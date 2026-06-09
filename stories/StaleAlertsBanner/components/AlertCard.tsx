import type { RelationshipAlert } from "@/lib/alerts";
import { formatMonthsAgo } from "@/lib/dates";
import { WarmthBadge } from "@/app/components/WarmthBadge";

interface AlertCardProps {
  alert: RelationshipAlert;
  onSelect: () => void;
}

export function AlertCard({ alert, onSelect }: AlertCardProps) {
  const timeLabel = alert.lastSignalDate
    ? formatMonthsAgo(alert.lastSignalDate)
    : "No signal on record";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`touch-press snap-item snap-start shrink-0 max-md:w-[82%] max-md:max-w-[18rem] md:w-full md:max-w-none lg:w-full lg:max-w-none text-left rounded-2xl border p-4 ${
        alert.severity === "high" ? "border-signal-amber/40 bg-navy" : "border-line bg-mist"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-muted font-semibold">
            {alert.type === "stale_relationship" ? "Stale" : "Warm at risk"}
          </p>
          <h3 className="text-sm font-semibold text-ink truncate">{alert.fundName}</h3>
        </div>
        <WarmthBadge tier={alert.warmthTier} size="sm" />
      </div>

      <p className="text-xs text-muted mb-1">
        {alert.portfolioCompany} · {timeLabel}
      </p>

      <p className="text-xs text-ink/90 line-clamp-2 leading-relaxed">{alert.suggestedAction}</p>

      <p className="mt-3 text-[11px] text-muted flex items-center gap-1">
        Tap to view profile
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
