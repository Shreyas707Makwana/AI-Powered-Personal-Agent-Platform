-- Tools, Agent Tools, and Tool Logs schema with RLS
-- Run in Supabase SQL editor

-- 1) tools registry
CREATE TABLE IF NOT EXISTS tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  input_schema jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 2) per-agent tool enablement
CREATE TABLE IF NOT EXISTS agent_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  tool_key text NOT NULL,
  enabled boolean DEFAULT true,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 3) tool usage logs
CREATE TABLE IF NOT EXISTS tool_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES agents(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  tool_key text NOT NULL,
  request_payload jsonb,
  response_payload jsonb,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tools_key ON tools(key);
CREATE INDEX IF NOT EXISTS idx_agent_tools_agent_id ON agent_tools(agent_id);
CREATE INDEX IF NOT EXISTS idx_tool_logs_agent_id ON tool_logs(agent_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_tools_unique ON agent_tools(agent_id, tool_key);

-- Enable RLS
ALTER TABLE agent_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_logs ENABLE ROW LEVEL SECURITY;

-- RLS: only agent owner can view/modify agent_tools
DROP POLICY IF EXISTS "agent_tools: owner only" ON agent_tools;
CREATE POLICY "agent_tools: owner only" ON agent_tools
  FOR ALL
  USING (
    (SELECT owner FROM agents WHERE id = agent_tools.agent_id) = auth.uid()
  )
  WITH CHECK (
    (SELECT owner FROM agents WHERE id = agent_tools.agent_id) = auth.uid()
  );

-- RLS: tool_logs select policy for owner or user
DROP POLICY IF EXISTS "tool_logs: owner or user" ON tool_logs;
CREATE POLICY "tool_logs: owner or user" ON tool_logs
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    (agent_id IS NOT NULL AND (SELECT owner FROM agents WHERE id = tool_logs.agent_id) = auth.uid())
  );

-- Insert a tools registry row for "weather"
INSERT INTO tools (key, name, description, input_schema) VALUES (
  'weather',
  'Weather',
  'Get current weather for a city. Params: { "city": "City name" }',
  '{"type":"object","properties":{"city":{"type":"string"}},"required":["city"]}'::jsonb
) ON CONFLICT (key) DO NOTHING;

-- Insert a tools registry row for "news"
INSERT INTO tools (key, name, description, input_schema) VALUES (
  'news',
  'News',
  'Fetch recent news articles by topic using NewsAPI.org. Params: { "topic": string (<=200 chars), "language": string (optional, default "en"), "pageSize": number (1-10, default 5) }',
  '{
    "type":"object",
    "properties":{
      "topic":{"type":"string","maxLength":200},
      "language":{"type":"string"},
      "pageSize":{"type":"integer","minimum":1,"maximum":10}
    },
    "required":["topic"]
  }'::jsonb
) ON CONFLICT (key) DO NOTHING;
