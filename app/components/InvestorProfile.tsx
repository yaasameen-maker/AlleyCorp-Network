'use client';

import { Investor } from '../data/mockData';
import { WarmthBadge } from './WarmthBadge';

interface InvestorProfileProps {
  investor: Investor;
  onClose: () => void;
}

export function InvestorProfile({ investor, onClose }: InvestorProfileProps) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-lg w-full sm:w-[min(90vw,48rem)] max-h-[95vh] sm:max-h-[90vh] overflow-y-auto overflow-x-hidden border-t sm:border border-gray-200">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2 sm:gap-4 overflow-hidden flex-1">
            <h2 className="text-lg sm:text-xl md:text-2xl truncate font-semibold">{investor.fund.name}</h2>
            <div className="shrink-0">
              <WarmthBadge tier={investor.warmthTier} size="sm" />
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-3xl sm:text-2xl leading-none shrink-0 ml-2"
          >
            ×
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {investor.suggestedAction && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
              <h3 className="mb-1.5 sm:mb-2 text-blue-900 text-base sm:text-lg font-semibold">Suggested Action</h3>
              <p className="text-gray-900 text-sm sm:text-base">{investor.suggestedAction}</p>
            </div>
          )}

          <div>
            <h3 className="mb-2 sm:mb-3 text-base sm:text-lg font-semibold">Overview</h3>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-gray-500 mb-1">Total Co-investments</div>
                <div className="text-xl sm:text-2xl text-gray-900 font-semibold">
                  {investor.coInvestments.length}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-gray-500 mb-1">Last Interaction</div>
                <div className="text-xl sm:text-2xl text-gray-900 font-semibold">
                  {investor.lastInteraction || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 sm:mb-3 text-base sm:text-lg font-semibold">Signals ({investor.signals.length})</h3>
            <div className="space-y-2 sm:space-y-3">
              {investor.signals.map((signal, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-white">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <span className="px-2 py-0.5 sm:py-1 bg-gray-100 text-gray-700 text-xs rounded whitespace-nowrap">
                        {signal.type}
                      </span>
                      <span className={`px-2 py-0.5 sm:py-1 text-xs rounded whitespace-nowrap ${
                        signal.weight === 'High' ? 'bg-red-100 text-red-700' :
                        signal.weight === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {signal.weight}
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm text-gray-500">{signal.date}</span>
                  </div>
                  <p className="text-gray-900 text-sm sm:text-base">{signal.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 sm:mb-3 text-base sm:text-lg font-semibold">
              Co-investment History ({investor.coInvestments.length})
            </h3>
            <div className="space-y-2 sm:space-y-3">
              {investor.coInvestments.map((investment, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-white">
                  <div className="flex flex-col gap-2 mb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-gray-900 text-sm sm:text-base truncate font-semibold">
                          {investment.portfolioCompany.name}
                        </h4>
                        <a
                          href={`https://${investment.portfolioCompany.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs sm:text-sm text-blue-600 hover:underline break-all"
                        >
                          {investment.portfolioCompany.url}
                        </a>
                      </div>
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm whitespace-nowrap shrink-0 ${
                        investment.fundParticipated ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {investment.fundParticipated ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 flex-wrap">
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
