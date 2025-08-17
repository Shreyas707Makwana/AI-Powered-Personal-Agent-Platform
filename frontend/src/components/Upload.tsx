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

  // Debounced file validation and setting
  const validateAndSetFile = useCallback((selectedFile: File | null) => {
    if (!selectedFile) {
      setFile(null);
      setError(null);
      setSuccess(null);
      return;
    }

    // Check file extension
    const fileName = selectedFile.name.toLowerCase();
    const isPdfExtension = fileName.endsWith('.pdf');
    
    // Check MIME type
    const isPdfMime = selectedFile.type === 'application/pdf';
    
    if (isPdfExtension && isPdfMime) {
      setFile(selectedFile);
      setError(null);
      setSuccess(null);
    } else {
      setError('Please select a valid PDF file. Only .pdf files are accepted.');
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
        `Document "${response.file_name}" uploaded successfully! ${response.chunks_processed} chunks processed.`
      );
      setFile(null);
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Trigger callback to refresh documents list
      onUploaded();
      
      // Clear success message after 5 seconds
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
    <div className="cyber-card">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-4 h-4 rounded-full bg-blue-400"></div>
          <h2 className="text-lg font-bold" style={{color: 'var(--neon-blue)', fontFamily: 'var(--font-futuristic)'}}>
            DATA UPLOAD
          </h2>
        </div>
        
        {/* Futuristic File Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer relative overflow-hidden ${
            file
              ? 'border-green-400 bg-green-900 bg-opacity-20'
              : isDragOver
              ? 'border-blue-400 bg-blue-900 bg-opacity-20'
              : 'border-gray-600 hover:border-blue-400 hover:bg-blue-900 hover:bg-opacity-10'
          }`}
          style={{
            borderColor: file 
              ? 'var(--neon-teal)' 
              : isDragOver 
              ? 'var(--neon-blue)' 
              : 'rgba(0, 240, 255, 0.3)'
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={!file ? openFilePicker : undefined}
          onKeyDown={!file ? handleKeyDown : undefined}
          role={!file ? "button" : undefined}
          tabIndex={!file ? 0 : undefined}
          aria-label={!file ? "Click to choose a PDF file or drag and drop here" : undefined}
        >
          {file ? (
            <div className="space-y-4">
              <div style={{color: 'var(--neon-teal)'}}>
                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="space-y-2">
                <p className="text-base font-semibold break-words" style={{color: 'var(--foreground)', fontFamily: 'var(--font-body)'}}>{file.name}</p>
                <p className="text-sm" style={{color: 'var(--neon-teal)', fontFamily: 'var(--font-futuristic)'}}>{formatFileSize(file.size)}</p>
              </div>
              <button
                onClick={openFilePicker}
                disabled={uploading}
                className="cyber-button px-4 py-2 rounded-lg text-sm disabled:opacity-50 transition-all hover:scale-105"
                style={{fontFamily: 'var(--font-futuristic)'}}
              >
                CHANGE FILE
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <svg className="mx-auto h-16 w-16" style={{color: 'var(--neon-blue)'}} stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="space-y-2">
                <p className="text-base" style={{color: 'var(--foreground)'}}>
                  <span className="font-semibold" style={{color: 'var(--neon-blue)', fontFamily: 'var(--font-futuristic)'}}>
                    DRAG & DROP PDF • CLICK TO SELECT
                  </span>
                </p>
                <p className="text-sm" style={{color: 'var(--foreground-muted)'}}>PDF files only • Maximum 10MB</p>
              </div>
            </div>
          )}
          
          {/* Animated border effect */}
          <div className="absolute inset-0 rounded-xl pointer-events-none">
            <div className="absolute inset-0 rounded-xl border border-transparent animate-pulse"
                 style={{
                   background: isDragOver 
                     ? 'linear-gradient(45deg, transparent, rgba(0, 240, 255, 0.2), transparent)'
                     : 'none'
                 }}>
            </div>
          </div>
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
          <div className="mt-6 space-y-3">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full cyber-button py-3 px-6 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
              style={{fontFamily: 'var(--font-futuristic)'}}
            >
              {uploading ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  <span>UPLOADING...</span>
                </div>
              ) : (
                'UPLOAD DOCUMENT'
              )}
            </button>
            
            <button
              onClick={clearFile}
              disabled={uploading}
              className="w-full py-3 px-6 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
              style={{
                background: 'rgba(155, 92, 255, 0.1)',
                border: '1px solid rgba(155, 92, 255, 0.3)',
                color: 'var(--neon-purple)',
                fontFamily: 'var(--font-futuristic)'
              }}
            >
              REMOVE FILE
            </button>
          </div>
        )}

        {/* Status Messages */}
        {error && (
          <div className="mt-4 p-4 rounded-lg border-2 border-red-500 bg-red-900 bg-opacity-20" aria-live="polite">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-red-400 text-sm" style={{fontFamily: 'var(--font-futuristic)'}}>
                ERROR: {error}
              </span>
            </div>
          </div>
        )}

        {success && (
          <div className="mt-4 p-4 rounded-lg border-2 border-green-500 bg-green-900 bg-opacity-20" aria-live="polite">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-green-400 text-sm" style={{fontFamily: 'var(--font-futuristic)'}}>
                SUCCESS: {success}
              </span>
            </div>
          </div>
        )}

        {/* System Info */}
        <div className="mt-6 space-y-2 text-xs" style={{color: 'var(--foreground-muted)'}}>
          <p>• Documents processed for RAG neural network integration</p>
          <p>• Text extraction and semantic chunking protocols active</p>
          <p>• Neural interface ready for document queries</p>
        </div>
      </div>
    </div>
  );
}
