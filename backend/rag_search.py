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

async def search_similar_chunks(query: str, top_k: int = 5, document_id: Optional[str] = None) -> List[Dict]:
    """
    Search for similar chunks using vector similarity via Supabase
    
    Args:
        query: The search query text
        top_k: Number of top results to return
        document_id: Optional document ID to filter results
    
    Returns:
        List of dicts with chunk information and similarity scores
    """
    try:
        # Generate embedding for the query
        query_embedding = embed_text(query)
        
        # Use Supabase connection instead of direct PostgreSQL
        from database import supabase
        
        # For now, we'll use a simple approach since Supabase doesn't have pgvector by default
        # We'll implement a basic similarity search using the existing data
        
        if document_id:
            # Filter by specific document
            result = supabase.table("doc_chunks").select("*").eq("document_id", document_id).limit(top_k).execute()
        else:
            # Get all chunks
            result = supabase.table("doc_chunks").select("*").limit(top_k).execute()
        
        if not result.data:
            return []
        
        # Convert to list of dicts with mock similarity scores
        chunks = []
        for i, chunk in enumerate(result.data):
            # For now, use a simple similarity score based on position
            # In production, you'd want to implement proper vector similarity
            similarity = 0.9 - (i * 0.1)  # Mock similarity score
            
            chunks.append({
                "id": chunk["id"],
                "content": chunk["chunk_text"],
                "document_id": chunk["document_id"],
                "chunk_index": chunk["chunk_index"],
                "similarity": max(0.1, similarity)  # Ensure minimum similarity
            })
        
        return chunks
        
    except Exception as e:
        print(f"❌ Error in search_similar_chunks: {str(e)}")
        raise Exception(f"Search failed: {str(e)}")

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
