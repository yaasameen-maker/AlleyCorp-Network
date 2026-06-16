/**
 * Investor Prospect Discovery — Phase 1
 *
 * Report-only scraper/adapter for the broader deep tech investor universe.
 * It searches public lead sources and the web, enriches against official/profile
 * sources when possible, and writes candidate JSON that can be passed to:
 *
 *   npm run import:prospects -- --input .agent-runs/<report>.json
 *
 * This script never writes to the database.
 *
 * Usage:
 *   npm run discover:prospects -- --quick
 *   npm run discover:prospects -- --max-targets=10
 *   npm run discover:prospects -- --query="defense tech venture capital firm"
 *   npm run discover:prospects -- --out-dir=agent-runs
 */

import dotenv from "dotenv";
dotenv.config({ override: true });

import Anthropic from "@anthropic-ai/sdk";
import Exa from "exa-js";
import { createHash } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import {
  reviewInvestorProspectCandidate,
  type InvestorProspectCandidate,
  type ProspectEvidenceField,
  type ProspectFieldEvidence,
  type ReviewedInvestorProspect,
} from "../lib/investor-prospect-policy.js";
import { hostnameFromUrl, isCandidateOnlySource, sourceNameFromUrl } from "../lib/source-policy.js";
import { pool } from "../lib/db.js";

interface SearchPage {
  url: string;
  title: string;
  snippet: string;
}

interface LeadProspect {
  fundName: string;
  aliases?: string[];
  website?: string;
  discoverySourceUrl: string;
  discoverySourceTitle?: string;
  rawSnippet: string;
}

interface ReportCandidate extends ReviewedInvestorProspect {
  qualityWarnings: string[];
}

const DEFAULT_QUERIES = [
  "deep tech venture capital firm United States",
  "hard tech VC firm aerospace robotics defense US",
  "frontier technology venture fund New York Boston",
  "deep tech investors seed series A Silicon Valley",
  "defense tech venture capital firm US-based",
  "deep tech venture capital Europe international",
];

const LEAD_SOURCE_DOMAINS = [
  "openvc.app",
  "differentfunds.com",
  "deeptechvclist.com",
  "hellotomorrow.org",
  "vcsheet.com",
  "alleycorp.substack.com",
  "techcrunch.com",
  "prnewswire.com",
  "businesswire.com",
];

const HARD_MAX_TARGETS = 10;
const HARD_MAX_RESULTS_PER_QUERY = 6;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const idx = process.argv.indexOf(`--${name}`);
  return idx >= 0 ? process.argv[idx + 1] : undefined;
}

function boundedNumberArg(name: string, fallback: number, max: number): number {
  const value = Number(getArg(name));
  const parsed = Number.isFinite(value) && value > 0 ? value : fallback;
  return Math.min(parsed, max);
}

function uniqueByUrl(pages: SearchPage[]): SearchPage[] {
  const seen = new Map<string, SearchPage>();
  for (const page of pages) {
    if (!page.url || seen.has(page.url)) continue;
    seen.set(page.url, page);
  }
  return [...seen.values()];
}

function normalizeUrl(url: string | undefined): string | undefined {
  if (!url?.trim()) return undefined;
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return undefined;
  }
}

function sourceLabel(url: string): string {
  const name = sourceNameFromUrl(url);
  return name || hostnameFromUrl(url);
}

function isUnknownValue(value: string | null | undefined): boolean {
  if (value === null || value === undefined) return true;
  return !value.trim() || /\bunknown\b|verify before/i.test(value);
}

function fieldValue(
  candidate: InvestorProspectCandidate,
  field: ProspectEvidenceField
): string | null | undefined {
  return candidate[field];
}

function significantFundTokens(fundName: string): string[] {
  return fundName
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(
      (token) =>
        token.length >= 3 &&
        !["capital", "ventures", "venture", "partners", "fund", "management"].includes(token)
    );
}

function isOfficialWebsiteSource(sourceUrl: string, website: string | undefined): boolean {
  if (!website) return false;
  return hostnameFromUrl(sourceUrl) === hostnameFromUrl(website);
}

function textContainsFundToken(text: string, fundName: string): boolean {
  const tokens = significantFundTokens(fundName);
  if (tokens.length === 0) return true;
  const lower = text.toLowerCase();
  return tokens.some((token) => lower.includes(token));
}

function qualityWarnings(candidate: ReviewedInvestorProspect): string[] {
  const warnings: string[] = [];
  const fields: ProspectEvidenceField[] = [
    "teamLocation",
    "stageFocus",
    "geographyFocus",
    "aumTier",
    "checkSizeProxy",
    "deepTechEvidence",
  ];
  const unknownFields = fields.filter((field) => isUnknownValue(fieldValue(candidate, field)));
  const evidenceText = [
    candidate.deepTechEvidence ?? "",
    ...(candidate.fieldEvidence ?? []).map((evidence) => evidence.rawSnippet),
  ]
    .join(" ")
    .toLowerCase();
  const fundTokens = significantFundTokens(candidate.fundName);

  if (candidate.status === "accepted_for_market_map" && unknownFields.length > 0) {
    warnings.push(`accepted with unknown fields: ${unknownFields.join(", ")}`);
  }

  if (/\blorem ipsum\b|placeholder|sample text|dummy text/i.test(evidenceText)) {
    warnings.push("source evidence contains placeholder text");
  }

  if (
    candidate.status === "accepted_for_market_map" &&
    fundTokens.length > 0 &&
    !textContainsFundToken(evidenceText, candidate.fundName)
  ) {
    warnings.push("fund name is not visible in captured evidence snippets");
  }

  if (candidate.website) {
    const officialEvidence = (candidate.fieldEvidence ?? []).filter((evidence) =>
      isOfficialWebsiteSource(evidence.sourceUrl, candidate.website)
    );
    const officialEvidenceText = officialEvidence.map((evidence) => evidence.rawSnippet).join(" ");
    if (
      officialEvidence.length > 0 &&
      !textContainsFundToken(officialEvidenceText, candidate.fundName)
    ) {
      warnings.push("official website evidence does not name the fund");
    }
  }

  const candidateOnlyEvidence = (candidate.fieldEvidence ?? []).filter((evidence) =>
    isCandidateOnlySource(evidence.sourceUrl)
  );
  if (candidateOnlyEvidence.length > 0) {
    warnings.push("field evidence includes candidate-only sources");
  }

  return warnings;
}

function applyQualityGate(candidate: InvestorProspectCandidate): ReportCandidate {
  const baseReview = reviewInvestorProspectCandidate(candidate);
  const warnings = qualityWarnings(baseReview);
  const warningGatedReview = reviewInvestorProspectCandidate({
    ...candidate,
    qualityWarnings: warnings,
  });
  return {
    ...warningGatedReview,
    qualityWarnings: warnings,
  };
}

const EXTRACT_LEADS_TOOL: Anthropic.Tool = {
  name: "extract_investor_leads",
  description: "Extract candidate deep tech investor leads from search results.",
  input_schema: {
    type: "object" as const,
    properties: {
      prospects: {
        type: "array",
        items: {
          type: "object",
          properties: {
            fundName: {
              type: "string",
              description: "Exact investor/fund name as written in the source.",
            },
            aliases: {
              type: "array",
              items: { type: "string" },
              description: "Known alternate names explicitly visible in the source.",
            },
            website: {
              type: "string",
              description: "Official website only if explicitly visible in the source.",
            },
            discoverySourceUrl: { type: "string" },
            discoverySourceTitle: { type: "string" },
            rawSnippet: {
              type: "string",
              description:
                "Exact quote or close source snippet showing this is a deep tech/frontier/hard tech investor.",
            },
          },
          required: ["fundName", "discoverySourceUrl", "rawSnippet"],
        },
      },
    },
    required: ["prospects"],
  },
};

const EXTRACT_PROFILE_TOOL: Anthropic.Tool = {
  name: "extract_investor_profile_candidate",
  description:
    "Extract source-backed investor profile fields. Missing or unsupported fields must be omitted or set to null — never use placeholder text.",
  input_schema: {
    type: "object" as const,
    properties: {
      fundName: { type: "string" },
      aliases: { type: "array", items: { type: "string" } },
      website: { type: "string" },
      teamLocation: { type: "string" },
      stageFocus: { type: "string" },
      geographyFocus: { type: "string" },
      aumTier: { type: "string" },
      checkSizeProxy: { type: "string" },
      deepTechEvidence: { type: "string" },
      profileSourceUrls: { type: "array", items: { type: "string" } },
      fieldEvidence: {
        type: "array",
        items: {
          type: "object",
          properties: {
            field: {
              type: "string",
              enum: [
                "teamLocation",
                "stageFocus",
                "geographyFocus",
                "aumTier",
                "checkSizeProxy",
                "deepTechEvidence",
              ],
            },
            sourceUrl: { type: "string" },
            sourceTitle: { type: "string" },
            rawSnippet: {
              type: "string",
              description: "Exact quote or close source snippet supporting the field.",
            },
          },
          required: ["field", "sourceUrl", "rawSnippet"],
        },
      },
    },
    required: [
      "fundName",
      "website",
      "teamLocation",
      "stageFocus",
      "geographyFocus",
      "aumTier",
      "checkSizeProxy",
      "deepTechEvidence",
      "profileSourceUrls",
      "fieldEvidence",
    ],
  },
};

// Strips generic VC suffixes so "Starburst" and "Starburst Ventures" compare equal.
function normalizeForDedup(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(ventures?|capital|partners?|fund|management|llc|lp|inc\.?)\b/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

interface KnownFundIdentifiers {
  normalizedNames: Set<string>;
  hostnames: Set<string>;
}

async function fetchKnownFundIdentifiers(): Promise<KnownFundIdentifiers> {
  try {
    const result = await pool.query<{ name: string; website: string | null }>(
      "SELECT name, website FROM fund"
    );
    const normalizedNames = new Set(result.rows.map((r) => normalizeForDedup(r.name)));
    const hostnames = new Set(
      result.rows
        .map((r) => (r.website ? hostnameFromUrl(r.website) : null))
        .filter((h): h is string => !!h)
    );
    return { normalizedNames, hostnames };
  } catch (err) {
    console.warn("Could not fetch known funds from DB — skipping dedup filter:", err);
    return { normalizedNames: new Set(), hostnames: new Set() };
  }
}

function isKnownFund(lead: LeadProspect, known: KnownFundIdentifiers): boolean {
  if (known.normalizedNames.has(normalizeForDedup(lead.fundName))) return true;
  if (lead.website && known.hostnames.has(hostnameFromUrl(lead.website))) return true;
  return false;
}

const SEC_USER_AGENT = "AlleyCorp/ResearchTool research@alleycorp.com";

interface SecFilingInfo {
  entityName: string;
  cik: string;
  accessionId: string;
  fileNum: string;
  period: string;
}

async function searchSecFiling(fundName: string): Promise<SecFilingInfo | null> {
  const q = encodeURIComponent(`"${fundName}"`);
  const url = `https://efts.sec.gov/LATEST/search-index?q=${q}&forms=ADV&dateRange=custom&startdt=2020-01-01&enddt=2027-01-01`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": SEC_USER_AGENT } });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      hits?: {
        hits?: Array<{
          _id?: string;
          _source?: { entity_name?: string; file_num?: string; period_of_report?: string };
        }>;
      };
    };
    const hits = data?.hits?.hits ?? [];
    if (hits.length === 0) return null;

    const normalizedQuery = normalizeForDedup(fundName);
    const match =
      hits.find((h) => {
        const name = h._source?.entity_name ?? "";
        const normalizedName = normalizeForDedup(name);
        return normalizedName.includes(normalizedQuery) || normalizedQuery.includes(normalizedName);
      }) ?? hits[0];

    const raw = match._id?.replace(/-/g, "") ?? "";
    const cik = raw.slice(0, 10).replace(/^0+/, "");
    return {
      entityName: match._source?.entity_name ?? fundName,
      cik,
      accessionId: raw,
      fileNum: match._source?.file_num ?? "",
      period: match._source?.period_of_report ?? "",
    };
  } catch {
    return null;
  }
}

async function fetchSecAdvText(
  info: SecFilingInfo
): Promise<{ text: string; docUrl: string } | null> {
  const indexUrl = `https://www.sec.gov/Archives/edgar/data/${info.cik}/${info.accessionId}/${info.accessionId}-index.json`;
  try {
    const idxRes = await fetch(indexUrl, { headers: { "User-Agent": SEC_USER_AGENT } });
    if (!idxRes.ok) return null;
    const idx = (await idxRes.json()) as {
      directory?: { item?: Array<{ name?: string; type?: string }> };
    };
    const items = idx?.directory?.item ?? [];
    const doc =
      items.find((item) => /adv/i.test(item.name ?? "")) ??
      items.find((item) => /\.htm$/i.test(item.name ?? "")) ??
      items.find((item) => /\.txt$/i.test(item.name ?? ""));
    if (!doc?.name) return null;

    const docUrl = `https://www.sec.gov/Archives/edgar/data/${info.cik}/${info.accessionId}/${doc.name}`;
    const docRes = await fetch(docUrl, { headers: { "User-Agent": SEC_USER_AGENT } });
    if (!docRes.ok) return null;

    const raw = await docRes.text();
    const lower = raw.toLowerCase();
    const idx2 = lower.indexOf("regulatory assets under management");
    const excerpt =
      idx2 >= 0 ? raw.slice(Math.max(0, idx2 - 300), idx2 + 3000) : raw.slice(0, 4000);
    return { text: excerpt, docUrl };
  } catch {
    return null;
  }
}

async function extractAumFromSecText(
  claude: Anthropic,
  fundName: string,
  info: SecFilingInfo,
  text: string,
  docUrl: string
): Promise<{ aumTier: string; evidence: ProspectFieldEvidence } | null> {
  const response = await claude.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Extract the regulatory assets under management (AUM) for "${fundName}" from this SEC Form ADV filing excerpt.

Return a JSON object with exactly two fields:
- "aumTier": a short description like "$50M–$250M AUM" or "$1B+ AUM" based on the dollar amount in the filing. Use the regulatory AUM figure.
- "rawSnippet": the exact sentence or clause from the filing that states the AUM amount.

If the AUM figure cannot be found, return the JSON: {"aumTier": null, "rawSnippet": null}

Filing excerpt (period: ${info.period}):
${text}`,
      },
    ],
  });

  const textContent = response.content.find((b) => b.type === "text")?.text ?? "";
  try {
    const match = textContent.match(/\{[\s\S]*?\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]) as { aumTier?: string | null; rawSnippet?: string | null };
    if (!parsed.aumTier || !parsed.rawSnippet) return null;
    return {
      aumTier: parsed.aumTier,
      evidence: {
        field: "aumTier",
        sourceUrl: docUrl,
        sourceTitle: `SEC Form ADV — ${info.entityName} (${info.period})`,
        rawSnippet: parsed.rawSnippet,
      },
    };
  } catch {
    return null;
  }
}

async function searchLeadPages(
  exa: InstanceType<typeof Exa>,
  queries: string[],
  numResults: number
): Promise<SearchPage[]> {
  const pages: SearchPage[] = [];

  for (const query of queries) {
    console.log(`Search leads: ${query}`);
    const results = await exa.search(query, {
      type: "auto",
      numResults,
      contents: { highlights: true },
      includeDomains: LEAD_SOURCE_DOMAINS,
    });

    for (const result of results.results) {
      const highlights = (result as unknown as { highlights?: string[] }).highlights ?? [];
      pages.push({
        url: result.url,
        title: result.title ?? "",
        snippet: highlights.join(" "),
      });
    }
    await sleep(300);
  }

  return uniqueByUrl(pages);
}

async function extractLeadProspects(
  claude: Anthropic,
  pages: SearchPage[],
  maxTargets: number,
  known: KnownFundIdentifiers
): Promise<LeadProspect[]> {
  if (pages.length === 0) return [];

  const prompt = `Extract candidate deep tech / hard tech / frontier technology VC funds from these search results.

Rules:
- Only include actual investors/funds explicitly named in a source.
- Do not invent websites, locations, AUM, stages, or portfolio data.
- Open directories are lead sources only.
- Prefer funds that invest in deep tech, hard tech, aerospace, defense, robotics, industrials, frontier technology, climate infrastructure, or physical economy.
- Return at most ${maxTargets} prospects.

Search results:
${pages.map((p, i) => `[${i + 1}] ${p.title}\n${p.url}\n${p.snippet}`).join("\n\n")}`;

  const response = await claude.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    tools: [EXTRACT_LEADS_TOOL],
    tool_choice: { type: "tool", name: "extract_investor_leads" },
    messages: [{ role: "user", content: prompt }],
  });

  const toolUse = response.content.find((block) => block.type === "tool_use") as
    | Anthropic.ToolUseBlock
    | undefined;
  if (!toolUse) return [];

  const input = toolUse.input as { prospects?: unknown };
  const prospects = Array.isArray(input.prospects) ? (input.prospects as LeadProspect[]) : [];
  const filtered = prospects.filter((prospect) => {
    if (!prospect.fundName?.trim() || !prospect.discoverySourceUrl?.trim()) return false;
    if (isKnownFund(prospect, known)) {
      console.log(`  skip (already known): ${prospect.fundName}`);
      return false;
    }
    return true;
  });
  return filtered.slice(0, maxTargets);
}

async function fetchWithJina(url: string): Promise<string | null> {
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: { Accept: "text/markdown", "X-Return-Format": "markdown" },
    });
    if (!res.ok) return null;
    const text = await res.text();
    return text.slice(0, 5000);
  } catch {
    return null;
  }
}

async function searchProfilePages(
  exa: InstanceType<typeof Exa>,
  lead: LeadProspect,
  numResults: number
): Promise<SearchPage[]> {
  const website = normalizeUrl(lead.website);
  const domains = website ? [hostnameFromUrl(website)] : undefined;
  const queries = [
    `"${lead.fundName}" official website venture capital`,
    `"${lead.fundName}" portfolio team stage AUM`,
    `"${lead.fundName}" deep tech portfolio`,
  ];
  const pages: SearchPage[] = [];

  if (website) {
    const jinaContent = await fetchWithJina(website);
    pages.push({
      url: website,
      title: `${lead.fundName} official website`,
      snippet: jinaContent ?? "",
    });
    await sleep(300);
  }

  for (const query of queries) {
    const results = await exa.search(query, {
      type: "auto",
      numResults,
      contents: { text: { maxCharacters: 2000 } },
      includeDomains: domains,
    });

    for (const result of results.results) {
      pages.push({
        url: result.url,
        title: result.title ?? "",
        snippet: result.text ?? "",
      });
    }
    await sleep(300);
  }

  return uniqueByUrl(pages);
}

// Clear any profile field that has a real value but no matching fieldEvidence entry.
// Enforces the rule in code rather than relying on Claude to follow it in the prompt.
function enforceFieldEvidenceCoverage(
  candidate: InvestorProspectCandidate,
  evidence: ProspectFieldEvidence[]
): Partial<InvestorProspectCandidate> {
  const coveredFields = new Set(evidence.map((e) => e.field as ProspectEvidenceField));
  const overrides: Partial<InvestorProspectCandidate> = {};
  const fields: ProspectEvidenceField[] = [
    "teamLocation",
    "stageFocus",
    "geographyFocus",
    "aumTier",
    "checkSizeProxy",
    "deepTechEvidence",
  ];
  for (const field of fields) {
    const value = candidate[field];
    if (!isUnknownValue(value) && !coveredFields.has(field)) {
      overrides[field] = null;
    }
  }
  return overrides;
}

const PLACEHOLDER_PATTERN = /\blorem ipsum\b|placeholder|sample text|dummy text/i;

function sanitizeFieldEvidence(
  evidence: ProspectFieldEvidence[] | undefined,
  pages: SearchPage[]
): ProspectFieldEvidence[] {
  if (!Array.isArray(evidence)) return [];
  const knownUrls = new Set(pages.map((page) => page.url));
  return evidence.filter((item) => {
    const field = item.field as ProspectEvidenceField;
    return (
      field &&
      item.sourceUrl?.trim() &&
      item.rawSnippet?.trim() &&
      knownUrls.has(item.sourceUrl) &&
      !PLACEHOLDER_PATTERN.test(item.rawSnippet)
    );
  });
}

async function extractProfileCandidate(
  claude: Anthropic,
  lead: LeadProspect,
  profilePages: SearchPage[]
): Promise<InvestorProspectCandidate> {
  const website = normalizeUrl(lead.website);
  const sourceList = [lead.discoverySourceUrl, ...profilePages.map((page) => page.url)];
  const profileSourceUrls = [...new Set(sourceList.filter(Boolean))];

  const fallback: InvestorProspectCandidate = {
    fundName: lead.fundName,
    aliases: lead.aliases ?? [],
    website,
    discoverySourceUrl: lead.discoverySourceUrl,
    discoverySourceTitle: lead.discoverySourceTitle ?? sourceLabel(lead.discoverySourceUrl),
    deepTechEvidence: lead.rawSnippet,
    profileSourceUrls,
    fieldEvidence: [
      {
        field: "deepTechEvidence",
        sourceUrl: lead.discoverySourceUrl,
        sourceTitle: lead.discoverySourceTitle,
        rawSnippet: lead.rawSnippet,
      },
    ],
  };

  if (profilePages.length === 0) return fallback;

  const prompt = `Build a source-backed investor prospect candidate for "${lead.fundName}".

Rules:
- Missing data is acceptable. Fabricated or inferred data is not.
- Only populate a field when you can copy a verbatim excerpt directly from the source page that explicitly supports it.
- Never paraphrase, summarize, rewrite, or infer evidence. The rawSnippet must be text copied directly from the source — not your own words.
- If no verbatim excerpt exists for a field, return null for that field and omit the fieldEvidence entry. Do not guess.
- CRITICAL: Every non-null field MUST have a matching fieldEvidence entry. The rawSnippet must be a verbatim excerpt from the sourceUrl. Evidence entries with paraphrased or generated text will be rejected.
- The fund name ("${lead.fundName}") should appear somewhere in the rawSnippet whenever the source reasonably names it.
- Reject snippets that sound like summaries or descriptions you wrote rather than text you copied.
- Use the official fund website only when the URL clearly belongs to the fund.
- Candidate-only directories may surface a fund name but cannot be the sole evidence for any profile field.
- Minimum useful snippet length is ~30 characters. Single-sentence or shorter excerpts are acceptable only if they directly state the fact.

Correct example (two fields, real copied text):
  teamLocation: "Austin, TX"
  stageFocus: "Seed to Series A"
  fieldEvidence: [
    { field: "teamLocation", sourceUrl: "https://fund.com/about", rawSnippet: "Fund XYZ is headquartered in Austin, TX with an additional office in Washington, D.C." },
    { field: "stageFocus", sourceUrl: "https://fund.com/approach", rawSnippet: "We invest at the Seed and Series A stages in companies building..." }
  ]

Wrong example (paraphrased summaries — never do this):
  teamLocation: "New York"
  fieldEvidence: [{ field: "teamLocation", sourceUrl: "https://fund.com", rawSnippet: "Fund XYZ is based in New York and invests in defense technology." }]
  ← wrong if "Fund XYZ is based in New York" does not appear verbatim in the source

Lead:
${JSON.stringify(lead, null, 2)}

Profile/search pages:
${profilePages.map((p, i) => `[${i + 1}] ${p.title}\n${p.url}\n${p.snippet}`).join("\n\n")}`;

  const response = await claude.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    tools: [EXTRACT_PROFILE_TOOL],
    tool_choice: { type: "tool", name: "extract_investor_profile_candidate" },
    messages: [{ role: "user", content: prompt }],
  });

  const toolUse = response.content.find((block) => block.type === "tool_use") as
    | Anthropic.ToolUseBlock
    | undefined;
  if (!toolUse) return fallback;

  const extracted = toolUse.input as Omit<
    InvestorProspectCandidate,
    "discoverySourceUrl" | "discoverySourceTitle"
  >;
  const extractedWebsite = normalizeUrl(extracted.website) ?? website;
  const allFetchedPages = [
    ...profilePages,
    {
      url: lead.discoverySourceUrl,
      title: lead.discoverySourceTitle ?? "",
      snippet: lead.rawSnippet,
    },
  ];
  const fetchedUrls = new Set(allFetchedPages.map((p) => p.url));
  // Only keep profileSourceUrls that were actually fetched — prevents Claude from
  // hallucinating citations to pages it never saw.
  const extractedProfileSources = (extracted.profileSourceUrls ?? [])
    .map(normalizeUrl)
    .filter((url): url is string => !!url && fetchedUrls.has(url));

  const sanitizedEvidence = sanitizeFieldEvidence(extracted.fieldEvidence, allFetchedPages);
  const uncoveredOverrides = enforceFieldEvidenceCoverage(
    { ...fallback, ...extracted } as InvestorProspectCandidate,
    sanitizedEvidence
  );
  const baseCandidate: InvestorProspectCandidate = {
    ...fallback,
    ...extracted,
    ...uncoveredOverrides,
    fundName: extracted.fundName?.trim() || lead.fundName,
    aliases: extracted.aliases ?? lead.aliases ?? [],
    website: extractedWebsite,
    discoverySourceUrl: lead.discoverySourceUrl,
    discoverySourceTitle: lead.discoverySourceTitle ?? sourceLabel(lead.discoverySourceUrl),
    profileSourceUrls: [...new Set([...profileSourceUrls, ...extractedProfileSources])],
    fieldEvidence: sanitizedEvidence,
  };

  // If AUM is still unknown, try SEC EFTS → ADV filing → Claude extraction.
  if (isUnknownValue(baseCandidate.aumTier)) {
    const secInfo = await searchSecFiling(lead.fundName);
    await sleep(300);
    if (secInfo) {
      const secDoc = await fetchSecAdvText(secInfo);
      await sleep(300);
      if (secDoc) {
        const aumResult = await extractAumFromSecText(
          claude,
          lead.fundName,
          secInfo,
          secDoc.text,
          secDoc.docUrl
        );
        if (aumResult) {
          return {
            ...baseCandidate,
            aumTier: aumResult.aumTier,
            profileSourceUrls: [
              ...new Set([...(baseCandidate.profileSourceUrls ?? []), secDoc.docUrl]),
            ],
            // SEC doc is added as a trusted page so sanitizeFieldEvidence allows it.
            fieldEvidence: [...(baseCandidate.fieldEvidence ?? []), aumResult.evidence],
          };
        }
      }
    }
  }

  return baseCandidate;
}

async function writeReport(
  candidates: InvestorProspectCandidate[],
  leadPages: SearchPage[],
  outDir: string
) {
  const endedAt = new Date().toISOString();
  const reviewed = candidates.map(applyQualityGate);
  const candidatesWithWarnings = reviewed.filter(
    (candidate) => candidate.qualityWarnings.length > 0
  ).length;
  const isCleanDryRun =
    reviewed.length > 0 &&
    candidatesWithWarnings === 0 &&
    reviewed.every((candidate) => candidate.status === "accepted_for_market_map");
  const report = {
    agent: "investor-prospect-discovery",
    phase: "phase_1_report_only",
    mode: "dry_run_no_db_writes",
    endedAt,
    summary: {
      leadPages: leadPages.length,
      totalCandidates: reviewed.length,
      acceptedForMarketMap: reviewed.filter(
        (candidate) => candidate.status === "accepted_for_market_map"
      ).length,
      candidateOnly: reviewed.filter((candidate) => candidate.status === "candidate_only").length,
      rejected: reviewed.filter((candidate) => candidate.status === "rejected").length,
      candidateOnlySources: leadPages.filter((page) => isCandidateOnlySource(page.url)).length,
      candidatesWithWarnings,
      isCleanDryRun,
    },
    candidates: reviewed,
    leadPages,
  };

  await mkdir(outDir, { recursive: true });
  const hash = createHash("sha256")
    .update(JSON.stringify(candidates.map((candidate) => candidate.fundName)))
    .digest("hex")
    .slice(0, 8);
  const fileName = `${outDir.replace(/\/$/, "")}/investor-prospect-discovery-${endedAt.replace(/[:.]/g, "-")}-${hash}.json`;
  await writeFile(fileName, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return { fileName, report };
}

async function run() {
  if (!process.env.EXA_API_KEY) throw new Error("Missing EXA_API_KEY");
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Missing ANTHROPIC_API_KEY");

  const quick = process.argv.includes("--quick");
  const maxTargets = boundedNumberArg("max-targets", quick ? 3 : 10, HARD_MAX_TARGETS);
  const numResults = boundedNumberArg("num-results", quick ? 4 : 6, HARD_MAX_RESULTS_PER_QUERY);
  const outDir = getArg("out-dir") ?? ".agent-runs";
  const queryArg = getArg("query");
  const queries = queryArg
    ? [queryArg]
    : DEFAULT_QUERIES.slice(0, quick ? 2 : DEFAULT_QUERIES.length);

  const exa = new Exa(process.env.EXA_API_KEY);
  const claude = new Anthropic();

  console.log("=== Investor Prospect Discovery — Phase 1 ===");
  console.log("Mode: report-only, no DB writes");
  console.log(`Queries: ${queries.length}`);
  console.log(`Max targets: ${maxTargets}`);
  console.log(`Results/query: ${numResults}`);
  console.log(`Output dir: ${outDir}`);

  const known = await fetchKnownFundIdentifiers();
  console.log(`Known funds in DB: ${known.normalizedNames.size}`);

  const leadPages = await searchLeadPages(exa, queries, numResults);
  console.log(`Lead pages: ${leadPages.length}`);

  const leads = await extractLeadProspects(claude, leadPages, maxTargets, known);
  console.log(`Lead prospects (after dedup): ${leads.length}`);

  const candidates: InvestorProspectCandidate[] = [];
  for (const lead of leads) {
    console.log(`\n→ ${lead.fundName}`);
    const profilePages = await searchProfilePages(exa, lead, Math.min(numResults, 4));
    console.log(`  profile pages: ${profilePages.length}`);
    const candidate = await extractProfileCandidate(claude, lead, profilePages);
    const reviewed = applyQualityGate(candidate);
    console.log(`  status: ${reviewed.status}`);
    if (reviewed.rejectionReasons.length > 0) {
      console.log(`  reasons: ${reviewed.rejectionReasons.join("; ")}`);
    }
    const warnings = qualityWarnings(reviewed);
    if (warnings.length > 0) {
      console.log(`  warnings: ${warnings.join("; ")}`);
    }
    candidates.push(candidate);
  }

  const { fileName, report } = await writeReport(candidates, leadPages, outDir);
  console.log("\n=== Summary ===");
  console.log(`Accepted for market map: ${report.summary.acceptedForMarketMap}`);
  console.log(`Candidate-only leads:    ${report.summary.candidateOnly}`);
  console.log(`Rejected:                ${report.summary.rejected}`);
  console.log(`Candidates with warnings:${report.summary.candidatesWithWarnings}`);
  console.log(`Run report:              ${fileName}`);
  console.log("\nNext:");
  console.log(`npm run import:prospects -- --input ${fileName}`);
}

run()
  .catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
  })
  .finally(() => pool.end());
