"use client";

import { Investor } from "../data/mockData";
import { WarmthBadge } from "./WarmthBadge";

interface InvestorProfileProps {
  investor: Investor;
  onClose: () => void;
}

export function InvestorProfile({ investor, onClose }: InvestorProfileProps) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      <div className="bg-slate-900 text-slate-100 rounded-t-2xl sm:rounded-2xl w-full sm:w-[min(90vw,48rem)] max-h-[95vh] sm:max-h-[90vh] overflow-y-auto overflow-x-hidden border-t sm:border border-slate-800 shadow-2xl">
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-5 sm:px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3 overflow-hidden flex-1">
            <h2 className="text-lg sm:text-xl md:text-2xl truncate font-semibold text-white">
              {investor.fund.name}
            </h2>
            <div className="shrink-0">
              <WarmthBadge tier={investor.warmthTier} size="sm" />
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 hover:text-white text-3xl leading-none shrink-0 ml-2"
          >
            ×
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          {investor.suggestedAction && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <h3 className="mb-2 text-blue-300 text-base sm:text-lg font-semibold">
                Suggested Action
              </h3>
              <p className="text-slate-100 text-sm sm:text-base leading-relaxed">
                {investor.suggestedAction}
              </p>
            </div>
          )}

          <div>
            <h3 className="mb-3 text-base sm:text-lg font-semibold text-white">Overview</h3>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <div className="text-xs sm:text-sm text-slate-400 mb-1">Total Co-investments</div>
                <div className="text-xl sm:text-2xl text-white font-semibold">
                  {investor.coInvestments.length}
                </div>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <div className="text-xs sm:text-sm text-slate-400 mb-1">Last Interaction</div>
                <div className="text-xl sm:text-2xl text-white font-semibold">
                  {investor.lastInteraction || "N/A"}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-base sm:text-lg font-semibold text-white">
              Signals ({investor.signals.length})
            </h3>
            <div className="space-y-3">
              {investor.signals.map((signal, index) => (
                <div key={index} className="border border-slate-800 rounded-xl p-4 bg-slate-950/40">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-200 text-xs rounded whitespace-nowrap">
                        {signal.type}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs rounded border whitespace-nowrap ${
                          signal.weight === "High"
                            ? "bg-red-500/15 text-red-300 border-red-500/30"
                            : signal.weight === "Medium"
                              ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                              : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                        }`}
                      >
                        {signal.weight}
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm text-slate-400">{signal.date}</span>
                  </div>
                  <p className="text-slate-100 text-sm sm:text-base leading-relaxed">
                    {signal.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-base sm:text-lg font-semibold text-white">
              Co-investment History ({investor.coInvestments.length})
            </h3>
            <div className="space-y-3">
              {investor.coInvestments.map((investment, index) => (
                <div key={index} className="border border-slate-800 rounded-xl p-4 bg-slate-950/40">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-white text-sm sm:text-base truncate font-semibold">
                        {investment.portfolioCompany.name}
                      </h4>
                      <a
                        href={`https://${investment.portfolioCompany.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs sm:text-sm text-blue-400 hover:text-blue-300 hover:underline break-all"
                      >
                        {investment.portfolioCompany.url}
                      </a>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs sm:text-sm border whitespace-nowrap shrink-0 ${
                        investment.fundParticipated
                          ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                          : "bg-red-500/15 text-red-300 border-red-500/30"
                      }`}
                    >
                      {investment.fundParticipated ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-400 flex-wrap">
                    <span>Round: {investment.round}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>{investment.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
