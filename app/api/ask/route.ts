// POST /api/ask — natural language query routed to real MCP tools via Anthropic
// Claude picks the tool; we execute it against the Railway DB and return the answer as JSON.
// Turn 1: tool selection. Turn 2: answer generation with tool results injected.

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getInvestorByName, listStaleRelationships, searchRelationships } from "../../../lib/db";
import { TOOLS } from "../../../lib/ai-tools";
import type { Relationship } from "../../../lib/types";

const client = new Anthropic();

function toWarmthTier(s: string): "Hot" | "Warm" | "Stale" | "Cold" {
  const map: Record<string, "Hot" | "Warm" | "Stale" | "Cold"> = {
    hot: "Hot",
    warm: "Warm",
    stale: "Stale",
    cold: "Cold",
  };
  return map[s.toLowerCase()] ?? "Cold";
}

function formatDate(d: string | undefined): string {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function relToCard(r: Relationship) {
  return {
    id: r.id,
    fundName: r.fund?.name ?? "Unknown",
    warmthTier: toWarmthTier(r.warmthTier),
    company: r.portfolioCompany?.name ?? null,
    lastSignal: formatDate(r.lastSignalDate),
    signalCount: r.signals?.length ?? 0,
    suggestedAction: {
      Hot: "Active co-investor — prioritize for next round or event invite.",
      Warm: "Warming relationship — schedule a touchpoint in the next 30 days.",
      Stale: "Relationship has lapsed. Reconnect before they lead a round without you.",
      Cold: "No prior co-investment. Identify a warm intro path.",
    }[toWarmthTier(r.warmthTier)],
  };
}

export interface AskCard {
  id: string;
  fundName: string;
  warmthTier: "Hot" | "Warm" | "Stale" | "Cold";
  company: string | null;
  lastSignal: string;
  signalCount: number;
  suggestedAction: string;
}

export interface AskResponse {
  tool: string | null;
  query: string;
  answer: string;
  cards: AskCard[];
  error?: string;
}

const SYSTEM =
  "You are Abe's AI advisor for AlleyCorp's deep tech investor intelligence platform. " +
  "AlleyCorp is a deep tech venture firm. Today is June 2026.\n\n" +
  "FORMATTING RULES - follow exactly, no exceptions:\n" +
  "- No markdown. No asterisks, no bold (**), no underscores, no hyphens as dividers (---).\n" +
  "- No em dashes. Use a comma or period instead.\n" +
  "- Use plain section labels on their own line in ALL CAPS: RECOMMENDATIONS, RATIONALE, SUGGESTED ACTIONS.\n" +
  "- Bullet points: start each item with a hyphen and space (- ), one item per line.\n" +
  "- For network and relationship questions use this exact structure:\n" +
  "  RECOMMENDATIONS\n" +
  "  - Fund name: reason, evidence (last contact date, signal count, co-investment)\n" +
  "  RATIONALE\n" +
  "  One or two sentences on the overall pattern.\n" +
  "  SUGGESTED ACTIONS\n" +
  "  - Concrete next step\n\n" +
  "For non-network questions (greetings, general VC questions): respond conversationally, no sections.\n\n" +
  "Always be specific: names, dates, signal counts. No filler. Keep it tight.";

export async function POST(req: Request): Promise<NextResponse<AskResponse>> {
  try {
    const { query } = (await req.json()) as { query: string };
    if (!query?.trim()) {
      return NextResponse.json(
        { tool: null, query: "", answer: "Query required.", cards: [], error: "Query required" },
        { status: 400 }
      );
    }

    // Turn 1 — Claude decides whether to use a tool (auto) or answer directly
    const turn1 = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      tools: TOOLS,
      tool_choice: { type: "auto" },
      system: SYSTEM,
      messages: [{ role: "user", content: query }],
    });

    // If Claude answered directly (no tool needed — e.g. greetings, off-topic), return as-is
    const toolUseBlocks = turn1.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    );
    if (toolUseBlocks.length === 0) {
      const directAnswer = turn1.content.find((b) => b.type === "text");
      const answer =
        directAnswer?.type === "text"
          ? directAnswer.text
          : "I can help with questions about AlleyCorp's deep tech investor universe. Try asking about a specific fund or relationship.";
      return NextResponse.json({ tool: null, query, answer, cards: [] });
    }

    // Execute every tool Claude called (it may call more than one in parallel)
    const allRelationships: Relationship[] = [];
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    const primaryToolName = toolUseBlocks[0]?.name ?? null;

    for (const toolUse of toolUseBlocks) {
      const toolName = toolUse.name;
      const toolInput = toolUse.input as Record<string, string>;
      let relationships: Relationship[] = [];
      let toolResultText = "";

      if (toolName === "list_stale_relationships") {
        relationships = await listStaleRelationships();
        toolResultText =
          relationships.length === 0
            ? "No stale relationships found."
            : relationships
                .map((r) => {
                  const fund = r.fund?.name ?? "Unknown";
                  const company = r.portfolioCompany?.name ?? "Unknown";
                  const date = r.lastSignalDate ? formatDate(r.lastSignalDate) : "unknown date";
                  const signals = r.signals?.length ?? 0;
                  return `${fund} | last signal: ${date} | co-invested in: ${company} | signals: ${signals}`;
                })
                .join("\n");
      } else if (toolName === "search_relationships") {
        relationships = await searchRelationships(toolInput.query ?? query);
        toolResultText =
          relationships.length === 0
            ? `No results for "${toolInput.query ?? query}".`
            : relationships
                .map((r) => {
                  const fund = r.fund?.name ?? "Unknown";
                  const company = r.portfolioCompany?.name ?? null;
                  const signals = r.signals?.length ?? 0;
                  const parts = [
                    `${fund}`,
                    `warmth: ${r.warmthTier ?? "prospect"}`,
                    company ? `co-invested in: ${company}` : "no co-investment yet",
                    `signals: ${signals}`,
                    r.fund?.hqLocation ? `location: ${r.fund.hqLocation}` : null,
                    r.fund?.stage ? `stage: ${r.fund.stage}` : null,
                    r.fund?.checkSizeProxy ? `check size: ${r.fund.checkSizeProxy}` : null,
                    r.fund?.deepTechSignal ? `deep tech: ${r.fund.deepTechSignal}` : null,
                  ].filter(Boolean);
                  return parts.join(" | ");
                })
                .join("\n");
      } else if (toolName === "get_investor") {
        const rel = await getInvestorByName(toolInput.name ?? query);
        if (rel) {
          relationships = [rel];
          const signals = (rel.signals ?? [])
            .map((s) => `${s.type}: ${s.source} (${s.date})`)
            .join("; ");
          toolResultText = [
            `Fund: ${rel.fund?.name}`,
            `Warmth: ${rel.warmthTier}`,
            `Co-invested in: ${rel.portfolioCompany?.name ?? "N/A"}`,
            `Last signal: ${formatDate(rel.lastSignalDate)}`,
            `Signal history: ${signals || "none"}`,
          ].join("\n");
        } else {
          toolResultText = `No fund found matching "${toolInput.name ?? query}".`;
        }
      }

      allRelationships.push(...relationships);
      toolResults.push({ type: "tool_result", tool_use_id: toolUse.id, content: toolResultText });
    }

    // Turn 2 — Claude synthesizes tool results into a final answer.
    // tool_choice: none forces a text response and prevents "No answer generated."
    const turn2 = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      tools: TOOLS,
      tool_choice: { type: "none" },
      system: SYSTEM,
      messages: [
        { role: "user", content: query },
        { role: "assistant", content: turn1.content },
        { role: "user", content: toolResults },
      ],
    });

    const answerBlock = turn2.content.find((b) => b.type === "text");
    const answer = answerBlock?.type === "text" ? answerBlock.text : "No answer generated.";

    return NextResponse.json({
      tool: primaryToolName,
      query,
      answer,
      cards: allRelationships.map(relToCard),
    });
  } catch (err) {
    console.error("[POST /api/ask]", err);
    return NextResponse.json(
      {
        tool: null,
        query: "",
        answer: "Something went wrong. Please try again.",
        cards: [],
        error: String(err),
      },
      { status: 500 }
    );
  }
}
