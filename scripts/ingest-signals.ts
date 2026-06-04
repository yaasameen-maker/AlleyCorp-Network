/**
 * Signal Ingestion Pipeline
 *
 * Searches the web for co-investment signals using Exa, parses them with Claude,
 * and writes real signal rows into Neon. Safe to re-run — deduplicates via unique_hash.
 *
 * Usage:
 *   npm run ingest:signals            # dry run (no DB writes)
 *   npm run ingest:signals -- --write # real run (writes to Neon)
 *
 * Phase 1 target: Trimble Ventures + Civ Robotics
 */

import dotenv from "dotenv";
dotenv.config({ override: true });

import Exa from "exa-js";
import Anthropic from "@anthropic-ai/sdk";
import { createHash } from "crypto";
import { pool } from "../lib/db.js";

const DRY_RUN = !process.argv.includes("--write");
const exa = new Exa(process.env.EXA_API_KEY!);
const claude = new Anthropic();

// ── Types ─────────────────────────────────────────────────────────────────────

interface SearchTarget {
  relationshipId: string;
  fundName: string;
  companyName: string;
  queries: string[];
}

interface CandidateSignal {
  relationshipId: string;
  fundName: string;
  companyName: string;
  signalType: "co_investment" | "press_mention";
  signalDate: string;       // YYYY-MM-DD
  sourceTitle: string;
  sourceUrl: string;
  rawSnippet: string;
  value: string;            // human-readable description
  confidence: "confirmed" | "inferred" | "pending";
  weight: "high" | "medium" | "low";
}

// ── Targets ───────────────────────────────────────────────────────────────────

const TARGETS: SearchTarget[] = [
  {
    relationshipId: "ba731a1f-acfd-4c2a-ad44-41b46278dbc4",
    fundName: "Trimble Ventures",
    companyName: "Civ Robotics",
    queries: [
      "Civ Robotics Trimble Ventures funding round",
      "Civ Robotics Series A investment 2023 2024 2025",
      "Civ Robotics construction robotics funding investors",
    ],
  },
];

// ── Step 1: Search ────────────────────────────────────────────────────────────

async function searchForSignals(target: SearchTarget): Promise<{ url: string; title: string; snippet: string }[]> {
  console.log(`\n🔍 Searching for: ${target.fundName} + ${target.companyName}`);
  const found: { url: string; title: string; snippet: string }[] = [];

  for (const query of target.queries) {
    console.log(`   Query: "${query}"`);
    try {
      const results = await exa.search(query, {
        type: "auto",
        numResults: 5,
        contents: { highlights: true },
        includeDomains: [
          "techcrunch.com", "prnewswire.com", "businesswire.com",
          "axios.com", "reuters.com", "bloomberg.com", "crunchbase.com",
          "forbes.com", "venturebeat.com",
        ],
      });

      for (const r of results.results) {
        const snippet = (r as unknown as { highlights?: string[] }).highlights?.join(" ") ?? "";
        if (snippet || r.title) {
          found.push({ url: r.url, title: r.title ?? "", snippet });
          console.log(`   ✓ ${r.title} — ${r.url}`);
        }
      }
    } catch (err) {
      console.error(`   ✗ Query failed: ${err}`);
    }
  }

  // Dedupe by URL
  return [...new Map(found.map((f) => [f.url, f])).values()];
}

// ── Step 2: Parse with Claude ─────────────────────────────────────────────────

async function parseSignals(
  target: SearchTarget,
  pages: { url: string; title: string; snippet: string }[]
): Promise<CandidateSignal[]> {
  if (pages.length === 0) return [];

  console.log(`\n🤖 Parsing ${pages.length} pages with Claude...`);

  const prompt = `You are extracting co-investment signals for a VC relationship intelligence platform.

Fund we are tracking: ${target.fundName}
Portfolio company: ${target.companyName}

Here are web search results. Extract ONLY real, factual signals about:
1. Funding rounds where ${target.fundName} co-invested in ${target.companyName}
2. Press mentions that confirm a relationship between them

For each signal found, return JSON with this exact shape:
{
  "signals": [
    {
      "signalType": "co_investment" | "press_mention",
      "signalDate": "YYYY-MM-DD",
      "sourceTitle": "article title",
      "sourceUrl": "https://...",
      "rawSnippet": "exact quote from the article",
      "value": "human readable description, e.g. Trimble Ventures co-led Civ Robotics $8M Seed round",
      "confidence": "confirmed" | "inferred" | "pending",
      "weight": "high" | "medium" | "low"
    }
  ]
}

Rules:
- Only include signals where BOTH ${target.fundName} AND ${target.companyName} are explicitly mentioned
- Never fabricate — if not clearly stated, skip it
- If date is only a year, use YYYY-01-01
- Return empty signals array if nothing found
- confidence "confirmed" = explicitly stated, "inferred" = strongly implied, "pending" = uncertain

Search results:
${pages.map((p, i) => `[${i + 1}] Title: ${p.title}\nURL: ${p.url}\nContent: ${p.snippet}`).join("\n\n")}`;

  const response = await claude.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  // Extract JSON from response
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    console.log("   No JSON found in Claude response");
    return [];
  }

  const parsed = JSON.parse(match[0]) as { signals: Omit<CandidateSignal, "relationshipId" | "fundName" | "companyName">[] };
  return parsed.signals.map((s) => ({
    ...s,
    relationshipId: target.relationshipId,
    fundName: target.fundName,
    companyName: target.companyName,
  }));
}

// ── Step 3: Dedupe hash ───────────────────────────────────────────────────────

function makeHash(s: CandidateSignal): string {
  const raw = `${s.fundName}|${s.companyName}|${s.signalType}|${s.sourceUrl}|${s.signalDate}`;
  return createHash("sha256").update(raw).digest("hex").slice(0, 32);
}

// ── Step 4: Write to DB ───────────────────────────────────────────────────────

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

    // rowCount = 1 if inserted, 0 if duplicate (ON CONFLICT DO NOTHING)
    return (result.rowCount ?? 0) > 0 ? "inserted" : "duplicate";
  } catch (err) {
    console.error(`   DB error: ${err}`);
    return "error";
  }
}

// ── Step 5: Update last_signal_date ──────────────────────────────────────────

async function updateRelationshipDate(relationshipId: string, latestDate: string) {
  await pool.query(
    `UPDATE relationship
     SET last_signal_date = GREATEST(last_signal_date, $1::date), updated_at = now()
     WHERE id = $2`,
    [latestDate, relationshipId]
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  console.log("=== AlleyCorp Signal Ingestion Pipeline ===");
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no DB writes)" : "LIVE (writing to Neon)"}\n`);

  let totalFound = 0;
  let totalInserted = 0;
  let totalDuplicates = 0;

  for (const target of TARGETS) {
    // Step 1: Search
    const pages = await searchForSignals(target);
    console.log(`\n   Found ${pages.length} unique pages`);

    if (pages.length === 0) {
      console.log("   Nothing found — skipping");
      continue;
    }

    // Step 2: Parse
    const candidates = await parseSignals(target, pages);
    totalFound += candidates.length;

    if (candidates.length === 0) {
      console.log("   Claude found no usable signals in the content");
      continue;
    }

    console.log(`\n📋 Candidate signals (${candidates.length}):`);
    for (const c of candidates) {
      console.log(`   [${c.signalType}] ${c.signalDate} | ${c.confidence} | ${c.value}`);
      console.log(`   Source: ${c.sourceUrl}`);
      console.log(`   Snippet: ${c.rawSnippet.slice(0, 120)}...`);
    }

    if (DRY_RUN) {
      console.log("\n⏸  Dry run — skipping DB writes. Run with --write to insert.");
      continue;
    }

    // Step 3+4: Write
    console.log("\n💾 Writing to Neon...");
    let latestDate = "";
    for (const c of candidates) {
      const result = await writeSignal(c);
      if (result === "inserted") {
        totalInserted++;
        if (!latestDate || c.signalDate > latestDate) latestDate = c.signalDate;
        console.log(`   ✓ Inserted: ${c.value}`);
      } else if (result === "duplicate") {
        totalDuplicates++;
        console.log(`   ⟳ Duplicate skipped: ${c.value}`);
      } else {
        console.log(`   ✗ Error on: ${c.value}`);
      }
    }

    // Step 5: Update relationship date
    if (latestDate) {
      await updateRelationshipDate(target.relationshipId, latestDate);
      console.log(`   📅 Updated last_signal_date → ${latestDate}`);
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Candidates found:  ${totalFound}`);
  if (!DRY_RUN) {
    console.log(`Inserted:          ${totalInserted}`);
    console.log(`Duplicates skipped: ${totalDuplicates}`);
  }
  console.log(DRY_RUN ? "\nRun with --write to insert into Neon." : "\nDone.");

  await pool.end();
}

run().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
