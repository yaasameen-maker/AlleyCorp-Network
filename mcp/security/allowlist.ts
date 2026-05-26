// ── SECURITY LAYER 1: Explicit Tool Allowlist ────────────────────────
//
// Only tools defined here can be called. Any tool name not in this list
// is rejected before it reaches a handler — even if Claude somehow
// generates a tool_use block for it.
//
// Each entry also defines the exact input keys that are permitted.
// Extra keys on the input object are stripped before the handler runs.
// This prevents prompt injection attempts that smuggle extra parameters.

export interface AllowedTool {
  name: string;
  allowedInputKeys: string[];
  description: string;
}

export const TOOL_ALLOWLIST: AllowedTool[] = [
  {
    name: "get_investor",
    allowedInputKeys: ["name"],
    description: "Fetch a single investor/fund profile by name",
  },
  {
    name: "search_relationships",
    allowedInputKeys: ["query", "tier"],
    description: "Search relationships by query string and optional warmth tier",
  },
  {
    name: "list_stale_relationships",
    allowedInputKeys: [], // no inputs — no injection surface
    description: "Return all Stale-tier relationships",
  },
  {
    name: "get_warmth_signals",
    allowedInputKeys: ["investor_id"],
    description: "Return signal breakdown for a specific relationship",
  },
];

// Fast lookup set for O(1) checks
const ALLOWED_NAMES = new Set(TOOL_ALLOWLIST.map((t) => t.name));
const ALLOWED_KEYS = new Map(
  TOOL_ALLOWLIST.map((t) => [t.name, new Set(t.allowedInputKeys)])
);

export interface AllowlistResult {
  allowed: boolean;
  reason?: string;
  sanitizedInput?: Record<string, string>;
}

/**
 * Validates a tool call against the allowlist.
 * - Rejects any tool name not in the list
 * - Strips any input keys not in the allowed set for that tool
 * - Returns the sanitized input ready for the handler
 */
export function checkAllowlist(
  toolName: string,
  rawInput: Record<string, unknown>
): AllowlistResult {
  if (!ALLOWED_NAMES.has(toolName)) {
    return {
      allowed: false,
      reason: `Tool "${toolName}" is not in the allowlist. Permitted tools: ${[...ALLOWED_NAMES].join(", ")}`,
    };
  }

  const permittedKeys = ALLOWED_KEYS.get(toolName)!;

  // Strip any keys not in the permitted set — never pass them to handlers
  const sanitizedInput: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawInput)) {
    if (permittedKeys.has(key)) {
      sanitizedInput[key] = String(value); // coerce to string — no objects through
    }
    // Silently drop disallowed keys (don't leak info about what was stripped)
  }

  return { allowed: true, sanitizedInput };
}
