"use client";

import { Investor } from "../data/mockData";
import { WarmthBadge } from "./WarmthBadge";

interface InvestorCardProps {
  investor: Investor;
  onClick: () => void;
}

export function InvestorCard({ investor, onClick }: InvestorCardProps) {
  return (
    <div
      onClick={onClick}
      className="group p-5 border border-line rounded-xl hover:border-ink transition-colors cursor-pointer bg-paper"
    >
      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="flex-1 overflow-hidden">
          <h3 className="text-base font-semibold text-ink truncate">{investor.fund.name}</h3>
          <p className="text-sm text-muted truncate mt-0.5">{investor.name}</p>
        </div>
        <div className="shrink-0">
          <WarmthBadge tier={investor.warmthTier} size="sm" />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted">Co-investments:</span>
          <span className="text-ink font-medium">{investor.coInvestments.length}</span>
        </div>

        {investor.lastSignalDate && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted">Last signal:</span>
            <span className="text-ink font-medium">{investor.lastSignalDate}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted">Signals:</span>
          <span className="text-ink font-medium">{investor.signals.length}</span>
        </div>
      </div>

      {investor.suggestedAction && (
        <div className="mt-4 pt-4 border-t border-line">
          <p className="text-sm text-muted line-clamp-2 leading-relaxed">
            {investor.suggestedAction}
          </p>
        </div>
      )}
    </div>
  );
}
