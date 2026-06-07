/**
 * Client-safe digest utilities.
 *
 * This file is browser-safe — it does NOT import lib/db.ts or anything
 * that pulls in `pg`. All functions work on Investor[] (already-fetched data).
 *
 * lib/digest.ts (server-side) handles DB-backed digest generation.
 * This file handles UI-side digest building for EmailDigestView.
 */

import type { Investor } from "@/app/data/mockData";

// ── Types ────────────────────────────────────────────────────────────────────

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

// ── Helpers ──────────────────────────────────────────────────────────────────

function latestSignal(investor: Investor): string {
  if (investor.signals.length === 0) return "No signals logged";
  return investor.signals[investor.signals.length - 1].description;
}

function displayDate(investor: Investor): string {
  return investor.lastSignalDate ?? "No recent signals";
}

// ── buildWeeklyDigest ────────────────────────────────────────────────────────

/**
 * Build a weekly digest from the already-fetched investor list.
 * Groups stale investors into "Reconnect now" and warm investors into
 * "Warm but cooling" sections.
 */
export function buildWeeklyDigest(investors: Investor[]): WeeklyDigest {
  const stale = investors.filter((i) => i.warmthTier === "Stale");
  const warm = investors.filter((i) => i.warmthTier === "Warm");

  const sections: DigestSection[] = [];

  if (stale.length > 0) {
    sections.push({
      id: "stale",
      title: "Reconnect now",
      items: stale.map((inv, idx) => ({
        id: `stale-${inv.id}-${idx}`,
        investorId: inv.id,
        headline: `${inv.fund.name} — relationship has gone stale`,
        timestamp: displayDate(inv),
        signalSource: latestSignal(inv),
      })),
    });
  }

  if (warm.length > 0) {
    sections.push({
      id: "warm",
      title: "Warm but cooling",
      items: warm.map((inv, idx) => ({
        id: `warm-${inv.id}-${idx}`,
        investorId: inv.id,
        headline: `${inv.fund.name} — keep the momentum going`,
        timestamp: displayDate(inv),
        signalSource: latestSignal(inv),
      })),
    });
  }

  const staleCount = stale.length;
  const subject =
    staleCount > 0
      ? `${staleCount} stale relationship${staleCount > 1 ? "s" : ""} need attention`
      : "All relationships are on track this week";

  const preheader =
    staleCount > 0
      ? `Reconnect with ${stale.map((i) => i.fund.name).slice(0, 2).join(", ")}${staleCount > 2 ? ` and ${staleCount - 2} more` : ""}`
      : "No urgent reconnects — good standing across the portfolio";

  return {
    subject,
    preheader,
    generatedAt: new Date().toISOString(),
    sections,
  };
}

// ── formatDigestAsEmail ───────────────────────────────────────────────────────

/**
 * Render a WeeklyDigest as plain text suitable for pasting into an email client.
 */
export function formatDigestAsEmail(digest: WeeklyDigest): string {
  const lines: string[] = [
    `Subject: ${digest.subject}`,
    "",
    `AlleyCorp · Weekly Relationship Digest`,
    `Generated: ${new Date(digest.generatedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
    "",
  ];

  if (digest.sections.length === 0) {
    lines.push("No digest items this week — all relationships are on track.");
    return lines.join("\n");
  }

  for (const section of digest.sections) {
    lines.push(`── ${section.title.toUpperCase()} (${section.items.length}) ──`);
    for (const item of section.items) {
      lines.push(`• ${item.headline}`);
      lines.push(`  Last signal: ${item.timestamp}`);
      lines.push(`  Source: ${item.signalSource}`);
      lines.push("");
    }
  }

  return lines.join("\n");
}
