"use client";

import type { Signal } from "@/app/data/mockData";
import { isSignalActive } from "@/lib/alerts";
import { SignalCard } from "./SignalCard";

interface SignalsPanelProps {
  signals: Signal[];
  activeTimelineId: string | null;
}

export function SignalsPanel({ signals, activeTimelineId }: SignalsPanelProps) {
  if (signals.length === 0) {
    return (
      <p className="text-sm text-muted py-8 text-center border border-line rounded-2xl bg-paper">
        No signals recorded for this relationship.
      </p>
    );
  }

  const activeCount = signals.filter((s) => isSignalActive(s)).length;

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">
        {activeCount} active · {signals.length - activeCount} decayed (outside 24-month window)
      </p>
      {signals.map((signal, index) => {
        const signalId = `signal-${signal.date}-${signal.type}-${index}`;
        return (
          <SignalCard
            key={signalId}
            id={signalId}
            signal={signal}
            index={index}
            isActive={isSignalActive(signal)}
            isHighlighted={activeTimelineId === signalId}
          />
        );
      })}
    </div>
  );
}
