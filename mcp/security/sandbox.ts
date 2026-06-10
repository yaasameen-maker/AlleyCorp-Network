// ── SECURITY LAYER 4: File Access Sandbox ───────────────────────────
//
// If any MCP tool needs to read files (event exports, CSVs, attachments),
// it must go through this sandbox. Direct fs calls in tool handlers are banned.
//
// Enforces:
//   1. All reads constrained to MCP_SANDBOX_DIR
//   2. Path traversal prevention — resolves symlinks via realpath before check
//   3. Allowlist of permitted file extensions (.csv, .json, .txt)
//   4. 10 MB max file size to prevent memory exhaustion
//   5. Read-only — no writes, no deletes, no execs

import { readFile, realpath, stat, readdir } from "fs/promises";
import { resolve, extname, relative, isAbsolute } from "path";

const SANDBOX_ROOT = resolve(process.env.MCP_SANDBOX_DIR ?? "./data");

const ALLOWED_EXTENSIONS = new Set([
  ".csv", // Swoogo / Luma event exports
  ".json", // structured data files
  ".txt", // plain text notes
]);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export class SandboxViolationError extends Error {
  constructor(
    message: string,
    public readonly path: string
  ) {
    super(`[MCP SANDBOX] ${message}: "${path}"`);
    this.name = "SandboxViolationError";
  }
}

async function resolveAndVerify(requestedPath: string): Promise<string> {
  const candidate = resolve(SANDBOX_ROOT, requestedPath);

  let real: string;
  try {
    real = await realpath(candidate);
  } catch {
    throw new SandboxViolationError("Path does not exist or cannot be resolved", requestedPath);
  }

  const rel = relative(SANDBOX_ROOT, real);
  if (rel.startsWith("..") || isAbsolute(rel)) {
    throw new SandboxViolationError(
      "Path traversal attempt blocked — resolved path escapes sandbox",
      requestedPath
    );
  }

  return real;
}

/**
 * Read a file safely within the sandbox.
 * This is the ONLY function tool handlers should use for file I/O.
 *
 * @param requestedPath  Path relative to MCP_SANDBOX_DIR
 * @returns              File contents as a UTF-8 string
 */
export async function sandboxedRead(requestedPath: string): Promise<string> {
  const ext = extname(requestedPath).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new SandboxViolationError(
      `File extension "${ext}" is not permitted. Allowed: ${[...ALLOWED_EXTENSIONS].join(", ")}`,
      requestedPath
    );
  }

  const safePath = await resolveAndVerify(requestedPath);

  const info = await stat(safePath);
  if (info.size > MAX_FILE_SIZE_BYTES) {
    throw new SandboxViolationError(
      `File exceeds ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB read limit (${(info.size / 1024 / 1024).toFixed(1)}MB)`,
      requestedPath
    );
  }

  return readFile(safePath, "utf-8");
}

/** List permitted files in a sandbox subdirectory. Returns filenames only — never full paths. */
export async function sandboxedList(subdir = "."): Promise<string[]> {
  const safePath = await resolveAndVerify(subdir);
  const entries = await readdir(safePath, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && ALLOWED_EXTENSIONS.has(extname(e.name).toLowerCase()))
    .map((e) => e.name);
}

/** Returns the sandbox root for logging. Never expose to untrusted callers. */
export function getSandboxRoot(): string {
  return SANDBOX_ROOT;
}
