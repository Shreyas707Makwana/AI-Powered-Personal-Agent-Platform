#!/usr/bin/env bash
# Simple end-to-end test for Memory API and chat integration
# Usage:
#   API_BASE=http://localhost:8000 TOKEN=eyJ... ./test_memory_flow.sh
# Optional: AGENT_ID=<uuid>

set -euo pipefail

API_BASE=${API_BASE:-http://localhost:8000}
TOKEN=${TOKEN:-}
AGENT_ID=${AGENT_ID:-}

if [[ -z "$TOKEN" ]]; then
  echo "ERROR: TOKEN env var required (Supabase JWT)" >&2
  exit 1
fi

auth() {
  echo "Authorization: Bearer $TOKEN"
}

section() {
  echo
  echo "===== $1 ====="
}

jqexists() {
  command -v jq >/dev/null 2>&1
}

section "List memories (empty or existing)"
resp=$(curl -s -H "$(auth)" "${API_BASE}/api/memories?limit=5")
if jqexists; then echo "$resp" | jq; else echo "$resp"; fi

section "Get preferences"
resp=$(curl -s -H "$(auth)" "${API_BASE}/api/memories/preferences")
if jqexists; then echo "$resp" | jq; else echo "$resp"; fi

section "Disable autosave"
resp=$(curl -s -X PUT -H "Content-Type: application/json" -H "$(auth)" \
  -d '{"autosave_memories": false}' \
  "${API_BASE}/api/memories/preferences")
if jqexists; then echo "$resp" | jq; else echo "$resp"; fi

section "Create a memory"
resp=$(curl -s -X POST -H "Content-Type: application/json" -H "$(auth)" \
  -d '{"title": "User favorite city", "memory_text": "User likes Paris in the spring.", "metadata": {"source": "manual_test"}}' \
  "${API_BASE}/api/memories")
if jqexists; then echo "$resp" | jq; else echo "$resp"; fi
MEM_ID=$(echo "$resp" | sed -n 's/.*"id"\s*:\s*"\([^"]\+\)".*/\1/p' | head -n1)

eq() { test "$1" = "$2"; }

if [[ -n "$MEM_ID" ]]; then
  section "Search by query (Paris)"
  resp=$(curl -s -H "$(auth)" "${API_BASE}/api/memories?q=Paris&limit=5")
  if jqexists; then echo "$resp" | jq; else echo "$resp"; fi
else
  echo "WARN: Could not parse created memory id; skipping search"
fi

section "Condense sample conversation"
read -r -d '' SAMPLE_CONVO <<'EOF'
User: I love traveling to Paris in the spring. The cherry blossoms are wonderful.
Assistant: Great! I will remember that you enjoy Paris during springtime.
EOF
resp=$(curl -s -X POST -H "Content-Type: application/json" -H "$(auth)" \
  -d "{\"conversation\": $(printf %s "$SAMPLE_CONVO" | jq -Rs .)}" \
  "${API_BASE}/api/memories/condense")
if jqexists; then echo "$resp" | jq; else echo "$resp"; fi

section "Chat without memory"
cat > /tmp/chat_nomem.json <<JSON
{
  "messages": [
    {"role":"user","content":"Where do I like to travel in spring?"}
  ],
  "use_rag": false,
  "agent_id": ${AGENT_ID:+"$AGENT_ID"}
}
JSON
resp=$(curl -s -X POST -H "Content-Type: application/json" -H "$(auth)" \
  -d @/tmp/chat_nomem.json \
  "${API_BASE}/api/llm/chat?no_memory=true")
if jqexists; then echo "$resp" | jq; else echo "$resp"; fi

section "Chat with memory"
cat > /tmp/chat_mem.json <<JSON
{
  "messages": [
    {"role":"user","content":"Where do I like to travel in spring?"}
  ],
  "use_rag": false,
  "agent_id": ${AGENT_ID:+"$AGENT_ID"}
}
JSON
resp=$(curl -s -X POST -H "Content-Type: application/json" -H "$(auth)" \
  -d @/tmp/chat_mem.json \
  "${API_BASE}/api/llm/chat")
if jqexists; then echo "$resp" | jq; else echo "$resp"; fi

echo
section "Delete created memory (cleanup)"
if [[ -n "$MEM_ID" ]]; then
  resp=$(curl -s -X DELETE -H "$(auth)" "${API_BASE}/api/memories/${MEM_ID}")
  echo "Deleted ${MEM_ID}: $resp"
else
  echo "No memory id to delete"
fi

echo
section "Re-enable autosave"
resp=$(curl -s -X PUT -H "Content-Type: application/json" -H "$(auth)" \
  -d '{"autosave_memories": true}' \
  "${API_BASE}/api/memories/preferences")
if jqexists; then echo "$resp" | jq; else echo "$resp"; fi

echo "\nAll memory tests finished."
