from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List
import os
import traceback
from dotenv import load_dotenv
from openai import OpenAI

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
