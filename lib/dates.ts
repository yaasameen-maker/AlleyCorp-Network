const MONTHS: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

/** Parse "Mar 2025" or "May 28 2026" style dates used in mock data. */
export function parseMonthYear(dateStr: string): Date | null {
  const dayMatch = dateStr.match(/^([A-Za-z]{3})\s+(\d{1,2})\s+(\d{4})$/);
  if (dayMatch) {
    const month = MONTHS[dayMatch[1]];
    if (month === undefined) return null;
    return new Date(Number(dayMatch[3]), month, Number(dayMatch[2]));
  }

  const match = dateStr.match(/^([A-Za-z]{3})\s+(\d{4})$/);
  if (!match) return null;
  const month = MONTHS[match[1]];
  if (month === undefined) return null;
  return new Date(Number(match[2]), month, 1);
}

export function isWithinDays(dateStr: string, days: number, from: Date = new Date()): boolean {
  const parsed = parseMonthYear(dateStr);
  if (!parsed) return false;
  const diffMs = from.getTime() - parsed.getTime();
  return diffMs >= 0 && diffMs <= days * 86_400_000;
}

export function monthsSince(dateStr: string, from: Date = new Date()): number {
  const parsed = parseMonthYear(dateStr);
  if (!parsed) return 0;
  const diffMs = from.getTime() - parsed.getTime();
  return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24 * 30.44)));
}

export function formatMonthsAgo(dateStr: string): string {
  const months = monthsSince(dateStr);
  if (months === 0) return "this month";
  if (months === 1) return "1 month ago";
  return `${months} months ago`;
}

export function formatHumanDate(dateStr: string): string {
  const months = monthsSince(dateStr);
  if (months === 0) return `${dateStr} · this month`;
  if (months === 1) return `${dateStr} · 1 month ago`;
  return `${dateStr} · ${months} months ago`;
}

export function formatDataFreshness(refreshedAt: Date): string {
  return refreshedAt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function sortByDateDesc<T extends { date: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const da = parseMonthYear(a.date)?.getTime() ?? 0;
    const db = parseMonthYear(b.date)?.getTime() ?? 0;
    return db - da;
  });
}

export interface TimelineEvent {
  id: string;
  date: string;
  label: string;
  kind: "signal" | "co-investment";
  meta?: string;
}

export function buildTimelineEvents(
  signals: { type: string; description: string; date: string; source?: string }[],
  coInvestments: { portfolioCompany: { name: string }; round: string; date: string }[]
): TimelineEvent[] {
  const signalEvents: TimelineEvent[] = signals.map((s, i) => ({
    id: `signal-${s.date}-${s.type}-${i}`,
    date: s.date,
    label: s.description,
    kind: "signal" as const,
    meta: s.source ? `${s.type} · ${s.source}` : s.type,
  }));

  const coEvents: TimelineEvent[] = coInvestments.map((c) => ({
    id: `co-${c.portfolioCompany.name}-${c.round}-${c.date}`,
    date: c.date,
    label: c.portfolioCompany.name,
    kind: "co-investment" as const,
    meta: c.round,
  }));

  return sortByDateDesc([...signalEvents, ...coEvents]);
}
