'use client';

import React, { useState, useEffect } from 'react';
import { fetchDocuments, Document } from '@/lib/api';

interface DocumentsListProps {
  selectedDocId: string | null;
  onDocumentSelect: (docId: string | null) => void;
  onRefresh: () => void;
}

export default function DocumentsList({ selectedDocId, onDocumentSelect, onRefresh }: DocumentsListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const docs = await fetchDocuments();
      setDocuments(docs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadDocuments();
    onRefresh();
  };

  const handleDocumentClick = (docId: number) => {
    const docIdString = docId.toString();
    if (selectedDocId === docIdString) {
      // Deselect if already selected
      onDocumentSelect(null);
    } else {
      // Select the document
      onDocumentSelect(docIdString);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed':
        return 'bg-green-900 bg-opacity-30 text-green-400 border-green-400';
      case 'processing':
        return 'bg-yellow-900 bg-opacity-30 text-yellow-400 border-yellow-400';
      case 'error':
        return 'bg-red-900 bg-opacity-30 text-red-400 border-red-400';
      default:
        return 'bg-gray-900 bg-opacity-30 text-gray-400 border-gray-400';
    }
  };

  return (
    <div className="cyber-card">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 rounded-full bg-purple-400"></div>
            <h2 className="text-lg font-bold" style={{color: 'var(--neon-purple)', fontFamily: 'var(--font-futuristic)'}}>
              DATA ARCHIVE
            </h2>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="cyber-button p-2 rounded-lg disabled:opacity-50 transition-all hover:scale-110"
            title="Refresh neural archive"
          >
            <svg className="w-5 h-5" style={{color: 'var(--neon-teal)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="cyber-card p-6 max-w-xs mx-auto">
              <div className="flex items-center justify-center space-x-3 mb-3">
                <div className="w-6 h-6 rounded-full bg-blue-400 animate-spin"></div>
                <span style={{color: 'var(--neon-blue)', fontFamily: 'var(--font-futuristic)'}}>SCANNING NEURAL ARCHIVE...</span>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-4 p-4 rounded-lg border-2 border-red-500 bg-red-900 bg-opacity-20">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-red-400 text-sm" style={{fontFamily: 'var(--font-futuristic)'}}>
                ARCHIVE ERROR: {error}
              </span>
            </div>
          </div>
        )}

        {/* Documents List */}
        {!loading && documents.length === 0 ? (
          <div className="text-center py-12">
            <div className="cyber-card p-8 max-w-sm mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" 
                   style={{background: 'linear-gradient(45deg, var(--neon-purple), var(--neon-teal))'}}>
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="mb-2" style={{color: 'var(--neon-purple)', fontFamily: 'var(--font-futuristic)'}}>
                ARCHIVE EMPTY
              </p>
              <p className="text-sm" style={{color: 'var(--foreground-muted)'}}>
                Upload documents to initialize RAG protocol
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => handleDocumentClick(doc.id)}
                className={`cyber-card p-4 cursor-pointer transition-all duration-300 hover:scale-105 ${
                  selectedDocId === doc.id.toString()
                    ? 'border-2 border-blue-400 bg-blue-900 bg-opacity-20'
                    : 'hover:border-blue-400 hover:bg-blue-900 hover:bg-opacity-10'
                }`}
                style={{
                  borderColor: selectedDocId === doc.id.toString() ? 'var(--neon-blue)' : undefined,
                  boxShadow: selectedDocId === doc.id.toString() ? 'var(--glow-blue)' : undefined
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <svg className="w-5 h-5 flex-shrink-0" style={{color: 'var(--neon-teal)'}} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm font-semibold truncate" 
                         style={{color: 'var(--foreground)', fontFamily: 'var(--font-body)'}} 
                         title={doc.file_name}>
                        {doc.file_name}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-xs" style={{color: 'var(--foreground-muted)'}}>
                      <span>{formatFileSize(doc.file_size)}</span>
                      <span>•</span>
                      <span>{formatDate(doc.upload_timestamp)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 ml-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(doc.status)}`}
                          style={{fontFamily: 'var(--font-futuristic)'}}>
                      {doc.status.toUpperCase()}
                    </span>
                    {selectedDocId === doc.id.toString() && (
                      <div className="w-6 h-6 rounded-full flex items-center justify-center"
                           style={{background: 'rgba(0, 240, 255, 0.2)', color: 'var(--neon-blue)'}}>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* System Instructions */}
        <div className="mt-6 space-y-2 text-xs" style={{color: 'var(--foreground-muted)'}}>
          <p>• Select documents for targeted RAG queries</p>
          <p>• Active selections highlighted with neural glow</p>
          <p>• Archive automatically syncs with neural interface</p>
        </div>
      </div>
    </div>
  );
}
