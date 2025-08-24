"use client";

import React from "react";
import { openNewsTool, openWeatherTool } from "@/lib/toolBus";

export default function ToolsCard() {
  return (
    <div className="quantum-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-200">Tools</h3>
        <span className="text-[10px] uppercase tracking-wide text-gray-500">Sidebar</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={openWeatherTool}
          className="px-3 py-2 rounded-md border border-gray-700 bg-gray-900/60 text-gray-200 hover:bg-gray-900/80 transition-colors text-sm"
        >
          Weather
        </button>
        <button
          onClick={openNewsTool}
          className="px-3 py-2 rounded-md border border-gray-700 bg-gray-900/60 text-gray-200 hover:bg-gray-900/80 transition-colors text-sm"
        >
          News
        </button>
      </div>
      <p className="mt-3 text-xs text-gray-500">
        Opens modals. Uses the currently selected agent in chat if applicable.
      </p>
    </div>
  );
}
