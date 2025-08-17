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
    <div className="min-h-screen">
      {/* Futuristic Header */}
      <header className="cyber-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-10 w-10" style={{color: 'var(--neon-blue)'}} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold" style={{color: 'var(--neon-blue)', fontFamily: 'var(--font-futuristic)'}}>
                  AI NEXUS
                </h1>
                <p className="text-sm" style={{color: 'var(--foreground-secondary)'}}>
                  Neural Document Intelligence • RAG Protocol Active
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-sm" style={{color: 'var(--neon-teal)', fontFamily: 'var(--font-futuristic)'}}>
                MISTRAL-7B CORE
              </div>
              <div className="w-3 h-3 rounded-full bg-green-400" 
                   title="System Online">
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[calc(100vh-12rem)]">
          {/* Left Sidebar - Control Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Upload Component */}
            <Upload onUploaded={handleUploaded} />
            
            {/* Documents List */}
            <DocumentsList
              selectedDocId={selectedDocId}
              onDocumentSelect={handleDocumentSelect}
              onRefresh={handleDocumentsRefresh}
            />
          </div>

          {/* Right Main Area - Neural Interface */}
          <div className="lg:col-span-3">
            <Chat
              selectedDocId={selectedDocId}
              onDocumentsRefresh={handleDocumentsRefresh}
            />
          </div>
        </div>
      </main>

      {/* Futuristic Footer */}
      <footer className="cyber-card mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <p className="text-sm" style={{color: 'var(--neon-purple)', fontFamily: 'var(--font-futuristic)'}}>
              NEURAL NETWORK ARCHITECTURE • NEXT.JS • FASTAPI • MISTRAL-7B
            </p>
            <p className="text-xs mt-2" style={{color: 'var(--foreground-muted)'}}>
              Advanced Document Processing • Retrieval Augmented Generation • Quantum-Ready Infrastructure
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
