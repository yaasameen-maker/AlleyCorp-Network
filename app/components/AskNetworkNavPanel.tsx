"use client";

import type { Investor } from "@/app/data/mockData";
import { useAskNetwork } from "@/app/hooks/useAskNetwork";
import { QueryResults } from "@/stories/MCPQueryInterface/components/QueryResults";

interface AskNetworkNavPanelProps {
  investors: Investor[];
  onSelectInvestor: (investor: Investor) => void;
  compact?: boolean;
}

export function AskNetworkNavPanel({
  investors,
  onSelectInvestor,
  compact = false,
}: AskNetworkNavPanelProps) {
  const {
    query,
    setQuery,
    result,
    isLoading,
    submitQuery,
    handleSubmit,
    clearResults,
    reset,
    quickQueries,
  } = useAskNetwork(investors);

  const showResults = isLoading || result;

  return (
    <div
      className={`${compact ? "px-4 py-3 border-b border-line bg-paper/50" : "px-3 py-3 mt-1 rounded-xl border border-line bg-mist/30"}`}
      aria-label="Ask the network"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-2">
        Ask the network
      </p>

      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="relative">
          <input
            type="text"
            enterKeyHint="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={clearResults}
            placeholder="Ask about investors…"
            className="w-full pl-3 pr-9 py-2.5 bg-field-input text-ink border-0 rounded-xl text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ink/10"
          />
          {query ? (
            <button
              type="button"
              onClick={reset}
              aria-label="Clear question and results"
              className="absolute right-9 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-md text-muted hover:text-ink"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : null}
          <button
            type="submit"
            aria-label="Submit question"
            className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-lg bg-field-action text-field-action-text hover:bg-field-action/90"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => submitQuery(quickQueries.stale)}
            className="touch-press w-full text-left px-3 py-2 rounded-lg border border-line bg-paper text-xs text-muted hover:text-ink disabled:opacity-50"
          >
            Show stale relationships
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => submitQuery(quickQueries.hotspots)}
            className="touch-press w-full text-left px-3 py-2 rounded-lg border border-line bg-paper text-xs text-muted hover:text-ink disabled:opacity-50"
          >
            Hotspots — warmest co-investors
          </button>
        </div>
      </form>

      {showResults && (
        <div className="mt-2 relative max-h-[40vh] overflow-y-auto rounded-xl">
          <button
            type="button"
            onClick={reset}
            aria-label="Dismiss results"
            className="absolute top-2 right-2 z-10 flex items-center justify-center w-7 h-7 rounded-lg border border-line bg-paper/95 text-muted hover:text-ink shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <QueryResults
            result={result}
            isLoading={isLoading}
            onSelectInvestor={onSelectInvestor}
            previewItemCount={2}
            compact
          />
        </div>
      )}
    </div>
  );
}
