'use client';

import React, { useState, useRef, useCallback } from 'react';
import { uploadDocument } from '@/lib/api';

interface UploadProps {
  onUploaded: () => void;
}

export default function Upload({ onUploaded }: UploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = useCallback((selectedFile: File | null) => {
    if (!selectedFile) {
      setFile(null);
      setError(null);
      setSuccess(null);
      return;
    }

    const fileName = selectedFile.name.toLowerCase();
    const isPdfExtension = fileName.endsWith('.pdf');
    const isPdfMime = selectedFile.type === 'application/pdf';
    
    if (isPdfExtension && isPdfMime) {
      setFile(selectedFile);
      setError(null);
      setSuccess(null);
    } else {
      setError('Invalid file format. Only PDF documents accepted.');
      setFile(null);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    validateAndSetFile(selectedFile);
  }, [validateAndSetFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0] || null;
    validateAndSetFile(droppedFile);
  }, [validateAndSetFile]);

  const openFilePicker = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openFilePicker();
    }
  }, [openFilePicker]);

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await uploadDocument(file);
      setSuccess(
        `"${response.file_name}" successfully integrated • ${response.chunks_processed} vectors generated`
      );
      setFile(null);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      onUploaded();
      
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const clearFile = useCallback(() => {
    setFile(null);
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  return (
    <div className="quantum-card">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="upload-orb"></div>
          <div>
            <h2 className="text-lg font-bold neon-text-cyan tracking-wider">
              QUANTUM UPLINK
            </h2>
            <p className="text-xs text-gray-500 font-mono mt-1">PDF DOCUMENT INGESTION</p>
          </div>
        </div>
        
        {/* Futuristic Drop Zone */}
        <div
          className={`upload-zone ${file ? 'has-file' : ''} ${isDragOver ? 'drag-over' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={!file ? openFilePicker : undefined}
          onKeyDown={!file ? handleKeyDown : undefined}
          role={!file ? "button" : undefined}
          tabIndex={!file ? 0 : undefined}
          aria-label={!file ? "Click to choose a PDF file or drag and drop here" : undefined}
        >
          <div className="upload-zone-content">
            {file ? (
              <>
                <div className="file-preview">
                  <div className="file-icon-large">
                    <svg className="w-16 h-16" fill="none" stroke="url(#fileGradient)" viewBox="0 0 24 24">
                      <defs>
                        <linearGradient id="fileGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#00ffcc" />
                          <stop offset="100%" stopColor="#00f0ff" />
                        </linearGradient>
                      </defs>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="file-success-indicator">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-center">
                    <p className="text-base font-medium text-gray-100 break-words px-4">{file.name}</p>
                    <p className="text-sm text-cyan-400 font-mono">{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openFilePicker();
                    }}
                    disabled={uploading}
                    className="change-file-button mt-4"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    REPLACE FILE
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="upload-icon-container">
                  <div className="upload-icon-bg"></div>
                  <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div className="mt-6 space-y-3 text-center">
                  <div>
                    <p className="text-lg font-bold neon-text-gradient">
                      DRAG & DROP FILE
                    </p>
                    <p className="text-sm text-gray-400 mt-1">or click to browse</p>
                  </div>
                  <div className="flex items-center justify-center space-x-4 text-xs font-mono text-gray-500">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      PDF FORMAT
                    </span>
                    <span>•</span>
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      MAX 10MB
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* Animated Border Effect */}
          <div className="upload-zone-border"></div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="File input"
        />

        {/* Action Buttons */}
        {file && (
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={clearFile}
              disabled={uploading}
              className="quantum-button-secondary"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              REMOVE
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="quantum-button-primary"
            >
              {uploading ? (
                <>
                  <div className="upload-progress"></div>
                  <span>UPLOADING...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 11l3 3m0 0l3-3m-3 3V8" />
                  </svg>
                  INITIALIZE UPLOAD
                </>
              )}
            </button>
          </div>
        )}

        {/* Status Messages */}
        {error && (
          <div className="error-alert mt-4" aria-live="polite">
            <div className="flex items-center space-x-3">
              <div className="error-icon-pulse"></div>
              <span className="text-sm font-mono">ERROR: {error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="success-alert mt-4" aria-live="polite">
            <div className="flex items-center space-x-3">
              <div className="success-icon-pulse"></div>
              <span className="text-sm font-mono text-emerald-400">SUCCESS: {success}</span>
            </div>
          </div>
        )}

        {/* System Info */}
        <div className="mt-6 pt-4 border-t border-gray-800">
          <div className="grid grid-cols-2 gap-3 text-xs font-mono text-gray-500">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse mr-2"></div>
              <span>VECTOR PROCESSING</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-cyan-500 mr-2"></div>
              <span>SEMANTIC CHUNKING</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}