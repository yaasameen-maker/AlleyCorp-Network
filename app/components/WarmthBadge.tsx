import { WarmthTier } from "../data/mockData";

interface WarmthBadgeProps {
  tier: WarmthTier;
  size?: "sm" | "md" | "lg";
}

export function WarmthBadge({ tier, size = "md" }: WarmthBadgeProps) {
  const styles: Record<WarmthTier, string> = {
    Hot: "bg-red-500/15 text-red-300 border-red-500/30",
    Warm: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    Cold: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    Stale: "bg-slate-700/40 text-slate-300 border-slate-600/60",
  };

  const sizeClasses = {
    sm: "text-xs px-2.5 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium whitespace-nowrap ${styles[tier]} ${sizeClasses[size]}`}
    >
      {tier}
    </span>
  );
}
