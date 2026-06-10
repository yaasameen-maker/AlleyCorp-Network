/**
 * Event Page Adapter
 *
 * Parses public event page URLs and extracts EVENT_PARTICIPATION signals
 * for known funds, investors, portfolio companies, and AlleyCorp actors.
 *
 * Only emits signals for relationship-bearing roles:
 * speaker, panelist, sponsor, host, partner, attendee, venue.
 *
 * Status: stub — implementation Phase 2 (post-Demo Day).
 */

import type Exa from "exa-js";
import type Anthropic from "@anthropic-ai/sdk";
import type { RelationshipDiscoveryOutput } from "../../lib/discovery-types.js";

export async function eventPageAdapter(
  eventPageUrls: string[],
  knownFunds: string[],
  _exa: InstanceType<typeof Exa>,
  _claude: Anthropic
): Promise<RelationshipDiscoveryOutput> {
  if (eventPageUrls.length === 0 || knownFunds.length === 0) {
    return { sources: [], signals: [] };
  }

  // TODO: Phase 2
  // For each URL:
  //   1. Fetch page HTML via Exa
  //   2. Claude tool_use: extract participants with roles (speaker/sponsor/host/etc)
  //   3. Match against knownFunds + knownInvestors
  //   4. Emit EVENT_PARTICIPATION DiscoverySignalCandidate per match
  console.log(`[eventPageAdapter] ${eventPageUrls.length} URLs queued — implementation Phase 2`);

  return { sources: [], signals: [] };
}
