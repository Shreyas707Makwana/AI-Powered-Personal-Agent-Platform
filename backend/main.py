from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import os
import traceback
from dotenv import load_dotenv
from openai import OpenAI
import openai
import tempfile
import shutil
import time
import json

# Import our custom modules
from database import (
    Document,
    DocumentChunk,
    insert_document,
    update_document_status,
    insert_document_chunks,
    get_agent,
    create_conversation,
    get_conversation,
    append_message,
    list_messages,
)
from document_processor import DocumentProcessor, save_uploaded_file
from rag_search import search_similar_chunks, embed_text, ping_embedding_model, ping_database
from auth import optional_auth_dependency, required_auth_dependency
from routers import agents, tools
from routers import conversations
from routers.tools import execute_tool_internal

# Load environment variables
load_dotenv()

app = FastAPI(
    title="AI Agent Platform API",
    description="Backend API for AI-Powered Personal Agent Platform with Llama-3.1-8B",
    version="1.0.0"
)

# Include routers
app.include_router(agents.router)
app.include_router(tools.router)
app.include_router(conversations.router)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://ai-powered-personal-agent-platform.vercel.app"],
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
    agent_id: Optional[str] = None
    conversation_id: Optional[str] = None  # optional: continue existing conversation

class ChatResponse(BaseModel):
    response: str
    citations: Optional[List[Dict[str, Any]]] = None
    conversation_id: Optional[str] = None

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
        message="AI Agent Platform API is running with Llama-3.1-8B",
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
        "ai_model": "Llama-3.1-8B",
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "development")
    }

@app.post("/api/llm/chat", response_model=ChatResponse, responses={500: {"model": ErrorResponse}})
async def chat_with_llama(request: ChatRequest, user: Dict[str, Any] = Depends(required_auth_dependency)):
    """Chat with Llama-3.1-8B model via Hugging Face Router API with optional RAG"""
    
    try:
        # Get the last user message
        if not request.messages:
            raise HTTPException(status_code=400, detail="No messages provided")
        
        # Get the last message content
        last_message = request.messages[-1]
        if last_message.role != "user":
            raise HTTPException(status_code=400, detail="Last message must be from user")
        
        question = last_message.content
        
        # Ensure/prepare conversation
        conv_id: Optional[str] = request.conversation_id
        if conv_id:
            existing = await get_conversation(conv_id, user["id"])
            if not existing:
                raise HTTPException(status_code=404, detail="Conversation not found")
        else:
            # Create a new conversation; let database auto-title as "Chat N"
            new_conv = await create_conversation(user["id"], title=None)
            conv_id = new_conv.get("id")

        # Persist the incoming user message
        try:
            await append_message(conv_id, user["id"], "user", question)
        except Exception as e:
            # Do not fail the chat if persistence has an issue; log and continue
            print(f"⚠️ Failed to persist user message: {e}")

        # Get API key from environment
        hf_api_key = os.getenv("HF_API_KEY")
        if not hf_api_key:
            print("❌ HF_API_KEY not found in environment variables")
            raise HTTPException(status_code=500, detail="HF_API_KEY not configured")
        
        print(f"✅ Using API key: {hf_api_key[:10]}...")
        print(f"📤 User message: {question}")
        print(f"🔍 RAG enabled: {request.use_rag}")
        print(f"🤖 Agent ID: {request.agent_id}")
        
        # Initialize OpenAI client with Hugging Face Router API
        client = OpenAI(
            base_url="https://router.huggingface.co/v1",
            api_key=hf_api_key,
        )
        
        citations = []
        final_prompt = question
        memory_system_note = None
        
        # Get agent instructions if agent_id is provided
        system_prompt_from_agent = None
        if request.agent_id:
            agent = await get_agent(request.agent_id, owner_id=user["id"])
            if not agent:
                raise HTTPException(status_code=404, detail="Agent not found")
            system_prompt_from_agent = agent["instructions"]
            print(f"🤖 Using agent: {agent['name']}")

        # Memory feature removed: no retrieval or autosave
        memory_system_note = None
        
        # Load prior conversation turns (small window) when continuing a conversation
        prior_chat: List[Dict[str, str]] = []
        try:
            if conv_id and request.conversation_id:
                prior = await list_messages(conv_id, user["id"], limit=20)
                for m in prior[-20:]:
                    role = m.get("role") or "user"
                    content = m.get("content") or ""
                    # Skip echoing the last user question since it is already in request
                    prior_chat.append({"role": role, "content": content})
        except Exception as e:
            print(f"⚠️ Failed to preload prior messages: {e}")

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
                    
                    # Build system prompt for RAG (no memories)
                    rag_system_prompt = (
                        "You are an assistant. Use the provided context sections to answer. "
                        "If the answer is not present in the context, say you don't know."
                    )
                    
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
                    
                    # Memories removed: no user_memories context

                    # Compose final prompt
                    context_text = "\n\n".join(context_blocks)
                    
                    # Build messages for the LLM with proper order: agent system prompt, RAG system prompt, user message
                    messages = []
                    if system_prompt_from_agent:
                        messages.append({"role": "system", "content": system_prompt_from_agent})
                    # Memories removed
                    messages.append({"role": "system", "content": rag_system_prompt})
                    messages.append({"role": "user", "content": f"Context:\n{context_text}\n\nQuestion: {question}\n\nAnswer:"})
                    
                    print(f"📝 Final prompt length: {len(str(messages))} characters")
                    
                else:
                    print("⚠️ No relevant chunks found, proceeding without RAG")
                    # Build messages without RAG but with agent if available
                    messages = []
                    if system_prompt_from_agent:
                        messages.append({"role": "system", "content": system_prompt_from_agent})
                    if memory_system_note:
                        messages.append({"role": "system", "content": memory_system_note})
                    # Append prior turns for continuity
                    if prior_chat:
                        messages.extend(prior_chat[-10:])
                    messages.append({"role": "user", "content": question})
                    
            except Exception as e:
                print(f"⚠️ RAG search failed: {str(e)}, proceeding without RAG")
                # Build messages without RAG but with agent if available
                messages = []
                if system_prompt_from_agent:
                    messages.append({"role": "system", "content": system_prompt_from_agent})
                # Memories removed
                if prior_chat:
                    messages.extend(prior_chat[-10:])
                messages.append({"role": "user", "content": question})
        else:
            # No RAG, use original message with agent if available
            messages = []
            if system_prompt_from_agent:
                messages.append({"role": "system", "content": system_prompt_from_agent})
            # Memories removed
            if prior_chat:
                messages.extend(prior_chat[-10:])
            messages.append({"role": "user", "content": question})
        
        print("🚀 Making request to Hugging Face Router API...")

        # Model selection via env override and fallbacks
        primary_model = os.getenv("MODEL_ID", "mistralai/Mistral-7B-Instruct-v0.2:featherless-ai")
        fallbacks_raw = os.getenv(
            "MODEL_FALLBACKS",
            "meta-llama/Meta-Llama-3-8B-Instruct, mistralai/Mixtral-8x7B-Instruct-v0.1, mistralai/Mistral-7B-Instruct-v0.3"
        )
        model_candidates = [m.strip() for m in [primary_model] + fallbacks_raw.split(",") if m.strip()]

        def _parse_retry_schedule() -> List[float]:
            raw = os.getenv("PROVIDER_RETRY_SCHEDULE", "0,1,2,4,8,16")
            try:
                return [float(x.strip()) for x in raw.split(",") if x.strip() != ""]
            except Exception:
                return [0.0, 1.0, 2.0, 4.0, 8.0, 16.0]

        def _messages_to_prompt(msgs: List[Dict[str, str]]) -> str:
            parts = []
            for m in msgs:
                role = m.get("role") or "user"
                content = m.get("content") or ""
                parts.append(f"{role}: {content}")
            parts.append("assistant:")
            return "\n".join(parts)

        def call_provider(msgs: List[Dict[str, str]], model_id: str):
            """Call provider with retries for transient errors. If model is not chat-capable, fallback to Completions."""
            backoffs = _parse_retry_schedule()
            last_err = None
            for i, delay in enumerate(backoffs):
                if delay:
                    time.sleep(delay)
                try:
                    print(f"🧪 Calling provider with model: {model_id}")
                    return client.chat.completions.create(
                        model=model_id,
                        messages=msgs,
                        max_tokens=512,
                        temperature=0.7,
                        top_p=0.95,
                    )
                except openai.APIStatusError as api_err:
                    status = getattr(api_err, "status_code", None)
                    print(f"❌ Provider API error (attempt {i+1}/{len(backoffs)} status {status}, backoff {delay}s): {str(api_err)}")
                    # Clear 402 when HF credits are exhausted
                    if status == 402:
                        raise HTTPException(
                            status_code=402,
                            detail=(
                                "Model provider credits exhausted at Hugging Face Router. "
                                "Update HF_API_KEY or add credits to continue."
                            ),
                        )
                    # Retry only on likely-transient errors
                    if status in (429, 502, 503):
                        last_err = api_err
                        continue
                    # If model isn't chat-capable for this provider, try Completions API
                    try:
                        err_msg = str(api_err)
                    except Exception:
                        err_msg = ""
                    if status == 400 and ("not a chat model" in err_msg.lower() or "model_not_supported" in err_msg.lower()):
                        try:
                            prompt = _messages_to_prompt(msgs)
                            print("🔁 Falling back to Completions API with constructed prompt…")
                            return client.completions.create(
                                model=model_id,
                                prompt=prompt,
                                max_tokens=512,
                                temperature=0.7,
                                top_p=0.95,
                            )
                        except openai.APIStatusError as api_err2:
                            # Not retryable -> surface as HTTPException to move to next model
                            raise HTTPException(status_code=502, detail=f"Upstream model provider error (completions): {str(api_err2)}")
                    # Non-retryable -> surface immediately
                    raise HTTPException(status_code=502, detail=f"Upstream model provider error: {str(api_err)}")
            # Exhausted retries
            if last_err is not None:
                # For APIStatusError path, bubble as 502
                raise HTTPException(status_code=502, detail=f"Upstream model provider error: {str(last_err)}")
            raise HTTPException(status_code=502, detail="Upstream model provider error: unknown")

        completion = None
        try:
            # Try primary + fallback models
            last_exc: Optional[HTTPException] = None
            for mid in model_candidates:
                try:
                    completion = call_provider(messages, mid)
                    last_exc = None
                    break
                except HTTPException as e:
                    last_exc = e
                    continue
            # If all models failed and an agent was used, retry once more without the agent system prompt
            if completion is None and last_exc is not None and system_prompt_from_agent:
                print("🛟 All models failed with agent. Retrying across models without agent system prompt...")
                msgs_wo_agent = [
                    m for m in messages
                    if not (m.get("role") == "system" and m.get("content") == system_prompt_from_agent)
                ]
                for mid in model_candidates:
                    try:
                        completion = call_provider(msgs_wo_agent, mid)
                        last_exc = None
                        break
                    except HTTPException as e:
                        last_exc = e
                        continue
            if completion is None and last_exc is not None:
                raise last_exc
        except openai.APIStatusError as api_err:
            # After retries failed. If agent was used, try once more without agent system message.
            status = getattr(api_err, "status_code", None)
            print(f"❌ Provider failed after retries (status {status}).")
            if system_prompt_from_agent:
                print("🛟 Retrying once without agent system prompt while keeping RAG/user context...")
                msgs_wo_agent = [
                    m for m in messages
                    if not (m.get("role") == "system" and m.get("content") == system_prompt_from_agent)
                ]
                try:
                    # Try model candidates again without agent prompt
                    last_exc: Optional[HTTPException] = None
                    for mid in model_candidates:
                        try:
                            completion = call_provider(msgs_wo_agent, mid)
                            last_exc = None
                            break
                        except HTTPException as e:
                            last_exc = e
                            continue
                    if completion is None and last_exc is not None:
                        raise last_exc
                except openai.APIStatusError as api_err2:
                    status2 = getattr(api_err2, "status_code", None)
                    print(f"❌ Provider still failing without agent (status {status2}).")
                    # Map to HTTPException using same rules
                    if status2 == 402:
                        raise HTTPException(
                            status_code=402,
                            detail=(
                                "Model provider credits exhausted at Hugging Face Router. "
                                "Update HF_API_KEY or add credits to continue."
                            ),
                        )
                    raise HTTPException(status_code=502, detail=f"Upstream model provider error: {str(api_err2)}")
            else:
                # No agent, surface the error
                raise HTTPException(status_code=502, detail=f"Upstream model provider error: {str(api_err)}")
        
        
        # Extract the generated text (supports both chat and completions responses)
        generated_text = None
        try:
            generated_text = completion.choices[0].message.content
        except Exception:
            try:
                generated_text = completion.choices[0].text
            except Exception:
                generated_text = ""

        # Optional tool_call handling: If model returned a JSON with {"tool_call": {...}}, execute tool and return its result
        # This preserves existing behavior when no such JSON is returned.
        try:
            parsed = json.loads((generated_text or "").strip())
            if isinstance(parsed, dict) and "tool_call" in parsed:
                tool_call = parsed.get("tool_call") or {}
                tool_key = tool_call.get("tool_key") or tool_call.get("key")
                params = tool_call.get("params") or {}
                if not tool_key:
                    raise ValueError("Missing tool_key in tool_call")
                print(f"🛠️ Detected tool_call -> key={tool_key}, params={params}")
                tool_result = await execute_tool_internal(user_id=user.get("id"), agent_id=request.agent_id, tool_key=str(tool_key), params=params if isinstance(params, dict) else {})
                # MVP behavior: return tool output directly and invite user to continue.
                tool_text = f"Tool {tool_key} result: {json.dumps(tool_result)}\n\nAsk a follow-up or say 'continue' for an explanation."
                # Persist assistant tool response
                try:
                    await append_message(conv_id, user["id"], "assistant", tool_text)
                except Exception as pe:
                    print(f"⚠️ Failed to persist assistant tool response: {pe}")
                if request.use_rag and citations:
                    return ChatResponse(response=tool_text, citations=citations, conversation_id=conv_id)
                else:
                    return ChatResponse(response=tool_text, conversation_id=conv_id)
        except json.JSONDecodeError:
            pass
        except Exception as te:
            print(f"⚠️ Tool-call handling error: {te}")
        
        print(f"✅ Generated text: {generated_text}")
        
        # Memory autosave removed

        # Persist assistant response
        try:
            await append_message(conv_id, user["id"], "assistant", generated_text or "")
        except Exception as e:
            print(f"⚠️ Failed to persist assistant message: {e}")

        # Return response with citations if RAG was used
        if request.use_rag and citations:
            return ChatResponse(response=generated_text, citations=citations, conversation_id=conv_id)
        else:
            return ChatResponse(response=generated_text, conversation_id=conv_id)
        
    except HTTPException as http_e:
        # Let explicit HTTP errors bubble up without converting to 500
        raise http_e
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
    import os

    # Use the PORT environment variable provided by Render (or default to 8000 for local dev)
    port = int(os.environ.get("PORT", 8000))

    # Disable reload in production environments
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)

