"use client";
import React from "react";

export default function MemoryToolbar({
  autosaveEnabled,
  onToggleAutosave,
  onOpenCondense,
}: {
  autosaveEnabled: boolean;
  onToggleAutosave: (val: boolean) => void;
  onOpenCondense: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-[#34343a] bg-[#18181B]">
      <div className="flex items-center gap-3">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={autosaveEnabled}
            onChange={(e) => onToggleAutosave(e.target.checked)}
            className="sr-only peer"
            aria-label="Toggle autosave memories"
          />
          <div className="w-11 h-6 bg-[#27272A] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#6366F1] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6366F1]"></div>
          <span className="ml-3 text-sm text-[#F3F4F6]">
            Autosave memories
          </span>
        </label>
        <span className="text-xs text-[#9CA3AF]">
          Create short memory after each conversation
        </span>
      </div>
      <button
        onClick={onOpenCondense}
        className="text-sm px-3 py-1.5 rounded bg-[#27272A] text-[#F3F4F6] border border-[#34343a] hover:border-[#6366F1] focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
      >
        Condense conversation
      </button>
    </div>
  );
}
