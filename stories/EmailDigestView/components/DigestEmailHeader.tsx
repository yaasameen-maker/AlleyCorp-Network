import type { WeeklyDigest } from "@/lib/digest";
import { formatDataFreshness } from "@/lib/dates";

interface DigestEmailHeaderProps {
  digest: WeeklyDigest;
}

export function DigestEmailHeader({ digest }: DigestEmailHeaderProps) {
  return (
    <header className="shrink-0 border-b border-line bg-paper px-4 py-4">
      <p className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-1">
        AlleyCorp · Weekly digest
      </p>
      <h2 id="digest-title" className="text-base font-semibold text-ink leading-snug">
        {digest.subject}
      </h2>
      <p className="text-xs text-muted mt-2">{digest.preheader}</p>
      <p className="text-[11px] text-muted mt-1">
        Generated {formatDataFreshness(digest.generatedAt)} · Read-only preview
      </p>
    </header>
  );
}
