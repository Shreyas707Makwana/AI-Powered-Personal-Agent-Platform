# 🤖 AI-Powered Personal Agent Platform

> **Transform your documents into an intelligent conversation partner**

An end-to-end, production-ready AI assistant that brings your documents to life. Upload PDFs, get context-aware answers powered by RAG (Retrieval-Augmented Generation), and experience secure, personalized interactions—all wrapped in a beautiful, modern interface.

[![Deploy Status](https://img.shields.io/badge/Deploy-Live-brightgreen)](https://ai-powered-personal-agent-platform.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Latest-teal)](https://fastapi.tiangolo.com/)

---

## 🎯 **What Makes This Special?**

- **🧠 Smart Document Understanding** - Upload PDFs and chat with them like never before
- **🔐 Bank-Level Security** - Supabase authentication with JWT tokens
- **⚡ Lightning Fast** - Optimized RAG pipeline with semantic search
- **🎨 Beautiful UI** - Modern Next.js interface with Tailwind CSS
- **🚀 Production Ready** - Full deployment pipeline included
- **📱 Responsive** - Works seamlessly across all devices

---

## ✨ **Core Features**

### 📄 **Document Intelligence**
- **PDF Upload & Processing** - Automatic chunking and embedding generation
- **Smart Retrieval** - Find the most relevant information instantly
- **Source Citations** - Every answer links back to specific document sections

### 💬 **Conversational AI**
- **Context-Aware Chat** - Powered by Llama-3.1-8B via Hugging Face Router
- **Memory Retention** - Maintains conversation context for natural interactions
- **Multi-Document Support** - Query across all your uploaded documents

### 🔒 **Enterprise Security**
- **User Authentication** - Secure login with Supabase Auth
- **Data Isolation** - Your documents are private and user-scoped
- **JWT Protection** - All API endpoints secured with token validation

---

## 🏗️ **Architecture Overview**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Supabase      │
│   (Next.js 15)  │◄──►│   (FastAPI)     │◄──►│  (Auth + DB)    │
│   Vercel        │    │   Render        │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  Hugging Face   │
                       │     Router      │
                       │ (Llama-3.1-8B)  │
                       └─────────────────┘
```

### **Data Flow**
1. **Authentication** → User logs in via Supabase, receives JWT token
2. **Document Upload** → PDF processed, chunked, and embedded
3. **Query Processing** → RAG retrieval finds relevant chunks
4. **AI Generation** → Llama-3.1-8B generates contextual responses
5. **Citation Linking** → Responses include source references

---

## 🛠️ **Tech Stack**

### **Frontend**
- ![Next.js](https://img.shields.io/badge/-Next.js_15-black?logo=next.js) **Next.js 15** - React framework with App Router
- ![React](https://img.shields.io/badge/-React_19-blue?logo=react) **React 19** - Latest React features
- ![TypeScript](https://img.shields.io/badge/-TypeScript-blue?logo=typescript) **TypeScript** - Type-safe development
- ![Tailwind](https://img.shields.io/badge/-Tailwind_CSS-teal?logo=tailwindcss) **Tailwind CSS** - Utility-first styling

### **Backend**
- ![FastAPI](https://img.shields.io/badge/-FastAPI-teal?logo=fastapi) **FastAPI** - Modern Python web framework
- ![Python](https://img.shields.io/badge/-Python-yellow?logo=python) **Uvicorn** - High-performance ASGI server
- ![Pydantic](https://img.shields.io/badge/-Pydantic_v2-red) **Pydantic v2** - Data validation and settings

### **Infrastructure & Services**
- ![Vercel](https://img.shields.io/badge/-Vercel-black?logo=vercel) **Vercel** - Frontend deployment
- ![Render](https://img.shields.io/badge/-Render-purple) **Render** - Backend hosting
- ![Supabase](https://img.shields.io/badge/-Supabase-green?logo=supabase) **Supabase** - Auth & PostgreSQL database

### **AI & ML**
- ![Hugging Face](https://img.shields.io/badge/-Hugging_Face-yellow?logo=huggingface) **Hugging Face Router** - OpenAI-compatible API
- **Llama-3.1-8B** - Large language model for generation
- **Sentence Transformers** - Document embeddings
- **PyMuPDF** - PDF parsing and text extraction

---

## 🧪 **Testing**

```bash
cd backend
pytest tests/ -v
```

Tests cover:
- ✅ Authentication flows
- ✅ Document processing
- ✅ RAG pipeline
- ✅ API endpoints

---

## 🗺️ **Roadmap**

### **🔄 Short Term**
- [ ] **Streaming Responses** - Real-time answer generation
- [ ] **Multiple File Formats** - Support for DOCX, TXT, etc.
- [ ] **Enhanced Citations** - Page-level highlighting

### **🚀 Medium Term**  
- [ ] **Vector DB Optimization** - Hybrid search capabilities
- [ ] **Team Collaboration** - Shared document workspaces
- [ ] **Custom Models** - Fine-tuned domain-specific AI

### **🌟 Long Term**
- [ ] **Multi-Modal Support** - Images and tables understanding
- [ ] **Advanced Analytics** - Usage insights and document metrics
- [ ] **Enterprise Features** - SSO, audit logs, compliance

---

## 📄 **License**

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 **Author**

**Shreyas Makwana**  
- 🌐 [Portfolio](https://portfolio-website-shreyas.vercel.app/)
- 💼 [LinkedIn](www.linkedin.com/in/shreyas-makwana)

---

<div align="center">

**⭐ If you found this project helpful, please give it a star!**

*Built with 🔥*

</div>
