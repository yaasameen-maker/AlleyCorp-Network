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
      className="group p-5 border border-slate-800 rounded-xl hover:border-slate-700 hover:bg-slate-900/60 transition-colors cursor-pointer bg-slate-900/40"
    >
      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="flex-1 overflow-hidden">
          <h3 className="text-base font-semibold text-white truncate">{investor.fund.name}</h3>
          <p className="text-sm text-slate-400 truncate mt-0.5">{investor.name}</p>
        </div>
        <div className="shrink-0">
          <WarmthBadge tier={investor.warmthTier} size="sm" />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-400">Co-investments:</span>
          <span className="text-slate-100 font-medium">{investor.coInvestments.length}</span>
        </div>

        {investor.lastSignalDate && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">Last signal:</span>
            <span className="text-slate-100 font-medium">{investor.lastSignalDate}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-400">Signals:</span>
          <span className="text-slate-100 font-medium">{investor.signals.length}</span>
        </div>
      </div>

      {investor.suggestedAction && (
        <div className="mt-4 pt-4 border-t border-slate-800">
          <p className="text-sm text-slate-300 line-clamp-2 leading-relaxed">
            {investor.suggestedAction}
          </p>
        </div>
      )}
    </div>
  );
}
