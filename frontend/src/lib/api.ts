/**
 * API functions for communicating with the AI Agent Platform backend
 */

import { supabase } from './supabaseClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

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
}

export interface UploadResponse {
  message: string;
  document_id: number;
  file_name: string;
  chunks_processed: number;
  status: string;
}

/**
 * Fetch all uploaded documents from the backend
 * Returns user's documents if authenticated, or public documents if not
 */
export async function fetchDocuments(): Promise<Document[]> {
  const authHeaders = await getAuthHeaders();
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/ingest/documents`, {
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
  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/ingest/upload`, {
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

/**
 * Send a chat message to the AI model with optional RAG support
 * Uses user's documents for RAG if authenticated
 */
export async function sendChat(
  messages: ChatMessage[], 
  options: ChatOptions = {}
): Promise<ChatResponse> {
  const { use_rag = false, top_k = 4, document_id = null } = options;
  
  const authHeaders = await getAuthHeaders();
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/llm/chat`, {
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
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/me`, {
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
