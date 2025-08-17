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
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Document</h2>
      
      {/* File Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer ${
          file
            ? 'border-green-300 bg-green-50'
            : isDragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!file ? openFilePicker : undefined}
        onKeyDown={!file ? handleKeyDown : undefined}
        role={!file ? "button" : undefined}
        tabIndex={!file ? 0 : undefined}
        aria-label={!file ? "Click to choose a PDF file or drag and drop here" : undefined}
        style={{ zIndex: 1 }}
      >
        {file ? (
          <div className="space-y-3">
            <div className="text-green-600">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900 break-words">{file.name}</p>
              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
            </div>
            <button
              onClick={openFilePicker}
              disabled={uploading}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
            >
              Change file
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-blue-600">
                  Drag & drop a PDF here, or click to choose
                </span>
              </p>
              <p className="text-xs text-gray-500">PDF files only, up to 10MB</p>
            </div>
          </div>
        )}
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

      {/* Upload Button */}
      {file && (
        <div className="mt-4 space-y-3">
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {uploading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Uploading...</span>
              </div>
            ) : (
              'Upload Document'
            )}
          </button>
          
          <button
            onClick={clearFile}
            disabled={uploading}
            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Remove file
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div 
          className="mt-3 text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2"
          aria-live="polite"
        >
          {error}
        </div>
      )}

      {/* Success Display */}
      {success && (
        <div 
          className="mt-3 text-green-600 text-sm bg-green-50 border border-green-200 rounded px-3 py-2"
          aria-live="polite"
        >
          {success}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 text-xs text-gray-500">
        <p>• Uploaded documents will be processed for RAG capabilities</p>
        <p>• Text will be extracted and chunked into searchable segments</p>
        <p>• Use the chat interface to ask questions about your documents</p>
      </div>
    </div>
  );
}
