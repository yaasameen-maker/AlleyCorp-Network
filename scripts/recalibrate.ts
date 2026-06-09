/**
 * Recalibrate warmth tiers for all relationships based on current signals.
 *
 * Runs the deterministic scoring engine (lib/scoring.ts) against the live DB
 * and updates any tiers that have drifted from what the signals support.
 *
 * Usage:
 *   npm run recalibrate            # dry run — show what would change
 *   npm run recalibrate -- --write # live run — update tiers in DB
 */

import dotenv from "dotenv";
dotenv.config({ override: true });

import { recalibrateAll, computeWarmthTier } from "../lib/scoring.js";
import { dbRepository } from "../lib/db-repository.js";
import { pool } from "../lib/db.js";

const DRY_RUN = !process.argv.includes("--write");

async function run() {
  console.log("=== AlleyCorp Warmth Recalibration ===");
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no DB writes)" : "LIVE (updating tiers)"}\n`);

  const all = await dbRepository.findAll();
  console.log(`Loaded ${all.length} relationships\n`);

  let changes = 0;

  for (const rel of all) {
    const newTier = computeWarmthTier(rel);
    const oldTier = rel.warmthTier;

    if (newTier !== oldTier) {
      changes++;
      console.log(`📊 ${rel.fundName}`);
      console.log(
        `   ${oldTier} → ${newTier} (${rel.signals.length} active signals, last: ${rel.lastSignalDate?.toISOString().slice(0, 10) ?? "none"})`
      );

      if (!DRY_RUN) {
        await dbRepository.updateTier(rel.id, newTier);
        console.log(`   ✓ Updated`);
      }
    }
  }

  if (changes === 0) {
    console.log("✓ All tiers are current — no changes needed");
  } else {
    console.log(`\n${DRY_RUN ? "Would update" : "Updated"} ${changes} relationship(s)`);
    if (DRY_RUN) console.log("\nRun with --write to apply changes.");
  }

  await pool.end();
}

run().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
