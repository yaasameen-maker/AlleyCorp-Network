import { rmSync } from "node:fs";
import { execSync } from "node:child_process";

rmSync(".next", { recursive: true, force: true });
execSync("next dev", { stdio: "inherit" });
