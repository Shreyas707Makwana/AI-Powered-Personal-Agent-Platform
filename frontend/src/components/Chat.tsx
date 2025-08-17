'use client';

import React, { useState, useRef, useEffect } from 'react';
import { sendChat, fetchDocuments, Document } from '@/lib/api';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Array<{
    id: number;
    snippet: string;
    similarity: number;
    document_id: number;
    chunk_index: number;
  }>;
}

interface ChatProps {
  selectedDocId: string | null;
  onDocumentsRefresh: () => void;
}

export default function Chat({ selectedDocId, onDocumentsRefresh }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [useRag, setUseRag] = useState(true);
  const [topK, setTopK] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch documents on component mount
  useEffect(() => {
    fetchDocumentsList();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchDocumentsList = async () => {
    try {
      const docs = await fetchDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setError(null);
    setLoading(true);

    try {
      // Prepare messages for API call (excluding system messages)
      const apiMessages = messages
        .filter(msg => msg.role !== 'system')
        .concat(userMessage)
        .map(msg => ({ role: msg.role, content: msg.content }));

      // Send chat request
      const response = await sendChat(apiMessages, {
        use_rag: useRag,
        top_k: topK,
        document_id: selectedDocId,
      });

      // Add assistant response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        citations: response.citations,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Refresh documents list if RAG was used
      if (useRag) {
        onDocumentsRefresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };



  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-xl font-semibold text-gray-900">AI Agent Chat</h1>
        <p className="text-sm text-gray-600">Powered by Mistral-7B with RAG capabilities</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>Start a conversation by typing a message below</p>
            <p className="text-sm mt-2">
              {useRag ? 'RAG is enabled - responses will include document context' : 'RAG is disabled - general responses only'}
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                
                {/* Citations for assistant messages */}
                {message.role === 'assistant' && message.citations && message.citations.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium text-gray-600">Sources:</p>
                    {message.citations.map((citation) => (
                      <div
                        key={citation.id}
                        className="bg-white rounded border p-2 text-xs"
                      >
                        <p className="text-gray-700 mb-1">
                          {citation.snippet.length > 200
                            ? `${citation.snippet.substring(0, 200)}...`
                            : citation.snippet}
                        </p>
                        <div className="flex justify-between items-center text-gray-500">
                          <span>Similarity: {Math.round(citation.similarity * 100)}%</span>
                          <a
                            href={`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/ingest/documents/${citation.document_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            View Doc
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        
        {/* Loading skeleton */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-[80%]">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        {/* RAG Controls */}
        <div className="mb-3 flex flex-wrap gap-4 items-center text-sm">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={useRag}
              onChange={(e) => setUseRag(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span>Use RAG</span>
          </label>
          
          {useRag && (
            <>
              <label className="flex items-center space-x-2">
                <span>Top K:</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={topK}
                  onChange={(e) => setTopK(Number(e.target.value))}
                  className="w-16 rounded border border-gray-300 px-2 py-1 text-sm"
                />
              </label>
              
              <label className="flex items-center space-x-2">
                <span>Document:</span>
                                 <select
                   value={selectedDocId || ''}
                   onChange={() => onDocumentsRefresh()}
                   className="rounded border border-gray-300 px-2 py-1 text-sm"
                 >
                  <option value="">All Documents</option>
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.file_name}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-3 text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">
            Error: {error}
          </div>
        )}

        {/* Message Input */}
        <div className="flex space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here..."
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
