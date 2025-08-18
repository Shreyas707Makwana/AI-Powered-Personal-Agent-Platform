# AI Agent Platform - Authentication Setup Guide

## Overview
Complete user authentication system with Supabase Auth, user profiles, and per-user document ownership.

## Features Implemented
- ✅ Supabase authentication (sign up, sign in, sign out)
- ✅ Optional authentication (preserves demo mode)
- ✅ User-scoped document uploads and RAG search
- ✅ Row Level Security (RLS) policies
- ✅ `/api/me` endpoint for user profiles
- ✅ AuthButton component in header

## Setup Instructions

### 1. Supabase Configuration

#### Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and API keys

#### Run Database Schema
Copy and paste the complete SQL schema from the main implementation into your Supabase SQL editor. This creates:
- `profiles` table linked to auth users
- `agents`, `conversations`, `messages`, `memories` tables
- Adds `owner` columns to existing `documents` and `doc_chunks` tables
- Enables RLS with proper policies

### 2. Environment Variables

#### Frontend `.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

#### Backend `.env`
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_service_role_key
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
HF_API_KEY=your_huggingface_api_key
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
```

### 3. Install Dependencies

#### Frontend
```bash
cd frontend
npm install @supabase/supabase-js
```

#### Backend
```bash
cd backend
pip install requests  # Already in requirements.txt
```

### 4. Test the Implementation

#### Start Services
```bash
# Terminal 1: Backend
cd backend
python main.py

# Terminal 2: Frontend  
cd frontend
npm run dev
```

#### Test Authentication Flow
1. **Demo Mode**: Visit http://localhost:3000 without signing in
   - Upload documents (stored as public)
   - Chat works normally
   - Documents list shows public documents

2. **Authenticated Mode**: Click "NEURAL_AUTH" in header
   - Sign up with email/password
   - Upload documents (stored with your user ID)
   - Chat with RAG uses only your documents
   - Documents list shows only your documents

#### API Testing
```bash
# Test unauthenticated /api/me
curl http://localhost:8000/api/me
# Returns: 204 No Content

# Test authenticated /api/me (replace TOKEN)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/me
# Returns: {"id": "uuid", "email": "user@example.com"}
```

## Architecture Details

### Authentication Flow
1. **Frontend**: Supabase client handles auth UI and token management
2. **API Client**: Automatically attaches `Authorization: Bearer <token>` headers
3. **Backend**: Optional auth dependency validates tokens with Supabase Auth API
4. **Database**: RLS policies enforce user-scoped access

### User Scoping
- **Authenticated**: Users see only their own documents/chunks
- **Unauthenticated**: Users see only public documents (owner = NULL)
- **RAG Search**: Automatically scoped to user's documents when authenticated

### Security Features
- Row Level Security (RLS) enabled on all tables
- Service role can bypass RLS for server operations
- JWT token validation via Supabase Auth API
- Graceful fallback to demo mode for unauthenticated users

## File Changes Made

### Frontend Files
- `src/lib/supabaseClient.ts` - Supabase client configuration
- `src/components/AuthButton.tsx` - Authentication UI component
- `src/lib/api.ts` - Updated to include auth headers
- `src/app/page.tsx` - Integrated AuthButton in header

### Backend Files
- `auth.py` - Authentication dependencies and user validation
- `main.py` - Updated endpoints with optional auth
- `database.py` - Added owner fields to models
- `rag_search.py` - User-scoped document search

### Database Schema
- Added `profiles`, `agents`, `conversations`, `messages`, `memories` tables
- Added `owner` columns to existing tables
- Comprehensive RLS policies for all tables

## Testing

Run the integration test script:
```bash
python test_auth_integration.py
```

This validates:
- Unauthenticated demo mode functionality
- API endpoint responses
- Document upload and listing
- Chat with RAG functionality

## Troubleshooting

### Common Issues

1. **"Missing authorization header"**
   - Check that SUPABASE_KEY (service role) is set in backend .env
   - Verify token is being sent from frontend

2. **"Invalid or expired token"**
   - Check SUPABASE_URL matches between frontend and backend
   - Verify user is signed in on frontend

3. **RLS Policy Errors**
   - Ensure RLS policies are created correctly
   - Check that service role key has proper permissions

4. **No documents showing**
   - Authenticated users only see their own documents
   - Unauthenticated users only see public documents (owner = NULL)

### Debug Commands
```bash
# Check backend auth
curl -H "Authorization: Bearer TOKEN" http://localhost:8000/api/me

# Check document ownership
curl -H "Authorization: Bearer TOKEN" http://localhost:8000/api/ingest/documents

# Test RAG with auth
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer TOKEN" \
  -d '{"messages":[{"role":"user","content":"test"}],"use_rag":true}' \
  http://localhost:8000/api/llm/chat
```

## Next Steps

1. **Production Deployment**: Update CORS origins and environment variables
2. **Enhanced UI**: Add user profile management, agent creation
3. **Advanced Features**: Implement conversations, memories, and agent management
4. **Vector Search**: Upgrade to proper pgvector similarity search
5. **Rate Limiting**: Add authentication-based rate limiting
