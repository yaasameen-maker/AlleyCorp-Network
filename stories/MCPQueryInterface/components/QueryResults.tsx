import type { Investor } from "@/app/data/mockData";
import type { MCPQueryResult } from "@/lib/mcpQuery";
import { formatToolLabel } from "@/lib/mcpQuery";
import { QueryResultRow } from "./QueryResultRow";

interface QueryResultsProps {
  result: MCPQueryResult | null;
  isLoading: boolean;
  onSelectInvestor: (investor: Investor) => void;
  /** Limit visible result rows; scroll to see the rest */
  previewItemCount?: number;
  compact?: boolean;
}

export function QueryResults({
  result,
  isLoading,
  onSelectInvestor,
  previewItemCount,
  compact = false,
}: QueryResultsProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-line bg-paper p-6 text-center animate-pulse">
        <p className="text-sm text-muted">Searching relationship network…</p>
      </div>
    );
  }

  if (!result) return null;

  if (result.isError) {
    return (
      <div className="rounded-2xl border border-line bg-paper p-4">
        <p className="text-sm text-ink">{result.errorMessage}</p>
      </div>
    );
  }

  if (result.isEmpty) {
    return (
      <div className="rounded-2xl border border-line bg-paper p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-sm font-medium text-ink">No results</p>
          <span className="text-[10px] uppercase tracking-wide text-muted font-semibold">
            {formatToolLabel(result.tool)}
          </span>
        </div>
        <p className="text-xs text-muted">
          Nothing matched &ldquo;{result.query}&rdquo;. Try one of the suggested questions.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-mist overflow-hidden animate-fade-in-up">
      <div className="px-4 py-3 border-b border-line bg-navy flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">{result.headline}</p>
          <p className="text-xs text-muted mt-0.5 truncate">&ldquo;{result.query}&rdquo;</p>
        </div>
        <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted font-semibold bg-paper/80 px-2 py-1 rounded-full">
          {formatToolLabel(result.tool)}
        </span>
      </div>
      <div
        className={`p-3 space-y-2 ${
          previewItemCount
            ? `${compact ? "max-h-[12rem]" : "max-h-[15.5rem]"} overflow-y-auto overscroll-contain scrollbar-hide`
            : ""
        }`}
      >
        {previewItemCount && result.items.length > previewItemCount && (
          <p className="text-[11px] text-muted text-center pb-1 sticky top-0 bg-mist/95 py-1 z-[1]">
            Scroll to see all {result.items.length} results
          </p>
        )}
        {result.items.map((item) => (
          <QueryResultRow key={item.investor.id} item={item} onSelect={onSelectInvestor} />
        ))}
      </div>
    </div>
  );
}
