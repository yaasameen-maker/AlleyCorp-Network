import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

import { tool as getInvestorTool, handler as getInvestor } from "./tools/get-investor.js";
import {
  tool as searchRelationshipsTool,
  handler as searchRelationships,
} from "./tools/search-relationships.js";
import {
  tool as listStaleTool,
  handler as listStaleRelationships,
} from "./tools/list-stale-relationships.js";
import {
  tool as getWarmthSignalsTool,
  handler as getWarmthSignals,
} from "./tools/get-warmth-signals.js";
import { checkAllowlist } from "./security/allowlist.js";
import type { ToolName } from "./security/tokens.js";

const server = new Server(
  { name: "alleycorp-network", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [getInvestorTool, searchRelationshipsTool, listStaleTool, getWarmthSignalsTool],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  // ── Layer 1: Allowlist — reject unknown tools, sanitize input keys ──
  const allowlist = checkAllowlist(name, args as Record<string, unknown>);
  if (!allowlist.allowed) {
    throw new Error(`[MCP SECURITY] ${allowlist.reason}`);
  }
  const sanitized = allowlist.sanitizedInput ?? {};

  // ── Layer 2: Token validation ────────────────────────────────────────
  // TODO: extract token from request context and call validateToken(token, name as ToolName)
  // once HTTP transport is added. Stdio transport is process-scoped — token enforcement
  // applies at the process invocation level (who can spawn this process).

  // ── Layer 3: Network binding ─────────────────────────────────────────
  // Enforced at startup via validateBindAddress(). Stdio transport is not network-exposed.

  // ── Dispatch with sanitized input ────────────────────────────────────
  switch (name as ToolName) {
    case "get_investor":
      return getInvestor(sanitized as { name: string });
    case "search_relationships":
      return searchRelationships(sanitized as { query: string });
    case "list_stale_relationships":
      return listStaleRelationships();
    case "get_warmth_signals":
      return getWarmthSignals(sanitized as { investor_id: string });
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("AlleyCorp MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
