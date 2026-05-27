'use client';

import { Investor } from '../data/mockData';
import { WarmthBadge } from './WarmthBadge';

interface InvestorCardProps {
  investor: Investor;
  onClick: () => void;
}

export function InvestorCard({ investor, onClick }: InvestorCardProps) {
  return (
    <div
      onClick={onClick}
      className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer bg-white"
    >
      <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
        <div className="flex-1 overflow-hidden">
          <h3 className="mb-0.5 sm:mb-1 truncate text-sm sm:text-base font-semibold">{investor.fund.name}</h3>
          <p className="text-xs sm:text-sm text-gray-500 truncate">{investor.name}</p>
        </div>
        <div className="shrink-0">
          <WarmthBadge tier={investor.warmthTier} size="sm" />
        </div>
      </div>

      <div className="space-y-1.5 sm:space-y-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <span className="text-gray-500">Co-investments:</span>
          <span className="text-gray-900">{investor.coInvestments.length}</span>
        </div>

        {investor.lastInteraction && (
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <span className="text-gray-500">Last interaction:</span>
            <span className="text-gray-900">{investor.lastInteraction}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <span className="text-gray-500">Signals:</span>
          <span className="text-gray-900">{investor.signals.length}</span>
        </div>
      </div>

      {investor.suggestedAction && (
        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{investor.suggestedAction}</p>
        </div>
      )}
    </div>
  );
}
