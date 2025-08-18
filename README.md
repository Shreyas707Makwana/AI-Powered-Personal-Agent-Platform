# AI‑Powered Personal Agent Platform

An end‑to‑end, production‑ready AI assistant. Upload documents, chat with context-aware answers powered by RAG, and authenticate securely—all with a beautiful Next.js frontend and a FastAPI backend.

- Frontend: Next.js 15 + React 19 (deployed on Vercel)
- Backend: FastAPI + Uvicorn (deployed on Render)
- Auth & DB: Supabase
- AI: Hugging Face Router (Mistral-7B-Instruct), embeddings, and semantic search

---

## ✨ Features

- Document upload (PDF) with automatic chunking and embeddings
- RAG-enabled chat (citations linked to document chunks)
- Secure authentication with Supabase JWT
- User-scoped documents and queries
- Clean monorepo deploys (Vercel for frontend, Render for backend)
- Production-ready configs and environment management

---

## 🧠 Architecture

- `frontend/` Next.js app consumes REST endpoints
- `backend/` FastAPI app exposes REST endpoints
  - Uploading PDFs, listing documents, RAG chat, health checks

Data flow:
1. User logs in (Supabase) → gets JWT
2. User uploads PDF → backend chunks + embeds → stores metadata and vectors
3. User asks a question → backend retrieves relevant chunks (RAG) → calls Hugging Face Router for generation
4. Response includes citations pointing to document chunks

---

## 🧰 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Uvicorn, Pydantic v2
- **Infrastructure**: Vercel (frontend), Render (backend)
- **Auth/DB**: Supabase (Auth + Postgres)
- **AI/ML**:
  - Hugging Face Router (OpenAI-compatible API)
  - Mistral‑7B‑Instruct (inference)
  - Sentence Transformers (embeddings)
  - PyMuPDF (PDF parsing)

---

## 🚀 Quick Start (Local)

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # fill with your values
uvicorn main:app --reload --host 0.0.0.0 --port 8000

**Frontend:**
```bash
cd frontend
npm install
cp env.local.example .env.local  # configure environment
npm run dev

☁️ Deployment
See 
DEPLOYMENT.md
 for complete deployment instructions.

Quick Summary:

Backend (Render): Uses 
render.yaml
 blueprint with rootDir: backend
Frontend (Vercel): Uses 
vercel.json
 to build from frontend/
Environment: Configure variables per the example files in platform dashboards
📡 Key API Endpoints
GET /health — Service status
POST /api/ingest/upload — Upload PDF (auth required)
GET /api/ingest/documents — List documents (auth required)
POST /api/llm/chat — RAG-enabled chat (auth required)
GET /api/me — Current user profile
🧪 Testing
Tests are organized under backend/tests/ and tracked in version control.

🧭 Roadmap
Vector DB optimization and hybrid search
Streaming responses
Fine-tuned models for domain-specific RAG
Role-based access and team sharing
🤝 Contributing
PRs welcome! Please maintain the existing code style and keep secrets out of commits.

📄 License
MIT © Shreyas Makwana
