import type { DigestSection as DigestSectionType } from "@/lib/digest";
import { DigestItemRow } from "./DigestItemRow";

interface DigestSectionProps {
  section: DigestSectionType;
  onSelectItem: (investorId: string) => void;
}

export function DigestSection({ section, onSelectItem }: DigestSectionProps) {
  return (
    <section className="border border-line rounded-2xl overflow-hidden bg-paper">
      <div className="px-4 py-2.5 bg-navy border-b border-line">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink">
          {section.title}
          <span className="text-muted font-normal normal-case ml-2">({section.items.length})</span>
        </h3>
      </div>
      <div>
        {section.items.map((item) => (
          <DigestItemRow
            key={item.id}
            item={item}
            onSelect={() => onSelectItem(item.investorId)}
          />
        ))}
      </div>
    </section>
  );
}
