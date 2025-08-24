# AI Agent Platform Backend

A FastAPI-based backend for the AI-Powered Personal Agent Platform, featuring integration with Hugging Face's Llama-3.1-8B model via the Router API.

## 🚀 Features

- **FastAPI Backend**: Modern, fast web framework for building APIs
- **Hugging Face Integration**: Uses the Router API for reliable model access
- **Llama-3.1-8B**: State-of-the-art language model for chat interactions
- **RAG (Retrieval-Augmented Generation)**: Document ingestion and semantic search
- **PDF Processing**: Text extraction and chunking with PyMuPDF
- **Vector Embeddings**: Sentence transformers for semantic similarity
- **Supabase Integration**: Document storage and vector search
- **Environment Management**: Secure configuration with .env files
- **CORS Support**: Ready for frontend integration
- **Comprehensive Testing**: Multiple test scripts for validation

## 🛠️ Prerequisites

- Python 3.8+
- Hugging Face API key (free tier available)
- Virtual environment (recommended)

## 📦 Installation

### 1. Clone and Navigate
```bash
cd backend
```

### 2. Create Virtual Environment
```bash
python -m venv venv
```

### 3. Activate Virtual Environment
**Windows:**
```bash
venv\Scripts\activate
```

**Linux/Mac:**
```bash
source venv/bin/activate
```

### 4. Install Dependencies
```bash
pip install -r requirements.txt
```

## 🔑 Configuration

### 1. Get Hugging Face API Key
- Visit [Hugging Face Settings](https://huggingface.co/settings/tokens)
- Create a new token (starts with `hf_`)
- Copy the token

### 2. Setup Supabase (for RAG functionality)
- Create a Supabase project at [supabase.com](https://supabase.com)
- Get your project URL and anon key
- Run the database schema: `psql -h your-host -U postgres -d your-db -f schema.sql`
- Ensure pgvector extension is enabled in your Supabase project

### 3. Setup Environment
```bash
python setup_env.py
```
Enter your API key and Supabase credentials when prompted.

**Required Environment Variables:**
- `HF_API_KEY`: Your Hugging Face API key
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase anon key
- `DATABASE_URL`: PostgreSQL connection string (for direct DB access)
- `EMBEDDING_MODEL`: Hugging Face model for embeddings (default: sentence-transformers/all-MiniLM-L6-v2)

### 4. Verify Configuration
```bash
python test_env_simple.py
```

## 🧪 Testing

### Test Hugging Face Router API
```bash
python test_hf_router.py
```

### Test RAG-Enabled Chat with curl

**1. Regular Chat (no RAG):**
```bash
curl -X POST "http://localhost:8000/api/llm/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hello! What is the capital of France?"}],
    "use_rag": false
  }'
```

**2. RAG-Enabled Chat:**
```bash
curl -X POST "http://localhost:8000/api/llm/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "What is this document about?"}],
    "use_rag": true,
    "top_k": 3
  }'
```

**3. RAG Chat with Document Filter:**
```bash
curl -X POST "http://localhost:8000/api/llm/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Tell me about the content in this specific document"}],
    "use_rag": true,
    "top_k": 2,
    "document_id": "1"
  }'
```

### Quick System Test
```bash
python quick_test.py
```

### Debug Environment
```bash
python debug_env.py
```

### Test Different Models
```bash
python test_models.py
```

### Test RAG Functionality
```bash
python test_rag.py
```

### Test RAG-Enabled Chat
```bash
python test_rag_chat.py
```

## 🚀 Running the Server

### Start Backend
```bash
python main.py
```

The server will start on `http://localhost:8000`

### Test Endpoints
```bash
# Health check
curl http://localhost:8000/

# API status
curl http://localhost:8000/api/status

# Chat with Llama-3.1-8B
curl -X POST "http://localhost:8000/api/llm/chat" \
  -H "Content-Type: application/json" \
  -d "{\"messages\": [{\"role\": \"user\", \"content\": \"Hello!\"}]}"
```

## 📁 Project Structure

```
backend/
├── main.py                 # Main FastAPI application
├── requirements.txt        # Python dependencies
├── .env                   # Environment variables (not in git)
├── env.example            # Environment template
├── setup_env.py           # Environment setup script
├── database.py             # Database models and operations
├── document_processor.py   # PDF processing and embeddings
├── schema.sql              # Database schema for RAG
├── test_hf_router.py      # HF Router API test
├── test_rag.py            # RAG functionality test
├── quick_test.py          # Quick system test
├── debug_env.py           # Environment debugging
├── test_models.py         # Model testing
├── test_curl.bat          # Windows curl testing
└── setup_and_test.bat     # Windows setup script
```

## 🔧 API Endpoints

### GET `/`
Health check endpoint
```json
{
  "status": "healthy",
  "message": "AI Agent Platform API is running with Llama-3.1-8B",
  "version": "1.0.0"
}
```

### GET `/health`
Service health status
```json
{
  "status": "healthy",
  "message": "Service is operational",
  "version": "1.0.0"
}
```

### GET `/api/status`
Detailed API information
```json
{
  "status": "running",
  "service": "AI Agent Platform Backend",
  "ai_model": "Llama-3.1-8B",
  "version": "1.0.0",
  "environment": "development"
}
```

### POST `/api/llm/chat`
Chat with Llama-3.1-8B model
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ]
}
```

**Response:**
```json
{
  "response": "Hello! I'm doing well, thank you for asking..."
}
```

### POST `/api/llm/chat` (RAG-Enabled)
Chat with Llama-3.1-8B model using RAG for document context

**Request with RAG:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "What is this document about?"
    }
  ],
  "use_rag": true,
  "top_k": 4,
  "document_id": null
}
```

**Response with Citations:**
```json
{
  "response": "Based on the document content, this appears to be about...",
  "citations": [
    {
      "id": 1,
      "document_id": 1,
      "chunk_index": 0,
      "similarity": 0.92,
      "snippet": "This document discusses the fundamentals of..."
    }
  ]
}
```

**Parameters:**
- `use_rag`: Enable/disable RAG functionality (default: false)
- `top_k`: Number of document chunks to retrieve (default: 4)
- `document_id`: Filter to specific document (optional)

### POST `/api/ingest/upload`
Upload and process a PDF document for RAG
```bash
curl -X POST -F "file=@sample.pdf" http://localhost:8000/api/ingest/upload
```

**Response:**
```json
{
  "message": "Document successfully processed and stored",
  "document_id": 1,
  "file_name": "sample.pdf",
  "chunks_processed": 15,
  "status": "processed"
}
```

### POST `/api/ingest/search`
Search documents using semantic similarity
```json
{
  "query": "What is machine learning?",
  "limit": 5
}
```

**Response:**
```json
{
  "chunks": [
    {
      "chunk_text": "Machine learning is a subset of artificial intelligence...",
      "document_id": 1,
      "chunk_index": 0,
      "token_count": 45
    }
  ],
  "total_found": 1
}
```

### GET `/api/ingest/documents`
List all uploaded documents

### GET `/api/rag/ping`
Check RAG system status (embedding model and database)
```json
{
  "ok": true,
  "embedding_model": "loaded",
  "database": "connected"
}
```
```json
{
  "documents": [
    {
      "id": 1,
      "file_name": "sample.pdf",
      "file_size": 1024000,
      "upload_timestamp": "2024-01-01T00:00:00Z",
      "status": "processed"
    }
  ],
  "total": 1
}
```

## 🔍 RAG Integration Architecture

### How RAG Works
1. **Document Processing**: PDFs are uploaded, text extracted, and chunked into ~500 token pieces
2. **Embedding Generation**: Each chunk gets a vector embedding using sentence-transformers
3. **Vector Storage**: Embeddings stored in Supabase with pgvector extension
4. **Semantic Search**: User queries are embedded and matched against stored vectors
5. **Context Retrieval**: Top-k most similar chunks are retrieved
6. **LLM Generation**: Context + question sent to Llama-3.1-8B for answer generation
7. **Citation Tracking**: Each response includes source document and chunk information

### RAG Components
- **`rag_search.py`**: Core RAG functionality (embeddings, vector search, DB operations)
- **`document_processor.py`**: PDF processing and chunking
- **`database.py`**: Supabase integration and data models
- **Enhanced Chat Endpoint**: `/api/llm/chat` with RAG support

## 🌐 Hugging Face Integration

### Router API
- **Base URL**: `https://router.huggingface.co/v1`
- **Model**: `meta-llama/Meta-Llama-3.1-8B-Instruct`
- **Authentication**: Bearer token via `HF_API_KEY`

### Why Router API?
- ✅ More reliable than Inference API
- ✅ Better free tier support
- ✅ Consistent response format
- ✅ OpenAI-compatible interface

## 🐛 Troubleshooting

### Common Issues

1. **API Key Not Found**
   ```bash
   python debug_env.py
   ```

2. **Dependencies Missing**
   ```bash
   pip install -r requirements.txt
   ```

3. **Model Not Responding**
   ```bash
   python test_hf_router.py
   ```

4. **Environment Issues**
   ```bash
   python setup_env.py
   ```

### Debug Commands

- **Environment Check**: `python test_env_simple.py`
- **Full Debug**: `python debug_env.py`
- **API Test**: `python test_hf_router.py`
- **System Test**: `python quick_test.py`

## 🔒 Security

- `.env` file is in `.gitignore`
- API keys are never logged in full
- CORS is configured for development
- Environment variables are validated

## 📚 Dependencies

- **FastAPI**: Web framework
- **Uvicorn**: ASGI server
- **OpenAI**: Hugging Face Router API client
- **Python-dotenv**: Environment management
- **Pydantic**: Data validation

## 🚀 Next Steps

1. **Frontend Integration**: Connect with Next.js frontend
2. **Database**: Add PostgreSQL/Supabase integration
3. **Authentication**: Implement JWT-based auth
4. **Rate Limiting**: Add API usage controls
5. **Monitoring**: Add logging and metrics

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Run debug scripts
3. Verify environment configuration
4. Check Hugging Face API status

---

**Happy coding! 🎉**
