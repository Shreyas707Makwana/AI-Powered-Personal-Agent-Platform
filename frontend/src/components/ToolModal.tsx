"use client";

import React, { useState } from "react";
import { executeTool } from "@/lib/api";
import ModalPortal from "@/components/ModalPortal";

interface ToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId?: string | null;
}

export default function ToolModal({ isOpen, onClose, agentId }: ToolModalProps) {
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  if (!isOpen) return null;

  const runWeather = async () => {
    if (!city.trim()) {
      setError("Please enter a city");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const resp = await executeTool<{ temp_c?: number; description?: string; city?: string }>(
        { agent_id: agentId || undefined, tool_key: "weather", params: { city: city.trim() } }
      );
      setResult(resp.result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to execute tool");
    } finally {
      setLoading(false);
    }
  };

  const titleId = "tool-modal-title";
  const descId = "tool-modal-desc";

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose} labelledBy={titleId} describedBy={descId}>
      <div
        className="quantum-card w-full max-w-md p-6 mx-auto animate-[fadeIn_0.2s_ease-out] scale-100 sm:scale-100"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 id={titleId} className="text-lg font-bold neon-text-cyan">Run Tool</h3>
          <button
            onClick={onClose}
            aria-label="Close Tool"
            className="px-2 py-1 text-sm border border-gray-600 rounded-md hover:bg-gray-800 focus:outline-none"
          >
            Close
          </button>
        </div>

        <div id={descId} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-purple-400 mb-2">Weather City</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g., San Francisco"
              className="quantum-input w-full"
            />
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
            <button
              onClick={runWeather}
              disabled={loading}
              className="quantum-send-button"
            >
              {loading ? <span>RUNNING...</span> : <span>RUN WEATHER</span>}
            </button>
          </div>

          {result !== null && (
            <div className="mt-4 bg-gray-900/50 rounded-lg p-4 border border-gray-700 text-sm text-gray-200">
              <pre className="whitespace-pre-wrap break-words">{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </ModalPortal>
  );
}
