import { rmSync } from "node:fs";
import { execSync } from "node:child_process";

// Stop any stale Next dev servers so we always bind to :3000
for (const port of [3000, 3001]) {
  try {
    const pids = execSync(`lsof -ti:${port}`, { encoding: "utf8" }).trim();
    if (pids) execSync(`kill -9 ${pids.split("\n").join(" ")}`);
  } catch {
    // port free
  }
}

rmSync(".next", { recursive: true, force: true });
execSync("next dev", { stdio: "inherit" });
