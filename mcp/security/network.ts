// ── SECURITY LAYER 3: Network Binding ───────────────────────────────
//
// Binding to 0.0.0.0 exposes the MCP server on every network interface —
// including public-facing ones. On a cloud host this means the server is
// reachable from the internet with no auth, no TLS, nothing.
//
// Rule: the MCP server must ONLY bind to:
//   - 127.0.0.1 (localhost) — if Claude and the MCP server are on the same host
//   - A Unix domain socket  — lower overhead, OS-level access control via file permissions
//
// Applies when HTTP transport is added. Current stdio transport is process-scoped.

export type BindMode = "localhost" | "unix-socket";

export interface ServerBindConfig {
  mode: BindMode;
  port?: number; // used when mode = 'localhost'
  socketPath?: string; // used when mode = 'unix-socket'
  allowedOrigins?: string[];
}

export const DEFAULT_BIND_CONFIG: ServerBindConfig = {
  mode: "localhost",
  port: parseInt(process.env.MCP_PORT ?? "3001", 10),
  allowedOrigins: ["http://127.0.0.1", "http://localhost"],
};

/**
 * Validates a bind address before the server starts.
 * Hard-rejects 0.0.0.0 and any public IP. Call at startup — fail fast.
 */
export function validateBindAddress(host: string): void {
  const blocked = ["0.0.0.0", "::", "::0"];

  if (blocked.includes(host)) {
    throw new Error(
      `[MCP SECURITY] Refusing to bind to "${host}". ` +
        `Binding to all interfaces exposes the MCP server publicly. ` +
        `Use "127.0.0.1" for localhost or a Unix socket path instead.`
    );
  }

  const isPublicIP =
    !host.startsWith("127.") &&
    !host.startsWith("10.") &&
    !host.startsWith("192.168.") &&
    !host.startsWith("172.") &&
    host !== "localhost" &&
    !host.startsWith("/"); // not a unix socket path

  if (isPublicIP) {
    throw new Error(
      `[MCP SECURITY] Refusing to bind to "${host}". ` +
        `Public IPs are not permitted. Use 127.0.0.1, a private CIDR, or a Unix socket.`
    );
  }
}

/** Returns listen args for http server. Pass result directly to server.listen(). */
export function getListenArgs(config: ServerBindConfig): [string | number, string?] {
  if (config.mode === "unix-socket") {
    return [config.socketPath ?? "/tmp/alleycorp-mcp.sock"];
  }
  const host = "127.0.0.1";
  validateBindAddress(host);
  return [config.port ?? 3001, host];
}

/** Origin check for HTTP-based transport. Call before any tool dispatch. */
export function isAllowedOrigin(
  origin: string | undefined,
  config: ServerBindConfig = DEFAULT_BIND_CONFIG
): boolean {
  if (!origin) return false;
  const allowed = config.allowedOrigins ?? ["http://127.0.0.1", "http://localhost"];
  return allowed.some((o) => origin.startsWith(o));
}
