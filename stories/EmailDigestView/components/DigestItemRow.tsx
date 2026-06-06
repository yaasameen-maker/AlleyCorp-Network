import type { DigestItem } from "@/lib/digest";

interface DigestItemRowProps {
  item: DigestItem;
  onSelect: () => void;
}

export function DigestItemRow({ item, onSelect }: DigestItemRowProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="touch-press w-full text-left border-b border-line last:border-b-0 px-4 py-3 hover:bg-paper/40 transition-colors"
    >
      <p className="text-sm text-ink leading-snug">{item.headline}</p>
      <p className="text-xs text-muted mt-1">
        {item.timestamp} · {item.signalSource}
      </p>
    </button>
  );
}
