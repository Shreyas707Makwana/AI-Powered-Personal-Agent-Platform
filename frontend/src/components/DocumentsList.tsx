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
      onDocumentSelect(null);
    } else {
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

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'processed':
        return { color: 'emerald', icon: '✓', label: 'SYNCED' };
      case 'processing':
        return { color: 'amber', icon: '◈', label: 'INDEXING' };
      case 'error':
        return { color: 'red', icon: '⚠', label: 'FAILED' };
      default:
        return { color: 'gray', icon: '○', label: 'UNKNOWN' };
    }
  };

  return (
    <div className="quantum-card h-full flex flex-col">
      <div className="p-6 flex-1 flex flex-col">
        {/* Header with Refresh */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="data-orb"></div>
              <h2 className="text-lg font-bold tracking-wider">
                QUANTUM DATA ARCHIVE
              </h2>
            </div>
            <p className="text-xs text-gray-500 font-mono">
              {documents.length} DOCUMENTS • {documents.filter(d => d.status === 'processed').length} INDEXED
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="refresh-button group"
            title="Resync quantum archive"
          >
            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`} 
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Loading State (skeletons) */}
        {loading && (
          <div className="flex-1 overflow-y-auto space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="document-card">
                <div className="flex items-start space-x-3 animate-pulse">
                  <div className="w-5 h-5 rounded bg-gray-700/60" />
                  <div className="flex-1 min-w-0">
                    <div className="h-4 bg-gray-700/60 rounded w-2/3 mb-2" />
                    <div className="h-3 bg-gray-700/50 rounded w-1/3" />
                  </div>
                  <div className="w-20 h-5 bg-gray-700/60 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="error-alert mb-4">
            <div className="flex items-center space-x-3">
              <div className="error-icon-pulse"></div>
              <span className="text-sm font-mono">ARCHIVE ERROR: {error}</span>
            </div>
          </div>
        )}

        {/* Documents Grid */}
        {!loading && documents.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8">
            <div className="text-center">
              <div className="empty-archive-icon mx-auto mb-6 flex items-center justify-center">
                <svg className="w-20 h-20" fill="none" stroke="url(#emptyGradient)" viewBox="0 0 24 24">
                  <defs>
                    <linearGradient id="emptyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#9b5cff" />
                      <stop offset="100%" stopColor="#00ffcc" />
                    </linearGradient>
                  </defs>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <div className="flex flex-col items-center">
                <h3 className="text-lg font-bold mb-2 text-center">ARCHIVE EMPTY</h3>
                <p className="text-sm text-gray-400 text-center">
                  Upload documents to initialize<br />quantum knowledge base
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-3 scrollbar-thin">
            {documents.map((doc) => {
              const status = getStatusIndicator(doc.status);
              const isSelected = selectedDocId === doc.id.toString();
              
              return (
                <div
                  key={doc.id}
                  onClick={() => handleDocumentClick(doc.id)}
                  className={`document-card ${isSelected ? 'document-selected' : ''}`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Document Icon with Status */}
                    <div className="relative flex-shrink-0">
                      <div className="document-icon">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" 
                                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" 
                                clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className={`status-dot status-${status.color}`}>
                        <span>{status.icon}</span>
                      </div>
                    </div>
                    
                    {/* Document Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-100 truncate mb-1" title={doc.file_name}>
                        {doc.file_name}
                      </p>
                      <div className="flex items-center space-x-3 text-xs text-gray-500 font-mono">
                        <span>{formatFileSize(doc.file_size)}</span>
                        <span>•</span>
                        <span>{formatDate(doc.upload_timestamp)}</span>
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <div className="flex-shrink-0">
                      <span className={`status-badge status-badge-${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                  
                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="selection-indicator mt-3">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/50 to-transparent"></div>
                        <span className="text-xs text-cyan-400 font-mono">ACTIVE TARGET</span>
                        <div className="flex-1 h-px bg-gradient-to-l from-cyan-500/50 to-transparent"></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Info */}
        {!loading && documents.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-800">
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-gray-500">NEURAL SYNC ACTIVE</span>
              </div>
              <div className="flex items-center space-x-2 justify-end">
                <span className="text-gray-500">VECTOR DB: READY</span>
                <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}