// ── SECURITY LAYER 2: Scoped Short-Lived Tokens ─────────────────────
//
// Static API keys are a liability — one leak exposes everything forever.
// This module issues scoped tokens that:
//   - Expire after a configurable TTL (default 15 minutes)
//   - Are bound to a specific set of permitted tools
//   - Are single-use by default (revoked after first successful call)
//   - Carry a caller identity for audit logging
//
// Usage flow:
//   1. Your auth layer calls issueToken() when a session starts
//   2. The token is passed with each MCP request
//   3. validateToken() is called at the entry point before any handler runs
//   4. The token is consumed (or rejected if expired/wrong scope)

import { createHmac, randomBytes } from "crypto";

const TOKEN_SECRET = process.env.MCP_TOKEN_SECRET;
if (!TOKEN_SECRET) throw new Error("MCP_TOKEN_SECRET must be set in environment");

export type ToolName =
  | "get_investor"
  | "search_relationships"
  | "list_stale_relationships"
  | "get_warmth_signals";

export interface TokenClaims {
  callerId: string;         // who requested the token (e.g. 'abe@alleycorp.vc')
  allowedTools: ToolName[]; // which tools this token may call
  issuedAt: number;         // unix ms
  expiresAt: number;        // unix ms
  singleUse: boolean;       // revoke after first successful call
  tokenId: string;          // unique — used for revocation
}

export interface TokenValidationResult {
  valid: boolean;
  claims?: TokenClaims;
  reason?: string;
}

// In-memory revocation set — swap for Redis in production
const revokedTokens = new Set<string>();

// In-memory token store — swap for Redis or DB in production
const tokenStore = new Map<string, TokenClaims>();

/**
 * Issues a scoped short-lived token.
 *
 * @param callerId   Identity of the requester (email, user ID, service name)
 * @param tools      Explicit list of tools this token may invoke
 * @param ttlMinutes How long the token is valid (default 15 min)
 * @param singleUse  Whether to revoke after one successful use (default true)
 */
export function issueToken(
  callerId: string,
  tools: ToolName[],
  ttlMinutes = 15,
  singleUse = true
): string {
  const now = Date.now();
  const tokenId = randomBytes(16).toString("hex");

  const claims: TokenClaims = {
    callerId,
    allowedTools: tools,
    issuedAt: now,
    expiresAt: now + ttlMinutes * 60 * 1000,
    singleUse,
    tokenId,
  };

  const payload = JSON.stringify(claims);
  const sig = createHmac("sha256", TOKEN_SECRET!).update(payload).digest("hex");
  const token = `${Buffer.from(payload).toString("base64url")}.${sig}`;

  tokenStore.set(tokenId, claims);
  return token;
}

/**
 * Validates a token and checks it has permission for the requested tool.
 * Revokes single-use tokens after successful validation.
 */
export function validateToken(
  token: string,
  requestedTool: ToolName
): TokenValidationResult {
  const parts = token.split(".");
  if (parts.length !== 2) {
    return { valid: false, reason: "Malformed token" };
  }

  const [encodedPayload, providedSig] = parts;
  let claims: TokenClaims;

  try {
    const payload = Buffer.from(encodedPayload, "base64url").toString();
    const expectedSig = createHmac("sha256", TOKEN_SECRET!).update(payload).digest("hex");
    if (providedSig !== expectedSig) {
      return { valid: false, reason: "Invalid token signature" };
    }
    claims = JSON.parse(payload) as TokenClaims;
  } catch {
    return { valid: false, reason: "Token parse error" };
  }

  if (revokedTokens.has(claims.tokenId)) {
    return { valid: false, reason: "Token has been revoked" };
  }

  if (Date.now() > claims.expiresAt) {
    revokedTokens.add(claims.tokenId);
    tokenStore.delete(claims.tokenId);
    return { valid: false, reason: "Token expired" };
  }

  if (!claims.allowedTools.includes(requestedTool)) {
    return {
      valid: false,
      reason: `Token not scoped for tool "${requestedTool}". Allowed: ${claims.allowedTools.join(", ")}`,
    };
  }

  if (claims.singleUse) {
    revokedTokens.add(claims.tokenId);
    tokenStore.delete(claims.tokenId);
  }

  return { valid: true, claims };
}

/** Explicitly revoke a token before it expires. Call on logout or suspicious activity. */
export function revokeToken(tokenId: string): void {
  revokedTokens.add(tokenId);
  tokenStore.delete(tokenId);
}

/** Full-access session token for Abe or Brannon — all tools, 30 min, multi-use. */
export function issueSessionToken(callerId: string): string {
  return issueToken(
    callerId,
    ["get_investor", "search_relationships", "list_stale_relationships", "get_warmth_signals"],
    30,
    false
  );
}

/** Single-use digest token for the automated digest job — read-only tools, 5 min. */
export function issueDigestToken(): string {
  return issueToken("digest-job", ["list_stale_relationships", "search_relationships"], 5, true);
}
