import type { Tool, CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { getWarmthSignals } from "../../lib/db.js";

export const tool: Tool = {
  name: "get_warmth_signals",
  description:
    "Returns all warmth signals for a specific investor by their ID. Signals are the individual data points (co-investments, event attendance, press mentions, LinkedIn connections) that make up their warmth tier score. Use this after get_investor to show the evidence behind a warmth classification.",
  inputSchema: {
    type: "object",
    properties: {
      investor_id: {
        type: "string",
        description: "The unique ID of the investor relationship record",
      },
    },
    required: ["investor_id"],
  },
};

export async function handler(args: { investor_id: string }): Promise<CallToolResult> {
  const signals = await getWarmthSignals(args.investor_id);

  if (signals.length === 0) {
    return { content: [{ type: "text", text: "No signals found for this investor." }] };
  }

  const formatDate = (d: unknown): string => {
    if (!d) return "unknown";
    const date = d instanceof Date ? d : new Date(String(d));
    return isNaN(date.getTime())
      ? String(d)
      : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const entries = signals.map((s) => {
    const weightDots = { high: "●●●", medium: "●●○", low: "●○○" }[s.weight];
    return `• [${formatDate(s.date)}] ${s.type.replace(/_/g, " ")} — ${s.source} — ${s.value} ${weightDots}`;
  });

  const text = [`**Warmth signals (${signals.length})**`, "", ...entries].join("\n");

  return { content: [{ type: "text", text }] };
}
