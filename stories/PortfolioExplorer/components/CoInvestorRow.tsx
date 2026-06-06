"use client";

import { WarmthBadge } from "@/app/components/WarmthBadge";
import type { CoInvestorLink } from "@/lib/portfolio";

interface CoInvestorRowProps {
  link: CoInvestorLink;
  onSelect: () => void;
}

export function CoInvestorRow({ link, onSelect }: CoInvestorRowProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="touch-press w-full text-left border border-line rounded-2xl p-4 bg-paper flex items-center gap-3"
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium text-ink truncate">{link.fundName}</p>
        <p className="text-xs text-muted mt-0.5">
          {link.round} · {link.date}
          {link.lastSignalLabel ? ` · Last signal ${link.lastSignalLabel}` : ""}
        </p>
        <p className="text-xs text-muted mt-1">{link.relationshipStatus}</p>
      </div>
      <WarmthBadge tier={link.warmthTier} size="sm" />
    </button>
  );
}
