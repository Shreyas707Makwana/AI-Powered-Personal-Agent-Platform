@echo off
echo 🧪 Testing AI Agent Platform API with curl...

echo.
echo 🔍 First, let's check if your API key is working...
echo.

REM Read the API key from .env file
for /f "tokens=2 delims==" %%a in ('findstr "HF_API_KEY=" .env') do set HF_API_KEY=%%a

echo API Key found: %HF_API_KEY:~0,10%...

echo.
echo 🚀 Testing health check endpoint...
curl -X GET "http://localhost:8000/"

echo.
echo.
echo 📊 Testing API status endpoint...
curl -X GET "http://localhost:8000/api/status"

echo.
echo.
echo 🤖 Testing chat endpoint with Mistral-7B-Instruct...
curl -X POST "http://localhost:8000/api/llm/chat" ^
  -H "Content-Type: application/json" ^
  -d "{\"messages\": [{\"role\": \"user\", \"content\": \"Hello! What is the capital of France?\"}]}"

echo.
echo.
echo 🔍 Testing RAG ping endpoint...
curl -X GET "http://localhost:8000/api/rag/ping"

echo.
echo.
echo 📚 Testing RAG-enabled chat (if you have documents uploaded)...
curl -X POST "http://localhost:8000/api/llm/chat" ^
  -H "Content-Type: application/json" ^
  -d "{\"messages\": [{\"role\": \"user\", \"content\": \"What is this document about?\"}], \"use_rag\": true, \"top_k\": 3}"

echo.
echo.
echo ✅ Test completed!
pause
