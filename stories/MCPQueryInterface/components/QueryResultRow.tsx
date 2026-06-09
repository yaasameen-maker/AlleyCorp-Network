import type { Investor } from "@/app/data/mockData";
import { WarmthBadge } from "@/app/components/WarmthBadge";
import type { MCPQueryResultItem } from "@/lib/mcpQuery";

interface QueryResultRowProps {
  item: MCPQueryResultItem;
  onSelect: (investor: Investor) => void;
}

export function QueryResultRow({ item, onSelect }: QueryResultRowProps) {
  const { investor, detail } = item;

  return (
    <button
      type="button"
      onClick={() => onSelect(investor)}
      className="touch-press w-full text-left rounded-2xl border border-line bg-paper p-4 hover:border-ink/30 transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <h4 className="text-sm font-semibold text-ink">{investor.fund.name}</h4>
        <WarmthBadge tier={investor.warmthTier} size="sm" />
      </div>
      <p className="text-xs text-muted line-clamp-2 leading-relaxed">{detail}</p>
      <p className="mt-2 text-[11px] text-muted flex items-center gap-1">
        Open profile
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </p>
    </button>
  );
}
