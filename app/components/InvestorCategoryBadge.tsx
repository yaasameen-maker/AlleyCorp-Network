import type { InvestorCategoryMeta } from "@/app/lib/investorCategory";

const BADGE_STYLES: Record<
  InvestorCategoryMeta["id"],
  { bg: string; border: string; text: string; dot: string }
> = {
  active_relationship: {
    bg: "bg-[#F0FBFF]",
    border: "border-[#0EA5D6]/30",
    text: "text-[#0EA5D6]",
    dot: "bg-[#0EA5D6]",
  },
  co_investor_vip: {
    bg: "bg-[#FFFBEB]",
    border: "border-[#F59E0B]/35",
    text: "text-[#B45309]",
    dot: "bg-[#F59E0B]",
  },
  market_prospect: {
    bg: "bg-[#F9FAFB]",
    border: "border-[#E5E7EB]",
    text: "text-[#6B7280]",
    dot: "bg-[#94A3B8]",
  },
  newly_discovered: {
    bg: "bg-[#F5F3FF]",
    border: "border-[#8B5CF6]/30",
    text: "text-[#6D28D9]",
    dot: "bg-[#8B5CF6]",
  },
};

export function VipStar({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center text-[#F59E0B] ${className}`}
      title="VIP co-investor"
      aria-label="VIP co-investor"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
        <path d="M6 1.2l1.04 2.36 2.56.22-1.94 1.68.58 2.5L6 6.84 3.76 8.96l.58-2.5L2.4 3.78l2.56-.22L6 1.2z" />
      </svg>
    </span>
  );
}

export function InvestorCategoryBadge({
  category,
  compact = false,
}: {
  category: InvestorCategoryMeta;
  compact?: boolean;
}) {
  const style = BADGE_STYLES[category.id];
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border ${style.bg} ${style.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} aria-hidden />
      <span
        className={`text-[9px] font-semibold tracking-widest uppercase leading-none ${style.text}`}
      >
        {compact ? category.shortLabel : category.label}
      </span>
    </span>
  );
}
