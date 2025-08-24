-- Per-User Long-Term Memories
-- Run in Supabase SQL editor

-- 1) Memories table (per-user)
CREATE TABLE IF NOT EXISTS memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  memory_text text NOT NULL,
  embedding vector,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2) Memory Logs (audit)
CREATE TABLE IF NOT EXISTS memory_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  memory_id uuid REFERENCES memories(id) ON DELETE SET NULL,
  action text NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- 2b) User settings for autosave toggle (optional, simple)
CREATE TABLE IF NOT EXISTS user_settings (
  owner uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  autosave_memories boolean DEFAULT null,
  updated_at timestamptz DEFAULT now()
);

-- 3) Trigger to update updated_at on memories
CREATE OR REPLACE FUNCTION update_memories_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_memories_updated_at ON memories;
CREATE TRIGGER trigger_update_memories_updated_at
  BEFORE UPDATE ON memories
  FOR EACH ROW
  EXECUTE FUNCTION update_memories_updated_at();

-- 3b) Trigger to update updated_at on user_settings
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_settings_updated_at ON user_settings;
CREATE TRIGGER trigger_update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_settings_updated_at();

-- 4) Enable RLS and policies
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policy: only owner may SELECT/INSERT/UPDATE/DELETE own memories
DROP POLICY IF EXISTS "memories: owner only" ON memories;
CREATE POLICY "memories: owner only" ON memories
  FOR ALL
  USING ( owner = auth.uid() )
  WITH CHECK ( owner = auth.uid() );

-- Policy for memory_logs: allow user to read their own logs
DROP POLICY IF EXISTS "memory_logs: owner only" ON memory_logs;
CREATE POLICY "memory_logs: owner only" ON memory_logs
  FOR SELECT
  USING ( user_id = auth.uid() );

-- user_settings policies
DROP POLICY IF EXISTS "user_settings: owner select" ON user_settings;
CREATE POLICY "user_settings: owner select" ON user_settings
  FOR SELECT USING ( owner = auth.uid() );

DROP POLICY IF EXISTS "user_settings: owner upsert" ON user_settings;
CREATE POLICY "user_settings: owner upsert" ON user_settings
  FOR INSERT WITH CHECK ( owner = auth.uid() );

CREATE POLICY "user_settings: owner update" ON user_settings
  FOR UPDATE USING ( owner = auth.uid() )
  WITH CHECK ( owner = auth.uid() );

-- 5) Indexes for performance
CREATE INDEX IF NOT EXISTS idx_memories_owner ON memories(owner);
-- If pgvector extension is present, create ivfflat index on embedding after setting correct dim:
-- CREATE INDEX IF NOT EXISTS idx_memories_embedding ON memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Notes:
-- - Set the vector column dimension using: ALTER TABLE memories ALTER COLUMN embedding TYPE vector(<MEMORY_EMBEDDING_DIM>);
-- - If pgvector is not available, leave embedding NULL and store embeddings in metadata as JSON (fallback path in backend).
