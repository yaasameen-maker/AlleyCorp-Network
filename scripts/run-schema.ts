import dotenv from "dotenv";
dotenv.config({ override: true });

import fs from "fs";
import path from "path";
import { pool } from "../lib/db.js";

const files = ["schema.sql", "seed.sql", "seed-dtny-signals.sql"];

async function run() {
  for (const file of files) {
    const filePath = path.join(process.cwd(), file);
    if (!fs.existsSync(filePath)) {
      console.log(`⚠ Skipping ${file} — not found`);
      continue;
    }
    const sql = fs.readFileSync(filePath, "utf8");
    process.stdout.write(`Running ${file}...`);
    try {
      await pool.query(sql);
      console.log(" ✓ done");
    } catch (err) {
      console.log(` ✗ ERROR: ${err}`);
      await pool.end();
      process.exit(1);
    }
  }
  await pool.end();
  console.log("\nSchema + seed complete. Run: npm run test:acceptance");
}

run();
