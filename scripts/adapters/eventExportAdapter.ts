/**
 * Event Export Adapter
 *
 * Parses structured CSV exports from Swoogo / Luma into high-confidence
 * EVENT_PARTICIPATION signals. Role values are already structured in exports
 * so confidence is always "high".
 *
 * Status: stub — implementation Phase 2 (post-Demo Day).
 * DTNY signals are currently seeded directly via seed-dtny-signals.sql.
 */

import type { RelationshipDiscoveryOutput } from "../../lib/discovery-types.js";

export interface EventExportFile {
  filePath: string;
  title: string;
  publishedAt?: string; // YYYY-MM-DD
}

export async function eventExportAdapter(
  exportFiles: EventExportFile[],
  knownFunds: string[]
): Promise<RelationshipDiscoveryOutput> {
  if (exportFiles.length === 0 || knownFunds.length === 0) {
    return { sources: [], signals: [] };
  }

  // TODO: Phase 2
  // For each CSV file:
  //   1. Parse rows (name, org, email, role columns)
  //   2. Match org against knownFunds (fuzzy match)
  //   3. Emit high-confidence EVENT_PARTICIPATION per match
  //   4. Source = event title + file path
  console.log(`[eventExportAdapter] ${exportFiles.length} files queued — implementation Phase 2`);

  return { sources: [], signals: [] };
}
