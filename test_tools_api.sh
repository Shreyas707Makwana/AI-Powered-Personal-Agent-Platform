#!/usr/bin/env bash
# Simple Tools API test script
# Usage:
#   export API_BASE="http://localhost:8000"
#   export TOKEN="<supabase_jwt>"
#   export AGENT_ID="<agent_uuid>"   # optional, but required if you enforce per-agent enablement
#   bash test_tools_api.sh

set -euo pipefail

API_BASE=${API_BASE:-"http://localhost:8000"}
TOKEN_HEADER=( -H "Authorization: Bearer ${TOKEN:-}" )

if [[ -z "${TOKEN:-}" ]]; then
  echo "ERROR: TOKEN env var is required (Supabase JWT)." >&2
  exit 1
fi

# 1) List all tools
printf "\n== List Tools ==\n"
curl -sS "$API_BASE/api/tools" | jq .

# 2) (Optional) Enable weather tool for agent
if [[ -n "${AGENT_ID:-}" ]]; then
  printf "\n== Enable Weather Tool for Agent %s ==\n" "$AGENT_ID"
  curl -sS -X PUT "$API_BASE/api/agents/$AGENT_ID/tools/weather" \
    "${TOKEN_HEADER[@]}" \
    -H 'Content-Type: application/json' \
    -d '{"enabled": true}' | jq .

  printf "\n== List Agent Tools ==\n"
  curl -sS "$API_BASE/api/agents/$AGENT_ID/tools" "${TOKEN_HEADER[@]}" | jq .
fi

# 3) Execute weather tool (with or without agent_id)
printf "\n== Execute Weather Tool ==\n"
BODY='{ "tool_key": "weather", "params": { "city": "London" } }'
if [[ -n "${AGENT_ID:-}" ]]; then
  BODY=$(jq -n --arg agent "$AGENT_ID" '{tool_key:"weather", agent_id:$agent, params:{city:"London"}}')
fi

curl -sS -X POST "$API_BASE/api/tools/execute" \
  "${TOKEN_HEADER[@]}" \
  -H 'Content-Type: application/json' \
  -d "$BODY" | jq .

# 4) Enable and execute news tool
if [[ -n "${AGENT_ID:-}" ]]; then
  printf "\n== Enable News Tool for Agent %s ==\n" "$AGENT_ID"
  curl -sS -X PUT "$API_BASE/api/agents/$AGENT_ID/tools/news" \
    "${TOKEN_HEADER[@]}" \
    -H 'Content-Type: application/json' \
    -d '{"enabled": true}' | jq .
fi

printf "\n== Execute News Tool ==\n"
NEWS_BODY='{ "tool_key": "news", "params": { "topic": "OpenAI GPT-4o", "language": "en", "pageSize": 5 } }'
if [[ -n "${AGENT_ID:-}" ]]; then
  NEWS_BODY=$(jq -n --arg agent "$AGENT_ID" '{tool_key:"news", agent_id:$agent, params:{topic:"OpenAI GPT-4o", language:"en", pageSize:5}}')
fi

curl -sS -X POST "$API_BASE/api/tools/execute" \
  "${TOKEN_HEADER[@]}" \
  -H 'Content-Type: application/json' \
  -d "$NEWS_BODY" | jq .

echo "\nDone."
