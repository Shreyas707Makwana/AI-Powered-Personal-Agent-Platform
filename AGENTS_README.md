# Custom Agents Feature - Developer Documentation

## Overview
The Custom Agents feature allows authenticated users to create, manage, and use personalized AI agents with custom instructions. Each agent can have a unique personality, expertise, and behavior pattern that influences chat responses.

## Architecture

### Database Schema
- **Table**: `agents`
- **RLS**: Enabled - users can only access their own agents
- **Key Fields**: `id`, `owner`, `name`, `avatar_url`, `instructions`, `is_default`

### Backend Endpoints
All endpoints require authentication via JWT token:

```
POST   /api/agents            - Create new agent
GET    /api/agents            - List user's agents  
GET    /api/agents/{id}       - Get agent details
PUT    /api/agents/{id}       - Update agent
DELETE /api/agents/{id}       - Delete agent
```

### Chat Integration
The existing `/api/llm/chat` endpoint now accepts an optional `agent_id` parameter:

```json
{
  "messages": [...],
  "use_rag": true,
  "agent_id": "uuid-here"
}
```

When `agent_id` is provided, the agent's instructions are prepended as a system message to the LLM conversation.

## Frontend Components

### Agent Management (`/agents`)
- Full CRUD interface for managing agents
- Card-based layout with agent list and detail view
- Form validation and error handling
- Responsive design matching app theme

### Chat Integration
- Agent selector dropdown in chat UI
- Default agent auto-selection
- "Manage Agents" quick link
- Backward compatibility (works without agent selection)

## Usage Examples

### Creating an Agent
```bash
curl -X POST /api/agents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Code Mentor",
    "instructions": "You are an expert programming tutor. Explain concepts clearly with code examples.",
    "is_default": true
  }'
```

### Using Agent in Chat
```bash
curl -X POST /api/llm/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Explain async/await"}],
    "agent_id": "agent-uuid-here"
  }'
```

## Key Features

### 1. User Isolation
- Row Level Security ensures users only see their agents
- All database queries scoped by `owner` field
- Authentication required for all operations

### 2. Default Agent Support
- Users can set one agent as default
- Default agent auto-selected in chat UI
- Setting new default unsets previous default

### 3. Backward Compatibility
- All existing functionality preserved
- Chat works without agent selection
- No breaking changes to existing APIs

### 4. System Message Integration
- Agent instructions become LLM system prompt
- Proper message ordering: Agent system → RAG system → User message
- Instructions influence response style and behavior

## File Changes Summary

### Backend
- `agents_schema.sql` - Database schema and RLS policies
- `backend/database.py` - Agent CRUD functions and models
- `backend/routers/agents.py` - FastAPI router with endpoints
- `backend/main.py` - Router integration and chat endpoint updates

### Frontend
- `frontend/src/lib/api.ts` - Agent API functions and types
- `frontend/src/app/agents/page.tsx` - Agent management page
- `frontend/src/components/Chat.tsx` - Agent selector integration

### Testing
- `test_agents_api.sh` - API endpoint testing script
- `QA_CHECKLIST.md` - Comprehensive testing checklist

## Deployment Steps

1. **Database Setup**
   ```sql
   -- Run in Supabase SQL editor
   \i agents_schema.sql
   ```

2. **Backend Deployment**
   - Deploy updated backend code
   - Verify all endpoints accessible
   - Test authentication and RLS

3. **Frontend Deployment**
   - Build and deploy frontend
   - Test agent management page
   - Verify chat integration

4. **Verification**
   - Run test script: `bash test_agents_api.sh`
   - Complete QA checklist
   - Monitor error logs

## Security Considerations

- **RLS Policies**: Prevent cross-user access
- **Input Validation**: Sanitize agent instructions
- **Authentication**: Required for all operations
- **XSS Protection**: Safe rendering of user content

## Performance Notes

- Agent queries use indexed `owner` field
- Instructions cached during chat session
- Minimal impact on existing chat performance
- Efficient database queries with proper indexing

## Troubleshooting

### Common Issues
1. **404 on agent endpoints**: Check router integration in `main.py`
2. **RLS errors**: Verify policies active and user authenticated
3. **Chat not using agent**: Check `agent_id` parameter in request
4. **Frontend errors**: Verify API base URL and authentication

### Debug Commands
```bash
# Check agent creation
curl -X GET /api/agents -H "Authorization: Bearer $TOKEN"

# Test chat with agent
curl -X POST /api/llm/chat -d '{"messages":[...], "agent_id":"..."}' 

# Verify RLS
SELECT * FROM agents; -- Should only show user's agents
```
