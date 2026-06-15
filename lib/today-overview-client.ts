/**
 * Client-safe Today Overview builder.
 * Works on Investor[] already fetched by the app — no DB or agent run required.
 */

import type { Investor, InvestorSignal } from "@/lib/investors";

export interface OverviewItem {
  id: string;
  investorId: string;
  headline: string;
  detail: string;
  timestamp: string;
  source?: string;
  sourceUrl?: string;
}

export interface OverviewSection {
  id: "new-signals" | "relationship-changes" | "deep-tech-headlines" | "media-signals";
  title: string;
  items: OverviewItem[];
  /** External feed not wired yet — show placeholder instead of duplicate/empty items. */
  pending?: boolean;
  pendingMessage?: string;
}

export interface TodayOverview {
  headline: string;
  generatedAt: string;
  sections: OverviewSection[];
}

const SECTION_DEFS: { id: OverviewSection["id"]; title: string }[] = [
  { id: "new-signals", title: "New investor signals" },
  { id: "relationship-changes", title: "Relationship changes" },
  { id: "deep-tech-headlines", title: "Deep tech headlines" },
  { id: "media-signals", title: "Event / podcast / Substack" },
];

function parseLooseDate(dateStr: string): number | null {
  const direct = Date.parse(dateStr);
  if (!Number.isNaN(direct)) return direct;
  const monthYear = Date.parse(dateStr.replace(/^(\w+)\s+(\d{4})$/, "$1 1, $2"));
  return Number.isNaN(monthYear) ? null : monthYear;
}

function isRecentDate(dateStr: string, withinDays = 365): boolean {
  const ms = parseLooseDate(dateStr);
  if (ms === null) return /\b202[5-9]\b/.test(dateStr);
  return Date.now() - ms <= withinDays * 86_400_000;
}

function isMediaSignal(signal: InvestorSignal): boolean {
  const hay =
    `${signal.sourceUrl ?? ""} ${signal.source ?? ""} ${signal.description}`.toLowerCase();
  return (
    signal.type === "event" ||
    hay.includes("substack") ||
    hay.includes("podcast") ||
    hay.includes("event") ||
    hay.includes("dtny")
  );
}

function signalSourceLabel(signal: InvestorSignal): string | undefined {
  if (signal.sourceUrl) {
    try {
      return new URL(signal.sourceUrl).hostname.replace(/^www\./, "");
    } catch {
      return signal.sourceUrl;
    }
  }
  return signal.source;
}

function itemFromSignal(investor: Investor, signal: InvestorSignal, idx: number): OverviewItem {
  const fund = investor.fund.name;
  return {
    id: `${investor.id}-sig-${idx}`,
    investorId: investor.id,
    headline: `${fund} — ${signal.description}`,
    detail: signal.portfolioCompanyName
      ? `Portfolio: ${signal.portfolioCompanyName}`
      : (investor.suggestedAction ?? ""),
    timestamp: signal.date || investor.lastSignalDate || "—",
    source: signalSourceLabel(signal),
    sourceUrl: signal.sourceUrl,
  };
}

// "Today Overview" is a recency surface — what changed lately, not the full history.
// Signals older than this window are not "new" no matter how well sourced.
const NEW_SIGNAL_WINDOW_DAYS = 180;

function collectNewSignals(investors: Investor[]): OverviewItem[] {
  const items: OverviewItem[] = [];

  for (const investor of investors) {
    if (
      investor.discoverySource &&
      investor.lastSignalDate &&
      isRecentDate(investor.lastSignalDate, NEW_SIGNAL_WINDOW_DAYS)
    ) {
      items.push({
        id: `${investor.id}-discovery`,
        investorId: investor.id,
        headline: `${investor.fund.name} — newly tracked investor`,
        detail: investor.fund.deepTechSignal ?? investor.suggestedAction ?? "Added to network map",
        timestamp: investor.lastSignalDate ?? "Recently added",
        source: investor.discoverySource,
      });
    }

    investor.signals.forEach((signal, idx) => {
      // Event/podcast/Substack signals belong to the media section — route them there,
      // not here (otherwise section precedence would swallow them into "new signals").
      if (isMediaSignal(signal)) return;
      // Only genuinely recent signals count as "new".
      if (!isRecentDate(signal.date, NEW_SIGNAL_WINDOW_DAYS)) return;
      const notable = Boolean(signal.sourceUrl || signal.sourceTitle) || signal.weight === "High";
      if (notable) {
        items.push(itemFromSignal(investor, signal, idx));
      }
    });
  }

  return dedupeItems(items);
}

function collectRelationshipChanges(investors: Investor[]): OverviewItem[] {
  const items: OverviewItem[] = [];

  for (const investor of investors) {
    if (investor.warmthTier === "Stale") {
      items.push({
        id: `${investor.id}-stale`,
        investorId: investor.id,
        headline: `${investor.fund.name} — relationship went stale`,
        detail: investor.suggestedAction ?? "Reconnect before they lead another round without us.",
        timestamp: investor.lastSignalDate ?? "No recent signal",
      });
      continue;
    }

    if (investor.warmthTier === "Warm") {
      items.push({
        id: `${investor.id}-warm`,
        investorId: investor.id,
        headline: `${investor.fund.name} — warmth cooling`,
        detail: investor.suggestedAction ?? "Schedule a touchpoint in the next 30 days.",
        timestamp: investor.lastSignalDate ?? "—",
      });
    }

    investor.signals.forEach((signal, idx) => {
      const lower = signal.description.toLowerCase();
      if (lower.includes("did not") || lower.includes("non-particip") || lower.includes("quiet")) {
        items.push(itemFromSignal(investor, signal, idx));
      }
    });
  }

  return dedupeItems(items);
}

function collectDeepTechHeadlines(_investors: Investor[]): OverviewItem[] {
  // Reserved for the external news feed (Brannon podcast, Abe Substack, deep tech
  // publications). Recent deal signals live under "New investor signals" instead.
  return [];
}

const DEEP_TECH_HEADLINES_PENDING_MESSAGE =
  "News feed pending — Brannon podcast and Abe Substack sources arriving soon.";

function collectMediaSignals(investors: Investor[]): OverviewItem[] {
  const items: OverviewItem[] = [];

  for (const investor of investors) {
    investor.signals.forEach((signal, idx) => {
      if (isMediaSignal(signal) && isRecentDate(signal.date, NEW_SIGNAL_WINDOW_DAYS)) {
        items.push(itemFromSignal(investor, signal, idx));
      }
    });
  }

  return dedupeItems(items);
}

function dedupeItems(items: OverviewItem[]): OverviewItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.investorId}:${item.headline}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Build Today Overview from investor data already loaded by the dashboard.
 * Safe for demo: no agent run or DB call required.
 */
export function buildTodayOverview(investors: Investor[]): TodayOverview {
  const collectors: Record<OverviewSection["id"], () => OverviewItem[]> = {
    "new-signals": () => collectNewSignals(investors),
    "relationship-changes": () => collectRelationshipChanges(investors),
    "deep-tech-headlines": () => collectDeepTechHeadlines(investors),
    "media-signals": () => collectMediaSignals(investors),
  };

  const usedKeys = new Set<string>();
  const sections: OverviewSection[] = SECTION_DEFS.map(({ id, title }) => {
    const items = collectors[id]().filter((item) => {
      const key = `${item.investorId}:${item.headline}`;
      if (usedKeys.has(key)) return false;
      usedKeys.add(key);
      return true;
    });

    if (id === "deep-tech-headlines") {
      return {
        id,
        title,
        items: [],
        pending: true,
        pendingMessage: DEEP_TECH_HEADLINES_PENDING_MESSAGE,
      };
    }

    return { id, title, items };
  });

  const totalItems = sections.reduce((n, s) => n + s.items.length, 0);
  const headline =
    totalItems > 0
      ? `${totalItems} update${totalItems === 1 ? "" : "s"} across your network`
      : "No new updates — relationships on track";

  return {
    headline,
    generatedAt: new Date().toISOString(),
    sections,
  };
}

export function formatTodayOverviewPlainText(overview: TodayOverview): string {
  const date = new Date(overview.generatedAt).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const lines: string[] = [`Today Overview — ${date}`, overview.headline, ""];

  for (const section of overview.sections) {
    lines.push(`${section.title} (${section.items.length})`);
    if (section.pending) {
      lines.push(`  ${section.pendingMessage ?? "Pending feed."}`);
    } else if (section.items.length === 0) {
      lines.push("  No updates in this section.");
    } else {
      for (const item of section.items) {
        lines.push(`  • ${item.headline}`);
        if (item.detail) lines.push(`    ${item.detail}`);
        lines.push(`    ${item.timestamp}${item.source ? ` · ${item.source}` : ""}`);
      }
    }
    lines.push("");
  }

  return lines.join("\n").trim();
}
