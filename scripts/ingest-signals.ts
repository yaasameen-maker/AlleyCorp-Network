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

  // ── STALE (highest priority — demo day critical) ──────────────────────────

  {
    relationshipId: "34ddba26-d2d6-432b-82c0-85e6a2fc15ec",
    fundName: "SineWave Ventures",
    companyName: "Aon 3D",
    queries: [
      "Aon 3D SineWave Ventures investment funding",
      "Aon 3D metal 3D printing startup funding investors 2021",
      "Aon 3D aerospace manufacturing startup investment",
    ],
  },
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
  {
    relationshipId: "6f9767da-d39d-47bd-bdb1-17a5b418a8b2",
    fundName: "BOLD Capital Partners",
    companyName: "Earth Force",
    queries: [
      "Earth Force BOLD Capital Partners investment",
      "Earth Force climate startup funding round investors",
      "Earth Force environmental technology venture capital",
    ],
  },

  // ── HOT with missing last_signal_date (need evidence) ────────────────────

  {
    relationshipId: "ad3c1e30-6fd1-4526-98df-a0fedcef8d7b",
    fundName: "Riot Ventures",
    companyName: "Valar Atomics",
    queries: [
      "Valar Atomics Riot Ventures funding investment",
      "Valar Atomics nuclear energy startup seed round investors 2024 2025",
      "Valar Atomics funding announcement investors",
    ],
  },
  {
    relationshipId: "cacec229-4320-4e23-a3cc-c25e992d8050",
    fundName: "Snowpoint Ventures",
    companyName: "Valar Atomics",
    queries: [
      "Valar Atomics Snowpoint Ventures investment",
      "Valar Atomics nuclear startup investors 2024 2025",
      "Valar Atomics seed funding round announcement",
    ],
  },
  {
    relationshipId: "3322eaea-b060-43ec-956d-23c093e616a7",
    fundName: "Mach33",
    companyName: "Portal Space Systems",
    queries: [
      "Portal Space Systems Mach33 investment funding",
      "Portal Space Systems space propulsion startup investors 2025 2026",
      "Portal Space Systems funding round announcement",
    ],
  },

  // ── HOT with recent signals (validate) ───────────────────────────────────

  {
    relationshipId: "6c6f5824-7a0f-4eee-8e3b-eafa63ecac06",
    fundName: "General Catalyst",
    companyName: "Eyebot",
    queries: [
      "Eyebot General Catalyst investment funding",
      "Eyebot eye surgery robotics startup funding 2025",
      "Eyebot ophthalmic robotics investors Series A",
    ],
  },
  {
    relationshipId: "78f6face-5fb0-44d0-bd22-7187412c3642",
    fundName: "Ubiquity Ventures",
    companyName: "Eyebot",
    queries: [
      "Eyebot Ubiquity Ventures funding",
      "Eyebot robotic eye surgery startup investors 2025",
      "Eyebot funding round announcement investors",
    ],
  },
  {
    relationshipId: "97281765-a82c-43f6-8103-2b67505f049e",
    fundName: "SOSV",
    companyName: "Renovate Robotics",
    queries: [
      "Renovate Robotics SOSV HAX investment",
      "Renovate Robotics roofing robot startup funding investors",
      "Renovate Robotics funding round 2024 2025",
    ],
  },
  {
    relationshipId: "fce3f571-76af-49cd-b600-c06b430f38af",
    fundName: "Geodesic Capital",
    companyName: "Portal Space Systems",
    queries: [
      "Portal Space Systems Geodesic Capital investment",
      "Portal Space Systems Series A funding 2026 investors",
      "Portal Space Systems propulsion startup funding announcement",
    ],
  },
  {
    relationshipId: "34e1ca8d-e2fc-4e3b-83b5-0183e07fe404",
    fundName: "Day One Ventures",
    companyName: "Valar Atomics",
    queries: [
      "Valar Atomics Day One Ventures investment funding",
      "Valar Atomics nuclear fission startup investors 2025",
      "Valar Atomics venture funding round deep tech",
    ],
  },
  {
    relationshipId: "24e92376-97c1-4c31-8178-4cbb22a14be7",
    fundName: "Amazon Climate Pledge Fund",
    companyName: "Glacier",
    queries: [
      "Glacier Amazon Climate Pledge Fund investment",
      "Glacier recycling robotics AI startup funding investors 2025",
      "Glacier waste sorting robot startup funding round",
    ],
  },
  {
    relationshipId: "1f669b0e-ce02-42a3-a59b-cee0be204d1e",
    fundName: "NEA",
    companyName: "Glacier",
    queries: [
      "Glacier NEA venture capital investment funding",
      "Glacier recycling AI startup Series A investors 2025",
      "Glacier climate tech startup funding announcement",
    ],
  },

  // ── WARM ─────────────────────────────────────────────────────────────────

  {
    relationshipId: "cdfc0f52-9ef7-4b31-8b02-fc0b93b2d888",
    fundName: "Flybridge",
    companyName: "Halo Braid",
    queries: [
      "Halo Braid Flybridge investment funding",
      "Halo Braid hair braiding robotics startup investors 2024",
      "Halo Braid automated hair braiding funding round",
    ],
  },
  {
    relationshipId: "557e9b32-0b44-447d-a213-b6848870aa35",
    fundName: "Cherubic Ventures",
    companyName: "Cargo Robotics",
    queries: [
      "Cargo Robotics Cherubic Ventures investment funding",
      "Cargo Robotics logistics startup funding investors 2024",
      "Cargo Robotics autonomous cargo handling investment",
    ],
  },

  // ── COLD (potential targets — look for any signals) ───────────────────────

  {
    relationshipId: "d0bf6b1f-2218-4e95-9d2f-1e50ec870f41",
    fundName: "a16z American Dynamism",
    companyName: "Cargo Robotics",
    queries: [
      "Cargo Robotics a16z American Dynamism investment",
      "Cargo Robotics logistics robotics startup Series A 2024 2025",
      "Cargo Robotics funding round announcement investors",
    ],
  },
  {
    relationshipId: "65e92c3a-c8e1-43be-889a-9712855ec776",
    fundName: "Eclipse Ventures",
    companyName: "Civ Robotics",
    queries: [
      "Civ Robotics Eclipse Ventures investment co-investment",
      "Civ Robotics construction surveying robot funding 2023 2024",
      "Civ Robotics investors funding deep tech",
    ],
  },
  {
    relationshipId: "0e9adc58-c4b9-4e11-9ac3-ba9e63fcbfda",
    fundName: "Founders Fund",
    companyName: "Valar Atomics",
    queries: [
      "Valar Atomics Founders Fund investment nuclear",
      "Valar Atomics nuclear energy investors 2024 2025 deep tech",
      "Valar Atomics advanced nuclear startup funding",
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

  // Extract JSON — try code block first, then bare object
  const codeBlock = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  const bareObject = text.match(/\{[\s\S]*\}/);
  const raw = codeBlock?.[1] ?? bareObject?.[0];

  if (!raw) {
    console.log("   No JSON found in Claude response");
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as { signals: Omit<CandidateSignal, "relationshipId" | "fundName" | "companyName">[] };
    return (parsed.signals ?? []).map((s) => ({
      ...s,
      relationshipId: target.relationshipId,
      fundName: target.fundName,
      companyName: target.companyName,
    }));
  } catch (parseErr) {
    console.error(`   JSON parse error: ${parseErr}`);
    return [];
  }
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
    try {
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
    } catch (err) {
      console.error(`   ✗ Target failed (${target.fundName} + ${target.companyName}): ${err}`);
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
