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
    <div className="flex flex-col h-full quantum-card overflow-hidden">
      {/* Neural Interface Header with Holographic Effect */}
      <div className="neural-header p-6 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 animate-gradient-shift"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="quantum-orb"></div>
                <h1 className="text-2xl font-bold neon-text-gradient tracking-wider">
                  QUANTUM NEURAL INTERFACE
                </h1>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-cyan-400 font-medium">MISTRAL-7B QUANTUM CORE</span>
                <span className="text-gray-500">•</span>
                <span className={`font-medium ${useRag ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {useRag ? '◉ RAG PROTOCOL ENGAGED' : '○ STANDALONE MODE'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="cyber-status-indicator"></div>
              <span className="text-xs text-gray-400 font-mono">SYS_READY</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area with Matrix Rain Effect */}
      <div className="flex-1 overflow-y-auto p-6 message-container relative">
        <div className="matrix-rain"></div>
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md mx-auto welcome-card">
              <div className="holographic-icon mx-auto mb-6">
                <svg className="w-20 h-20" fill="none" stroke="url(#gradient)" viewBox="0 0 24 24">
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00f0ff" />
                      <stop offset="50%" stopColor="#9b5cff" />
                      <stop offset="100%" stopColor="#00ffcc" />
                    </linearGradient>
                  </defs>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-3 neon-text-cyan">QUANTUM LINK ESTABLISHED</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Neural pathways synchronized. {useRag ? 'Knowledge base integrated.' : 'Direct neural access enabled.'}
              </p>
              <div className="mt-6 flex justify-center space-x-2">
                <div className="pulse-dot"></div>
                <div className="pulse-dot" style={{animationDelay: '0.2s'}}></div>
                <div className="pulse-dot" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 relative z-10">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} message-appear`}
              >
                <div className={`max-w-[75%] ${message.role === 'user' ? 'user-message' : 'ai-message'}`}>
                  {message.role === 'assistant' && (
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="ai-indicator"></div>
                      <span className="text-xs text-purple-400 font-mono">MISTRAL-7B</span>
                    </div>
                  )}
                  <div className="message-content">
                    <p className="whitespace-pre-wrap leading-relaxed text-gray-100">
                      {message.content}
                    </p>
                  </div>
                  
                  {/* Enhanced Citations */}
                  {message.role === 'assistant' && message.citations && message.citations.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center space-x-2">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
                        <span className="text-xs font-bold text-cyan-400 tracking-wider">DATA SOURCES</span>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
                      </div>
                      {message.citations.map((citation) => (
                        <div key={citation.id} className="citation-card">
                          <div className="flex items-start space-x-3">
                            <div className="citation-indicator mt-1"></div>
                            <div className="flex-1">
                              <p className="text-xs text-gray-300 leading-relaxed mb-2">
                                {citation.snippet.length > 200
                                  ? `${citation.snippet.substring(0, 200)}...`
                                  : citation.snippet}
                              </p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <div className="match-indicator" style={{width: `${citation.similarity * 100}%`}}></div>
                                  <span className="text-xs text-cyan-400 font-mono">
                                    {Math.round(citation.similarity * 100)}% MATCH
                                  </span>
                                </div>
                                <a
                                  href={`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/ingest/documents/${citation.document_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="access-link"
                                >
                                  <span>ACCESS</span>
                                  <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Enhanced Loading Animation */}
            {loading && (
              <div className="flex justify-start message-appear">
                <div className="ai-message max-w-[75%]">
                  <div className="flex items-center space-x-3">
                    <div className="quantum-loader">
                      <div className="quantum-particle"></div>
                      <div className="quantum-particle"></div>
                      <div className="quantum-particle"></div>
                    </div>
                    <span className="text-sm text-purple-400 font-mono animate-pulse">
                      QUANTUM PROCESSING...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Control Panel with Holographic UI */}
      <div className="control-panel p-6">
        {/* RAG Controls with Futuristic Toggle */}
        <div className="mb-4 flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-3">
            <label className="quantum-switch">
              <input
                type="checkbox"
                checked={useRag}
                onChange={(e) => setUseRag(e.target.checked)}
              />
              <span className="quantum-slider"></span>
            </label>
            <span className="text-sm font-bold text-cyan-400 tracking-wider">RAG PROTOCOL</span>
          </div>
          
          {useRag && (
            <>
              <div className="flex items-center space-x-3 cyber-control">
                <span className="text-sm text-purple-400 font-mono">VECTOR_DEPTH:</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={topK}
                  onChange={(e) => setTopK(Number(e.target.value))}
                  className="quantum-input w-20 text-center"
                />
              </div>
              
              <div className="flex items-center space-x-3 cyber-control">
                <span className="text-sm text-emerald-400 font-mono">TARGET_DOC:</span>
                <select
                  value={selectedDocId || ''}
                  onChange={() => onDocumentsRefresh()}
                  className="quantum-select"
                >
                  <option value="">◉ ALL DOCUMENTS</option>
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      ▸ {doc.file_name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        {/* Error Display with Glitch Effect */}
        {error && (
          <div className="error-alert mb-4">
            <div className="flex items-center space-x-3">
              <div className="error-icon-pulse"></div>
              <span className="text-sm font-mono glitch-text" data-text={`ERROR: ${error}`}>
                ERROR: {error}
              </span>
            </div>
          </div>
        )}

        {/* Message Input with Quantum Design */}
        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter quantum command sequence..."
              className="quantum-textarea w-full"
              rows={2}
              disabled={loading}
            />
            <div className="input-border-glow"></div>
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="quantum-send-button"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="transmit-loader"></div>
                <span>TRANSMITTING</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>TRANSMIT</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}