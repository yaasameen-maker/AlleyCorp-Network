/**
 * Orchestrator — builds a prioritized signal search target list from live DB state.
 *
 * Replaces the hardcoded TARGETS array in ingest-signals.ts with a dynamic list
 * derived from which relationships most urgently need new signals.
 *
 * Priority order:
 *   1. Stale relationships — oldest last_signal_date first (most lapsed = highest priority)
 *   2. Cold relationships  — NULL last_signal_date first, then oldest (no signal history)
 *   3. Warm approaching stale — last_signal_date older than 9 months (before they degrade)
 *   Hot relationships are excluded — they have recent signals and don't need proactive searches.
 *
 * Usage:
 *   npm run orchestrate              # dry run — prints prioritized target list, no writes
 *   npm run orchestrate -- --write   # live run — executes ingest pipeline against targets
 */

import dotenv from "dotenv";
dotenv.config({ override: true });

import Exa from "exa-js";
import Anthropic from "@anthropic-ai/sdk";
import { pool } from "../lib/db.js";
import {
  canPublishRelationshipSignal,
  isCandidateOnlySource,
  sourceNameFromUrl,
} from "../lib/source-policy.js";

const DRY_RUN = !process.argv.includes("--write");

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrchestratorTarget {
  relationshipId: string;
  fundName: string;
  companyName: string;
  warmthTier: string;
  lastSignalDate: string | null;
  monthsSinceSignal: number | null;
  priority: number; // lower = higher priority
  queries: string[];
}

// Matches SearchTarget in ingest-signals.ts — kept in sync deliberately.
export interface SearchTarget {
  fundName: string;
  companyName: string;
  queries: string[];
}

// ── Priority scoring ──────────────────────────────────────────────────────────

const TIER_PRIORITY: Record<string, number> = {
  stale: 1,
  cold: 2,
  warm: 3,
};

// Warm relationships with signal older than 9 months are approaching stale.
const WARM_APPROACHING_STALE_MONTHS = 9;

// ── Query generation ──────────────────────────────────────────────────────────
// Generates three complementary search queries per target.
// Less precise than hand-crafted queries but works for all fund+company pairs.

function buildQueries(fundName: string, companyName: string): string[] {
  return [
    `"${fundName}" "${companyName}" investment funding`,
    `"${companyName}" funding round investors venture capital`,
    `"${fundName}" portfolio "${companyName}"`,
  ];
}

// ── DB query ──────────────────────────────────────────────────────────────────

async function loadTargetsFromDb(): Promise<OrchestratorTarget[]> {
  const nineMonthsAgo = new Date();
  nineMonthsAgo.setMonth(nineMonthsAgo.getMonth() - 9);

  const { rows } = await pool.query<{
    id: string;
    fund_name: string;
    company_name: string;
    warmth_tier: string;
    last_signal_date: string | null;
  }>(
    `SELECT
       r.id,
       f.name  AS fund_name,
       pc.name AS company_name,
       r.warmth_tier,
       r.last_signal_date::text
     FROM relationship r
     JOIN fund f  ON f.id  = r.fund_id
     JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
     WHERE r.warmth_tier IN ('stale', 'cold', 'warm')
     ORDER BY
       CASE r.warmth_tier
         WHEN 'stale' THEN 1
         WHEN 'cold'  THEN 2
         WHEN 'warm'  THEN 3
       END,
       r.last_signal_date ASC NULLS FIRST`
  );

  const today = new Date();

  return rows
    .map((row) => {
      const lastDate = row.last_signal_date ? new Date(row.last_signal_date) : null;
      const monthsSinceSignal = lastDate
        ? Math.round((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24 * 30.5))
        : null;

      // Exclude warm relationships that still have recent signals (< 9 months ago)
      if (
        row.warmth_tier === "warm" &&
        monthsSinceSignal !== null &&
        monthsSinceSignal < WARM_APPROACHING_STALE_MONTHS
      ) {
        return null;
      }

      return {
        relationshipId: row.id,
        fundName: row.fund_name,
        companyName: row.company_name,
        warmthTier: row.warmth_tier,
        lastSignalDate: row.last_signal_date,
        monthsSinceSignal,
        priority: TIER_PRIORITY[row.warmth_tier] ?? 99,
        queries: buildQueries(row.fund_name, row.company_name),
      };
    })
    .filter((t): t is OrchestratorTarget => t !== null);
}

// ── Dry-run plan printer ───────────────────────────────────────────────────────

function printPlan(targets: OrchestratorTarget[]): void {
  const stale = targets.filter((t) => t.warmthTier === "stale");
  const cold = targets.filter((t) => t.warmthTier === "cold");
  const warmAtRisk = targets.filter((t) => t.warmthTier === "warm");

  console.log(`\n${"═".repeat(60)}`);
  console.log(`ORCHESTRATOR PLAN — ${targets.length} targets`);
  console.log("═".repeat(60));

  if (stale.length > 0) {
    console.log(`\n── STALE (${stale.length}) — reconnect urgently`);
    for (const t of stale) {
      const age =
        t.monthsSinceSignal !== null
          ? `${t.monthsSinceSignal}mo since last signal`
          : "no signals on record";
      console.log(`   ${t.fundName} + ${t.companyName} [${age}]`);
    }
  }

  if (cold.length > 0) {
    console.log(`\n── COLD (${cold.length}) — build initial signal`);
    for (const t of cold) {
      const age =
        t.monthsSinceSignal !== null
          ? `${t.monthsSinceSignal}mo since last signal`
          : "no signals on record";
      console.log(`   ${t.fundName} + ${t.companyName} [${age}]`);
    }
  }

  if (warmAtRisk.length > 0) {
    console.log(`\n── WARM APPROACHING STALE (${warmAtRisk.length}) — monitor before degrading`);
    for (const t of warmAtRisk) {
      console.log(
        `   ${t.fundName} + ${t.companyName} [${t.monthsSinceSignal}mo since last signal]`
      );
    }
  }

  console.log(`\n── Queries per target: 3 (auto-generated)`);
  console.log(`── Run with --write to execute ingest pipeline against this list.\n`);
}

// ── Ingest pipeline (inline — mirrors ingest-signals.ts core logic) ────────────
// Kept inline here so the orchestrator is self-contained. When ingest-signals.ts
// is refactored to export its pipeline, replace this with an import.

import { createHash } from "crypto";

const HIGH_CONFIDENCE_DOMAINS = [
  "techcrunch.com",
  "bloomberg.com",
  "prnewswire.com",
  "businesswire.com",
  "axios.com",
  "reuters.com",
  "venturebeat.com",
];
const MEDIUM_CONFIDENCE_DOMAINS = ["forbes.com", "wsj.com", "ft.com", "cnbc.com"];

function confidenceFromUrl(url: string): "confirmed" | "inferred" | "pending" {
  if (HIGH_CONFIDENCE_DOMAINS.some((d) => url.includes(d))) return "confirmed";
  if (MEDIUM_CONFIDENCE_DOMAINS.some((d) => url.includes(d))) return "inferred";
  return "pending";
}

const EXTRACT_TOOL: Anthropic.Tool = {
  name: "extract_signals",
  description:
    "Extract co-investment signals found in the search results. Only include signals explicitly mentioning both the fund and the company.",
  input_schema: {
    type: "object" as const,
    properties: {
      signals: {
        type: "array",
        items: {
          type: "object",
          properties: {
            signalType: {
              type: "string",
              enum: ["co_investment", "press_mention"],
            },
            signalDate: { type: "string" },
            sourceTitle: { type: "string" },
            sourceUrl: { type: "string" },
            rawSnippet: { type: "string" },
            value: { type: "string" },
            weight: { type: "string", enum: ["high", "medium", "low"] },
          },
          required: ["signalType", "signalDate", "sourceTitle", "sourceUrl", "rawSnippet", "value", "weight"],
        },
      },
    },
    required: ["signals"],
  },
};

interface CandidateSignal {
  relationshipId: string;
  fundName: string;
  companyName: string;
  signalType: "co_investment" | "press_mention";
  signalDate: string;
  sourceTitle: string;
  sourceUrl: string;
  rawSnippet: string;
  value: string;
  confidence: "confirmed" | "inferred" | "pending";
  weight: "high" | "medium" | "low";
}

function makeHash(s: CandidateSignal): string {
  const raw = `${s.fundName}|${s.companyName}|${s.signalType}|${s.sourceUrl}|${s.signalDate}`;
  return createHash("sha256").update(raw).digest("hex").slice(0, 32);
}

async function searchForSignals(
  target: OrchestratorTarget,
  exa: Exa
): Promise<{ url: string; title: string; snippet: string }[]> {
  const found = new Map<string, { url: string; title: string; snippet: string }>();

  for (const query of target.queries) {
    try {
      const results = await exa.search(query, {
        type: "auto",
        numResults: 5,
        contents: { highlights: true },
        includeDomains: [...HIGH_CONFIDENCE_DOMAINS, "crunchbase.com", "forbes.com"],
      });
      for (const r of results.results) {
        const snippet = (r as unknown as { highlights?: string[] }).highlights?.join(" ") ?? "";
        if ((snippet || r.title) && !found.has(r.url)) {
          found.set(r.url, { url: r.url, title: r.title ?? "", snippet });
        }
      }
    } catch (err) {
      console.error(`   ✗ Query failed: ${err}`);
    }
  }

  return [...found.values()];
}

async function parseSignals(
  target: OrchestratorTarget,
  pages: { url: string; title: string; snippet: string }[],
  claude: Anthropic
): Promise<CandidateSignal[]> {
  if (pages.length === 0) return [];

  const prompt = `Extract co-investment signals from these search results.

Fund: ${target.fundName}
Portfolio company: ${target.companyName}

Rules:
- Only extract signals where BOTH "${target.fundName}" AND "${target.companyName}" are explicitly mentioned
- Never fabricate — skip anything not clearly stated
- If date is only a year, use YYYY-01-01
- Call extract_signals with an empty signals array if nothing found

Search results:
${pages.map((p, i) => `[${i + 1}] ${p.title}\n${p.url}\n${p.snippet}`).join("\n\n")}`;

  try {
    const response = await claude.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      tools: [EXTRACT_TOOL],
      tool_choice: { type: "tool", name: "extract_signals" },
      messages: [{ role: "user", content: prompt }],
    });

    const toolUse = response.content.find((b) => b.type === "tool_use") as
      | Anthropic.ToolUseBlock
      | undefined;
    if (!toolUse) return [];

    const input = toolUse.input as {
      signals: Omit<CandidateSignal, "relationshipId" | "fundName" | "companyName" | "confidence">[];
    };

    return (input.signals ?? []).map((s) => ({
      ...s,
      relationshipId: target.relationshipId,
      fundName: target.fundName,
      companyName: target.companyName,
      confidence: confidenceFromUrl(s.sourceUrl),
    }));
  } catch (err) {
    console.error(`   Extraction error: ${err}`);
    return [];
  }
}

async function writeSignal(s: CandidateSignal): Promise<"inserted" | "duplicate" | "error"> {
  const hash = makeHash(s);
  try {
    const result = await pool.query(
      `INSERT INTO signal
         (id, relationship_id, signal_type, signal_date, source, value, weight, confidence,
          source_url, source_title, raw_snippet, unique_hash)
       VALUES
         (gen_random_uuid(), $1, $2, $3::date, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (unique_hash) DO NOTHING`,
      [
        s.relationshipId,
        s.signalType,
        s.signalDate,
        s.sourceUrl,
        s.value,
        s.weight,
        s.confidence,
        s.sourceUrl,
        s.sourceTitle,
        s.rawSnippet,
        hash,
      ]
    );
    return (result.rowCount ?? 0) > 0 ? "inserted" : "duplicate";
  } catch (err) {
    console.error(`   DB error: ${err}`);
    return "error";
  }
}

async function updateRelationshipDate(relationshipId: string, latestDate: string): Promise<void> {
  await pool.query(
    `UPDATE relationship
     SET last_signal_date = GREATEST(last_signal_date, $1::date), updated_at = now()
     WHERE id = $2`,
    [latestDate, relationshipId]
  );
}

async function runIngestForTargets(targets: OrchestratorTarget[]): Promise<void> {
  const exa = new Exa(process.env.EXA_API_KEY!);
  const claude = new Anthropic();

  let totalFound = 0;
  let totalInserted = 0;
  let totalDuplicates = 0;
  let totalSkipped = 0;

  for (const target of targets) {
    console.log(`\n🔍 ${target.fundName} + ${target.companyName} [${target.warmthTier}]`);

    try {
      const pages = await searchForSignals(target, exa);
      if (pages.length === 0) {
        console.log(`   Nothing found — skipping`);
        continue;
      }

      const candidates = await parseSignals(target, pages, claude);

      // Source-policy gate
      const gated = candidates.filter((c) => {
        if (!c.fundName || !c.companyName) {
          totalSkipped++;
          return false;
        }
        if (isCandidateOnlySource(c.sourceUrl)) {
          console.log(`  ⊘ SKIP (candidate-only) ${sourceNameFromUrl(c.sourceUrl)}`);
          totalSkipped++;
          return false;
        }
        if (!canPublishRelationshipSignal(c.sourceUrl)) {
          console.log(`  ⊘ SKIP (not publish-credible) ${sourceNameFromUrl(c.sourceUrl)}`);
          totalSkipped++;
          return false;
        }
        return true;
      });

      totalFound += gated.length;
      if (gated.length === 0) continue;

      console.log(`   ${gated.length} candidate signal(s) after gate`);
      for (const c of gated) {
        console.log(`   [${c.signalType}] ${c.signalDate} | ${c.confidence} | ${c.value}`);
      }

      let latestDate = "";
      for (const c of gated) {
        const result = await writeSignal(c);
        if (result === "inserted") {
          totalInserted++;
          if (!latestDate || c.signalDate > latestDate) latestDate = c.signalDate;
          console.log(`   ✓ Inserted: ${c.value}`);
        } else if (result === "duplicate") {
          totalDuplicates++;
          console.log(`   ⟳ Duplicate: ${c.value}`);
        } else {
          console.log(`   ✗ Error writing signal`);
        }
      }

      if (latestDate) {
        await updateRelationshipDate(target.relationshipId, latestDate);
        console.log(`   📅 Updated last_signal_date → ${latestDate}`);
      }
    } catch (err) {
      console.error(`   ✗ Target failed (${target.fundName} + ${target.companyName}): ${err}`);
    }
  }

  console.log(`\n${"═".repeat(60)}`);
  console.log(`SUMMARY`);
  console.log("═".repeat(60));
  console.log(`Targets processed:  ${targets.length}`);
  console.log(`Signals found:      ${totalFound}`);
  console.log(`Inserted:           ${totalInserted}`);
  console.log(`Duplicates skipped: ${totalDuplicates}`);
  console.log(`Gate-filtered:      ${totalSkipped}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run(): Promise<void> {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║   AlleyCorp Signal Orchestrator                          ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log(`Mode: ${DRY_RUN ? "DRY RUN — prints plan, no DB writes" : "LIVE — executing ingest pipeline"}`);
  console.log(`Date: ${new Date().toISOString().slice(0, 10)}\n`);

  const targets = await loadTargetsFromDb();

  if (targets.length === 0) {
    console.log("No targets found — all relationships have recent signals or DB is empty.");
    await pool.end();
    return;
  }

  printPlan(targets);

  if (!DRY_RUN) {
    console.log("═".repeat(60));
    console.log(`Starting ingest for ${targets.length} targets...`);
    console.log("═".repeat(60));
    await runIngestForTargets(targets);
  }

  await pool.end();
}

run().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
