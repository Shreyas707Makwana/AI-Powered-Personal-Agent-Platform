import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import List, Dict, Optional
import numpy as np
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Global variable to cache the embedding model
_embedding_model = None
_embedding_model_name = None

def load_embedding_model():
    """Load sentence-transformers model from EMBEDDING_MODEL env var and cache it"""
    global _embedding_model, _embedding_model_name
    
    model_name = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    
    # Only reload if model name changed
    if _embedding_model is None or _embedding_model_name != model_name:
        print(f"🔄 Loading embedding model: {model_name}")
        _embedding_model = SentenceTransformer(model_name)
        _embedding_model_name = model_name
        print(f"✅ Embedding model loaded: {model_name}")
    
    return _embedding_model

def embed_text(text: str) -> List[float]:
    """Returns the embedding (as python list) for given text"""
    model = load_embedding_model()
    embedding = model.encode(text)
    return embedding.tolist()

def vector_to_pgvector_literal(vec: List[float]) -> str:
    """Returns a string representation that can be used in SQL for pgvector"""
    # Convert to PostgreSQL vector format: [1,2,3] -> '[1,2,3]'
    return f"[{','.join(map(str, vec))}]"

def get_db_connection():
    """Get a database connection using DATABASE_URL"""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL environment variable not set")
    
    # Parse the URL to extract components for psycopg2
    if database_url.startswith("postgresql://"):
        # Convert to psycopg2 format
        db_url = database_url.replace("postgresql://", "")
        if "@" in db_url:
            auth, rest = db_url.split("@", 1)
            if ":" in auth:
                user, password = auth.split(":", 1)
            else:
                user, password = auth, ""
            
            if "/" in rest:
                host_port, database = rest.split("/", 1)
                if ":" in host_port:
                    host, port = host_port.split(":", 1)
                else:
                    host, port = host_port, "5432"
            else:
                host, port, database = rest, "5432", ""
            
            # Build connection parameters
            conn_params = {
                "host": host,
                "port": port,
                "database": database,
                "user": user,
                "password": password,
                "sslmode": "require"
            }
            
            return psycopg2.connect(**conn_params)
        else:
            raise ValueError("Invalid DATABASE_URL format")
    else:
        raise ValueError("DATABASE_URL must start with postgresql://")

async def search_similar_chunks(query: str, top_k: int = 5, document_id: Optional[str] = None, user_id: Optional[str] = None) -> List[Dict]:
    """
    Search for similar chunks using pgvector similarity via Supabase
    
    Args:
        query: The search query text
        top_k: Number of top results to return
        document_id: Optional document ID to filter results
        user_id: Optional user ID to scope results
    
    Returns:
        List of dicts with chunk information and similarity scores
    """
    try:
        # Generate embedding for the query
        query_embedding = embed_text(query)
        query_vector = vector_to_pgvector_literal(query_embedding)
        
        # Use direct PostgreSQL connection for vector similarity
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Build SQL query with user scoping and vector similarity
        base_query = """
            SELECT 
                id,
                chunk_text as content,
                document_id,
                chunk_index,
                1 - (embedding <=> %s::vector) as similarity
            FROM doc_chunks
            WHERE 1=1
        """
        
        params = [query_vector]
        
        # Apply user scoping
        if user_id:
            base_query += " AND owner = %s"
            params.append(user_id)
        else:
            # For unauthenticated requests, only show public chunks (no owner)
            base_query += " AND owner IS NULL"
        
        # Apply document filter if specified
        if document_id:
            base_query += " AND document_id = %s"
            params.append(int(document_id))
        
        # Order by similarity and limit results
        base_query += " ORDER BY similarity DESC LIMIT %s"
        params.append(top_k)
        
        print(f"🔍 Executing vector similarity search with {len(params)} parameters")
        cursor.execute(base_query, params)
        results = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        # Convert to list of dicts
        chunks = []
        for row in results:
            chunks.append({
                "id": row["id"],
                "content": row["content"],
                "document_id": row["document_id"],
                "chunk_index": row["chunk_index"],
                "similarity": float(row["similarity"])
            })
        
        print(f"✅ Found {len(chunks)} similar chunks with vector search")
        return chunks
        
    except Exception as e:
        print(f"❌ Error in vector search: {str(e)}")
        print("🔄 Falling back to simple search...")
        
        # Fallback to simple search if vector search fails
        try:
            from database import supabase
            
            query_builder = supabase.table("doc_chunks").select("*")
            
            if user_id:
                query_builder = query_builder.eq("owner", user_id)
            else:
                query_builder = query_builder.is_("owner", "null")
            
            if document_id:
                query_builder = query_builder.eq("document_id", document_id)
            
            result = query_builder.limit(top_k).execute()
            
            chunks = []
            for i, chunk in enumerate(result.data):
                similarity = 0.9 - (i * 0.1)  # Mock similarity score
                chunks.append({
                    "id": chunk["id"],
                    "content": chunk["chunk_text"],
                    "document_id": chunk["document_id"],
                    "chunk_index": chunk["chunk_index"],
                    "similarity": max(0.1, similarity)
                })
            
            return chunks
            
        except Exception as fallback_error:
            print(f"❌ Fallback search also failed: {str(fallback_error)}")
            raise Exception(f"Both vector and fallback search failed: {str(e)}")

def ping_embedding_model() -> bool:
    """Quick ping function to ensure model loaded"""
    try:
        model = load_embedding_model()
        # Test with a simple embedding
        test_embedding = model.encode("test")
        return True
    except Exception as e:
        print(f"❌ Embedding model ping failed: {str(e)}")
        return False

async def ping_database() -> bool:
    """Test database connection via Supabase"""
    try:
        from database import supabase
        
        # Test connection by making a simple query
        result = supabase.table("documents").select("id").limit(1).execute()
        return True
    except Exception as e:
        print(f"❌ Database ping failed: {str(e)}")
        return False
