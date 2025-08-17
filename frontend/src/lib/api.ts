/**
 * API functions for communicating with the AI Agent Platform backend
 */

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
 */
export async function fetchDocuments(): Promise<Document[]> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/ingest/documents`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch documents: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.documents || [];
}

/**
 * Upload a PDF document to the backend for RAG processing
 */
export async function uploadDocument(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/ingest/upload`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`Failed to upload document: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Send a chat message to the AI model with optional RAG support
 */
export async function sendChat(
  messages: ChatMessage[], 
  options: ChatOptions = {}
): Promise<ChatResponse> {
  const { use_rag = false, top_k = 4, document_id = null } = options;
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/llm/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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
