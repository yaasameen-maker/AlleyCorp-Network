/**
 * Co-investor Discovery Script
 *
 * Searches the web for funding rounds for AlleyCorp portfolio companies that
 * have no co-investor data yet. Uses Exa for search + Claude for extraction.
 *
 * Only generates SQL for high-confidence sources (press releases, TechCrunch, etc.)
 * Low-confidence findings are flagged for manual review.
 *
 * Usage:
 *   npm run discover
 *
 * Output:
 *   data/coinvestor-discovery-YYYY-MM-DD.md
 *   — review file with findings, source URLs, warmth tier reasoning, and ready-to-run SQL
 */

import dotenv from "dotenv";
dotenv.config({ override: true });

import Exa from "exa-js";
import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const exa = new Exa(process.env.EXA_API_KEY!);
const claude = new Anthropic();

// ── Companies to research ─────────────────────────────────────────────────────

const COMPANIES = [
  { name: "Appetronix", url: "appetronix.com", sector: "Food Tech" },
  { name: "Koop Technologies", url: "koop.ai", sector: "Logistics" },
  { name: "Mapless AI", url: "mapless.ai", sector: "Autonomy" },
  { name: "Avatar", url: "avatarsystems.com", sector: "Robotics" },
  { name: "Root Access", url: "rootaccess.ai", sector: "AI / ML" },
  { name: "dolaGon", url: "dolagon.com", sector: "Agriculture" },
  { name: "ARIX Technologies", url: "arix-tech.com", sector: "Industrial" },
  { name: "Spaero Bio", url: "spaero.bio", sector: "Life Sciences" },
  { name: "Dexai Robotics", url: "dexai.com", sector: "Robotics" },
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface DiscoveredInvestor {
  fundName: string;
  round: string;
  date: string;
  amount?: string;
  sourceTitle: string;
  sourceUrl: string;
  rawSnippet: string;
  confidence: "high" | "medium" | "low";
  warmthTier: "hot" | "warm" | "stale" | "cold";
  warmthReason: string;
}

interface CompanyResult {
  company: (typeof COMPANIES)[number];
  investors: DiscoveredInvestor[];
  gaps: string[];
}

// ── Confidence from source URL ────────────────────────────────────────────────

const HIGH_CONFIDENCE = [
  "techcrunch.com",
  "prnewswire.com",
  "businesswire.com",
  "axios.com",
  "reuters.com",
  "bloomberg.com",
  "venturebeat.com",
];
const MEDIUM_CONFIDENCE = [
  "crunchbase.com",
  "forbes.com",
  "wsj.com",
  "ft.com",
  "cnbc.com",
  "pitchbook.com",
];

function confidenceFromUrl(url: string): "high" | "medium" | "low" {
  if (HIGH_CONFIDENCE.some((d) => url.includes(d))) return "high";
  if (MEDIUM_CONFIDENCE.some((d) => url.includes(d))) return "medium";
  return "low";
}

// ── Warmth tier from signal date ──────────────────────────────────────────────

function warmthFromDate(dateStr: string): {
  tier: "hot" | "warm" | "stale" | "cold";
  reason: string;
} {
  if (!dateStr || dateStr === "unknown") {
    return { tier: "cold", reason: "No date found — cannot determine recency" };
  }

  const signalDate = new Date(dateStr);
  if (isNaN(signalDate.getTime())) {
    return { tier: "cold", reason: `Could not parse date: ${dateStr}` };
  }

  const now = new Date("2026-06-06");
  const monthsAgo = (now.getTime() - signalDate.getTime()) / (1000 * 60 * 60 * 24 * 30.5);

  if (monthsAgo <= 12)
    return { tier: "hot", reason: `Signal ${Math.round(monthsAgo)}mo ago — active relationship` };
  if (monthsAgo <= 24)
    return { tier: "warm", reason: `Signal ${Math.round(monthsAgo)}mo ago — warm but monitor` };
  return { tier: "stale", reason: `Signal ${Math.round(monthsAgo)}mo ago — relationship cooling` };
}

// ── Claude extraction tool ────────────────────────────────────────────────────

const EXTRACT_TOOL: Anthropic.Tool = {
  name: "extract_investors",
  description:
    "Extract all investors/funds found in the search results for this company's funding rounds.",
  input_schema: {
    type: "object" as const,
    properties: {
      investors: {
        type: "array",
        description: "All investors found. Empty array if none.",
        items: {
          type: "object",
          properties: {
            fundName: {
              type: "string",
              description: "Exact fund/investor name as written in the source.",
            },
            round: {
              type: "string",
              description: "Round type: Seed, Series A, Series B, Pre-Seed, etc.",
            },
            date: {
              type: "string",
              description:
                "Date in YYYY-MM-DD. Use YYYY-01-01 if only year known. 'unknown' if not found.",
            },
            amount: {
              type: "string",
              description: "Funding amount e.g. '$5M'. Omit if not mentioned.",
            },
            sourceTitle: { type: "string", description: "Title of the article or page." },
            sourceUrl: { type: "string", description: "Full URL of the source." },
            rawSnippet: {
              type: "string",
              description: "Exact quote (max 200 chars) confirming this investor.",
            },
          },
          required: ["fundName", "round", "date", "sourceTitle", "sourceUrl", "rawSnippet"],
        },
      },
      gaps: {
        type: "array",
        items: { type: "string" },
        description: "Notes on what couldn't be found or was unclear.",
      },
    },
    required: ["investors", "gaps"],
  },
};

// ── Search ────────────────────────────────────────────────────────────────────

async function searchCompany(company: (typeof COMPANIES)[number]) {
  const queries = [
    `"${company.name}" funding round investors venture capital`,
    `"${company.name}" seed series investment announcement`,
    `"${company.name}" startup raises million investors`,
  ];

  const found: { url: string; title: string; snippet: string }[] = [];

  for (const query of queries) {
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
          "wsj.com",
        ],
      });

      for (const r of results.results) {
        const snippet = (r as unknown as { highlights?: string[] }).highlights?.join(" ") ?? "";
        if (snippet || r.title) {
          found.push({ url: r.url, title: r.title ?? "", snippet });
        }
      }
    } catch {
      // continue on failed query
    }
  }

  return [...new Map(found.map((f) => [f.url, f])).values()];
}

// ── Extract ───────────────────────────────────────────────────────────────────

async function extractInvestors(
  company: (typeof COMPANIES)[number],
  pages: { url: string; title: string; snippet: string }[]
): Promise<{ investors: DiscoveredInvestor[]; gaps: string[] }> {
  if (pages.length === 0) {
    return { investors: [], gaps: ["No search results found"] };
  }

  const prompt = `Extract all investors and funding rounds for "${company.name}" (${company.url}) from these search results.

Rules:
- Only include investors explicitly named in the source
- Do not infer or guess fund names
- If the same investor appears in multiple sources, include only the highest-confidence source
- Call extract_investors with an empty array if nothing found

Search results:
${pages.map((p, i) => `[${i + 1}] ${p.title}\n${p.url}\n${p.snippet}`).join("\n\n")}`;

  try {
    const response = await claude.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      tools: [EXTRACT_TOOL],
      tool_choice: { type: "tool", name: "extract_investors" },
      messages: [{ role: "user", content: prompt }],
    });

    const toolUse = response.content.find((b) => b.type === "tool_use") as
      | Anthropic.ToolUseBlock
      | undefined;
    if (!toolUse) return { investors: [], gaps: ["Claude did not return structured output"] };

    const input = toolUse.input as {
      investors: Omit<DiscoveredInvestor, "confidence" | "warmthTier" | "warmthReason">[];
      gaps: string[];
    };

    const investors: DiscoveredInvestor[] = (input.investors ?? []).map((inv) => {
      const confidence = confidenceFromUrl(inv.sourceUrl);
      const { tier, reason } = warmthFromDate(inv.date);
      return { ...inv, confidence, warmthTier: tier, warmthReason: reason };
    });

    return { investors, gaps: input.gaps ?? [] };
  } catch (err) {
    return { investors: [], gaps: [`Extraction error: ${err}`] };
  }
}

// ── SQL generation ────────────────────────────────────────────────────────────

function generateSQL(results: CompanyResult[]): string {
  const lines: string[] = [
    "-- ─────────────────────────────────────────────────────────────────────────",
    "-- Co-investor Discovery Results — Generated " + new Date().toISOString().slice(0, 10),
    "-- REVIEW CAREFULLY before running. Verify source URLs are real.",
    "-- Run after seed.sql and seed-dtny-signals.sql.",
    "-- ─────────────────────────────────────────────────────────────────────────",
    "",
    "BEGIN;",
    "",
  ];

  let hasAny = false;

  for (const result of results) {
    const highConfidence = result.investors.filter(
      (i) => i.confidence === "high" || i.confidence === "medium"
    );
    if (highConfidence.length === 0) continue;

    hasAny = true;
    lines.push(`-- ── ${result.company.name} ──────────────────────────────────────────`);
    lines.push("");

    // Dedupe by fund name — keep highest confidence
    const byFund = new Map<string, DiscoveredInvestor>();
    for (const inv of highConfidence) {
      const existing = byFund.get(inv.fundName);
      if (!existing || inv.confidence === "high") byFund.set(inv.fundName, inv);
    }

    for (const inv of byFund.values()) {
      const fundVar = inv.fundName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
      lines.push(
        `-- ${inv.fundName} + ${result.company.name} · ${inv.warmthTier} (${inv.round}, ${inv.date})`
      );
      lines.push(`-- Source: ${inv.sourceUrl}`);
      lines.push(`INSERT INTO fund (id, name, focus, stage, created_at, updated_at)`);
      lines.push(
        `  VALUES (gen_random_uuid(), '${inv.fundName.replace(/'/g, "''")}', '${result.company.sector}', '${inv.round}', now(), now())`
      );
      lines.push(`  ON CONFLICT (name) DO NOTHING;`);
      lines.push("");
      lines.push(
        `INSERT INTO relationship (id, fund_id, portfolio_company_id, warmth_tier, last_signal_date, created_at, updated_at)`
      );
      lines.push(`SELECT`);
      lines.push(`  gen_random_uuid(),`);
      lines.push(`  (SELECT id FROM fund WHERE name = '${inv.fundName.replace(/'/g, "''")}'),`);
      lines.push(`  (SELECT id FROM portfolio_company WHERE name = '${result.company.name}'),`);
      lines.push(`  '${inv.warmthTier}',`);
      lines.push(`  '${inv.date}',`);
      lines.push(`  now(), now()`);
      lines.push(`WHERE NOT EXISTS (`);
      lines.push(`  SELECT 1 FROM relationship r`);
      lines.push(`  JOIN fund f ON f.id = r.fund_id`);
      lines.push(`  JOIN portfolio_company pc ON pc.id = r.portfolio_company_id`);
      lines.push(
        `  WHERE f.name = '${inv.fundName.replace(/'/g, "''")}' AND pc.name = '${result.company.name}'`
      );
      lines.push(`);`);
      lines.push("");
      void fundVar;
    }
  }

  if (!hasAny) {
    lines.push("-- No high/medium confidence findings to generate SQL for.");
    lines.push("-- See review file for low-confidence findings requiring manual research.");
  }

  lines.push("COMMIT;");
  return lines.join("\n");
}

// ── Markdown report ───────────────────────────────────────────────────────────

function generateReport(results: CompanyResult[], sql: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const lines: string[] = [
    `# Co-investor Discovery Report — ${date}`,
    "",
    "Generated by `scripts/discover-coinvestors.ts`  ",
    "Review all source URLs before applying SQL. High-confidence = press release / TechCrunch.  ",
    "Medium-confidence = Crunchbase / Forbes. Low-confidence = flag for manual research.",
    "",
    "---",
    "",
  ];

  for (const result of results) {
    lines.push(`## ${result.company.name}`);
    lines.push(`*${result.company.sector} · ${result.company.url}*`);
    lines.push("");

    if (result.investors.length === 0) {
      lines.push("❌ **No investors found** — needs manual Crunchbase research");
      if (result.gaps.length > 0) {
        lines.push("");
        lines.push("**Notes:**");
        for (const g of result.gaps) lines.push(`- ${g}`);
      }
      lines.push("");
      continue;
    }

    // Group by confidence
    const high = result.investors.filter((i) => i.confidence === "high");
    const medium = result.investors.filter((i) => i.confidence === "medium");
    const low = result.investors.filter((i) => i.confidence === "low");

    if (high.length > 0) {
      lines.push("### ✅ High confidence (will generate SQL)");
      for (const inv of high) {
        lines.push(
          `- **${inv.fundName}** — ${inv.round}, ${inv.date}${inv.amount ? `, ${inv.amount}` : ""}`
        );
        lines.push(`  - Warmth: \`${inv.warmthTier}\` — ${inv.warmthReason}`);
        lines.push(`  - Source: [${inv.sourceTitle}](${inv.sourceUrl})`);
        lines.push(`  - *"${inv.rawSnippet.slice(0, 150)}"*`);
      }
      lines.push("");
    }

    if (medium.length > 0) {
      lines.push("### ⚠️ Medium confidence (will generate SQL — verify before applying)");
      for (const inv of medium) {
        lines.push(
          `- **${inv.fundName}** — ${inv.round}, ${inv.date}${inv.amount ? `, ${inv.amount}` : ""}`
        );
        lines.push(`  - Warmth: \`${inv.warmthTier}\` — ${inv.warmthReason}`);
        lines.push(`  - Source: [${inv.sourceTitle}](${inv.sourceUrl})`);
        lines.push(`  - *"${inv.rawSnippet.slice(0, 150)}"*`);
      }
      lines.push("");
    }

    if (low.length > 0) {
      lines.push("### 🔍 Low confidence (NOT in SQL — manual review needed)");
      for (const inv of low) {
        lines.push(`- **${inv.fundName}** — ${inv.round}, ${inv.date}`);
        lines.push(`  - Source: [${inv.sourceTitle}](${inv.sourceUrl})`);
        lines.push(`  - *"${inv.rawSnippet.slice(0, 150)}"*`);
      }
      lines.push("");
    }

    if (result.gaps.length > 0) {
      lines.push("**Research gaps:**");
      for (const g of result.gaps) lines.push(`- ${g}`);
      lines.push("");
    }
  }

  lines.push("---");
  lines.push("");
  lines.push("## Generated SQL");
  lines.push("");
  lines.push("```sql");
  lines.push(sql);
  lines.push("```");
  lines.push("");
  lines.push("## Next steps");
  lines.push("1. Review all source URLs above — click through and confirm they're real");
  lines.push("2. Adjust any warmth tiers you disagree with");
  lines.push("3. Apply SQL: `psql $DATABASE_URL -f <this-file-sql-block>` or copy into seed.sql");
  lines.push(
    "4. Run scraper: `npm run ingest:signals -- --write` to add signals for new relationships"
  );
  lines.push("5. Run acceptance tests: `npm run test:acceptance`");

  return lines.join("\n");
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  console.log("=== AlleyCorp Co-investor Discovery ===");
  console.log(`Researching ${COMPANIES.length} portfolio companies...\n`);

  const results: CompanyResult[] = [];

  for (const company of COMPANIES) {
    console.log(`\n🔍 ${company.name}`);

    const pages = await searchCompany(company);
    console.log(`   Found ${pages.length} pages`);

    const { investors, gaps } = await extractInvestors(company, pages);

    const high = investors.filter((i) => i.confidence === "high").length;
    const medium = investors.filter((i) => i.confidence === "medium").length;
    const low = investors.filter((i) => i.confidence === "low").length;

    console.log(`   Extracted: ${high} high, ${medium} medium, ${low} low confidence`);
    for (const inv of investors.filter((i) => i.confidence !== "low")) {
      console.log(
        `   ✓ ${inv.fundName} (${inv.round}, ${inv.date}) [${inv.confidence}] → ${inv.warmthTier}`
      );
    }

    results.push({ company, investors, gaps });
  }

  const sql = generateSQL(results);
  const report = generateReport(results, sql);

  const date = new Date().toISOString().slice(0, 10);
  const outPath = join(process.cwd(), "data", `coinvestor-discovery-${date}.md`);

  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  writeFileSync(outPath, report, "utf-8");

  const totalHigh = results
    .flatMap((r) => r.investors)
    .filter((i) => i.confidence === "high").length;
  const totalMedium = results
    .flatMap((r) => r.investors)
    .filter((i) => i.confidence === "medium").length;
  const totalLow = results.flatMap((r) => r.investors).filter((i) => i.confidence === "low").length;
  const noData = results.filter((r) => r.investors.length === 0).length;

  console.log("\n=== Summary ===");
  console.log(`High confidence:   ${totalHigh}`);
  console.log(`Medium confidence: ${totalMedium}`);
  console.log(`Low confidence:    ${totalLow} (not in SQL)`);
  console.log(`No data found:     ${noData} companies`);
  console.log(`\nReport saved to: ${outPath}`);
  console.log("Review the report, then apply the SQL to Railway.");
}

run().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
