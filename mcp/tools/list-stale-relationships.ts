import type { Tool, CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { listStaleRelationships } from "../../lib/db.js";

export const tool: Tool = {
  name: "list_stale_relationships",
  description:
    "Returns all co-investors currently in the Stale warmth tier — funds that co-invested with AlleyCorp at an earlier round but have not returned at subsequent rounds, or whose signals have decayed. Use this when asked about relationships that need attention, reconnection, or risk being lost (e.g. 'Who should we reconnect with before they lead another round without us?' or 'Which co-investors are going cold?').",
  inputSchema: {
    type: "object",
    properties: {},
    required: [],
  },
};

export async function handler(): Promise<CallToolResult> {
  const relationships = await listStaleRelationships();

  if (relationships.length === 0) {
    return { content: [{ type: "text", text: "No stale relationships found." }] };
  }

  const entries = relationships.map((r) => {
    const fund = r.fund?.name ?? "Unknown fund";
    const company = r.portfolioCompany?.name ?? "Unknown company";
    const lastSignal = r.lastSignalDate ?? "unknown date";
    return `• **${fund}** — last signal ${lastSignal} on ${company}. Reconnect before their next investment in this space.`;
  });

  const text = [`**Stale co-investor relationships (${relationships.length})**`, "", ...entries].join("\n");

  return { content: [{ type: "text", text }] };
}
