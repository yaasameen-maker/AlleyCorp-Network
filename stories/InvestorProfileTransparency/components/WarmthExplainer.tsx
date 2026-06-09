"use client";

import type { WarmthAnalysis } from "@/lib/warmthAnalysis";
import { WarmthBadge } from "@/app/components/WarmthBadge";
import { AnimatedBar, AnimatedNumber } from "@/app/components/AnimatedBar";

interface WarmthExplainerProps {
  analysis: WarmthAnalysis;
  highlightedFactor: string | null;
  onFactorHover: (id: string | null) => void;
}

export function WarmthExplainer({
  analysis,
  highlightedFactor,
  onFactorHover,
}: WarmthExplainerProps) {
  const scoreRounded = Math.round(analysis.scorePercent);

  return (
    <section className="border border-line rounded-xl overflow-hidden bg-mist">
      <div className="bg-navy px-4 sm:px-5 py-3 border-b border-line">
        <p className="text-ink text-xs uppercase tracking-wider font-semibold">
          Why this classification
        </p>
        <p className="text-xs text-muted mt-0.5">Tap each factor to explore</p>
      </div>

      <div className="p-4 sm:p-5 space-y-5 bg-mist">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <WarmthBadge tier={analysis.tier} size="lg" />
          <p className="text-sm sm:text-base text-ink leading-relaxed flex-1">{analysis.summary}</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Relationship strength</span>
            <AnimatedNumber value={scoreRounded} suffix="%" className="text-ink tabular-nums" />
          </div>
          <AnimatedBar value={analysis.scorePercent} delay={100} />
        </div>

        <div className="space-y-3">
          {analysis.factors.map((factor, index) => {
            const isHighlighted = highlightedFactor === factor.id;
            return (
              <button
                key={factor.id}
                type="button"
                onMouseEnter={() => onFactorHover(factor.id)}
                onMouseLeave={() => onFactorHover(null)}
                onFocus={() => onFactorHover(factor.id)}
                onBlur={() => onFactorHover(null)}
                className={`w-full text-left border rounded-2xl p-4 transition-colors animate-fade-in-up touch-press touch-target ${
                  isHighlighted
                    ? "border-ink/50 bg-navy"
                    : "border-line bg-paper hover:border-ink/30"
                }`}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-ink">{factor.label}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded border ${
                          factor.met
                            ? "bg-signal-green/10 text-signal-green border-signal-green/30"
                            : "bg-paper text-muted border-line"
                        }`}
                      >
                        {factor.met ? "Met" : "Not met"}
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-1">{factor.detail}</p>
                  </div>
                  <span className="text-sm font-medium text-ink shrink-0 tabular-nums">
                    <AnimatedNumber
                      value={Math.round(factor.weight)}
                      suffix="%"
                      delay={200 + index * 120}
                    />
                  </span>
                </div>
                <div className="mt-2">
                  <AnimatedBar
                    value={factor.weight}
                    delay={200 + index * 120}
                    heightClass="h-1"
                    color={factor.met ? "#34d399" : "#8fa3bc"}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
