import type { WarmthTier } from "@/app/data/mockData";
import { WarmthBadge } from "@/app/components/WarmthBadge";

interface ProfileHeaderProps {
  fundName: string;
  warmthTier: WarmthTier;
  onClose: () => void;
  layout?: "modal" | "panel";
}

export function ProfileHeader({
  fundName,
  warmthTier,
  onClose,
  layout = "modal",
}: ProfileHeaderProps) {
  return (
    <header className="shrink-0 bg-mist/95 backdrop-blur border-b border-line px-4 sm:px-5 pb-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClose}
          aria-label={layout === "panel" ? "Close profile" : "Go back"}
          className="touch-target touch-press -ml-2 flex items-center justify-center rounded-full text-ink"
        >
          {layout === "panel" ? (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-wider text-muted font-semibold">Investor</p>
          <h2 id="profile-title" className="text-base sm:text-lg font-semibold text-ink truncate">
            {fundName}
          </h2>
        </div>

        <WarmthBadge tier={warmthTier} size="sm" />
      </div>
    </header>
  );
}
