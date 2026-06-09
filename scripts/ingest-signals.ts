/**
 * Signal Ingestion Pipeline
 *
 * Searches the web for co-investment signals using Exa, parses them with Claude
 * tool_use (schema-enforced — no JSON.parse), derives confidence from source URL,
 * and writes real signal rows into Neon. Safe to re-run — deduplicates via unique_hash.
 *
 * Usage:
 *   npm run ingest:signals            # dry run (no DB writes)
 *   npm run ingest:signals -- --write # real run (writes to Neon)
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
  fundName: string;
  companyName: string;
  queries: string[];
}

// Resolved at runtime from the live DB — works on any DB (Neon, Railway, local)
interface ResolvedTarget extends SearchTarget {
  relationshipId: string;
}

// ── Resolve relationship IDs from live DB ─────────────────────────────────────

async function resolveRelationshipIds(targets: SearchTarget[]): Promise<ResolvedTarget[]> {
  const { rows } = await pool.query<{ id: string; fund: string; company: string }>(
    `SELECT r.id, f.name AS fund, pc.name AS company
     FROM relationship r
     JOIN fund f ON f.id = r.fund_id
     JOIN portfolio_company pc ON pc.id = r.portfolio_company_id`
  );

  const lookup = new Map(rows.map((r) => [`${r.fund}|${r.company}`, r.id]));
  const resolved: ResolvedTarget[] = [];

  for (const t of targets) {
    const id = lookup.get(`${t.fundName}|${t.companyName}`);
    if (!id) {
      console.warn(`⚠️  No relationship found for: ${t.fundName} + ${t.companyName} — skipping`);
      continue;
    }
    resolved.push({ ...t, relationshipId: id });
  }

  console.log(`✓ Resolved ${resolved.length}/${targets.length} relationship IDs from DB\n`);
  return resolved;
}

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

// ── Targets ───────────────────────────────────────────────────────────────────
// Queries use exact quoted company names to prevent false positives.

const TARGETS: SearchTarget[] = [
  // ── STALE ────────────────────────────────────────────────────────────────

  {
    fundName: "SineWave Ventures",
    companyName: "Aon 3D",
    queries: [
      '"AON3D" "SineWave Ventures" investment 2021',
      '"AON3D" Series A investors list 2021',
      '"AON3D" "$11.5M" funding round investors Astrobotic',
    ],
  },
  {
    fundName: "Trimble Ventures",
    companyName: "Civ Robotics",
    queries: [
      '"Civ Robotics" "Trimble Ventures" funding',
      '"Civ Robotics" seed round investors 2022',
      '"Civ Robotics" construction surveying robot funding announcement',
    ],
  },
  {
    fundName: "BOLD Capital Partners",
    companyName: "Earth Force",
    queries: [
      '"Earth Force" "BOLD Capital Partners" investment',
      '"Earth Force Technologies" funding investors 2022',
      '"Earth Force" seed round venture capital 2022',
    ],
  },

  // ── HOT with missing last_signal_date ────────────────────────────────────

  {
    fundName: "Riot Ventures",
    companyName: "Valar Atomics",
    queries: [
      '"Valar Atomics" "Riot Ventures" funding',
      '"Valar Atomics" seed round investors 2025',
      '"Valar Atomics" "$19M" investors announcement',
    ],
  },
  {
    fundName: "Snowpoint Ventures",
    companyName: "Valar Atomics",
    queries: [
      '"Valar Atomics" "Snowpoint Ventures" funding',
      '"Valar Atomics" Series A investors "$130M" 2025',
      '"Valar Atomics" nuclear startup Series A co-investors',
    ],
  },
  {
    fundName: "Mach33",
    companyName: "Portal Space Systems",
    queries: [
      '"Portal Space Systems" "Mach33" funding',
      '"Portal Space Systems" Series A investors 2026',
      '"Portal Space Systems" "$50M" round investors',
    ],
  },

  // ── HOT with recent signals ───────────────────────────────────────────────

  {
    fundName: "General Catalyst",
    companyName: "Eyebot",
    queries: [
      '"Eyebot" "General Catalyst" funding Series A',
      '"Eyebot" "$20M" Series A investors 2025',
      '"Eyebot" vision kiosk funding announcement investors',
    ],
  },
  {
    fundName: "Ubiquity Ventures",
    companyName: "Eyebot",
    queries: [
      '"Eyebot" "Ubiquity Ventures" funding',
      '"Eyebot" "$6M" seed investors "AlleyCorp" "Ubiquity"',
      '"Eyebot" seed round investors 2024',
    ],
  },
  {
    fundName: "SOSV",
    companyName: "Renovate Robotics",
    queries: [
      '"Renovate Robotics" "SOSV" OR "HAX" funding',
      '"Renovate Robotics" pre-seed investors "$2.5M"',
      '"Renovate Robotics" roofing robot funding announcement',
    ],
  },
  {
    fundName: "Geodesic Capital",
    companyName: "Portal Space Systems",
    queries: [
      '"Portal Space Systems" "Geodesic Capital" funding',
      '"Portal Space Systems" Series A 2026 co-investors',
      '"Portal Space Systems" "$50M" investors "Geodesic"',
    ],
  },
  {
    fundName: "Day One Ventures",
    companyName: "Valar Atomics",
    queries: [
      '"Valar Atomics" "Day One Ventures" investment',
      '"Valar Atomics" Series A "$130M" "Day One" investors',
      '"Valar Atomics" nuclear funding "Day One Ventures"',
    ],
  },
  {
    fundName: "Amazon Climate Pledge Fund",
    companyName: "Glacier",
    queries: [
      '"Glacier" "Amazon Climate Pledge Fund" investment recycling',
      '"Glacier" recycling robot funding "$7.7M" investors Amazon NEA',
      '"Glacier" "$16M" Series A investors Amazon',
    ],
  },
  {
    fundName: "NEA",
    companyName: "Glacier",
    queries: [
      '"Glacier" "NEA" OR "New Enterprise Associates" recycling robot funding',
      '"Glacier" "$7.7M" investors NEA Amazon 2024',
      '"Glacier" recycling startup "New Enterprise Associates" investment',
    ],
  },

  // ── WARM ─────────────────────────────────────────────────────────────────

  {
    fundName: "Flybridge",
    companyName: "Halo Braid",
    queries: [
      '"Halo Braid" "Flybridge" funding',
      '"Halo Braid" startup funding investors 2024',
      '"Halo Braid" hair braiding robot investment round',
    ],
  },
  {
    fundName: "Cherubic Ventures",
    companyName: "Cargo Robotics",
    queries: [
      '"Cargo Robotics" "Cherubic Ventures" funding',
      '"Cargo Robotics" seed investors 2024',
      '"Cargo Robotics" autonomous cargo startup investment',
    ],
  },

  // ── COLD ─────────────────────────────────────────────────────────────────

  {
    fundName: "a16z American Dynamism",
    companyName: "Cargo Robotics",
    queries: [
      '"Cargo Robotics" "a16z" OR "Andreessen Horowitz" funding',
      '"Cargo Robotics" investors Series A funding round',
      '"Cargo Robotics" "American Dynamism" investment',
    ],
  },
  {
    fundName: "Eclipse Ventures",
    companyName: "Civ Robotics",
    queries: [
      '"Civ Robotics" "Eclipse Ventures" funding',
      '"Civ Robotics" Series A investors 2023 2024',
      '"Civ Robotics" construction robot all investors funding',
    ],
  },
  {
    fundName: "Founders Fund",
    companyName: "Valar Atomics",
    queries: [
      '"Valar Atomics" "Founders Fund" investment nuclear',
      '"Valar Atomics" Series A all investors list "$130M"',
      '"Valar Atomics" "$19M" seed investors "Founders Fund"',
    ],
  },
];

// ── Tool schema for Claude structured extraction ───────────────────────────────
// Using tool_use forces schema-valid output — eliminates JSON.parse failures.

const EXTRACT_TOOL: Anthropic.Tool = {
  name: "extract_signals",
  description:
    "Extract co-investment signals found in the search results. Only include signals explicitly mentioning both the fund and the company.",
  input_schema: {
    type: "object" as const,
    properties: {
      signals: {
        type: "array",
        description: "List of signals found. Empty array if none found.",
        items: {
          type: "object",
          properties: {
            signalType: {
              type: "string",
              enum: ["co_investment", "press_mention"],
              description:
                "co_investment = fund invested in company. press_mention = article confirms relationship.",
            },
            signalDate: {
              type: "string",
              description: "Date in YYYY-MM-DD format. Use YYYY-01-01 if only year is known.",
            },
            sourceTitle: { type: "string", description: "Title of the article or page." },
            sourceUrl: { type: "string", description: "Full URL of the source." },
            rawSnippet: {
              type: "string",
              description: "Exact quote from the source that confirms the signal. Max 300 chars.",
            },
            value: {
              type: "string",
              description:
                "Human-readable description, e.g. 'Trimble Ventures co-invested in Civ Robotics $5M Seed round (Sep 2022)'.",
            },
            weight: {
              type: "string",
              enum: ["high", "medium", "low"],
              description:
                "high = direct co-investment confirmed. medium = participation mentioned. low = inferred or indirect.",
            },
          },
          required: [
            "signalType",
            "signalDate",
            "sourceTitle",
            "sourceUrl",
            "rawSnippet",
            "value",
            "weight",
          ],
        },
      },
    },
    required: ["signals"],
  },
};

// ── Priority 4: Source-based confidence ──────────────────────────────────────
// Derived automatically from URL — not left to Claude's judgment.

const HIGH_CONFIDENCE_DOMAINS = [
  "techcrunch.com",
  "bloomberg.com",
  "prnewswire.com",
  "businesswire.com",
  "axios.com",
  "reuters.com",
  "venturebeat.com",
];
const MEDIUM_CONFIDENCE_DOMAINS = [
  "crunchbase.com",
  "news.crunchbase.com",
  "forbes.com",
  "wsj.com",
  "ft.com",
  "cnbc.com",
];

function confidenceFromUrl(url: string): "confirmed" | "inferred" | "pending" {
  if (HIGH_CONFIDENCE_DOMAINS.some((d) => url.includes(d))) return "confirmed";
  if (MEDIUM_CONFIDENCE_DOMAINS.some((d) => url.includes(d))) return "inferred";
  return "pending";
}

// ── Step 1: Search ────────────────────────────────────────────────────────────

async function searchForSignals(
  target: SearchTarget
): Promise<{ url: string; title: string; snippet: string }[]> {
  console.log(`\n🔍 Searching for: ${target.fundName} + ${target.companyName}`);
  const found: { url: string; title: string; snippet: string }[] = [];

  for (const query of target.queries) {
    console.log(`   Query: ${query}`);
    try {
      const results = await exa.search(query, {
        type: "auto",
        numResults: 5,
        contents: { highlights: true },
        includeDomains: [
          "techcrunch.com",
          "prnewswire.com",
          "businesswire.com",
          "axios.com",
          "reuters.com",
          "bloomberg.com",
          "crunchbase.com",
          "forbes.com",
          "venturebeat.com",
        ],
      });

      for (const r of results.results) {
        const snippet = (r as unknown as { highlights?: string[] }).highlights?.join(" ") ?? "";
        if (snippet || r.title) {
          found.push({ url: r.url, title: r.title ?? "", snippet });
          console.log(`   ✓ ${r.title}`);
        }
      }
    } catch (err) {
      console.error(`   ✗ Query failed: ${err}`);
    }
  }

  return [...new Map(found.map((f) => [f.url, f])).values()];
}

// ── Step 2: Extract with Claude tool_use (schema-enforced) ───────────────────

async function parseSignals(
  target: ResolvedTarget,
  pages: { url: string; title: string; snippet: string }[]
): Promise<CandidateSignal[]> {
  if (pages.length === 0) return [];

  console.log(`\n🤖 Extracting signals via Claude tool_use (${pages.length} pages)...`);

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

    if (!toolUse) {
      console.log("   No tool_use block in response — skipping");
      return [];
    }

    const input = toolUse.input as {
      signals: Omit<
        CandidateSignal,
        "relationshipId" | "fundName" | "companyName" | "confidence"
      >[];
    };
    const signals = input.signals ?? [];

    if (signals.length === 0) {
      console.log("   No signals found in content");
      return [];
    }

    // Derive confidence from source URL — not from Claude
    return signals.map((s) => ({
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
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no DB writes)" : "LIVE (writing to DB)"}\n`);

  // Resolve relationship IDs from live DB — works on any DB
  const targets = await resolveRelationshipIds(TARGETS);
  if (targets.length === 0) {
    console.error("No targets resolved — check DB connection and seed data.");
    process.exit(1);
  }

  let totalFound = 0;
  let totalInserted = 0;
  let totalDuplicates = 0;

  for (const target of targets) {
    try {
      const pages = await searchForSignals(target);
      console.log(`\n   Found ${pages.length} unique pages`);

      if (pages.length === 0) {
        console.log("   Nothing found — skipping");
        continue;
      }

      const candidates = await parseSignals(target, pages);
      totalFound += candidates.length;

      if (candidates.length === 0) continue;

      console.log(`\n📋 Candidate signals (${candidates.length}):`);
      for (const c of candidates) {
        console.log(`   [${c.signalType}] ${c.signalDate} | ${c.confidence} | ${c.value}`);
        console.log(`   Source: ${c.sourceUrl}`);
      }

      if (DRY_RUN) {
        console.log("\n⏸  Dry run — skipping DB writes.");
        continue;
      }

      console.log("\n💾 Writing to DB...");
      let latestDate = "";
      for (const c of candidates) {
        const result = await writeSignal(c);
        if (result === "inserted") {
          totalInserted++;
          if (!latestDate || c.signalDate > latestDate) latestDate = c.signalDate;
          console.log(`   ✓ Inserted: ${c.value}`);
        } else if (result === "duplicate") {
          totalDuplicates++;
          console.log(`   ⟳ Duplicate: ${c.value}`);
        } else {
          console.log(`   ✗ Error: ${c.value}`);
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

  console.log(`\n=== Summary ===`);
  console.log(`Candidates found:   ${totalFound}`);
  if (!DRY_RUN) {
    console.log(`Inserted:           ${totalInserted}`);
    console.log(`Duplicates skipped: ${totalDuplicates}`);
  }
  console.log(DRY_RUN ? "\nRun with --write to insert." : "\nDone.");

  await pool.end();
}

run().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
