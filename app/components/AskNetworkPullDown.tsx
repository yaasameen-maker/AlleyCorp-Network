"use client";

import type { Investor } from "@/app/data/mockData";
import { useAskNetwork } from "@/app/hooks/useAskNetwork";
import { QueryResults } from "@/stories/MCPQueryInterface/components/QueryResults";

interface AskNetworkPullDownProps {
  open: boolean;
  onClose: () => void;
  investors: Investor[];
  onSelectInvestor: (investor: Investor) => void;
}

export function AskNetworkPullDown({
  open,
  onClose,
  investors,
  onSelectInvestor,
}: AskNetworkPullDownProps) {
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

  const handleSelect = (investor: Investor) => {
    onSelectInvestor(investor);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[90] bg-black/20 lg:hidden" aria-hidden />

      <div
        className="lg:hidden absolute left-0 right-0 top-0 z-[100] bg-paper border-b border-line shadow-2xl safe-top animate-ask-pulldown"
        role="dialog"
        aria-modal="true"
        aria-label="Ask the network"
      >
        <div className="px-4 py-3 border-b border-line flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted font-semibold">AlleyCorp</p>
            <h2 className="text-base font-semibold text-ink">Ask the network</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="touch-press flex items-center justify-center w-9 h-9 rounded-xl border border-line bg-mist text-muted hover:text-ink"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-4 py-4 max-h-[min(70dvh,32rem)] overflow-y-auto overscroll-contain">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <input
                type="text"
                enterKeyHint="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={clearResults}
                placeholder="Ask about investors…"
                autoFocus
                className="w-full pl-4 pr-12 py-3.5 bg-mist border border-line rounded-2xl text-base text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-ink/20"
              />
              {query ? (
                <button
                  type="button"
                  onClick={reset}
                  aria-label="Clear question and results"
                  className="absolute right-12 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-lg text-muted hover:text-ink"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ) : null}
              <button
                type="submit"
                aria-label="Submit question"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9 rounded-xl bg-ink text-paper"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => submitQuery(quickQueries.stale)}
                className="touch-press text-left px-3 py-2.5 rounded-xl border border-line bg-mist text-xs text-muted hover:text-ink disabled:opacity-50"
              >
                Show stale relationships
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => submitQuery(quickQueries.hotspots)}
                className="touch-press text-left px-3 py-2.5 rounded-xl border border-line bg-mist text-xs text-muted hover:text-ink disabled:opacity-50"
              >
                Hotspots
              </button>
            </div>
          </form>

          {showResults && (
            <div className="mt-4 relative">
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
                onSelectInvestor={handleSelect}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
