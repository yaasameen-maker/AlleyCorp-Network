import { WarmthTier } from "../data/mockData";

interface WarmthBadgeProps {
  tier: WarmthTier;
  size?: "sm" | "md" | "lg";
}

export function WarmthBadge({ tier, size = "md" }: WarmthBadgeProps) {
  const styles: Record<WarmthTier, string> = {
    Hot: "bg-signal-green/15 text-signal-green border-signal-green/40",
    Warm: "bg-signal-amber/15 text-signal-amber border-signal-amber/40",
    Cold: "bg-paper text-muted border-line",
    Stale: "bg-navy/60 text-ink/80 border-line",
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
