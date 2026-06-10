"use client";

import { useCallback, useState } from "react";
import type { Investor } from "@/lib/investors";
import { runMCPQuery, type MCPQueryResult } from "@/lib/mcpQuery";

export const ASK_QUICK_QUERIES = {
  stale: "Show stale relationships",
  hotspots: "Who are our warmest co-investors?",
} as const;

export function useAskNetwork(investors: Investor[]) {
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
        setQuery("");
      }, 280);
    },
    [investors]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitQuery(query);
  };

  const clearResults = () => {
    setResult(null);
    setIsLoading(false);
  };

  const reset = () => {
    setQuery("");
    clearResults();
  };

  return {
    query,
    setQuery,
    result,
    isLoading,
    submitQuery,
    handleSubmit,
    clearResults,
    reset,
    quickQueries: ASK_QUICK_QUERIES,
  };
}
