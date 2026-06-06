"use client";

import { SUGGESTED_QUERIES } from "@/lib/mcpQuery";

interface SuggestedQueriesProps {
  onSelect: (query: string) => void;
  disabled?: boolean;
}

export function SuggestedQueries({ onSelect, disabled }: SuggestedQueriesProps) {
  return (
    <div className="-mx-1 overflow-x-auto scrollbar-hide snap-scroll-x">
      <div className="flex gap-2 min-w-max px-1 pb-1">
        {SUGGESTED_QUERIES.map((query) => (
          <button
            key={query}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(query)}
            className="touch-press snap-item shrink-0 max-w-[14rem] text-left px-3 py-2 rounded-xl border border-line bg-paper text-xs text-muted hover:text-ink disabled:opacity-50"
          >
            {query}
          </button>
        ))}
      </div>
    </div>
  );
}
