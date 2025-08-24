-- SQL to create agents table and RLS policies
-- Run these statements in Supabase SQL editor in order

-- Step 1: Drop table if exists (for clean setup)
DROP TABLE IF EXISTS agents CASCADE;

-- Step 2: Create agents table
CREATE TABLE agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  avatar_url text,
  instructions text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Step 3: Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger
DROP TRIGGER IF EXISTS trigger_update_agents_updated_at ON agents;
CREATE TRIGGER trigger_update_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 5: Enable RLS
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policy
CREATE POLICY "agents_owner_only" ON agents
  FOR ALL
  USING ( owner = auth.uid() )
  WITH CHECK ( owner = auth.uid() );

-- Step 7: Create performance indexes
CREATE INDEX idx_agents_owner ON agents(owner);
CREATE INDEX idx_agents_is_default ON agents(owner, is_default) WHERE is_default = true;
