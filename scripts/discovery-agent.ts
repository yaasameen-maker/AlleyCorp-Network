/**
 * Autonomous Daily Co-investor Discovery Agent
 *
 * Runs every morning via GitHub Actions (see .github/workflows/discovery.yml).
 * Discovers new co-investors through two phases and writes directly to Railway — no manual review step.
 *
 * Phase 1 — Portfolio Scan:
 *   For each active AlleyCorp portfolio company, searches funding news and extracts
 *   co-investors. High/medium confidence findings go straight into the DB.
 *
 * Phase 2 — Network Expansion (6 degrees):
 *   For each hot/warm fund, finds what OTHER companies they've backed, then finds
 *   who else was in those rounds. These "2nd-degree" funds are inserted as Cold with
 *   a full discovery_context explaining why they surfaced.
 *
 * Phase 3 — Contact Enrichment:
 *   Every newly discovered fund immediately gets a LinkedIn enrichment pass so the
 *   dashboard shows a real contact, not just a fund name.
 *
 * Usage:
 *   npm run discover:agent                     # dry run — shows what would change
 *   npm run discover:agent -- --write          # live run
 *   npm run discover:agent -- --write --quick  # live run, 3 companies only (for testing)
 */

import dotenv from "dotenv";
dotenv.config({ override: true });

import Exa from "exa-js";
import Anthropic from "@anthropic-ai/sdk";
import { pool } from "../lib/db.js";
import {
  buildLogoUrl,
  searchLinkedIn,
  extractContacts,
  type LinkedInResult,
} from "../lib/enrichment.js";
import {
  substackAdapter,
  searchCompanyFunding,
  extractInvestors,
  type RawInvestor,
} from "./adapters/substackAdapter.js";
import { SIGNAL_TYPE_TO_DB } from "../lib/discovery-types.js";
import { confidenceFromSource, type ConfidenceLevel } from "../lib/enrichment.js";

const DRY_RUN = !process.argv.includes("--write");
const QUICK = process.argv.includes("--quick"); // process only 3 companies

const exa = new Exa(process.env.EXA_API_KEY!);
const claude = new Anthropic();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── DB row types ──────────────────────────────────────────────────────────────

interface PortfolioRow {
  id: string;
  name: string;
  website: string | null;
  sector: string | null;
}

interface HotWarmFund {
  id: string;
  name: string;
  website: string | null;
  warmthTier: string;
  portfolioCompanyId: string; // AlleyCorp portfolio company we're linked through
}

const EXTRACT_PORTFOLIO_TOOL: Anthropic.Tool = {
  name: "extract_portfolio_companies",
  description:
    "Extract companies this VC fund has recently invested in, from search results about their portfolio activity.",
  input_schema: {
    type: "object" as const,
    properties: {
      companies: {
        type: "array",
        description: "Companies this fund backed. Max 10 most recent. Empty array if none found.",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "Company name." },
            round: { type: "string", description: "Round: Seed, Series A, etc." },
            date: {
              type: "string",
              description: "Date YYYY-MM-DD or YYYY-01-01 if only year known.",
            },
          },
          required: ["name", "round", "date"],
        },
      },
    },
    required: ["companies"],
  },
};

// ── Exa search helpers ────────────────────────────────────────────────────────
// searchCompanyFunding + extractInvestors moved to scripts/adapters/substackAdapter.ts

async function searchFundPortfolio(
  fundName: string
): Promise<{ url: string; title: string; snippet: string }[]> {
  const queries = [
    `"${fundName}" portfolio investment 2024 2025`,
    `"${fundName}" backed invested startup`,
  ];
  const found = new Map<string, { url: string; title: string; snippet: string }>();

  for (const query of queries) {
    try {
      const results = await exa.search(query, {
        type: "auto",
        numResults: 8,
        contents: { highlights: true },
        includeDomains: [
          "techcrunch.com",
          "prnewswire.com",
          "businesswire.com",
          "crunchbase.com",
          "axios.com",
          "venturebeat.com",
        ],
      });
      for (const r of results.results) {
        const snippet = (r as unknown as { highlights?: string[] }).highlights?.join(" ") ?? "";
        if ((snippet || r.title) && !found.has(r.url)) {
          found.set(r.url, { url: r.url, title: r.title ?? "", snippet });
        }
      }
    } catch {
      // continue
    }
    await sleep(300);
  }
  return [...found.values()];
}

// ── Claude extraction helpers ─────────────────────────────────────────────────
// RawInvestor, extractInvestors imported from substackAdapter
// searchCompanyFunding imported from substackAdapter (used by Phase 2)

interface PortfolioCompanyRef {
  name: string;
  round: string;
  date: string;
}

async function extractPortfolioCompanies(
  fundName: string,
  pages: { url: string; title: string; snippet: string }[]
): Promise<PortfolioCompanyRef[]> {
  if (pages.length === 0) return [];

  const prompt = `Extract companies that "${fundName}" has invested in from these search results.

Rules:
- Only include companies explicitly named in the sources
- Focus on the most recent investments (2023–2026)
- Max 10 companies
- Call extract_portfolio_companies with empty array if nothing found

Search results:
${pages.map((p, i) => `[${i + 1}] ${p.title}\n${p.url}\n${p.snippet}`).join("\n\n")}`;

  try {
    const response = await claude.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      tools: [EXTRACT_PORTFOLIO_TOOL],
      tool_choice: { type: "tool", name: "extract_portfolio_companies" },
      messages: [{ role: "user", content: prompt }],
    });
    const toolUse = response.content.find((b) => b.type === "tool_use") as
      | Anthropic.ToolUseBlock
      | undefined;
    if (!toolUse) return [];
    const input = toolUse.input as { companies: PortfolioCompanyRef[] };
    return input.companies ?? [];
  } catch (err) {
    console.error(`   ✗ Portfolio extraction failed for "${fundName}": ${err}`);
    return [];
  }
}

// ── DB write helpers ──────────────────────────────────────────────────────────

// Upsert fund by name (case-insensitive). Returns fund ID.
async function upsertFund(
  name: string,
  focus: string | null,
  website?: string
): Promise<string | null> {
  try {
    const { rows } = await pool.query<{ id: string }>(
      `WITH ins AS (
         INSERT INTO fund (id, name, focus, website, logo_url, created_at, updated_at)
         SELECT gen_random_uuid(), $1, $2, $3,
                CASE WHEN $3 IS NOT NULL THEN $4 ELSE NULL END,
                now(), now()
         WHERE NOT EXISTS (SELECT 1 FROM fund WHERE LOWER(name) = LOWER($1))
         RETURNING id
       )
       SELECT id FROM ins
       UNION ALL
       SELECT id FROM fund WHERE LOWER(name) = LOWER($1)
       LIMIT 1`,
      [name, focus, website ?? null, website ? buildLogoUrl(website) : null]
    );
    return rows[0]?.id ?? null;
  } catch (err) {
    console.error(`   ✗ upsertFund failed for "${name}": ${err}`);
    return null;
  }
}

// Upsert relationship. Returns { relId, isNew }.
async function upsertRelationship(
  fundId: string,
  portfolioCompanyId: string,
  warmthTier: string,
  lastSignalDate: string,
  discoverySource: string,
  discoveryContext: object
): Promise<{ relId: string; isNew: boolean } | null> {
  try {
    const { rows } = await pool.query<{ id: string; is_new: boolean }>(
      `WITH ins AS (
         INSERT INTO relationship (
           id, fund_id, portfolio_company_id, warmth_tier,
           last_signal_date, discovery_source, discovery_context,
           alley_partner, created_at, updated_at
         )
         SELECT
           gen_random_uuid(), $1, $2, $3,
           $4::date, $5, $6::jsonb,
           'discovery-agent', now(), now()
         WHERE NOT EXISTS (
           SELECT 1 FROM relationship
           WHERE fund_id = $1 AND portfolio_company_id = $2
         )
         RETURNING id, true AS is_new
       )
       SELECT id, is_new FROM ins
       UNION ALL
       SELECT id, false AS is_new FROM relationship
       WHERE fund_id = $1 AND portfolio_company_id = $2
         AND NOT EXISTS (SELECT 1 FROM ins)
       LIMIT 1`,
      [
        fundId,
        portfolioCompanyId,
        warmthTier,
        lastSignalDate,
        discoverySource,
        JSON.stringify(discoveryContext),
      ]
    );
    if (!rows[0]) return null;
    return { relId: rows[0].id, isNew: rows[0].is_new };
  } catch (err) {
    console.error(`   ✗ upsertRelationship failed: ${err}`);
    return null;
  }
}

// Insert signal only if (relationship_id, signal_type, signal_date, source) doesn't exist.
async function upsertSignal(
  relationshipId: string,
  signalType: string,
  signalDate: string,
  source: string,
  value: string,
  weight: string
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO signal (id, relationship_id, signal_type, signal_date, source, value, weight, confidence, created_at)
       SELECT gen_random_uuid(), $1, $2, $3::date, $4, $5, $6, 'confirmed', now()
       WHERE NOT EXISTS (
         SELECT 1 FROM signal
         WHERE relationship_id = $1 AND signal_type = $2
           AND signal_date = $3::date AND source = $4
       )`,
      [relationshipId, signalType, signalDate, source, value, weight]
    );
  } catch (err) {
    console.error(`   ✗ upsertSignal failed: ${err}`);
  }
}

// Enrich a newly discovered fund with LinkedIn contact and logo.
async function enrichNewFund(fundId: string, fundName: string): Promise<void> {
  const pages: LinkedInResult[] = await searchLinkedIn(fundName, exa);
  if (pages.length === 0) return;

  const contacts = await extractContacts(fundName, pages, claude);
  for (const c of contacts) {
    try {
      await pool.query(
        `INSERT INTO investor (id, fund_id, name, role, linkedin_url, created_at, updated_at)
         SELECT gen_random_uuid(), $1, $2, $3, $4, now(), now()
         WHERE NOT EXISTS (
           SELECT 1 FROM investor WHERE fund_id = $1 AND LOWER(name) = LOWER($2)
         )`,
        [fundId, c.name, c.role, c.linkedinUrl]
      );
      console.log(`     ✓ Contact: ${c.name} · ${c.role}`);
    } catch (err) {
      console.error(`     ✗ Contact insert failed: ${err}`);
    }
  }
}

// ── Check if fund is already known (hot/warm/stale) ──────────────────────────

async function getKnownFundIds(): Promise<Set<string>> {
  const { rows } = await pool.query<{ name: string }>(
    `SELECT LOWER(f.name) AS name FROM fund f
     JOIN relationship r ON r.fund_id = f.id
     WHERE r.warmth_tier IN ('hot', 'warm', 'stale')`
  );
  return new Set(rows.map((r) => r.name));
}

// ── Stats counters ────────────────────────────────────────────────────────────

const stats = {
  phase1: { fundsFound: 0, fundsNew: 0, signalsAdded: 0, skipped: 0 },
  phase2: { fundsFound: 0, fundsNew: 0, signalsAdded: 0 },
  contacts: { added: 0 },
};

// ── Phase 1: Portfolio scan ───────────────────────────────────────────────────
// Delegates search + extraction to substackAdapter.
// Warmth tier is NOT assigned here — recalibrate.ts computes it from signals.

async function runPortfolioScan(companies: PortfolioRow[]): Promise<void> {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`PHASE 1 — Portfolio Scan (${companies.length} companies)`);
  console.log("═".repeat(60));

  const { signals, rawByCompany } = await substackAdapter(companies, exa, claude);

  console.log(`\n   substackAdapter: ${signals.length} signal candidates from ${companies.length} companies`);

  for (const signal of signals) {
    const company = companies.find((c) => c.name === signal.portfolioCompanyName);
    if (!company) continue;

    const rawForCompany = rawByCompany.get(company.name) ?? [];
    const raw = rawForCompany.find((r) => r.fundName === signal.fundName);

    console.log(`   → ${signal.fundName} · ${signal.confidence} · ${signal.signalDate}`);
    stats.phase1.fundsFound++;

    if (DRY_RUN) continue;

    const fundId = await upsertFund(signal.fundName!, company.sector, undefined);
    if (!fundId) continue;

    const context = {
      source_url: raw?.sourceUrl ?? "",
      round: raw?.round ?? signal.metadata?.roundName ?? "",
      company: company.name,
      summary: signal.value ?? `Co-invested in ${company.name} alongside AlleyCorp.`,
    };

    const today = new Date().toISOString().slice(0, 10);
    const signalDate = signal.signalDate ?? today;

    // Warmth tier defaults to 'cold' — recalibrate.ts promotes based on signal history
    const rel = await upsertRelationship(fundId, company.id, "cold", signalDate, "portfolio_scan", context);
    if (!rel) continue;
    if (rel.isNew) stats.phase1.fundsNew++;

    await upsertSignal(
      rel.relId,
      SIGNAL_TYPE_TO_DB[signal.signalType],
      signalDate,
      raw?.sourceTitle ?? signal.sourceId,
      signal.value ?? "",
      signal.confidence
    );
    stats.phase1.signalsAdded++;

    if (rel.isNew) {
      console.log(`     ✓ New fund — enriching contacts`);
      await enrichNewFund(fundId, signal.fundName!);
      stats.contacts.added++;
    }
  }

  stats.phase1.skipped = companies.length - new Set(signals.map((s) => s.portfolioCompanyName)).size;
}

// ── Phase 2: Network expansion ────────────────────────────────────────────────

interface NetworkEvidence {
  viaFund: string;
  viaFundPortfolioCompanyId: string;
  companies: string[]; // non-AlleyCorp companies where overlap was observed
  rounds: number;
  dates: string[];
}

async function runNetworkExpansion(hotWarmFunds: HotWarmFund[]): Promise<void> {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`PHASE 2 — Network Expansion (${hotWarmFunds.length} hot/warm funds)`);
  console.log("═".repeat(60));

  const knownFunds = await getKnownFundIds();

  // Accumulate evidence across all hot/warm funds before writing
  // key = LOWER(fundName), value = best evidence found so far
  const evidence = new Map<string, NetworkEvidence & { fundName: string }>();

  for (const fund of hotWarmFunds) {
    console.log(`\n── Expanding from ${fund.name} (${fund.warmthTier})`);

    const pages = await searchFundPortfolio(fund.name);
    console.log(`   Exa: ${pages.length} pages about ${fund.name}'s portfolio`);
    if (pages.length === 0) continue;

    const theirCompanies = await extractPortfolioCompanies(fund.name, pages);
    console.log(`   Claude: ${theirCompanies.length} portfolio companies found`);

    for (const company of theirCompanies.slice(0, 6)) {
      // cap at 6 to control Exa usage
      const coPages = await searchCompanyFunding(company.name, exa);
      if (coPages.length === 0) continue;

      const coInvestors = await extractInvestors(company.name, coPages, claude);

      for (const inv of coInvestors) {
        // Skip funds already known as hot/warm/stale
        if (knownFunds.has(inv.fundName.toLowerCase())) continue;
        // Skip the originating fund itself
        if (inv.fundName.toLowerCase() === fund.name.toLowerCase()) continue;

        const key = inv.fundName.toLowerCase();
        const existing = evidence.get(key);

        if (existing) {
          existing.rounds++;
          existing.companies.push(company.name);
          existing.dates.push(inv.date);
        } else {
          evidence.set(key, {
            fundName: inv.fundName,
            viaFund: fund.name,
            viaFundPortfolioCompanyId: fund.portfolioCompanyId,
            companies: [company.name],
            rounds: 1,
            dates: [inv.date],
          });
        }
      }
      await sleep(400);
    }
    await sleep(500);
  }

  // Write candidates with >= 2 round appearances (quality threshold)
  const candidates = [...evidence.values()].filter((c) => c.rounds >= 2);
  console.log(
    `\n   Network expansion found ${evidence.size} candidates, ${candidates.length} meet quality threshold (2+ rounds)`
  );

  for (const candidate of candidates) {
    const oldestDate =
      candidate.dates.filter((d) => d !== "unknown").sort()[0] ??
      new Date().toISOString().slice(0, 10);

    const oldestMonths = Math.round(
      (Date.now() - new Date(oldestDate).getTime()) / (1000 * 60 * 60 * 24 * 30.5)
    );

    console.log(
      `\n   → ${candidate.fundName} (via ${candidate.viaFund}, ${candidate.rounds} rounds, ${oldestMonths}mo)`
    );
    stats.phase2.fundsFound++;

    if (DRY_RUN) continue;

    const fundId = await upsertFund(candidate.fundName, "Deep tech", undefined);
    if (!fundId) continue;

    const discoveryContext = {
      via_fund: candidate.viaFund,
      shared_rounds: candidate.rounds,
      companies: [...new Set(candidate.companies)],
      oldest_signal_months: oldestMonths,
      summary: `Frequently co-invests with ${candidate.viaFund} across deep tech rounds. Appeared alongside AlleyCorp's known co-investors in ${candidate.rounds} deals. No direct AlleyCorp relationship signals yet.`,
    };

    const rel = await upsertRelationship(
      fundId,
      candidate.viaFundPortfolioCompanyId,
      "cold",
      oldestDate,
      "network_expansion",
      discoveryContext
    );
    if (!rel) continue;
    if (rel.isNew) stats.phase2.fundsNew++;

    await upsertSignal(
      rel.relId,
      "press_mention",
      oldestDate,
      `Network expansion via ${candidate.viaFund}`,
      `Observed co-investing alongside ${candidate.viaFund} in ${candidate.rounds} deep tech rounds`,
      "low"
    );
    stats.phase2.signalsAdded++;

    if (rel.isNew) {
      console.log(`     ✓ New fund inserted — enriching contacts`);
      await enrichNewFund(fundId, candidate.fundName);
      stats.contacts.added++;
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  const startTime = Date.now();

  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║   AlleyCorp Autonomous Co-investor Discovery Agent       ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log(`Mode:  ${DRY_RUN ? "DRY RUN — no DB writes" : "LIVE — writing to Railway"}`);
  console.log(`Scope: ${QUICK ? "QUICK — 3 companies only" : "FULL"}`);
  console.log(`Date:  ${new Date().toISOString().slice(0, 10)}\n`);

  // ── Load from DB ──────────────────────────────────────────────────────────
  const { rows: allCompanies } = await pool.query<PortfolioRow>(
    `SELECT id, name, website, sector FROM portfolio_company WHERE status = 'active' ORDER BY name`
  );

  const { rows: hotWarmFunds } = await pool.query<HotWarmFund>(
    `SELECT DISTINCT ON (f.id)
       f.id, f.name, f.website, r.warmth_tier AS "warmthTier",
       r.portfolio_company_id AS "portfolioCompanyId"
     FROM relationship r
     JOIN fund f ON f.id = r.fund_id
     WHERE r.warmth_tier IN ('hot', 'warm')
     ORDER BY f.id, r.last_signal_date DESC NULLS LAST`
  );

  const companies = QUICK ? allCompanies.slice(0, 3) : allCompanies;

  console.log(`Portfolio companies: ${allCompanies.length} (processing ${companies.length})`);
  console.log(`Hot/warm funds for network expansion: ${hotWarmFunds.length}`);

  // ── Run phases ────────────────────────────────────────────────────────────
  await runPortfolioScan(companies);
  if (!QUICK) await runNetworkExpansion(hotWarmFunds);

  // ── Summary ───────────────────────────────────────────────────────────────
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  console.log(`\n${"═".repeat(60)}`);
  console.log(`SUMMARY — ${elapsed}s elapsed`);
  console.log("═".repeat(60));
  console.log(`Phase 1 (portfolio scan):`);
  console.log(`  Funds found:      ${stats.phase1.fundsFound}`);
  console.log(`  New to DB:        ${stats.phase1.fundsNew}`);
  console.log(`  Signals added:    ${stats.phase1.signalsAdded}`);
  console.log(`  No data:          ${stats.phase1.skipped} companies`);
  console.log(`Phase 2 (network expansion):`);
  console.log(`  Candidates found: ${stats.phase2.fundsFound}`);
  console.log(`  New to DB:        ${stats.phase2.fundsNew}`);
  console.log(`  Signals added:    ${stats.phase2.signalsAdded}`);
  console.log(`Contact enrichment: ${stats.contacts.added} funds enriched`);

  if (DRY_RUN) {
    console.log(`\nRun with --write to commit to Railway.`);
  }

  await pool.end();
}

run().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
