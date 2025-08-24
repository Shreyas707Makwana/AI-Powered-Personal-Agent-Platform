"use client";
import React from "react";

type MemoryMetadata = {
  source?: string;
  conversation_excerpt?: string;
  [k: string]: unknown;
};

type Memory = {
  id: string;
  title: string;
  memory_text: string;
  created_at?: string;
  metadata?: MemoryMetadata;
};

export default function MemoryCard({
  memory,
  onDelete,
  onPreview,
}: {
  memory: Memory;
  onDelete: (id: string) => void;
  onPreview?: (m: Memory) => void;
}) {
  const created = memory.created_at
    ? new Date(memory.created_at).toLocaleString()
    : "";
  const hasContext = Boolean(memory.metadata?.source || memory.metadata?.conversation_excerpt);

  return (
    <div className="relative rounded-lg border border-[#27272A] bg-[#27272A] p-4 shadow hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <h3 className="text-[#F3F4F6] font-semibold text-base pr-8">
          {memory.title || "Untitled"}
        </h3>
        <button
          aria-label="Delete memory"
          title="Delete memory"
          onClick={() => onDelete(memory.id)}
          className="text-[#FCA5A5] hover:text-white p-1 rounded focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path d="M9 3h6a1 1 0 0 1 1 1v1h4a1 1 0 1 1 0 2h-1.05l-1.02 12.24A3 3 0 0 1 14.94 22H9.06a3 3 0 0 1-2.99-2.76L5.05 7H4a1 1 0 1 1 0-2h4V4a1 1 0 0 1 1-1Zm2 0v1h2V3h-2ZM7.06 7l.98 11.76A1 1 0 0 0 9.06 20h5.88a1 1 0 0 0 1.02-.92L16.94 7H7.06Z" />
          </svg>
        </button>
      </div>
      <p className="mt-2 text-sm text-[#D1D5DB] whitespace-pre-wrap">
        {memory.memory_text}
      </p>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-[#9CA3AF]">{created}</span>
        {hasContext && (
          <button
            onClick={() => onPreview && onPreview(memory)}
            className="text-xs px-2 py-1 rounded bg-[#18181B] text-[#F3F4F6] border border-[#34343a] hover:border-[#6366F1] focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
          >
            View context
          </button>
        )}
      </div>
    </div>
  );
}
