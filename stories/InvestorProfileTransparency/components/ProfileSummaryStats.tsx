import type { WarmthTier } from "@/app/data/mockData";
import { WarmthBadge } from "@/app/components/WarmthBadge";
import { formatHumanDate } from "@/lib/dates";

interface ProfileSummaryStatsProps {
  warmthTier: WarmthTier;
  lastSignalDate?: string;
  activeSignalCount: number;
  totalSignalCount: number;
}

export function ProfileSummaryStats({
  warmthTier,
  lastSignalDate,
  activeSignalCount,
  totalSignalCount,
}: ProfileSummaryStatsProps) {
  const cards = [
    {
      label: "Warmth tier",
      content: <WarmthBadge tier={warmthTier} size="md" />,
    },
    {
      label: "Last signal",
      content: (
        <p className="text-sm font-semibold text-ink leading-snug">
          {lastSignalDate ? formatHumanDate(lastSignalDate) : "No signals yet"}
        </p>
      ),
    },
    {
      label: "Active signals",
      content: (
        <p className="text-xl font-semibold text-ink">
          {activeSignalCount}
          <span className="text-sm text-muted font-normal"> / {totalSignalCount}</span>
        </p>
      ),
    },
  ];

  return (
    <div className="-mx-4 sm:-mx-5 px-4 sm:px-5 overflow-x-auto scrollbar-hide snap-scroll-x">
      <div className="flex gap-3 min-w-max pb-1">
        {cards.map((card) => (
          <div
            key={card.label}
            className="snap-item w-[9.5rem] sm:w-auto sm:min-w-[10rem] sm:flex-1 bg-paper border border-line rounded-2xl p-4 animate-fade-in-up"
          >
            <div className="text-[11px] text-muted mb-2 uppercase tracking-wide">{card.label}</div>
            {card.content}
          </div>
        ))}
      </div>
    </div>
  );
}
