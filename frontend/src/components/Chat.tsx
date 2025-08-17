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
    <div className="flex flex-col h-full" style={{
      background: 'linear-gradient(145deg, rgba(21, 21, 32, 0.8), rgba(26, 26, 46, 0.6))',
      backdropFilter: 'blur(15px)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
    }}>
      {/* Neural Interface Header */}
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-4 h-4 rounded-full bg-purple-400"></div>
          <h1 className="text-xl font-bold" style={{color: 'var(--neon-purple)', fontFamily: 'var(--font-futuristic)'}}>
            NEURAL INTERFACE
          </h1>
        </div>
        <p className="text-sm mt-2" style={{color: 'var(--foreground-secondary)'}}>
          Mistral-7B Core • RAG Protocol {useRag ? 'ACTIVE' : 'STANDBY'}
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{background: 'rgba(10, 10, 15, 0.3)'}}>
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="cyber-card p-8 max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" 
                   style={{background: 'linear-gradient(45deg, var(--neon-blue), var(--neon-purple))'}}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="mb-2" style={{color: 'var(--neon-blue)', fontFamily: 'var(--font-futuristic)'}}>
                NEURAL LINK ESTABLISHED
              </p>
              <p className="text-sm" style={{color: 'var(--foreground-muted)'}}>
                {useRag ? 'RAG Protocol Active - Document context enabled' : 'Standard mode - General AI responses'}
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div
                className={`max-w-[80%] rounded-xl px-6 py-4 backdrop-filter backdrop-blur-sm ${
                  message.role === 'user'
                    ? 'message-user text-white'
                    : 'message-assistant'
                }`}
                style={{
                  color: message.role === 'user' ? '#ffffff' : 'var(--foreground)',
                  fontFamily: 'var(--font-body)'
                }}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                
                {/* Citations for assistant messages */}
                {message.role === 'assistant' && message.citations && message.citations.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <p className="text-xs font-semibold" style={{color: 'var(--neon-teal)', fontFamily: 'var(--font-futuristic)'}}>
                      DATA SOURCES:
                    </p>
                    {message.citations.map((citation) => (
                      <div
                        key={citation.id}
                        className="cyber-card p-3 text-xs border border-opacity-30"
                        style={{borderColor: 'var(--neon-teal)'}}
                      >
                        <p className="mb-2 leading-relaxed" style={{color: 'var(--foreground-secondary)'}}>
                          {citation.snippet.length > 200
                            ? `${citation.snippet.substring(0, 200)}...`
                            : citation.snippet}
                        </p>
                        <div className="flex justify-between items-center">
                          <span style={{color: 'var(--neon-teal)', fontFamily: 'var(--font-futuristic)'}}>
                            MATCH: {Math.round(citation.similarity * 100)}%
                          </span>
                          <a
                            href={`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/ingest/documents/${citation.document_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="cyber-button px-3 py-1 text-xs rounded-md hover:scale-105 transition-transform"
                          >
                            ACCESS
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
          <div className="flex justify-start animate-fade-in">
            <div className="message-assistant max-w-[80%] rounded-xl px-6 py-4 backdrop-filter backdrop-blur-sm">
              <div className="flex space-x-3 items-center">
                <div className="w-3 h-3 rounded-full animate-bounce" style={{background: 'var(--neon-purple)', boxShadow: 'var(--glow-purple)'}}></div>
                <div className="w-3 h-3 rounded-full animate-bounce" style={{background: 'var(--neon-blue)', boxShadow: 'var(--glow-blue)', animationDelay: '0.1s'}}></div>
                <div className="w-3 h-3 rounded-full animate-bounce" style={{background: 'var(--neon-teal)', boxShadow: 'var(--glow-teal)', animationDelay: '0.2s'}}></div>
                <span className="text-sm" style={{color: 'var(--neon-purple)', fontFamily: 'var(--font-futuristic)'}}>
                  PROCESSING...
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Control Panel */}
      <div className="p-6">
        {/* RAG Controls */}
        <div className="mb-4 flex flex-wrap gap-6 items-center text-sm">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={useRag}
              onChange={(e) => setUseRag(e.target.checked)}
              className="w-4 h-4 rounded border-2 border-blue-400 bg-transparent checked:bg-blue-500 focus:ring-2 focus:ring-blue-500"
            />
            <span style={{color: 'var(--neon-blue)', fontFamily: 'var(--font-futuristic)'}}>RAG PROTOCOL</span>
          </label>
          
          {useRag && (
            <>
              <label className="flex items-center space-x-3">
                <span style={{color: 'var(--neon-teal)', fontFamily: 'var(--font-futuristic)'}}>TOP-K:</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={topK}
                  onChange={(e) => setTopK(Number(e.target.value))}
                  className="w-16 cyber-input rounded-md px-2 py-1 text-sm text-center"
                />
              </label>
              
              <label className="flex items-center space-x-3">
                <span style={{color: 'var(--neon-purple)', fontFamily: 'var(--font-futuristic)'}}>TARGET:</span>
                <select
                  value={selectedDocId || ''}
                  onChange={() => onDocumentsRefresh()}
                  className="cyber-input rounded-md px-3 py-1 text-sm"
                >
                  <option value="">ALL DOCUMENTS</option>
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
          <div className="mb-4 p-3 rounded-lg border-2 border-red-500 bg-red-900 bg-opacity-20">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-red-400 text-sm" style={{fontFamily: 'var(--font-futuristic)'}}>
                ERROR: {error}
              </span>
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="flex space-x-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter neural command..."
            className="flex-1 cyber-input rounded-xl px-4 py-3 resize-none text-base"
            style={{minHeight: '60px'}}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="cyber-button px-6 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            style={{fontFamily: 'var(--font-futuristic)'}}
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                <span>TRANSMIT</span>
              </div>
            ) : (
              'TRANSMIT'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
