from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import os
import traceback
from dotenv import load_dotenv
from openai import OpenAI
import tempfile
import shutil

# Import our custom modules
from database import Document, DocumentChunk, insert_document, update_document_status, insert_document_chunks, search_similar_chunks
from document_processor import DocumentProcessor, save_uploaded_file

# Load environment variables
load_dotenv()

app = FastAPI(
    title="AI Agent Platform API",
    description="Backend API for AI-Powered Personal Agent Platform with Mistral-7B-Instruct",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://your-frontend-domain.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class HealthResponse(BaseModel):
    status: str
    message: str
    version: str

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]

class ChatResponse(BaseModel):
    response: str

class ErrorResponse(BaseModel):
    error: str

class DocumentUploadResponse(BaseModel):
    message: str
    document_id: int
    file_name: str
    chunks_processed: int
    status: str

class DocumentSearchRequest(BaseModel):
    query: str
    limit: Optional[int] = 5

class DocumentSearchResponse(BaseModel):
    chunks: List[Dict[str, Any]]
    total_found: int

@app.get("/", response_model=HealthResponse)
async def root():
    """Root endpoint with health check information"""
    return HealthResponse(
        status="healthy",
        message="AI Agent Platform API is running with Mistral-7B-Instruct",
        version="1.0.0"
    )

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        message="Service is operational",
        version="1.0.0"
    )

@app.get("/api/status")
async def api_status() -> Dict[str, Any]:
    """API status endpoint with additional information"""
    return {
        "status": "running",
        "service": "AI Agent Platform Backend",
        "ai_model": "Mistral-7B-Instruct",
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "development")
    }

@app.post("/api/llm/chat", response_model=ChatResponse, responses={500: {"model": ErrorResponse}})
async def chat_with_mistral(request: ChatRequest):
    """Chat with Mistral-7B-Instruct model via Hugging Face Router API"""
    
    try:
        # Get the last user message
        if not request.messages:
            raise HTTPException(status_code=400, detail="No messages provided")
        
        # Get the last message content
        last_message = request.messages[-1]
        if last_message.role != "user":
            raise HTTPException(status_code=400, detail="Last message must be from user")
        
        # Get API key from environment
        hf_api_key = os.getenv("HF_API_KEY")
        if not hf_api_key:
            print("❌ HF_API_KEY not found in environment variables")
            raise HTTPException(status_code=500, detail="HF_API_KEY not configured")
        
        print(f"✅ Using API key: {hf_api_key[:10]}...")
        
        # Initialize OpenAI client with Hugging Face Router API
        client = OpenAI(
            base_url="https://router.huggingface.co/v1",
            api_key=hf_api_key,
        )
        
        print("🚀 Making request to Hugging Face Router API...")
        print(f"📤 User message: {last_message.content}")
        
        # Make request using OpenAI client
        completion = client.chat.completions.create(
            model="mistralai/Mistral-7B-Instruct-v0.2:featherless-ai",
            messages=[
                {
                    "role": "user",
                    "content": last_message.content
                }
            ],
            max_tokens=256,
            temperature=0.7,
            top_p=0.95,
        )
        
        # Extract the generated text
        generated_text = completion.choices[0].message.content
        
        print(f"✅ Generated text: {generated_text}")
        return ChatResponse(response=generated_text)
        
    except Exception as e:
        # Log the error for debugging
        print(f"❌ Unexpected error: {str(e)}")
        print(f"❌ Error type: {type(e).__name__}")
        print(f"❌ Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.post("/api/ingest/upload", response_model=DocumentUploadResponse, responses={500: {"model": ErrorResponse}})
async def upload_document(file: UploadFile = File(...)):
    """Upload and process a PDF document for RAG"""
    
    try:
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        # Check file size (limit to 10MB)
        file.file.seek(0, 2)  # Seek to end
        file_size = file.file.tell()
        file.file.seek(0)  # Reset to beginning
        
        if file_size > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(status_code=400, detail="File size too large. Maximum size is 10MB")
        
        print(f"📄 Processing document: {file.filename} ({file_size} bytes)")
        
        # Save file temporarily
        temp_file_path = save_uploaded_file(file)
        
        try:
            # Initialize document processor
            processor = DocumentProcessor()
            
            # Process document
            chunks, embeddings = processor.process_document(temp_file_path)
            
            print(f"✅ Document processed: {len(chunks)} chunks created")
            
            # Insert document into database
            document_id = await insert_document(file.filename, file_size)
            
            # Create document chunks
            document_chunks = []
            for i, (chunk_text, embedding) in enumerate(zip(chunks, embeddings)):
                chunk = DocumentChunk(
                    document_id=document_id,
                    chunk_text=chunk_text,
                    chunk_index=i,
                    embedding=embedding,
                    token_count=processor.estimate_token_count(chunk_text)
                )
                document_chunks.append(chunk)
            
            # Insert chunks into database
            await insert_document_chunks(document_chunks)
            
            # Update document status
            await update_document_status(document_id, "processed")
            
            print(f"✅ Document {document_id} successfully processed and stored")
            
            return DocumentUploadResponse(
                message="Document successfully processed and stored",
                document_id=document_id,
                file_name=file.filename,
                chunks_processed=len(chunks),
                status="processed"
            )
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                print(f"🧹 Temporary file cleaned up: {temp_file_path}")
        
    except Exception as e:
        print(f"❌ Error processing document: {str(e)}")
        print(f"❌ Error type: {type(e).__name__}")
        print(f"❌ Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")

@app.post("/api/ingest/search", response_model=DocumentSearchResponse, responses={500: {"model": ErrorResponse}})
async def search_documents(request: DocumentSearchRequest):
    """Search documents using semantic similarity"""
    
    try:
        # Initialize document processor for embedding generation
        processor = DocumentProcessor()
        
        # Generate embedding for the query
        query_embedding = processor.generate_embeddings([request.query])[0]
        
        # Search for similar chunks
        similar_chunks = await search_similar_chunks(query_embedding, request.limit)
        
        # Format response
        chunks_data = []
        for chunk in similar_chunks:
            chunks_data.append({
                "chunk_text": chunk.chunk_text,
                "document_id": chunk.document_id,
                "chunk_index": chunk.chunk_index,
                "token_count": chunk.token_count
            })
        
        return DocumentSearchResponse(
            chunks=chunks_data,
            total_found=len(chunks_data)
        )
        
    except Exception as e:
        print(f"❌ Error searching documents: {str(e)}")
        print(f"❌ Error type: {type(e).__name__}")
        print(f"❌ Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error searching documents: {str(e)}")

@app.get("/api/ingest/documents")
async def list_documents():
    """List all uploaded documents"""
    
    try:
        # Get documents from database
        from database import supabase
        result = supabase.table("documents").select("*").order("upload_timestamp", desc=True).execute()
        
        return {
            "documents": result.data,
            "total": len(result.data)
        }
        
    except Exception as e:
        print(f"❌ Error listing documents: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error listing documents: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
