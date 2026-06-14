/**
 * Shared enrichment utilities used by:
 *   scripts/enrich-funds.ts  — weekly contact refresh
 *   scripts/discovery-agent.ts — daily discovery agent
 *
 * All functions accept Exa and Anthropic clients as parameters so callers
 * control instantiation and the functions remain testable.
 */

import type Exa from "exa-js";
import type Anthropic from "@anthropic-ai/sdk";
import { confidenceFromUrl } from "./source-policy";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LinkedInResult {
  url: string;
  title: string;
  snippet: string;
}

export interface ExtractedContact {
  name: string;
  role: string;
  linkedinUrl: string;
}

export type ConfidenceLevel = "high" | "medium" | "low";

// ── Source confidence ─────────────────────────────────────────────────────────

export function confidenceFromSource(url: string): ConfidenceLevel {
  return confidenceFromUrl(url);
}

// ── Warmth from signal date ───────────────────────────────────────────────────

export function warmthFromDate(dateStr: string): {
  tier: "hot" | "warm" | "stale" | "cold";
  reason: string;
} {
  if (!dateStr || dateStr === "unknown") {
    return { tier: "cold", reason: "No date found — cannot determine recency" };
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    return { tier: "cold", reason: `Could not parse date: ${dateStr}` };
  }
  const now = new Date();
  const monthsAgo = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24 * 30.5);
  if (monthsAgo <= 12)
    return { tier: "hot", reason: `Signal ${Math.round(monthsAgo)}mo ago — active relationship` };
  if (monthsAgo <= 24)
    return { tier: "warm", reason: `Signal ${Math.round(monthsAgo)}mo ago — warm but monitor` };
  return { tier: "stale", reason: `Signal ${Math.round(monthsAgo)}mo ago — relationship cooling` };
}

// ── Logo URL via Google favicon service ───────────────────────────────────────
// Google's favicon API is free, reliable, and works for any domain including
// VC fund sites that Clearbit doesn't index.

export function buildLogoUrl(website: string): string {
  const domain = website
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0];
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

// ── LinkedIn search via Exa ───────────────────────────────────────────────────

export async function searchLinkedIn(
  fundName: string,
  exa: InstanceType<typeof Exa>
): Promise<LinkedInResult[]> {
  const query = `"${fundName}" managing partner OR general partner`;
  try {
    const results = await exa.search(query, {
      type: "neural",
      numResults: 5,
      contents: { highlights: true },
      includeDomains: ["linkedin.com"],
    });
    return results.results
      .map((r) => ({
        url: r.url,
        title: r.title ?? "",
        snippet: (r as unknown as { highlights?: string[] }).highlights?.join(" ") ?? "",
      }))
      .filter((r) => r.url.includes("linkedin.com/in/"));
  } catch (err) {
    console.error(`   ✗ Exa LinkedIn search failed for "${fundName}": ${err}`);
    return [];
  }
}

// ── Claude tool schema for contact extraction ─────────────────────────────────

export const EXTRACT_CONTACTS_TOOL: Anthropic.Tool = {
  name: "extract_contacts",
  description:
    "Extract the most senior partners at this VC fund from LinkedIn search results. Only include people explicitly shown in the results. Return empty array if nothing found.",
  input_schema: {
    type: "object" as const,
    properties: {
      contacts: {
        type: "array",
        description: "Partners found. Max 2. Empty array if none.",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "Full name of the person." },
            role: {
              type: "string",
              description: "Their exact title as shown on LinkedIn.",
            },
            linkedinUrl: {
              type: "string",
              description: "Full LinkedIn profile URL.",
            },
          },
          required: ["name", "role", "linkedinUrl"],
        },
      },
    },
    required: ["contacts"],
  },
};

// ── Extract contacts via Claude tool_use ──────────────────────────────────────

export async function extractContacts(
  fundName: string,
  pages: LinkedInResult[],
  claude: Anthropic
): Promise<ExtractedContact[]> {
  if (pages.length === 0) return [];

  const prompt = `Extract the most senior partners at "${fundName}" from these LinkedIn search results.

Rules:
- Only include people explicitly shown in the results
- Prefer Managing Partner, General Partner, or Partner titles
- Max 2 people — most senior only
- Use the exact LinkedIn URL from the result
- Call extract_contacts with empty array if nothing useful found

Search results:
${pages.map((p, i) => `[${i + 1}] ${p.title}\n${p.url}\n${p.snippet}`).join("\n\n")}`;

  try {
    const response = await claude.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      tools: [EXTRACT_CONTACTS_TOOL],
      tool_choice: { type: "tool", name: "extract_contacts" },
      messages: [{ role: "user", content: prompt }],
    });
    const toolUse = response.content.find((b) => b.type === "tool_use") as
      | Anthropic.ToolUseBlock
      | undefined;
    if (!toolUse) return [];
    const input = toolUse.input as { contacts: ExtractedContact[] };
    return input.contacts ?? [];
  } catch (err) {
    console.error(`   ✗ Claude contact extraction failed for "${fundName}": ${err}`);
    return [];
  }
}
