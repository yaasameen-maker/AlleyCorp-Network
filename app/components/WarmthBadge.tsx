import { WarmthTier } from "../data/mockData";

interface WarmthBadgeProps {
  tier: WarmthTier;
  size?: "sm" | "md" | "lg";
}

export function WarmthBadge({ tier, size = "md" }: WarmthBadgeProps) {
  // Hot/Warm use the brand signal colors. Cold/Stale aren't defined by the
  // brand guide — filled here within the neutral palette (see globals.css).
  const styles: Record<WarmthTier, string> = {
    Hot: "bg-signal-green/10 text-signal-green border-signal-green/30",
    Warm: "bg-signal-amber/10 text-signal-amber border-signal-amber/30",
    Cold: "bg-mist text-muted border-line",
    Stale: "bg-navy/5 text-navy border-navy/25",
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
