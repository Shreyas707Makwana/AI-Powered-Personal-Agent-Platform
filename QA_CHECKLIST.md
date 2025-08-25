# Custom Agents QA Checklist

## Pre-deployment Steps

### 1. Database Setup ✅
- [ ] Run SQL schema from `agents_schema.sql` in Supabase SQL editor
- [ ] Verify `agents` table created with correct columns
- [ ] Confirm RLS policies are active
- [ ] Test that users can only access their own agents

### 2. Backend Verification ✅
- [ ] Agents router imported in `main.py`
- [ ] All 5 agent endpoints accessible:
  - `POST /api/agents` - Create agent
  - `GET /api/agents` - List agents
  - `GET /api/agents/{id}` - Get agent
  - `PUT /api/agents/{id}` - Update agent
  - `DELETE /api/agents/{id}` - Delete agent
- [ ] Chat endpoint accepts optional `agent_id` parameter
- [ ] Chat works without `agent_id` (backward compatibility)

### 2.1 Tools Backend & DB ✅
- [ ] Apply migration `infra/migrations/20250822_add_tools.sql`
- [ ] Verify tables exist: `tools`, `agent_tools`, `tool_logs`
- [ ] Verify RLS policies: user can only read/write own agent_tools
- [ ] Verify default registry includes `weather` tool
- [ ] `OPENWEATHER_API_KEY` present in backend `.env`
- [ ] Optional `TOOL_TIMEOUT_SECONDS` set (or defaults)

### 3. Frontend Verification ✅
- [ ] Agents management page accessible at `/agents`
- [ ] Agent selector visible in chat UI
- [ ] API functions work (create, list, update, delete agents)
- [ ] Chat includes selected agent in requests

### 3.1 Tools UI ✅
- [ ] Agents page renders Tools panel with toggle for `weather`
- [ ] Toggling updates state and persists via API
- [ ] Chat page shows `TOOLS` button
- [ ] ToolModal opens and executes weather with city input
- [ ] Tool results render in modal

## Functional Testing

### Agent Management
- [ ] Create new agent with name, instructions, avatar URL
- [ ] Set agent as default
- [ ] Edit existing agent
- [ ] Delete agent
- [ ] View agent details
- [ ] Only user's agents visible

### Chat Integration
- [ ] Select agent from dropdown
- [ ] Chat responses reflect agent personality/instructions
- [ ] "No Agent" option works (default behavior)
- [ ] Default agent auto-selected on page load
- [ ] Agent + RAG combination works
- [ ] Agent without RAG works

### Tools Execution
- [ ] `GET /api/tools` returns registry
- [ ] `PUT /api/agents/{id}/tools/weather` enables/disables correctly
- [ ] `GET /api/agents/{id}/tools` reflects enablement
- [ ] `POST /api/tools/execute` runs only when enabled for the agent
- [ ] Tool logs inserted (check `tool_logs` table)
- [ ] Server-side tool_call from model triggers execution and injects result
- [ ] Error handling: invalid city / network error shows friendly message

### Backward Compatibility
- [ ] Existing chat works without agent selection
- [ ] Document upload still works
- [ ] RAG functionality unchanged
- [ ] Authentication flows unchanged
- [ ] All existing API endpoints work

## Error Handling
- [ ] Invalid agent ID returns 404
- [ ] Unauthorized access returns 401/403
- [ ] Missing required fields return validation errors
- [ ] Network errors handled gracefully in UI
- [ ] Missing/invalid `OPENWEATHER_API_KEY` returns 500 with safe error (no secrets)
- [ ] Unauthorized tool execution blocked by RLS/ownership checks

## UI/UX Testing
- [ ] Agent selector matches existing design theme
- [ ] Responsive design on mobile/tablet
- [ ] Loading states work properly
- [ ] Error messages display correctly
- [ ] Navigation between chat and agents page works

### Landing Page
- [ ] Not-authenticated users see the marketing landing page at `/`
- [ ] Landing shows hero, pseudo logos, features, testimonials
- [ ] Authenticated users are redirected to `/app`
- [ ] "Login" and "Try Demo" buttons route to `/login`

## Performance Testing
- [ ] Large number of agents (50+) loads quickly
- [ ] Chat with agent instructions doesn't timeout
- [ ] Database queries are efficient
- [ ] No memory leaks in frontend

## Security Testing
- [ ] RLS prevents cross-user agent access
- [ ] SQL injection protection in agent queries
- [ ] XSS protection in agent instructions display
- [ ] Authentication required for all agent operations
- [ ] Tools execution requires ownership of agent or user context
- [ ] Tool logs inserted with safe service privileges only

## Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

## Deployment Checklist
- [ ] Environment variables set correctly
- [ ] Database migrations applied
- [ ] Frontend build successful
- [ ] Backend deployment successful
- [ ] CORS settings updated if needed
- [ ] Backend `.env` contains `OPENWEATHER_API_KEY`
- [ ] Migration applied and idempotent

## Post-deployment Verification
- [ ] Create test agent in production
- [ ] Test chat with agent in production
- [ ] Monitor error logs for issues
- [ ] Verify performance metrics
- [ ] Test from different user accounts
 - [ ] Execute `test_tools_api.sh` against production with a test account

## Rollback Plan
If issues occur:
1. Revert to previous git commit
2. Database rollback (if schema changes cause issues)
3. Monitor for any data corruption
4. Communicate with users about temporary issues

---

# Memories QA Checklist

## Pre-deployment Steps
- [ ] Apply migrations for memories (`infra/migrations/20250823_create_memories.sql`)
- [ ] Verify tables exist: `memories`, `memory_logs`, `user_settings`
- [ ] Confirm RLS prevents cross-user memory access
- [ ] Backend `.env` includes memory vars (see README): `EMBEDDING_MODEL`, `MEMORY_EMBEDDING_DIM`, etc.

## Backend Verification
- [ ] Router mounted under `/api/memories`
- [ ] Endpoints:
  - [ ] `GET /api/memories` list + search (q, limit, offset)
  - [ ] `POST /api/memories` create memory
  - [ ] `DELETE /api/memories/{id}` delete memory
  - [ ] `POST /api/memories/condense` condense conversation
  - [ ] `GET /api/memories/preferences` get autosave
  - [ ] `PUT /api/memories/preferences` set autosave
- [ ] Chat integration:
  - [ ] Retrieval before prompt assembly when memory enabled
  - [ ] Autosave condensation after response when autosave enabled
  - [ ] `no_memory=true` disables memory usage per-request

## Frontend Verification
- [ ] `/memories` page accessible from header link
- [ ] Search filters results semantically
- [ ] Autosave toggle updates preference
- [ ] “Condense conversation” modal creates memories
- [ ] Deleting a memory removes it from list
- [ ] Subtle banner in `Chat.tsx` appears when related memories exist

## Functional Tests
- [ ] Run `./test_memory_flow.sh` with `API_BASE` and `TOKEN`
  - [ ] Lists memories
  - [ ] Gets/sets preferences
  - [ ] Creates memory and searches it
  - [ ] Condenses sample conversation
  - [ ] Chats with and without memory
  - [ ] Cleans up created memory

## Backward Compatibility
- [ ] Chat works with no memory changes (when `no_memory=true`)
- [ ] Existing RAG and upload flows unchanged
- [ ] Auth flows unchanged

## Security
- [ ] RLS verified for `memories`, `memory_logs`, `user_settings`
- [ ] Service role not exposed in frontend
- [ ] No sensitive data in memory texts

## Performance
- [ ] Listing 100+ memories remains responsive
- [ ] Search latency acceptable (<500ms typical)

## Browser Compatibility
- [ ] Chrome, Firefox, Safari, Edge latest
