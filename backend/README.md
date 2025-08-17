# AI Agent Platform Backend

A FastAPI-based backend for the AI-Powered Personal Agent Platform, featuring integration with Hugging Face's Mistral-7B-Instruct model via the Router API.

## 🚀 Features

- **FastAPI Backend**: Modern, fast web framework for building APIs
- **Hugging Face Integration**: Uses the Router API for reliable model access
- **Mistral-7B-Instruct**: State-of-the-art language model for chat interactions
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

### 2. Setup Environment
```bash
python setup_env.py
```
Enter your API key when prompted.

### 3. Verify Configuration
```bash
python test_env_simple.py
```

## 🧪 Testing

### Test Hugging Face Router API
```bash
python test_hf_router.py
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

# Chat with Mistral
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
├── test_hf_router.py      # HF Router API test
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
  "message": "AI Agent Platform API is running with Mistral-7B-Instruct",
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
  "ai_model": "Mistral-7B-Instruct",
  "version": "1.0.0",
  "environment": "development"
}
```

### POST `/api/llm/chat`
Chat with Mistral model
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

## 🌐 Hugging Face Integration

### Router API
- **Base URL**: `https://router.huggingface.co/v1`
- **Model**: `mistralai/Mistral-7B-Instruct-v0.2:featherless-ai`
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
