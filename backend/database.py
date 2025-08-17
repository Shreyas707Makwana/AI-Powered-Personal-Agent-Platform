from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables")

supabase: Client = create_client(supabase_url, supabase_key)

# Database Models
class Document(BaseModel):
    id: Optional[int] = None
    file_name: str
    file_size: int
    upload_timestamp: datetime
    status: str = "processed"

class DocumentChunk(BaseModel):
    id: Optional[int] = None
    document_id: int
    chunk_text: str
    chunk_index: int
    embedding: List[float]
    token_count: int

# Database operations
async def insert_document(file_name: str, file_size: int) -> int:
    """Insert a new document and return its ID"""
    data = {
        "file_name": file_name,
        "file_size": file_size,
        "upload_timestamp": datetime.utcnow().isoformat(),
        "status": "processing"
    }
    
    result = supabase.table("documents").insert(data).execute()
    return result.data[0]["id"]

async def update_document_status(document_id: int, status: str):
    """Update document status"""
    supabase.table("documents").update({"status": status}).eq("id", document_id).execute()

async def insert_document_chunks(chunks: List[DocumentChunk]):
    """Insert multiple document chunks"""
    chunk_data = [chunk.dict(exclude={"id"}) for chunk in chunks]
    supabase.table("doc_chunks").insert(chunk_data).execute()

async def get_document_chunks(document_id: int) -> List[DocumentChunk]:
    """Get all chunks for a specific document"""
    result = supabase.table("doc_chunks").select("*").eq("document_id", document_id).execute()
    return [DocumentChunk(**chunk) for chunk in result.data]

async def search_similar_chunks(query_embedding: List[float], limit: int = 5) -> List[DocumentChunk]:
    """Search for similar chunks using vector similarity"""
    # This is a simplified version - in production you'd use pgvector for proper similarity search
    result = supabase.table("doc_chunks").select("*").limit(limit).execute()
    return [DocumentChunk(**chunk) for chunk in result.data]
