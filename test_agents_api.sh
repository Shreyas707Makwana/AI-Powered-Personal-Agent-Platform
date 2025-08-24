#!/bin/bash

# Test script for Custom Agents API endpoints
# Replace YOUR_BACKEND_URL and USER_TOKEN with actual values

BACKEND_URL="http://localhost:8000"
USER_TOKEN="your_supabase_jwt_token_here"

echo "🧪 Testing Custom Agents API Endpoints"
echo "======================================="

# Test 1: Create an agent
echo "📝 Test 1: Creating a new agent..."
AGENT_RESPONSE=$(curl -s -X POST "${BACKEND_URL}/api/agents" \
  -H "Authorization: Bearer ${USER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Study Buddy",
    "instructions": "You are a patient tutor. Explain topics simply and provide examples. Always encourage learning and ask follow-up questions to ensure understanding.",
    "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=study",
    "is_default": true
  }')

echo "Response: $AGENT_RESPONSE"
AGENT_ID=$(echo $AGENT_RESPONSE | jq -r '.id')
echo "✅ Created agent with ID: $AGENT_ID"
echo ""

# Test 2: List agents
echo "📋 Test 2: Listing all agents..."
curl -s -X GET "${BACKEND_URL}/api/agents" \
  -H "Authorization: Bearer ${USER_TOKEN}" | jq '.'
echo ""

# Test 3: Get specific agent
echo "🔍 Test 3: Getting agent details..."
curl -s -X GET "${BACKEND_URL}/api/agents/${AGENT_ID}" \
  -H "Authorization: Bearer ${USER_TOKEN}" | jq '.'
echo ""

# Test 4: Update agent
echo "✏️ Test 4: Updating agent..."
curl -s -X PUT "${BACKEND_URL}/api/agents/${AGENT_ID}" \
  -H "Authorization: Bearer ${USER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Study Buddy Pro",
    "instructions": "You are an advanced tutor. Explain complex topics with detailed examples and provide practice problems."
  }' | jq '.'
echo ""

# Test 5: Use agent in chat
echo "💬 Test 5: Using agent in chat..."
curl -s -X POST "${BACKEND_URL}/api/llm/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${USER_TOKEN}" \
  -d "{
    \"messages\": [{\"role\": \"user\", \"content\": \"Explain recursion simply.\"}],
    \"use_rag\": false,
    \"agent_id\": \"${AGENT_ID}\"
  }" | jq '.'
echo ""

# Test 6: Chat without agent (backward compatibility)
echo "🔄 Test 6: Chat without agent (backward compatibility)..."
curl -s -X POST "${BACKEND_URL}/api/llm/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${USER_TOKEN}" \
  -d '{
    "messages": [{"role": "user", "content": "What is machine learning?"}],
    "use_rag": false
  }' | jq '.'
echo ""

# Test 7: Delete agent (commented out to preserve test data)
# echo "🗑️ Test 7: Deleting agent..."
# curl -s -X DELETE "${BACKEND_URL}/api/agents/${AGENT_ID}" \
#   -H "Authorization: Bearer ${USER_TOKEN}"
# echo "✅ Agent deleted"

echo "🎉 All tests completed!"
echo ""
echo "📋 Manual verification steps:"
echo "1. Check that agent appears in frontend /agents page"
echo "2. Verify agent selector works in chat UI"
echo "3. Test that agent instructions affect chat responses"
echo "4. Confirm existing functionality (upload, RAG) still works"
