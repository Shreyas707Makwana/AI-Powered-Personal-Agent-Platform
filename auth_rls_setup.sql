-- AI Agent Platform - Authentication and RLS Setup SQL
-- 1. Enable pgvector extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create profiles table for user data
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add owner columns to existing tables (if they don't exist)
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS owner UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.doc_chunks 
ADD COLUMN IF NOT EXISTS owner UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Create additional tables for full platform functionality
CREATE TABLE IF NOT EXISTS public.agents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    system_prompt TEXT,
    owner UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT,
    agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
    owner UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    owner UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.memories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    embedding vector(384), -- For semantic search
    owner UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doc_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 7. Create RLS policies for documents
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
CREATE POLICY "Users can view own documents" ON public.documents
    FOR SELECT USING (auth.uid() = owner);

DROP POLICY IF EXISTS "Users can insert own documents" ON public.documents;
CREATE POLICY "Users can insert own documents" ON public.documents
    FOR INSERT WITH CHECK (auth.uid() = owner);

DROP POLICY IF EXISTS "Users can update own documents" ON public.documents;
CREATE POLICY "Users can update own documents" ON public.documents
    FOR UPDATE USING (auth.uid() = owner);

DROP POLICY IF EXISTS "Users can delete own documents" ON public.documents;
CREATE POLICY "Users can delete own documents" ON public.documents
    FOR DELETE USING (auth.uid() = owner);

-- 8. Create RLS policies for document chunks
DROP POLICY IF EXISTS "Users can view own doc_chunks" ON public.doc_chunks;
CREATE POLICY "Users can view own doc_chunks" ON public.doc_chunks
    FOR SELECT USING (auth.uid() = owner);

DROP POLICY IF EXISTS "Users can insert own doc_chunks" ON public.doc_chunks;
CREATE POLICY "Users can insert own doc_chunks" ON public.doc_chunks
    FOR INSERT WITH CHECK (auth.uid() = owner);

DROP POLICY IF EXISTS "Users can update own doc_chunks" ON public.doc_chunks;
CREATE POLICY "Users can update own doc_chunks" ON public.doc_chunks
    FOR UPDATE USING (auth.uid() = owner);

DROP POLICY IF EXISTS "Users can delete own doc_chunks" ON public.doc_chunks;
CREATE POLICY "Users can delete own doc_chunks" ON public.doc_chunks
    FOR DELETE USING (auth.uid() = owner);

-- 9. Create RLS policies for agents
DROP POLICY IF EXISTS "Users can view own agents" ON public.agents;
CREATE POLICY "Users can view own agents" ON public.agents
    FOR SELECT USING (auth.uid() = owner);

DROP POLICY IF EXISTS "Users can insert own agents" ON public.agents;
CREATE POLICY "Users can insert own agents" ON public.agents
    FOR INSERT WITH CHECK (auth.uid() = owner);

DROP POLICY IF EXISTS "Users can update own agents" ON public.agents;
CREATE POLICY "Users can update own agents" ON public.agents
    FOR UPDATE USING (auth.uid() = owner);

DROP POLICY IF EXISTS "Users can delete own agents" ON public.agents;
CREATE POLICY "Users can delete own agents" ON public.agents
    FOR DELETE USING (auth.uid() = owner);

-- 10. Create RLS policies for conversations
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
CREATE POLICY "Users can view own conversations" ON public.conversations
    FOR SELECT USING (auth.uid() = owner);

DROP POLICY IF EXISTS "Users can insert own conversations" ON public.conversations;
CREATE POLICY "Users can insert own conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() = owner);

DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
CREATE POLICY "Users can update own conversations" ON public.conversations
    FOR UPDATE USING (auth.uid() = owner);

DROP POLICY IF EXISTS "Users can delete own conversations" ON public.conversations;
CREATE POLICY "Users can delete own conversations" ON public.conversations
    FOR DELETE USING (auth.uid() = owner);

-- 11. Create RLS policies for messages
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
CREATE POLICY "Users can view own messages" ON public.messages
    FOR SELECT USING (auth.uid() = owner);

DROP POLICY IF EXISTS "Users can insert own messages" ON public.messages;
CREATE POLICY "Users can insert own messages" ON public.messages
    FOR INSERT WITH CHECK (auth.uid() = owner);

DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
CREATE POLICY "Users can update own messages" ON public.messages
    FOR UPDATE USING (auth.uid() = owner);

DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;
CREATE POLICY "Users can delete own messages" ON public.messages
    FOR DELETE USING (auth.uid() = owner);

-- 12. Create RLS policies for memories
DROP POLICY IF EXISTS "Users can view own memories" ON public.memories;
CREATE POLICY "Users can view own memories" ON public.memories
    FOR SELECT USING (auth.uid() = owner);

DROP POLICY IF EXISTS "Users can insert own memories" ON public.memories;
CREATE POLICY "Users can insert own memories" ON public.memories
    FOR INSERT WITH CHECK (auth.uid() = owner);

DROP POLICY IF EXISTS "Users can update own memories" ON public.memories;
CREATE POLICY "Users can update own memories" ON public.memories
    FOR UPDATE USING (auth.uid() = owner);

DROP POLICY IF EXISTS "Users can delete own memories" ON public.memories;
CREATE POLICY "Users can delete own memories" ON public.memories
    FOR DELETE USING (auth.uid() = owner);

-- 13. Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Create trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 15. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_owner ON public.documents(owner);
CREATE INDEX IF NOT EXISTS idx_doc_chunks_owner ON public.doc_chunks(owner);
CREATE INDEX IF NOT EXISTS idx_doc_chunks_document_id ON public.doc_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_agents_owner ON public.agents(owner);
CREATE INDEX IF NOT EXISTS idx_conversations_owner ON public.conversations(owner);
CREATE INDEX IF NOT EXISTS idx_messages_owner ON public.messages(owner);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_memories_owner ON public.memories(owner);

-- 16. Create vector similarity search index for memories
CREATE INDEX IF NOT EXISTS idx_memories_embedding ON public.memories 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 17. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
