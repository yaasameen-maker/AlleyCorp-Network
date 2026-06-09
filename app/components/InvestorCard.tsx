"use client";

import { useMemo } from "react";
import { Investor } from "../data/mockData";
import { WarmthBadge } from "./WarmthBadge";
import { AnimatedBar, AnimatedNumber } from "./AnimatedBar";
import { useInView } from "@/app/hooks/useInView";
import { analyzeWarmth } from "@/lib/warmthAnalysis";

interface InvestorCardProps {
  investor: Investor;
  onClick: () => void;
}

export function InvestorCard({ investor, onClick }: InvestorCardProps) {
  const { ref, inView } = useInView({ threshold: 0.25, rootMargin: "0px 0px -4% 0px" });
  const analysis = useMemo(() => analyzeWarmth(investor), [investor]);

  const signalPercent = Math.min(100, (investor.signals.length / 4) * 100);
  const coInvestPercent = Math.min(100, (investor.coInvestments.length / 2) * 100);
  const scoreRounded = Math.round(analysis.scorePercent);

  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      type="button"
      onClick={onClick}
      className="touch-press w-full text-left p-4 max-md:p-4 md:p-5 border border-line rounded-2xl bg-mist active:bg-navy/40 transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-ink truncate">{investor.fund.name}</h3>
          <p className="text-sm text-muted truncate mt-0.5">{investor.name}</p>
        </div>
        <WarmthBadge tier={investor.warmthTier} size="sm" />
      </div>

      <div className="space-y-2.5 mb-3">
        <div>
          <div className="flex items-center justify-between text-xs text-muted mb-1">
            <span>Relationship strength</span>
            {inView ? (
              <AnimatedNumber
                value={scoreRounded}
                suffix="%"
                className="text-ink tabular-nums"
                active={inView}
              />
            ) : (
              <span className="text-ink tabular-nums opacity-40">0%</span>
            )}
          </div>
          <AnimatedBar value={analysis.scorePercent} active={inView} heightClass="h-1.5" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between text-[11px] text-muted mb-1">
              <span>Signals</span>
              {inView ? (
                <AnimatedNumber
                  value={investor.signals.length}
                  delay={80}
                  className="text-ink tabular-nums"
                  active={inView}
                />
              ) : (
                <span className="text-ink tabular-nums opacity-40">0</span>
              )}
            </div>
            <AnimatedBar
              value={signalPercent}
              active={inView}
              delay={80}
              heightClass="h-1"
              color="#34d399"
            />
          </div>
          <div>
            <div className="flex items-center justify-between text-[11px] text-muted mb-1">
              <span>Co-investments</span>
              {inView ? (
                <AnimatedNumber
                  value={investor.coInvestments.length}
                  delay={160}
                  className="text-ink tabular-nums"
                  active={inView}
                />
              ) : (
                <span className="text-ink tabular-nums opacity-40">0</span>
              )}
            </div>
            <AnimatedBar
              value={coInvestPercent}
              active={inView}
              delay={160}
              heightClass="h-1"
              color="#8fa3bc"
            />
          </div>
        </div>
      </div>

      {investor.lastSignalDate && (
        <p className="text-xs text-muted mb-2">
          Last signal <span className="text-ink font-medium">{investor.lastSignalDate}</span>
        </p>
      )}

      {investor.suggestedAction && (
        <p className="pt-3 border-t border-line text-sm text-muted line-clamp-2 leading-relaxed">
          {investor.suggestedAction}
        </p>
      )}

      <div className="mt-3 flex items-center justify-end gap-1 text-xs text-muted">
        <span>View profile</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}
