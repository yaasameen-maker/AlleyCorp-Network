"use client";

import type { Signal } from "@/app/data/mockData";
import { formatHumanDate } from "@/lib/dates";

interface SignalCardProps {
  signal: Signal;
  index: number;
  isActive: boolean;
  isHighlighted: boolean;
  id: string;
}

const TYPE_LABELS: Record<Signal["type"], string> = {
  "co-investment": "Co-investment",
  event: "Event",
  email: "Email",
  meeting: "Meeting",
};

export function SignalCard({ signal, index, isActive, isHighlighted, id }: SignalCardProps) {
  return (
    <article
      id={id}
      className={`border rounded-2xl p-4 transition-all duration-300 animate-fade-in-up touch-press ${
        isHighlighted
          ? "border-ink/50 bg-navy shadow-sm"
          : isActive
            ? "border-line bg-paper"
            : "border-line/60 bg-paper/50 opacity-80"
      }`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 bg-mist text-ink text-xs rounded whitespace-nowrap font-medium">
            {TYPE_LABELS[signal.type]}
          </span>
          <span
            className={`px-2 py-0.5 text-xs rounded border whitespace-nowrap ${
              isActive
                ? "bg-signal-green/15 text-signal-green border-signal-green/40"
                : "bg-paper text-muted border-line"
            }`}
          >
            {isActive ? "Active" : "Decayed"}
          </span>
          <span
            className={`px-2 py-0.5 text-xs rounded border whitespace-nowrap ${
              signal.weight === "High"
                ? "bg-ink/90 text-paper border-ink/90"
                : signal.weight === "Medium"
                  ? "bg-signal-amber/15 text-signal-amber border-signal-amber/40"
                  : "bg-mist text-muted border-line"
            }`}
          >
            {signal.weight}
          </span>
        </div>
        <time className="text-xs sm:text-sm text-muted whitespace-nowrap">
          {formatHumanDate(signal.date)}
        </time>
      </div>

      <p className="text-ink text-sm sm:text-base leading-relaxed mb-2">{signal.description}</p>

      {signal.source && (
        <p className="text-xs text-muted">
          Source: <span className="text-ink">{signal.source}</span>
        </p>
      )}
    </article>
  );
}
