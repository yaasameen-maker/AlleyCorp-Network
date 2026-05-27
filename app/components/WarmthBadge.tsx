'use client';

import { WarmthTier } from '../data/mockData';

interface WarmthBadgeProps {
  tier: WarmthTier;
  size?: 'sm' | 'md' | 'lg';
}

export function WarmthBadge({ tier, size = 'md' }: WarmthBadgeProps) {
  const styles = {
    Hot: 'bg-red-500/20 text-red-600 border-red-500/30',
    Warm: 'bg-orange-500/20 text-orange-600 border-orange-500/30',
    Cold: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
    Stale: 'bg-gray-500/20 text-gray-600 border-gray-500/30'
  };

  const sizeClasses = {
    sm: 'text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5',
    md: 'text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1',
    lg: 'text-sm sm:text-base px-3 sm:px-4 py-1 sm:py-1.5'
  };

  return (
    <span className={`inline-flex items-center rounded-full border font-medium whitespace-nowrap ${styles[tier]} ${sizeClasses[size]}`}>
      {tier}
    </span>
  );
}
