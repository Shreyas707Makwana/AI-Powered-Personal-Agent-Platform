/**
 * API functions for communicating with the AI Agent Platform backend
 */

import { supabase } from './supabaseClient';

// Tooling types
export interface ToolRegistryItem {
  id: string;
  key: string;
  name: string;
  description?: string;
  input_schema?: unknown;
  created_at?: string;
}

// -----------------------------
// Conversations API
// -----------------------------

export async function listConversations(): Promise<ConversationRow[]> {
  const response = await authenticatedFetch(`/api/conversations`);
  if (!response.ok) throw new Error(`Failed to list conversations: ${response.status}`);
  return await response.json();
}

export async function createConversation(data?: { title?: string }): Promise<ConversationRow> {
  const response = await authenticatedFetch(`/api/conversations`, {
    method: 'POST',
    body: JSON.stringify(data || {}),
  });
  if (!response.ok) throw new Error(`Failed to create conversation: ${response.status}`);
  return await response.json();
}

export async function deleteConversation(conversationId: string): Promise<{ ok: boolean; deleted_messages?: number; deleted_conversations?: number; }> {
  const response = await authenticatedFetch(`/api/conversations/${conversationId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error(`Failed to delete conversation: ${response.status}`);
  return await response.json();
}

export async function listConversationMessages(conversationId: string): Promise<ConversationMessageRow[]> {
  const response = await authenticatedFetch(`/api/conversations/${conversationId}/messages`);
  if (!response.ok) throw new Error(`Failed to list messages: ${response.status}`);
  return await response.json();
}

export async function postConversationMessage(
  conversationId: string,
  data: { role: 'user' | 'assistant' | 'agent'; content: string; agent_id?: string | null; tool_used?: string | null }
): Promise<ConversationMessageRow> {
  const response = await authenticatedFetch(`/api/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`Failed to post message: ${response.status}`);
  return await response.json();
}

export interface AgentToolRow {
  id: string;
  agent_id: string;
  tool_key: string;
  enabled: boolean;
  config?: unknown;
  created_at?: string;
}

export interface ExecuteToolResponse<T = unknown> {
  success: boolean;
  result: T;
}

// Helper function to get auth headers - REQUIRED for all requests
async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    // Redirect to login if no token
    window.location.href = '/login';
    throw new Error('Authentication required');
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  };
}

// Helper function to make authenticated requests - ALL requests require auth
async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  // Handle 401 responses by redirecting to login
  if (response.status === 401) {
    window.location.href = '/login';
    throw new Error('Authentication expired');
  }

  return response;
}

export interface Document {
  id: number;
  file_name: string;
  file_size: number;
  upload_timestamp: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  role: string;
  content: string;
}

export interface ChatOptions {
  use_rag?: boolean;
  top_k?: number;
  document_id?: string | null;
  agent_id?: string | null;
  conversation_id?: string | null;
}

export interface ChatResponse {
  response: string;
  citations?: Array<{
    id: number;
    snippet: string;
    similarity: number;
    document_id: number;
    chunk_index: number;
  }>;
  conversation_id?: string;
}

export interface UploadResponse {
  message: string;
  document_id: number;
  file_name: string;
  chunks_processed: number;
  status: string;
}

export interface Agent {
  id: string;
  owner: string;
  name: string;
  avatar_url?: string;
  instructions: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// Conversations types
export interface ConversationRow {
  id: string;
  owner: string;
  title?: string | null;
  archived?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ConversationMessageRow {
  id: string;
  conversation_id: string;
  owner: string;
  role: 'user' | 'assistant' | 'agent';
  content: string;
  agent_id?: string | null;
  tool_used?: string | null;
  created_at?: string;
}

export interface CreateAgentRequest {
  name: string;
  instructions: string;
  avatar_url?: string;
  is_default?: boolean;
}

export interface UpdateAgentRequest {
  name?: string;
  instructions?: string;
  avatar_url?: string;
  is_default?: boolean;
}

/**
 * Fetch all uploaded documents from the backend
 * Returns user's documents if authenticated, or public documents if not
 */
export async function fetchDocuments(): Promise<Document[]> {
  const authHeaders = await getAuthHeaders();
  
  const response = await fetch(`/api/ingest/documents`, {
    headers: authHeaders
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch documents: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.documents || [];
}

/**
 * Upload a PDF document to the backend for RAG processing
 * Associates with current user if authenticated
 */
export async function uploadDocument(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    window.location.href = '/login';
    throw new Error('Authentication required');
  }
  
  // For file uploads, don't set Content-Type - let browser set multipart/form-data
  const response = await fetch(`/api/ingest/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`Failed to upload document: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

// -----------------------------
// Tools API
// -----------------------------

export async function listTools(): Promise<ToolRegistryItem[]> {
  const response = await fetch(`/api/tools`);
  if (!response.ok) throw new Error(`Failed to list tools: ${response.status}`);
  return await response.json();
}

export async function listAgentTools(agentId: string): Promise<AgentToolRow[]> {
  const response = await authenticatedFetch(`/api/agents/${agentId}/tools`);
  if (!response.ok) throw new Error(`Failed to list agent tools: ${response.status}`);
  return await response.json();
}

export async function updateAgentTool(agentId: string, toolKey: string, data: { enabled?: boolean; config?: unknown; }): Promise<AgentToolRow> {
  const response = await authenticatedFetch(`/api/agents/${agentId}/tools/${toolKey}` , {
    method: 'PUT',
    body: JSON.stringify(data || {}),
  });
  if (!response.ok) throw new Error(`Failed to update agent tool: ${response.status}`);
  return await response.json();
}

export async function executeTool<T = unknown>(body: { agent_id?: string | null; tool_key: string; params: Record<string, unknown>; }): Promise<ExecuteToolResponse<T>> {
  const response = await authenticatedFetch(`/api/tools/execute`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Tool execute failed: ${response.status}`);
  return await response.json();
}

/**
 * Send a chat message to the AI model with optional RAG support
 * Uses user's documents for RAG if authenticated
 */
export async function sendChat(
  messages: ChatMessage[], 
  options: ChatOptions = {}
): Promise<ChatResponse> {
  const { use_rag = false, top_k = 4, document_id = null, agent_id = null, conversation_id = null } = options;
  
  const authHeaders = await getAuthHeaders();
  
  const response = await fetch(`/api/llm/chat`, {

    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders
    },
    body: JSON.stringify({
      messages,
      use_rag,
      top_k,
      document_id,
      agent_id,
      conversation_id,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to send chat: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Get current user profile information
 */
export async function getCurrentUserProfile() {
  const authHeaders = await getAuthHeaders();
  
  const response = await fetch(`/api/me`, {
    headers: authHeaders
  });
  
  if (response.status === 204) {
    return null; // Not authenticated
  }
  
  if (!response.ok) {
    throw new Error(`Failed to get user profile: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

// Agent API functions
/**
 * Create a new agent
 */
export async function createAgent(data: CreateAgentRequest): Promise<Agent> {
  const response = await authenticatedFetch(`/api/agents`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create agent: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * List all agents for the current user
 */
export async function listAgents(): Promise<Agent[]> {
  const response = await authenticatedFetch(`/api/agents`);
  
  if (!response.ok) {
    throw new Error(`Failed to list agents: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Get a specific agent by ID
 */
export async function getAgent(agentId: string): Promise<Agent> {
  const response = await authenticatedFetch(`/api/agents/${agentId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to get agent: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Update an agent
 */
export async function updateAgent(agentId: string, data: UpdateAgentRequest): Promise<Agent> {
  const response = await authenticatedFetch(`/api/agents/${agentId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update agent: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Delete an agent
 */
export async function deleteAgent(agentId: string): Promise<void> {
  const response = await authenticatedFetch(`/api/agents/${agentId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to delete agent: ${response.status} ${response.statusText}`);
  }
}
