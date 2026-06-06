"use client";

import { Investor } from "../data/mockData";
import { WarmthBadge } from "./WarmthBadge";

interface InvestorProfileProps {
  investor: Investor;
  onClose: () => void;
}

export function InvestorProfile({ investor, onClose }: InvestorProfileProps) {
  return (
    <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      <div className="bg-paper text-ink rounded-t-2xl sm:rounded-2xl w-full sm:w-[min(90vw,48rem)] max-h-[95vh] sm:max-h-[90vh] overflow-y-auto overflow-x-hidden border-t sm:border border-line shadow-2xl">
        <div className="sticky top-0 bg-paper/95 backdrop-blur border-b border-line px-5 sm:px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3 overflow-hidden flex-1">
            <h2 className="text-lg sm:text-xl md:text-2xl truncate font-semibold text-ink">
              {investor.fund.name}
            </h2>
            <div className="shrink-0">
              <WarmthBadge tier={investor.warmthTier} size="sm" />
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-muted hover:text-ink text-3xl leading-none shrink-0 ml-2"
          >
            ×
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          {investor.suggestedAction && (
            <div className="bg-mist border border-line rounded-xl p-4">
              <h3 className="mb-2 text-ink text-base sm:text-lg font-semibold">Suggested Action</h3>
              <p className="text-ink text-sm sm:text-base leading-relaxed">
                {investor.suggestedAction}
              </p>
            </div>
          )}

          <div>
            <h3 className="mb-3 text-base sm:text-lg font-semibold text-ink">Overview</h3>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-mist border border-line rounded-xl p-4">
                <div className="text-xs sm:text-sm text-muted mb-1">Total Co-investments</div>
                <div className="text-xl sm:text-2xl text-ink font-semibold">
                  {investor.coInvestments.length}
                </div>
              </div>
              <div className="bg-mist border border-line rounded-xl p-4">
                <div className="text-xs sm:text-sm text-muted mb-1">Last Signal</div>
                <div className="text-xl sm:text-2xl text-ink font-semibold">
                  {investor.lastSignalDate || "No signals yet"}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-base sm:text-lg font-semibold text-ink">
              Signals ({investor.signals.length})
            </h3>
            <div className="space-y-3">
              {investor.signals.map((signal, index) => (
                <div key={index} className="border border-line rounded-xl p-4 bg-paper">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 bg-mist text-ink text-xs rounded whitespace-nowrap">
                        {signal.type}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs rounded border whitespace-nowrap ${
                          signal.weight === "High"
                            ? "bg-ink text-paper border-ink"
                            : signal.weight === "Medium"
                              ? "bg-signal-amber/10 text-signal-amber border-signal-amber/30"
                              : "bg-mist text-muted border-line"
                        }`}
                      >
                        {signal.weight}
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm text-muted">{signal.date}</span>
                  </div>
                  <p className="text-ink text-sm sm:text-base leading-relaxed">
                    {signal.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-base sm:text-lg font-semibold text-ink">
              Co-investment History ({investor.coInvestments.length})
            </h3>
            <div className="space-y-3">
              {investor.coInvestments.map((investment, index) => (
                <div key={index} className="border border-line rounded-xl p-4 bg-paper">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-ink text-sm sm:text-base truncate font-semibold">
                        {investment.portfolioCompany.name}
                      </h4>
                      <a
                        href={`https://${investment.portfolioCompany.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs sm:text-sm text-ink underline underline-offset-2 hover:text-muted break-all"
                      >
                        {investment.portfolioCompany.url}
                      </a>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs sm:text-sm border whitespace-nowrap shrink-0 ${
                        investment.fundParticipated
                          ? "bg-signal-green/10 text-signal-green border-signal-green/30"
                          : "bg-mist text-muted border-line"
                      }`}
                    >
                      {investment.fundParticipated ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs sm:text-sm text-muted flex-wrap">
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
