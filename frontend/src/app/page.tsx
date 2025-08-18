'use client';

import React, { useState } from 'react';
import Chat from '@/components/Chat';
import Upload from '@/components/Upload';
import DocumentsList from '@/components/DocumentsList';

export default function Home() {
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  const handleDocumentSelect = (docId: string | null) => {
    setSelectedDocId(docId);
  };

  const handleDocumentsRefresh = () => {
    // Trigger a refresh by updating a state variable
    // This will cause components to re-render and fetch fresh data
  };

  const handleUploaded = () => {
    handleDocumentsRefresh();
  };

  return (
    <div className="min-h-screen relative">
      {/* Quantum Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="quantum-grid"></div>
      </div>

      {/* Futuristic Header with Enhanced Quantum Effects */}
      <header className="quantum-card relative z-10 border-b-2 border-cyan-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center">
              <div className="flex-shrink-0 relative">
                {/* Quantum Logo with Rotating Rings */}
                <div className="relative">
                  <div className="quantum-logo-ring-1"></div>
                  <div className="quantum-logo-ring-2"></div>
                  <svg className="h-12 w-12 relative z-10" style={{color: 'var(--neon-blue)'}} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="ml-6">
                <h1 className="text-3xl font-bold neon-text-gradient tracking-wider" 
                    style={{fontFamily: 'var(--font-futuristic)'}}>
                  QUANTUM NEXUS
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="quantum-orb"></div>
                  <p className="text-sm neon-text-cyan font-mono tracking-wider">
                    NEURAL DOCUMENT INTELLIGENCE • RAG PROTOCOL ACTIVE
                  </p>
                </div>
              </div>
            </div>
            
            {/* Enhanced Status Panel */}
            <div className="flex items-center space-x-6">
              <div className="status-panel">
                <div className="flex items-center space-x-3">
                  <div className="status-indicator-group">
                    <div className="status-dot-large bg-emerald-400 animate-pulse"></div>
                    <span className="text-sm neon-text-cyan font-mono tracking-wider">
                      MISTRAL-7B QUANTUM CORE
                    </span>
                  </div>
                  <div className="system-vitals">
                    <div className="vital-bar">
                      <div className="vital-fill neural-activity"></div>
                    </div>
                    <span className="text-xs text-gray-400 font-mono">NEURAL</span>
                  </div>
                </div>
              </div>
              
              {/* System Status */}
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-emerald-400 quantum-pulse-strong" 
                     title="Quantum Systems Online"></div>
                <span className="text-xs neon-text-purple font-mono tracking-wider">SYS_ONLINE</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Enhanced Grid Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[calc(100vh-8rem)]">
          {/* Enhanced Left Sidebar - Quantum Control Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Sidebar Header */}
            <div className="quantum-card p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="data-orb"></div>
                  <h2 className="text-lg font-bold neon-text-purple tracking-wider">
                    CONTROL MATRIX
                  </h2>
                </div>
                <div className="matrix-indicator">
                  <div className="matrix-dot"></div>
                  <div className="matrix-dot"></div>
                  <div className="matrix-dot"></div>
                </div>
              </div>
              <div className="quantum-separator"></div>
            </div>
            
            {/* Upload Component */}
            <Upload onUploaded={handleUploaded} />
            
            {/* Documents List */}
            <DocumentsList
              selectedDocId={selectedDocId}
              onDocumentSelect={handleDocumentSelect}
              onRefresh={handleDocumentsRefresh}
            />
          </div>

          {/* Enhanced Right Main Area - Neural Interface */}
          <div className="lg:col-span-3 relative">
            {/* Background Effects for Chat Area */}
            <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
              <div className="neural-background"></div>
              <div className="data-flow-lines"></div>
            </div>
            
            <Chat
              selectedDocId={selectedDocId}
              onDocumentsRefresh={handleDocumentsRefresh}
            />
          </div>
        </div>
      </main>

    </div>
  );
}