// Client-safe digest utilities — no DB imports, pure functions only.
// Server-side generateDigest() (DB-dependent) lives in lib/digest-server.ts.

import type { Investor } from "@/app/data/mockData";

export interface DigestItem {
  id: string;
  investorId: string;
  headline: string;
  timestamp: string;
  signalSource: string;
}

export interface DigestSection {
  id: string;
  title: string;
  items: DigestItem[];
}

export interface WeeklyDigest {
  subject: string;
  preheader: string;
  generatedAt: string;
  sections: DigestSection[];
}

// ── private helpers ───────────────────────────────────────────────────

function monthsSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (30 * 86_400_000));
}

function lastContactLabel(lastSignalDate?: string): string {
  if (!lastSignalDate) return "No contact on record";
  return `Last contact: ${new Date(lastSignalDate).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  })}`;
}

function headlineFor(investor: Investor): string {
  const months = investor.lastSignalDate ? monthsSince(investor.lastSignalDate) : null;
  const time =
    months === null
      ? "no contact on record"
      : months <= 1
        ? "active recently"
        : `${months} month${months === 1 ? "" : "s"} since last contact`;
  return `${investor.fund.name} · ${investor.warmthTier} · ${time}`;
}

function signalSourceLabel(investor: Investor): string {
  const latest = investor.signals[0];
  if (!latest) return investor.warmthTier === "Stale" ? "No recent signals" : "";
  return latest.source ?? latest.description;
}

function toDigestItem(investor: Investor): DigestItem {
  return {
    id: investor.id,
    investorId: investor.id,
    headline: headlineFor(investor),
    timestamp: lastContactLabel(investor.lastSignalDate),
    signalSource: signalSourceLabel(investor),
  };
}

// ── public API ────────────────────────────────────────────────────────

export function buildWeeklyDigest(investors: Investor[]): WeeklyDigest {
  const stale = investors.filter((i) => i.warmthTier === "Stale");
  const warmAtRisk = investors.filter(
    (i) => i.warmthTier === "Warm" && (!i.lastSignalDate || monthsSince(i.lastSignalDate) >= 2)
  );

  const sections: DigestSection[] = [];

  if (stale.length > 0) {
    sections.push({
      id: "stale",
      title: "Relationships Needing Attention",
      items: stale.map(toDigestItem),
    });
  }

  if (warmAtRisk.length > 0) {
    sections.push({
      id: "warm-at-risk",
      title: "Warm — Approaching Stale",
      items: warmAtRisk.map(toDigestItem),
    });
  }

  const count = sections.reduce((n, s) => n + s.items.length, 0);

  return {
    subject:
      count > 0
        ? `${count} investor relationship${count === 1 ? "" : "s"} need${count === 1 ? "s" : ""} attention`
        : "All relationships on track",
    preheader: new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }),
    generatedAt: new Date().toISOString(),
    sections,
  };
}

export function formatDigestAsEmail(digest: WeeklyDigest): string {
  const lines: string[] = [
    "AlleyCorp · Weekly Digest",
    digest.subject,
    `Generated: ${new Date(digest.generatedAt).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })}`,
    "",
  ];

  for (const section of digest.sections) {
    lines.push(`── ${section.title} (${section.items.length}) ──`);
    for (const item of section.items) {
      lines.push(`  ${item.headline}`);
      lines.push(`  ${item.timestamp}${item.signalSource ? ` · ${item.signalSource}` : ""}`);
    }
    lines.push("");
  }

  if (digest.sections.length === 0) {
    lines.push("No items this week — all relationships are on track.");
  }

  return lines.join("\n");
}
