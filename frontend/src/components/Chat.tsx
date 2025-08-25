'use client';

import React, { useState, useRef, useEffect } from 'react';
import { sendChat, fetchDocuments, Document, listAgents, Agent, listConversationMessages, ConversationMessageRow, listConversations, createConversation, ConversationRow, deleteConversation } from '@/lib/api';
import ToolModal from '@/components/ToolModal';
import NewsToolModal from '@/components/ToolModal/NewsToolModal';
import ArticlePager from '@/components/ArticlePager';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'agent';
  content: string;
  citations?: Array<{
    id: number;
    snippet: string;
    similarity: number;
    document_id: number;
    chunk_index: number;
  }>;
  articles?: Array<{ title: string; source?: string; publishedAt?: string; url?: string; snippet?: string; }>;
  cached?: boolean;
  ttl_remaining?: number;
}

type NewsArticle = { title: string; source?: string; publishedAt?: string; url?: string; snippet?: string };
type NewsResult = { provider: string; query: string; articles: NewsArticle[]; cached?: boolean; ttl_remaining?: number };

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
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [toolModalOpen, setToolModalOpen] = useState(false);
  const [newsModalOpen, setNewsModalOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Fetch documents and agents on component mount
  useEffect(() => {
    fetchDocumentsList();
    fetchAgentsList();
    fetchConversationsList();
    // Restore last conversation id and load messages
    const lastId = typeof window !== 'undefined' ? window.localStorage.getItem('lastConversationId') : null;
    if (lastId) {
      setConversationId(lastId);
      void loadConversationMessages(lastId);
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen for global tool open events from sidebar ToolsCard
  useEffect(() => {
    const openWeather = () => setToolModalOpen(true);
    const openNews = () => setNewsModalOpen(true);
    if (typeof window !== 'undefined') {
      window.addEventListener('open-weather-tool', openWeather as EventListener);
      window.addEventListener('open-news-tool', openNews as EventListener);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('open-weather-tool', openWeather as EventListener);
        window.removeEventListener('open-news-tool', openNews as EventListener);
      }
    };
  }, []);

  const fetchDocumentsList = async () => {
    try {
      const docs = await fetchDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    }
  };

  const fetchConversationsList = async () => {
    try {
      const rows = await listConversations();
      setConversations(rows);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  };

  const fetchAgentsList = async () => {
    try {
      const agentsList = await listAgents();
      setAgents(agentsList);
      // Set default agent if available
      const defaultAgent = agentsList.find(agent => agent.is_default);
      if (defaultAgent) {
        setSelectedAgent(defaultAgent);
      }
    } catch (err) {
      console.error('Failed to fetch agents:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversationMessages = async (convId: string) => {
    try {
      const rows: ConversationMessageRow[] = await listConversationMessages(convId);
      const mapped: Message[] = rows.map(r => ({
        id: r.id,
        role: (r.role as Message['role']) || 'assistant',
        content: r.content,
      }));
      setMessages(mapped);
    } catch (e) {
      console.error('Failed to load conversation messages', e);
      // Auto-recover if the conversation was deleted or belongs to another session/user.
      // Our API throws an Error with message containing the HTTP status, e.g., "Failed to list messages: 404".
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('404')) {
        // Clear stale selection and stored conversation id
        try { window.localStorage.removeItem('lastConversationId'); } catch {}
        setConversationId(null);
        setMessages([]);
      }
    }
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
      // Ensure we have a conversation to send to
      let targetConvId = conversationId;
      if (!targetConvId) {
        // Create with no title; server will auto-title on first user message
        const created = await createConversation();
        targetConvId = created.id;
        setConversationId(created.id);
        try { window.localStorage.setItem('lastConversationId', created.id); } catch {}
        // refresh list to include the new conversation
        void fetchConversationsList();
      }

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
        agent_id: selectedAgent?.id || null,
        conversation_id: targetConvId,
      });

      // Add assistant response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        citations: response.citations,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Capture conversation id for subsequent turns
      if (!conversationId && response.conversation_id) {
        setConversationId(response.conversation_id);
        try { window.localStorage.setItem('lastConversationId', response.conversation_id); } catch {}
      }

      // Refresh documents list if RAG was used
      if (useRag) {
        onDocumentsRefresh();
      }

      // After first send, refresh conversations to pick up server auto-title
      void fetchConversationsList();
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
      <ToolModal isOpen={toolModalOpen} onClose={() => setToolModalOpen(false)} agentId={selectedAgent?.id || null} />
      <NewsToolModal
        isOpen={newsModalOpen}
        onClose={() => setNewsModalOpen(false)}
        agentId={selectedAgent?.id || null}
        onStart={(topic) => {
          // Insert a placeholder assistant message indicating tool call
          setMessages(prev => ([...prev, {
            id: `${Date.now()}-news-start`,
            role: 'assistant',
            content: `Calling news for '${topic}'...`,
          }]));
        }}
        onResult={(res: NewsResult) => {
          // Append articles as assistant message with rich rendering
          setMessages(prev => ([...prev, {
            id: `${Date.now()}-news-result`,
            role: 'assistant',
            content: `News results for '${res?.query || ''}':`,
            articles: Array.isArray(res?.articles) ? res.articles : [],
            cached: !!res?.cached,
            ttl_remaining: res?.ttl_remaining,
          }]));
        }}
        onError={(msg) => {
          setMessages(prev => ([...prev, {
            id: `${Date.now()}-news-error`,
            role: 'assistant',
            content: `News tool error: ${msg}`,
          }]));
        }}
      />
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-cyan-400 font-medium font-mono">LLAMA-3.1-8B QUANTUM CORE</span>
                <span className="text-gray-500">•</span>
                <span className={`font-medium font-mono ${useRag ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {useRag ? '◉ RAG PROTOCOL ENGAGED' : '○ STANDALONE MODE'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="cyber-status-indicator"></div>
              <span className="text-xs text-gray-400 font-mono">SYS_READY</span>
            </div>
          </div>

          {/* Conversations Controls */}
          <div className="mt-4 flex flex-wrap gap-3 items-center">
            <button
              onClick={async () => {
                try {
                  // Create draft conversation; server will title on first message
                  const created = await createConversation();
                  setConversationId(created.id);
                  setMessages([]);
                  try { window.localStorage.setItem('lastConversationId', created.id); } catch {}
                  void fetchConversationsList();
                } catch (e) {
                  console.error('Failed to create conversation', e);
                }
              }}
              className="px-3 py-1.5 rounded-md border border-cyan-500/60 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 hover:text-cyan-200 transition-colors font-mono text-xs"
            >
              NEW CHAT
            </button>
            <select
              value={conversationId || ''}
              onChange={async (e) => {
                const id = e.target.value || null;
                setConversationId(id);
                try {
                  if (id) {
                    window.localStorage.setItem('lastConversationId', id);
                  } else {
                    window.localStorage.removeItem('lastConversationId');
                  }
                } catch {}
                if (id) await loadConversationMessages(id);
                else setMessages([]);
              }}
              className="quantum-select w-64 md:w-80 lg:w-96"
            >
              <option value="">◉ NO CONVERSATION</option>
              {conversations.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title && c.title.trim() ? c.title : 'New chat · draft'}
                </option>
              ))}
            </select>
            {/* Delete conversation button */}
            <button
              onClick={async () => {
                if (!conversationId) return;
                const confirmDelete = window.confirm('Delete this conversation and all its messages? This cannot be undone.');
                if (!confirmDelete) return;
                try {
                  await deleteConversation(conversationId);
                  // Reset current selection
                  setConversationId(null);
                  setMessages([]);
                  try { window.localStorage.removeItem('lastConversationId'); } catch {}
                  await fetchConversationsList();
                } catch (e) {
                  console.error('Failed to delete conversation', e);
                }
              }}
              className="px-2 py-1 rounded-md border border-rose-500/60 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 transition-colors font-mono text-xs"
              disabled={!conversationId}
              title="Delete selected conversation"
            >
              DELETE
            </button>
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
                  {/* Memory banner removed */}
                  {message.role === 'assistant' && (
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="ai-indicator"></div>
                      <span className="text-xs text-purple-400 font-mono">LLAMA-3.1-8B</span>
                    </div>
                  )}
                  <div className="message-content">
                    <p className="whitespace-pre-wrap leading-relaxed text-gray-100">
                      {message.content}
                    </p>
                  </div>
                  {/* News articles rendering as a single paged block */}
                  {message.articles && message.articles.length > 0 && (
                    <ArticlePager
                      articles={message.articles}
                      cached={message.cached}
                      ttlRemaining={message.ttl_remaining}
                    />
                  )}
                  
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
        {/* Agent Selector */}
        <div className="mb-4 flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-3 cyber-control">
            <span className="text-sm text-purple-400 font-mono">AGENT:</span>

            {/* Selected Agent Avatar Preview */}
            {selectedAgent ? (
              selectedAgent.avatar_url ? (
                <img
                  src={selectedAgent.avatar_url}
                  alt={selectedAgent.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-cyan-500/50"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center ring-2 ring-cyan-500/30">
                  <span className="text-xs font-bold">{selectedAgent.name.charAt(0)}</span>
                </div>
              )
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-800/70 border border-gray-700 flex items-center justify-center">
                <span className="text-xs text-gray-400">—</span>
              </div>
            )}

            <select
              value={selectedAgent?.id || ''}
              onChange={(e) => {
                const agentId = e.target.value;
                const agent = agents.find(a => a.id === agentId);
                setSelectedAgent(agent || null);
              }}
              className="quantum-select w-64 md:w-80 lg:w-96"
            >
              <option value="">◉ NO AGENT</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.is_default ? '★ ' : '▸ '}{agent.name}
                </option>
              ))}
            </select>

          </div>
        </div>

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
              placeholder="Enter command.."
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