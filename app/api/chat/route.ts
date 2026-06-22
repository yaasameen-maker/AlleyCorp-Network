import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import {
  getInvestorByName,
  searchRelationships,
  listStaleRelationships,
  getWarmthSignals,
} from "@/lib/db";
import { TOOLS } from "@/lib/ai-tools";
import type { Signal } from "@/lib/types";

const anthropic = new Anthropic();

const SYSTEM = `You are the AlleyCorp relationship intelligence assistant. You help the AlleyCorp Deep Tech investment team understand their investor universe.

Use the available tools to answer questions about co-investors, market prospects, warmth tiers, signals, and relationship health. Always ground your answers in data from the tools — do not fabricate fund names, tiers, or relationship history.

When a user asks about a specific fund, call get_investor first. If they ask a broad question about the network, use search_relationships. For reconnection or at-risk relationship questions, use list_stale_relationships.

Respond in clear, professional prose suitable for an investment team. Be concise and actionable.`;

function formatDate(d: unknown): string {
  if (!d) return "unknown date";
  const date = d instanceof Date ? d : new Date(String(d));
  return isNaN(date.getTime())
    ? String(d)
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

async function runTool(name: string, input: Record<string, unknown>): Promise<string> {
  switch (name) {
    case "get_investor": {
      const rel = await getInvestorByName(input.name as string);
      if (!rel) return `No investor or fund found matching "${input.name}".`;

      const fund = rel.fund;
      const company = rel.portfolioCompany;
      const signals = rel.signals ?? [];

      const signalSummary = signals.length
        ? signals.map((s) => `• ${s.type} — ${s.source} (${formatDate(s.date)})`).join("\n")
        : "No signals on record.";

      const suggestedAction = {
        Hot: "Prioritize for next round invite or co-investment outreach.",
        Warm: "Schedule a touchpoint in the next 60–90 days to keep the relationship active.",
        Stale: "Reconnect before the next financing event. Reference shared portfolio history.",
        Cold: "No prior relationship. Identify a warm intro path or shared portfolio company.",
      }[rel.warmthTier];

      return [
        `**${fund?.name ?? input.name}**`,
        `Warmth tier: ${rel.warmthTier}`,
        company ? `Co-investment: ${company.name} (${company.stage})` : "",
        `Last signal: ${formatDate(rel.lastSignalDate)}`,
        `Relationship ID: ${rel.id}`,
        "",
        "Signals:",
        signalSummary,
        "",
        `Suggested action: ${suggestedAction}`,
        rel.overrideNote ? `Note: ${rel.overrideNote}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    }

    case "search_relationships": {
      const rels = await searchRelationships(input.query as string);
      if (rels.length === 0) return `No relationships found matching "${input.query}".`;

      const entries = rels.map(
        (r) =>
          `• **${r.fund?.name ?? "Unknown fund"}** — ${r.warmthTier} — ${r.portfolioCompany?.name ?? "No co-investment on record"}${r.portfolioCompany ? "" : " — target/prospect"} — ${r.signals?.length ?? 0} signal(s)`
      );

      return [`**Results for "${input.query}" (${rels.length} found)**`, "", ...entries].join("\n");
    }

    case "list_stale_relationships": {
      const rels = await listStaleRelationships();
      if (rels.length === 0) return "No stale relationships found.";

      const entries = rels.map((r) => {
        const fund = r.fund?.name ?? "Unknown fund";
        const company = r.portfolioCompany?.name ?? "Unknown company";
        const parsed = r.lastSignalDate ? new Date(r.lastSignalDate) : null;
        const lastSignal =
          parsed && !isNaN(parsed.getTime())
            ? parsed.toLocaleDateString("en-US", { month: "short", year: "numeric" })
            : "unknown date";
        const monthsAgo =
          parsed && !isNaN(parsed.getTime())
            ? Math.floor((Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24 * 30))
            : null;
        return `• **${fund}** — last signal ${lastSignal}${monthsAgo ? ` (${monthsAgo} months ago)` : ""} on ${company}. Reconnect before their next investment in this space.`;
      });

      return [`**Stale co-investor relationships (${rels.length})**`, "", ...entries].join("\n");
    }

    case "get_warmth_signals": {
      const signals = await getWarmthSignals(input.investor_id as string);
      if (signals.length === 0) return "No signals found for this investor.";

      const entries = signals.map((s: Signal) => {
        const weightDots = s.weight
          ? (({ high: "●●●", medium: "●●○", low: "●○○" } as Record<string, string>)[s.weight] ??
            "○○○")
          : "○○○";
        return `• [${formatDate(s.date)}] ${s.type.replace(/_/g, " ")} — ${s.source} — ${s.value} ${weightDots}`;
      });

      return [`**Warmth signals (${signals.length})**`, "", ...entries].join("\n");
    }

    default:
      return `Unknown tool: ${name}`;
  }
}

export async function POST(request: NextRequest) {
  let body: { query?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.query !== "string" || !body.query.trim()) {
    return Response.json({ error: "query is required" }, { status: 400 });
  }

  const messages: Anthropic.MessageParam[] = [{ role: "user", content: body.query.trim() }];

  try {
    for (let i = 0; i < 5; i++) {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: SYSTEM,
        tools: TOOLS,
        messages,
      });

      if (response.stop_reason === "end_turn") {
        const text =
          response.content.find((b): b is Anthropic.TextBlock => b.type === "text")?.text ?? "";
        return Response.json({ response: text });
      }

      if (response.stop_reason === "tool_use") {
        const toolUseBlocks = response.content.filter(
          (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
        );

        messages.push({ role: "assistant", content: response.content });

        const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
          toolUseBlocks.map(async (block) => ({
            type: "tool_result" as const,
            tool_use_id: block.id,
            content: await runTool(block.name, block.input as Record<string, unknown>),
          }))
        );

        messages.push({ role: "user", content: toolResults });
        continue;
      }

      break;
    }

    return Response.json({ error: "No response generated" }, { status: 500 });
  } catch (err) {
    console.error("[POST /api/chat]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
