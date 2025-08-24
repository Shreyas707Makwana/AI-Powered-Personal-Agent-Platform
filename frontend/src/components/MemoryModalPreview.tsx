"use client";
import React from "react";

type Memory = {
  id: string;
  title: string;
  memory_text: string;
  created_at?: string;
  metadata?: Record<string, unknown>;
};

export default function MemoryModalPreview({
  open,
  memory,
  onClose,
}: {
  open: boolean;
  memory: Memory | null;
  onClose: () => void;
}) {
  if (!open || !memory) return null;
  const meta = (memory.metadata || {}) as Record<string, unknown>;
  const src = typeof meta.source === 'string' ? meta.source : undefined;
  const excerpt = typeof meta.conversation_excerpt === 'string' ? meta.conversation_excerpt : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-[#34343a] bg-[#18181B] text-[#F3F4F6] p-4 shadow-xl">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold">Context</h3>
          <button
            onClick={onClose}
            aria-label="Close preview"
            className="p-1 rounded hover:bg-[#27272A] focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div className="space-y-3 text-sm">
          {src && (
            <div>
              <div className="text-[#9CA3AF]">Source</div>
              <div className="mt-1 whitespace-pre-wrap">{src}</div>
            </div>
          )}
          {excerpt && (
            <div>
              <div className="text-[#9CA3AF]">Conversation excerpt</div>
              <div className="mt-1 whitespace-pre-wrap">{excerpt}</div>
            </div>
          )}
          {!src && !excerpt && (
            <div className="text-[#9CA3AF]">No additional context available.</div>
          )}
        </div>
      </div>
    </div>
  );
}
