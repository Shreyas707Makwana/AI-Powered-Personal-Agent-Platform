'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/components/Button';
import { Agent, listAgents, createAgent, updateAgent, deleteAgent, CreateAgentRequest, UpdateAgentRequest, listTools, listAgentTools, updateAgentTool, ToolRegistryItem, AgentToolRow } from '@/lib/api';

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateAgentRequest>({
    name: '',
    instructions: '',
    avatar_url: '',
    is_default: false
  });
  // Tools state
  const [toolRegistry, setToolRegistry] = useState<ToolRegistryItem[]>([]);
  const [agentTools, setAgentTools] = useState<Record<string, AgentToolRow>>({});
  const [toolsLoading, setToolsLoading] = useState(false);

  useEffect(() => {
    fetchAgents();
  }, []);

  // Load tools registry once
  useEffect(() => {
    (async () => {
      try {
        const registry = await listTools();
        setToolRegistry(registry);
      } catch (e) {
        // non-fatal
        console.warn('Failed to load tools', e);
      }
    })();
  }, []);

  // Load selected agent tools when agent changes
  useEffect(() => {
    (async () => {
      if (!selectedAgent) return;
      try {
        setToolsLoading(true);
        const rows = await listAgentTools(selectedAgent.id);
        const map: Record<string, AgentToolRow> = {};
        rows.forEach(r => { map[r.tool_key] = r; });
        setAgentTools(map);
      } catch (e) {
        console.warn('Failed to load agent tools', e);
      } finally {
        setToolsLoading(false);
      }
    })();
  }, [selectedAgent?.id]);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const agentsList = await listAgents();
      setAgents(agentsList);
      if (agentsList.length > 0 && !selectedAgent) {
        setSelectedAgent(agentsList[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch agents');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setError(null);
      const newAgent = await createAgent(formData);
      setAgents(prev => [newAgent, ...prev]);
      setSelectedAgent(newAgent);
      setIsCreating(false);
      setFormData({ name: '', instructions: '', avatar_url: '', is_default: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create agent');
    }
  };

  const handleUpdate = async () => {
    if (!selectedAgent) return;
    
    try {
      setError(null);
      const updateData: UpdateAgentRequest = {
        name: formData.name,
        instructions: formData.instructions,
        avatar_url: formData.avatar_url,
        is_default: formData.is_default
      };
      
      const updatedAgent = await updateAgent(selectedAgent.id, updateData);
      setAgents(prev => prev.map(agent => agent.id === updatedAgent.id ? updatedAgent : agent));
      setSelectedAgent(updatedAgent);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update agent');
    }
  };

  const handleDelete = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;
    
    try {
      setError(null);
      await deleteAgent(agentId);
      setAgents(prev => prev.filter(agent => agent.id !== agentId));
      if (selectedAgent?.id === agentId) {
        const remaining = agents.filter(agent => agent.id !== agentId);
        setSelectedAgent(remaining.length > 0 ? remaining[0] : null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete agent');
    }
  };

  const startEdit = (agent: Agent) => {
    setFormData({
      name: agent.name,
      instructions: agent.instructions,
      avatar_url: agent.avatar_url || '',
      is_default: agent.is_default
    });
    setIsEditing(true);
    setIsCreating(false);
  };

  const startCreate = () => {
    setFormData({ name: '', instructions: '', avatar_url: '', is_default: false });
    setIsCreating(true);
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setIsCreating(false);
    setFormData({ name: '', instructions: '', avatar_url: '', is_default: false });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="quantum-loader">
          <div className="quantum-particle"></div>
          <div className="quantum-particle"></div>
          <div className="quantum-particle"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="neural-header p-6 mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 animate-gradient-shift"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="quantum-orb"></div>
                  <h1 className="text-3xl font-bold neon-text-gradient tracking-wider">
                    AGENT MANAGEMENT
                  </h1>
                </div>
                <p className="text-gray-400">Configure and manage your AI agents</p>
              </div>
              <button
                onClick={startCreate}
                className="quantum-send-button"
              >
                <span>CREATE AGENT</span>
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-alert mb-6">
            <div className="flex items-center space-x-3">
              <div className="error-icon-pulse"></div>
              <span className="text-sm font-mono glitch-text" data-text={`ERROR: ${error}`}>
                ERROR: {error}
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Agents List */}
          <div className="lg:col-span-1">
            <div className="quantum-card p-6">
              <h2 className="text-xl font-bold neon-text-cyan mb-4">AGENTS</h2>
              {agents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">No agents created yet</p>
                  <button
                    onClick={startCreate}
                    className="text-cyan-400 hover:text-cyan-300 font-mono text-sm"
                  >
                    CREATE YOUR FIRST AGENT
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {agents.map((agent) => (
                    <div
                      key={agent.id}
                      className={`agent-card cursor-pointer transition-all duration-200 ${
                        selectedAgent?.id === agent.id ? 'border-cyan-500 bg-cyan-500/10' : ''
                      }`}
                      onClick={() => setSelectedAgent(agent)}
                    >
                      <div className="flex items-center space-x-3">
                        {agent.avatar_url ? (
                          <img
                            src={agent.avatar_url}
                            alt={agent.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center">
                            <span className="text-sm font-bold">{agent.name.charAt(0)}</span>
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-100">{agent.name}</h3>
                          <p className="text-xs text-gray-400 truncate">
                            {agent.instructions.substring(0, 50)}...
                          </p>
                        </div>
                        {agent.is_default && (
                          <div className="text-xs text-emerald-400 font-mono">DEFAULT</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Agent Details/Editor */}
          <div className="lg:col-span-2">
            <div className="quantum-card p-6">
              {isCreating || isEditing ? (
                <div>
                  <h2 className="text-xl font-bold neon-text-cyan mb-6">
                    {isCreating ? 'CREATE AGENT' : 'EDIT AGENT'}
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-purple-400 mb-2">
                        AGENT NAME
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="quantum-input w-full"
                        placeholder="Enter agent name..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-purple-400 mb-2">
                        AVATAR URL (Optional)
                      </label>
                      <input
                        type="url"
                        value={formData.avatar_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, avatar_url: e.target.value }))}
                        className="quantum-input w-full"
                        placeholder="https://example.com/avatar.jpg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-purple-400 mb-2">
                        INSTRUCTIONS
                      </label>
                      <textarea
                        value={formData.instructions}
                        onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                        className="quantum-textarea w-full h-40"
                        placeholder="Enter detailed instructions for this agent..."
                      />
                    </div>

                    <div className="flex items-center space-x-3">
                      <label className="quantum-switch">
                        <input
                          type="checkbox"
                          checked={formData.is_default}
                          onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                        />
                        <span className="quantum-slider"></span>
                      </label>
                      <span className="text-sm font-bold text-cyan-400 tracking-wider">
                        SET AS DEFAULT AGENT
                      </span>
                    </div>

                    <div className="flex space-x-4 pt-4">
                      <button
                        onClick={isCreating ? handleCreate : handleUpdate}
                        disabled={!formData.name.trim() || !formData.instructions.trim()}
                        className="quantum-send-button"
                      >
                        <span>{isCreating ? 'CREATE' : 'UPDATE'}</span>
                      </button>
                      <Button
                        variant="muted"
                        size="md"
                        onClick={cancelEdit}
                      >
                        CANCEL
                      </Button>
                    </div>
                  </div>
                </div>
              ) : selectedAgent ? (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold neon-text-cyan">AGENT DETAILS</h2>
                    <div className="flex space-x-3">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => startEdit(selectedAgent)}
                      >
                        EDIT
                      </Button>
                      <Button
                        variant="muted"
                        size="sm"
                        onClick={() => handleDelete(selectedAgent.id)}
                        className="hover:!bg-red-900/20 hover:!border-red-500/30 hover:!text-red-300"
                      >
                        DELETE
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                      {selectedAgent.avatar_url ? (
                        <img
                          src={selectedAgent.avatar_url}
                          alt={selectedAgent.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center">
                          <span className="text-xl font-bold">{selectedAgent.name.charAt(0)}</span>
                        </div>
                      )}
                      <div>
                        <h3 className="text-2xl font-bold text-gray-100">{selectedAgent.name}</h3>
                        {selectedAgent.is_default && (
                          <span className="text-sm text-emerald-400 font-mono">DEFAULT AGENT</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-purple-400 mb-2">INSTRUCTIONS</h4>
                      <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                        <p className="text-gray-100 whitespace-pre-wrap leading-relaxed">
                          {selectedAgent.instructions}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-purple-400 font-mono">CREATED:</span>
                        <p className="text-gray-300">{new Date(selectedAgent.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-purple-400 font-mono">UPDATED:</span>
                        <p className="text-gray-300">{new Date(selectedAgent.updated_at).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Tools Panel */}
                    <div className="mt-8">
                      <h3 className="text-lg font-bold neon-text-cyan mb-4">TOOLS</h3>
                      <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                        {toolsLoading ? (
                          <div className="text-gray-400">Loading tools...</div>
                        ) : toolRegistry.length === 0 ? (
                          <div className="text-gray-400">No tools available</div>
                        ) : (
                          <div className="space-y-3">
                            {toolRegistry.map(tool => {
                              const enabled = agentTools[tool.key]?.enabled ?? false;
                              return (
                                <div key={tool.id} className="flex items-center justify-between">
                                  <div>
                                    <div className="text-gray-100 font-medium">{tool.name || tool.key}</div>
                                    {tool.description && (
                                      <div className="text-xs text-gray-400">{tool.description}</div>
                                    )}
                                  </div>
                                  <label className="quantum-switch">
                                    <input
                                      type="checkbox"
                                      checked={enabled}
                                      onChange={async (e) => {
                                        if (!selectedAgent) return;
                                        try {
                                          const row = await updateAgentTool(selectedAgent.id, tool.key, { enabled: e.target.checked });
                                          setAgentTools(prev => ({ ...prev, [tool.key]: row }));
                                        } catch (err) {
                                          alert((err as Error).message);
                                        }
                                      }}
                                    />
                                    <span className="quantum-slider"></span>
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
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
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-3 neon-text-cyan">NO AGENT SELECTED</h3>
                  <p className="text-gray-400">Select an agent from the list or create a new one</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
