"use client";

import React, { useState } from "react";

export type Article = {
  title: string;
  source?: string;
  publishedAt?: string;
  url?: string;
  snippet?: string;
};

interface ArticlePagerProps {
  articles: Article[];
  cached?: boolean;
  ttlRemaining?: number;
}

export default function ArticlePager({ articles, cached, ttlRemaining }: ArticlePagerProps) {
  const [index, setIndex] = useState(0);
  const total = Array.isArray(articles) ? articles.length : 0;
  const a = total > 0 ? articles[index] : null;

  const next = () => setIndex((i) => (i + 1) % Math.max(total, 1));

  if (!a) return null;

  return (
    <div className="mt-3 rounded-lg border border-gray-700 bg-gray-900/60 p-4">
      {/* meta */}
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs text-gray-400">
          {cached && (
            <span className="mr-2 rounded-full border border-gray-700 bg-gray-800 px-2 py-0.5 text-[10px] text-gray-300">
              cached • TTL {ttlRemaining ?? 0}s
            </span>
          )}
          <span className="text-[11px] text-gray-400">{index + 1} / {total}</span>
        </div>
        <button onClick={next} className="px-2 py-1 text-xs rounded-md border border-cyan-600 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20">Next</button>
      </div>

      {/* card */}
      <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-4">
        <a href={a.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-cyan-400 hover:text-cyan-300">
          {a.title || "Untitled"}
        </a>
        <div className="mt-1 text-xs text-gray-400">
          {(a.source || "Unknown")} {a.publishedAt ? `• ${new Date(a.publishedAt).toLocaleString()}` : ""}
        </div>
        {a.snippet && (
          <p className="mt-2 text-sm text-gray-200">{a.snippet}</p>
        )}
        {a.url && (
          <div className="mt-2">
            <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-xs text-purple-300 underline">Open source</a>
          </div>
        )}
      </div>
    </div>
  );
}
