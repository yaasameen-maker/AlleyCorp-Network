/**
 * Substack / Newsletter Adapter
 *
 * Searches AlleyCorp and Deep Tech newsletters (via Exa) for funding news
 * about AlleyCorp portfolio companies, then extracts co-investor signals
 * using Claude tool_use.
 *
 * Returns SourceRecord[] + DiscoverySignalCandidate[] — no DB writes.
 * The discovery agent handles persistence.
 */

import { createHash } from "crypto";
import type Exa from "exa-js";
import type Anthropic from "@anthropic-ai/sdk";
import { confidenceFromSource } from "../../lib/enrichment.js";
import { sourceUseFromUrl } from "../../lib/source-policy.js";
import type {
  SourceRecord,
  DiscoverySignalCandidate,
  RelationshipDiscoveryOutput,
} from "../../lib/discovery-types.js";

// ── Exa search domains — newsletter-first, then press ────────────────────────

const SEARCH_DOMAINS = [
  "alleycorp.substack.com", // most authoritative — AlleyCorp's own newsletter
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
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Claude tool schema ────────────────────────────────────────────────────────

const EXTRACT_INVESTORS_TOOL: Anthropic.Tool = {
  name: "extract_investors",
  description:
    "Extract all VC funds/investors that participated in this company's funding round from the search results.",
  input_schema: {
    type: "object" as const,
    properties: {
      investors: {
        type: "array",
        description: "All investors found. Empty array if none.",
        items: {
          type: "object",
          properties: {
            fundName: { type: "string", description: "Exact fund name as written in the source." },
            round: { type: "string", description: "Round: Seed, Series A, Series B, etc." },
            date: {
              type: "string",
              description:
                "Date YYYY-MM-DD. Use YYYY-01-01 if only year known. 'unknown' if not found.",
            },
            amount: {
              type: "string",
              description: "Funding amount e.g. '$5M'. Omit if not mentioned.",
            },
            sourceTitle: { type: "string", description: "Article or page title." },
            sourceUrl: { type: "string", description: "Full source URL." },
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

// ── Internal types ────────────────────────────────────────────────────────────

interface RawSearchResult {
  url: string;
  title: string;
  snippet: string;
}

interface RawInvestor {
  fundName: string;
  round: string;
  date: string;
  amount?: string;
  sourceTitle: string;
  sourceUrl: string;
  rawSnippet: string;
}

// ── Search ────────────────────────────────────────────────────────────────────

async function searchFundingNews(
  companyName: string,
  exa: InstanceType<typeof Exa>
): Promise<RawSearchResult[]> {
  const queries = [
    `"${companyName}" funding round investors venture capital`,
    `"${companyName}" seed series investment announcement`,
    `"${companyName}" startup raises investors`,
  ];
  const found = new Map<string, RawSearchResult>();

  for (const query of queries) {
    try {
      const results = await exa.search(query, {
        type: "auto",
        numResults: 5,
        contents: { highlights: true },
        includeDomains: SEARCH_DOMAINS,
      });
      for (const r of results.results) {
        const snippet = (r as unknown as { highlights?: string[] }).highlights?.join(" ") ?? "";
        if ((snippet || r.title) && !found.has(r.url)) {
          found.set(r.url, { url: r.url, title: r.title ?? "", snippet });
        }
      }
    } catch {
      // continue on individual query failure
    }
    await sleep(300);
  }
  return [...found.values()];
}

// ── Extract ───────────────────────────────────────────────────────────────────

async function extractInvestors(
  companyName: string,
  pages: RawSearchResult[],
  claude: Anthropic
): Promise<RawInvestor[]> {
  if (pages.length === 0) return [];

  const prompt = `Extract all investors/funds that participated in funding rounds for "${companyName}" from these search results.

Rules:
- Only include investors explicitly named in a source
- Do not guess or infer fund names
- If the same investor appears in multiple sources, keep the highest-confidence source
- Call extract_investors with empty array if nothing found

Search results:
${pages.map((p, i) => `[${i + 1}] ${p.title}\n${p.url}\n${p.snippet}`).join("\n\n")}`;

  try {
    const response = await claude.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      tools: [EXTRACT_INVESTORS_TOOL],
      tool_choice: { type: "tool", name: "extract_investors" },
      messages: [{ role: "user", content: prompt }],
    });
    const toolUse = response.content.find((b) => b.type === "tool_use") as
      | Anthropic.ToolUseBlock
      | undefined;
    if (!toolUse) return [];
    const input = toolUse.input as { investors: RawInvestor[]; gaps: string[] };
    return input.investors ?? [];
  } catch (err) {
    console.error(`   ✗ Investor extraction failed for "${companyName}": ${err}`);
    return [];
  }
}

// ── Exports for Phase 2 (network expansion) in discovery-agent ───────────────
export { searchFundingNews as searchCompanyFunding, extractInvestors };
export type { RawInvestor };

// ── Adapter entry point ───────────────────────────────────────────────────────

export async function substackAdapter(
  portfolioCompanies: { id: string; name: string; sector: string | null }[],
  exa: InstanceType<typeof Exa>,
  claude: Anthropic
): Promise<RelationshipDiscoveryOutput & { rawByCompany: Map<string, RawInvestor[]> }> {
  const sources: SourceRecord[] = [];
  const signals: DiscoverySignalCandidate[] = [];

  // rawByCompany lets the discovery agent correlate signals back to portfolio company IDs
  const rawByCompany = new Map<string, RawInvestor[]>();

  const today = new Date().toISOString().slice(0, 10);

  for (const company of portfolioCompanies) {
    const pages = await searchFundingNews(company.name, exa);
    if (pages.length === 0) continue;

    // Build SourceRecords
    for (const page of pages) {
      const sourceId = createHash("sha256")
        .update(`${page.url}|${today}`)
        .digest("hex")
        .slice(0, 16);

      if (!sources.find((s) => s.sourceId === sourceId)) {
        sources.push({
          sourceId,
          url: page.url,
          title: page.title,
          sourceType: page.url.includes("substack.com") ? "newsletter" : "news_article",
          retrievedAt: today,
        });
      }
    }

    const investors = await extractInvestors(company.name, pages, claude);
    const actionable = investors.filter((inv) => {
      const conf = confidenceFromSource(inv.sourceUrl);
      const sourceUse = sourceUseFromUrl(inv.sourceUrl);
      return sourceUse !== "candidate_only" && (conf === "high" || conf === "medium");
    });

    rawByCompany.set(company.name, actionable);

    for (const inv of actionable) {
      const sourceId =
        sources.find((s) => s.url === inv.sourceUrl)?.sourceId ??
        createHash("sha256").update(`${inv.sourceUrl}|${today}`).digest("hex").slice(0, 16);

      const tempId = createHash("sha256")
        .update(`${inv.fundName}|${company.name}|${inv.round}|${inv.date}`)
        .digest("hex")
        .slice(0, 16);

      signals.push({
        tempId,
        portfolioCompanyName: company.name,
        fundName: inv.fundName,
        signalType: "CO_INVESTMENT",
        signalDate: inv.date === "unknown" ? today : inv.date,
        sourceId,
        evidenceSnippet: inv.rawSnippet.slice(0, 300),
        confidence: confidenceFromSource(inv.sourceUrl),
        value: `${inv.fundName} co-invested in ${company.name} ${inv.round}${inv.amount ? ` (${inv.amount})` : ""}`,
        metadata: {
          roundName: inv.round,
          counterpartyName: company.name,
        },
      });
    }

    await sleep(500);
  }

  return { sources, signals, rawByCompany };
}
