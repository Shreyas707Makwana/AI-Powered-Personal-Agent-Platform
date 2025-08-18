from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, Request
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
from database import Document, DocumentChunk, insert_document, update_document_status, insert_document_chunks
from document_processor import DocumentProcessor, save_uploaded_file
from rag_search import search_similar_chunks, embed_text, ping_embedding_model, ping_database
from auth import optional_auth_dependency, required_auth_dependency

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
    use_rag: Optional[bool] = False
    top_k: Optional[int] = 4
    document_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    citations: Optional[List[Dict[str, Any]]] = None

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
async def chat_with_mistral(request: ChatRequest, user: Dict[str, Any] = Depends(required_auth_dependency)):
    """Chat with Mistral-7B-Instruct model via Hugging Face Router API with optional RAG"""
    
    try:
        # Get the last user message
        if not request.messages:
            raise HTTPException(status_code=400, detail="No messages provided")
        
        # Get the last message content
        last_message = request.messages[-1]
        if last_message.role != "user":
            raise HTTPException(status_code=400, detail="Last message must be from user")
        
        question = last_message.content
        
        # Get API key from environment
        hf_api_key = os.getenv("HF_API_KEY")
        if not hf_api_key:
            print("❌ HF_API_KEY not found in environment variables")
            raise HTTPException(status_code=500, detail="HF_API_KEY not configured")
        
        print(f"✅ Using API key: {hf_api_key[:10]}...")
        print(f"📤 User message: {question}")
        print(f"🔍 RAG enabled: {request.use_rag}")
        
        # Initialize OpenAI client with Hugging Face Router API
        client = OpenAI(
            base_url="https://router.huggingface.co/v1",
            api_key=hf_api_key,
        )
        
        citations = []
        final_prompt = question
        
        if request.use_rag:
            try:
                print("🔍 Searching for relevant document chunks...")
                
                # Search for similar chunks (scoped to user if authenticated)
                similar_chunks = await search_similar_chunks(
                    query=question, 
                    top_k=request.top_k, 
                    document_id=request.document_id,
                    user_id=user["id"]
                )
                print(f"✅ Found {len(similar_chunks)} chunks for user {user['email']}")

                if similar_chunks:
                    print(f"✅ Found {len(similar_chunks)} relevant chunks")
                    
                    # Build system prompt
                    system_prompt = "You are an assistant. Use only the context sections provided to answer. If the answer is not present in the context, say you don't know."
                    
                    # Build context block with citations
                    context_blocks = []
                    for chunk in similar_chunks:
                        context_blocks.append(f"[doc:{chunk['document_id']}#chunk:{chunk['chunk_index']}]\n{chunk['content']}")
                        
                        # Add to citations
                        citations.append({
                            "id": chunk["id"],
                            "document_id": chunk["document_id"],
                            "chunk_index": chunk["chunk_index"],
                            "similarity": chunk["similarity"],
                            "snippet": chunk["content"][:100] + "..." if len(chunk["content"]) > 100 else chunk["content"]
                        })
                    
                    # Compose final prompt
                    context_text = "\n\n".join(context_blocks)
                    
                    # Build messages for the LLM
                    messages = [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"Context:\n{context_text}\n\nQuestion: {question}\n\nAnswer:"}
                    ]
                    
                    print(f"📝 Final prompt length: {len(str(messages))} characters")
                    
                else:
                    print("⚠️ No relevant chunks found, proceeding without RAG")
                    messages = [{"role": "user", "content": question}]
                    
            except Exception as e:
                print(f"⚠️ RAG search failed: {str(e)}, proceeding without RAG")
                messages = [{"role": "user", "content": question}]
        else:
            # No RAG, use original message
            messages = [{"role": "user", "content": question}]
        
        print("🚀 Making request to Hugging Face Router API...")
        
        # Make request using OpenAI client
        completion = client.chat.completions.create(
            model="mistralai/Mistral-7B-Instruct-v0.2:featherless-ai",
            messages=messages,
            max_tokens=512,  # Increased for RAG responses
            temperature=0.7,
            top_p=0.95,
        )
        
        # Extract the generated text
        generated_text = completion.choices[0].message.content
        
        print(f"✅ Generated text: {generated_text}")
        
        # Return response with citations if RAG was used
        if request.use_rag and citations:
            return ChatResponse(response=generated_text, citations=citations)
        else:
            return ChatResponse(response=generated_text)
        
    except Exception as e:
        # Log the error for debugging
        print(f"❌ Unexpected error: {str(e)}")
        print(f"❌ Error type: {type(e).__name__}")
        print(f"❌ Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.post("/api/ingest/upload", response_model=DocumentUploadResponse, responses={500: {"model": ErrorResponse}})
async def upload_document(file: UploadFile = File(...), user: Dict[str, Any] = Depends(required_auth_dependency)):
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
            
            # Insert document into database with owner
            document_id = await insert_document(file.filename, file_size, owner_id=user["id"])
            print(f"✅ Document saved with owner ID: {user['id']} for user: {user['email']}")
            
            # Create document chunks
            document_chunks = []
            for i, (chunk_text, embedding) in enumerate(zip(chunks, embeddings)):
                chunk = DocumentChunk(
                    document_id=document_id,
                    chunk_text=chunk_text,
                    chunk_index=i,
                    embedding=embedding,
                    token_count=processor.estimate_token_count(chunk_text),
                    owner=user["id"]
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
async def list_documents(user: Dict[str, Any] = Depends(required_auth_dependency)):
    """List all uploaded documents"""
    
    try:
        # Get documents from database (scoped to user if authenticated)
        from database import supabase
        
        query = supabase.table("documents").select("*")
        
        # Return only user's documents (authentication is required)
        query = query.eq("owner", user["id"])
        print(f"✅ Listing documents for user: {user['email']} (ID: {user['id']})")
            
        result = query.order("upload_timestamp", desc=True).execute()
        
        return {
            "documents": result.data,
            "total": len(result.data)
        }
        
    except Exception as e:
        print(f"❌ Error listing documents: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error listing documents: {str(e)}")

@app.get("/api/me")
async def get_current_user_profile(user: Dict[str, Any] = Depends(required_auth_dependency)):
    """Get current user profile information - requires authentication"""
    
    return {
        "id": user["id"],
        "email": user["email"]
    }

@app.get("/api/rag/ping")
async def rag_ping():
    """Ping RAG system to check if embedding model and database are working"""
    try:
        # Check embedding model
        model_ok = ping_embedding_model()
        
        # Check database connection
        db_ok = await ping_database()
        
        if model_ok and db_ok:
            return {"ok": True, "embedding_model": "loaded", "database": "connected"}
        else:
            return {"ok": False, "embedding_model": "loaded" if model_ok else "failed", "database": "connected" if db_ok else "failed"}
            
    except Exception as e:
        print(f"❌ RAG ping failed: {str(e)}")
        return {"ok": False, "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
