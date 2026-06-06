"use client";

import { useCallback, useState } from "react";
import type { Investor } from "@/app/data/mockData";
import { runMCPQuery, type MCPQueryResult } from "@/lib/mcpQuery";
import { SuggestedQueries } from "./components/SuggestedQueries";
import { QueryResults } from "./components/QueryResults";

export interface MCPQueryInterfaceProps {
  investors: Investor[];
  onSelectInvestor: (investor: Investor) => void;
  className?: string;
}

export function MCPQueryInterface({ investors, onSelectInvestor, className = "" }: MCPQueryInterfaceProps) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<MCPQueryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const submitQuery = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      setQuery(trimmed);
      if (!trimmed) {
        setResult(runMCPQuery("", investors));
        return;
      }

      setIsLoading(true);
      setResult(null);

      window.setTimeout(() => {
        setResult(runMCPQuery(trimmed, investors));
        setIsLoading(false);
      }, 280);
    },
    [investors]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitQuery(query);
  };

  return (
    <section className={`mb-5 px-4 lg:px-6 lg:mb-0 ${className}`} aria-label="Ask about the relationship network">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-ink">Ask the network</h2>
        <p className="text-xs text-muted mt-0.5">Plain English questions · powered by MCP tools</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <input
            type="text"
            enterKeyHint="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='e.g. "Show stale relationships"'
            className="w-full pl-4 pr-12 py-3.5 bg-mist border border-line rounded-2xl text-base text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-ink/20"
          />
          <button
            type="submit"
            aria-label="Submit question"
            className="touch-target touch-press absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 rounded-xl bg-ink text-paper"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 12h14M12 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        <SuggestedQueries onSelect={submitQuery} disabled={isLoading} />
      </form>

      <div className="mt-3">
        <QueryResults
          result={result}
          isLoading={isLoading}
          onSelectInvestor={onSelectInvestor}
        />
      </div>
    </section>
  );
}
