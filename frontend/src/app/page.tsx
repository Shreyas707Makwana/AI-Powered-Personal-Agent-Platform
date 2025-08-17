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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-semibold text-gray-900">AI-Powered Personal Agent Platform</h1>
                <p className="text-sm text-gray-600">Document Intelligence with RAG</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Powered by Mistral-7B
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-8rem)]">
          {/* Left Sidebar */}
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

          {/* Right Main Area - Chat */}
          <div className="lg:col-span-3">
            <Chat
              selectedDocId={selectedDocId}
              onDocumentsRefresh={handleDocumentsRefresh}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-gray-500">
            <p>AI Agent Platform - Built with Next.js, FastAPI, and Mistral-7B</p>
            <p className="mt-1">
              Upload documents, enable RAG, and chat with AI that understands your content
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
