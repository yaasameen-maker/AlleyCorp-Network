"use client";

import type { TimelineEvent } from "@/lib/dates";

interface RelationshipTimelineProps {
  events: TimelineEvent[];
  activeEventId: string | null;
  onEventSelect: (id: string | null) => void;
}

export function RelationshipTimeline({
  events,
  activeEventId,
  onEventSelect,
}: RelationshipTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="border border-line rounded-2xl p-8 text-center bg-paper">
        <p className="text-sm text-muted">No relationship events yet.</p>
      </div>
    );
  }

  const chronological = [...events].reverse();

  return (
    <section className="border border-line rounded-2xl bg-mist overflow-hidden">
      <div className="px-4 py-3 border-b border-line bg-navy">
        <h3 className="text-sm font-semibold text-ink">Relationship journey</h3>
        <p className="text-xs text-muted mt-0.5">Swipe the timeline · tap a milestone</p>
      </div>

      <div className="p-4 overflow-x-auto scrollbar-hide snap-scroll-x">
        <div className="flex items-start gap-0 min-w-max pb-2">
          {chronological.map((event, index) => {
            const isActive = activeEventId === event.id;
            const isLast = index === chronological.length - 1;

            return (
              <div key={event.id} className="flex items-start snap-item">
                <button
                  type="button"
                  onClick={() => onEventSelect(isActive ? null : event.id)}
                  className={`touch-press flex flex-col items-center w-[7.5rem] sm:w-32 py-2 px-1 rounded-xl transition-colors ${
                    isActive ? "bg-navy/80" : ""
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border-2 transition-colors ${
                      isActive
                        ? "bg-ink border-ink scale-110"
                        : event.kind === "co-investment"
                          ? "bg-signal-green border-signal-green"
                          : "bg-mist border-ink/60"
                    }`}
                  />
                  <span className="text-xs font-semibold text-ink mt-2.5 text-center">{event.date}</span>
                  <span
                    className={`text-xs mt-1 text-center line-clamp-2 leading-snug px-1 ${
                      isActive ? "text-ink font-medium" : "text-muted"
                    }`}
                  >
                    {event.label}
                  </span>
                  {event.meta && (
                    <span className="text-[10px] text-muted mt-1 text-center line-clamp-1 px-1">
                      {event.meta}
                    </span>
                  )}
                </button>

                {!isLast && (
                  <div className="flex items-center pt-3 w-6 sm:w-10 shrink-0">
                    <svg viewBox="0 0 48 8" className="w-full h-2 text-line" aria-hidden>
                      <line
                        x1="0"
                        y1="4"
                        x2="48"
                        y2="4"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={index === 0 ? "timeline-draw" : ""}
                      />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
