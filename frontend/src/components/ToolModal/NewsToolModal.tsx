"use client";

import React, { useState } from "react";
import { executeTool } from "@/lib/api";
import ModalPortal from "@/components/ModalPortal";

type NewsArticle = {
  title: string;
  source?: string;
  publishedAt?: string;
  url?: string;
  snippet?: string;
};

type NewsResult = {
  provider: string;
  query: string;
  articles: NewsArticle[];
  cached?: boolean;
  ttl_remaining?: number;
};

interface NewsToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId?: string | null;
  onStart?: (topic: string) => void;
  onResult?: (result: NewsResult) => void;
  onError?: (message: string) => void;
}

export default function NewsToolModal({ isOpen, onClose, agentId, onStart, onResult, onError }: NewsToolModalProps) {
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState("en");
  const [pageSize, setPageSize] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NewsResult | null>(null);

  if (!isOpen) return null;

  const clampPageSize = (n: number) => Math.max(1, Math.min(10, n || 1));

  const runNews = async () => {
    const t = topic.trim();
    if (!t) {
      setError("Please enter a topic");
      return;
    }
    if (t.length > 200) {
      setError("Topic too long (max 200 chars)");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      onStart?.(t);
      const resp = await executeTool<NewsResult>(
        { agent_id: agentId || undefined, tool_key: "news", params: { topic: t, language, pageSize: clampPageSize(pageSize) } }
      );
      setResult(resp.result);
      onResult?.(resp.result);
      // Auto-close the modal so the search card disappears
      onClose();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to execute news tool";
      setError(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  const titleId = "news-modal-title";
  const descId = "news-modal-desc";

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose} labelledBy={titleId} describedBy={descId}>
      <div className="quantum-card w-full max-w-lg p-6 mx-auto animate-[fadeIn_0.2s_ease-out]">
        <div className="flex items-center justify-between mb-4">
          <h3 id={titleId} className="text-lg font-bold neon-text-cyan">News Tool</h3>
          <button
            onClick={() => {
              // reset on manual close
              setTopic("");
              setLanguage("en");
              setPageSize(5);
              setResult(null);
              setError(null);
              onClose();
            }}
            aria-label="Close News"
            className="px-2 py-1 text-sm border border-gray-600 rounded-md hover:bg-gray-800 focus:outline-none"
          >
            Close
          </button>
        </div>

        <div id={descId} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-purple-400 mb-2">Topic</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., OpenAI, AI policy, Nvidia"
              className="quantum-input w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-purple-400 mb-2">Language</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="quantum-select w-full">
                <option value="en">English (en)</option>
                <option value="es">Spanish (es)</option>
                <option value="de">German (de)</option>
                <option value="fr">French (fr)</option>
                <option value="it">Italian (it)</option>
                <option value="pt">Portuguese (pt)</option>
                <option value="zh">Chinese (zh)</option>
                <option value="ja">Japanese (ja)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-400 mb-2">Page Size (1-10)</label>
              <input
                type="number"
                min={1}
                max={10}
                value={pageSize}
                onChange={(e) => setPageSize(clampPageSize(parseInt(e.target.value, 10) || 1))}
                className="quantum-input w-full"
              />
            </div>
          </div>

          {error && (
            <div className="error-alert">
              <div className="flex items-center space-x-2">
                <div className="error-icon-pulse"></div>
                <span className="text-xs font-mono">{error}</span>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-3">
            <button onClick={runNews} disabled={loading} className="quantum-send-button">
              {loading ? <span>FETCHING...</span> : <span>FETCH NEWS</span>}
            </button>
          </div>

          {result?.articles && Array.isArray(result.articles) && (
            <div className="mt-4 space-y-3">
              {result.cached && (
                <div className="text-xs text-gray-400">cached • TTL: {result.ttl_remaining}s</div>
              )}
              {result.articles.map((a: NewsArticle, idx: number) => (
                <div key={idx} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                  <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 font-semibold">
                    {a.title || 'Untitled'}
                  </a>
                  <div className="text-xs text-gray-400 mt-1">
                    {a.source || 'Unknown'} • {a.publishedAt ? new Date(a.publishedAt).toLocaleString() : ''}
                  </div>
                  {a.snippet && (
                    <p className="text-sm text-gray-200 mt-2">{a.snippet}</p>
                  )}
                  <div className="mt-2">
                    <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-xs text-purple-300 underline">Open source</a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ModalPortal>
  );
}
