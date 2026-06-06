"use client";

interface SectorFilterProps {
  sectors: string[];
  selected: string;
  onSelect: (sector: string) => void;
}

export function SectorFilter({ sectors, selected, onSelect }: SectorFilterProps) {
  const options = ["All", ...sectors];

  return (
    <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide snap-scroll-x">
      <div className="flex gap-2 min-w-max pb-1">
        {options.map((sector) => (
          <button
            key={sector}
            type="button"
            onClick={() => onSelect(sector)}
            className={`touch-press snap-item px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap ${
              selected === sector
                ? "bg-ink text-paper"
                : "bg-paper text-muted border border-line"
            }`}
          >
            {sector}
          </button>
        ))}
      </div>
    </div>
  );
}
