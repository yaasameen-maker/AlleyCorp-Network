/**
 * Critic Agent — pre-write validation gate for DiscoverySignalCandidate[].
 *
 * Called by discovery-agent.ts (Phase 1) before any DB write.
 * Pure function — all DB pre-fetching is done by the caller; this module
 * has no DB dependency so it can be unit-tested without a live connection.
 *
 * Rejection rules (first match wins):
 *   1. Source is a candidate-only directory (Crunchbase, PitchBook, etc.)
 *   2. Source is not publish-credible (not in PUBLISH_DOMAINS)
 *   3. Signal does not name both fund AND portfolio company
 *   4. Fund name doesn't fuzzy-match any known DB fund (threshold 80%)
 *      — skipped when knownFundNames is empty (Phase 1 discovers new funds)
 *   5. Low confidence with no corroborating signal for same fund + company
 *   6. Signal date is in the future
 *   7. Semantic duplicate already in DB (matched by existingHashes)
 */

import { createHash } from "crypto";
import type { DiscoverySignalCandidate, SourceRecord } from "../lib/discovery-types.js";
import { SIGNAL_TYPE_TO_DB } from "../lib/discovery-types.js";
import {
  canPublishRelationshipSignal,
  isCandidateOnlySource,
  sourceNameFromUrl,
} from "../lib/source-policy.js";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ReviewedCandidate extends DiscoverySignalCandidate {
  rejected: boolean;
  rejectionReason?: string;
}

// ── Fuzzy matching ────────────────────────────────────────────────────────────
// Normalized Levenshtein — no external dependency required.

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

function bestFundMatch(
  fundName: string,
  knownFundNames: string[]
): { name: string; score: number } {
  const normalized = fundName.toLowerCase().trim();
  let best = { name: "", score: 0 };
  for (const known of knownFundNames) {
    const score = similarity(normalized, known.toLowerCase().trim());
    if (score > best.score) best = { name: known, score };
  }
  return best;
}

// ── Duplicate key ─────────────────────────────────────────────────────────────
// Semantic hash: fund + company + signal type + date (no source URL required).
// Callers build existingHashes with the same format via getExistingSignalHashes().

export function makeDuplicateKey(
  fundName: string,
  companyName: string,
  signalType: string,
  signalDate: string
): string {
  const raw = `${fundName.toLowerCase()}|${companyName.toLowerCase()}|${signalType}|${signalDate}`;
  return createHash("sha256").update(raw).digest("hex").slice(0, 32);
}

// ── Review ────────────────────────────────────────────────────────────────────

const FUZZY_THRESHOLD = 0.8;

/**
 * Review a batch of signal candidates and mark each as accepted or rejected.
 *
 * @param candidates   Raw output from an adapter (substackAdapter, etc.)
 * @param sources      SourceRecord[] parallel to candidates — provides URL lookup by sourceId
 * @param knownFundNames  Fund names from DB. Pass [] to skip Rule 4 (new fund discovery).
 * @param existingHashes  Pre-fetched set of makeDuplicateKey() values from the signal table.
 */
export function reviewCandidates(
  candidates: DiscoverySignalCandidate[],
  sources: SourceRecord[],
  knownFundNames: string[],
  existingHashes: Set<string>
): ReviewedCandidate[] {
  const today = new Date().toISOString().slice(0, 10);
  const sourceMap = new Map(sources.map((s) => [s.sourceId, s]));

  const reviewed: ReviewedCandidate[] = candidates.map((c) => {
    const sourceUrl = sourceMap.get(c.sourceId)?.url;
    const signalTypeDb = SIGNAL_TYPE_TO_DB[c.signalType] ?? c.signalType;

    // Reject immediately when sourceId can't be resolved — source policy can't be applied.
    if (!sourceUrl) {
      return {
        ...c,
        rejected: true,
        rejectionReason: "source URL unresolvable — cannot apply source policy",
      };
    }

    // Rule 1: candidate-only source
    if (isCandidateOnlySource(sourceUrl)) {
      return {
        ...c,
        rejected: true,
        rejectionReason: `candidate-only source — lead only, not for signal publish: ${sourceNameFromUrl(sourceUrl)}`,
      };
    }

    // Rule 2: source not credible for signal publish
    if (!canPublishRelationshipSignal(sourceUrl)) {
      return {
        ...c,
        rejected: true,
        rejectionReason: `source not credible for signal publish: ${sourceNameFromUrl(sourceUrl)}`,
      };
    }

    // Rule 3: signal does not name both fund and portfolio company
    if (!c.fundName || !c.portfolioCompanyName) {
      return {
        ...c,
        rejected: true,
        rejectionReason: "signal does not name both fund and company",
      };
    }

    // Rule 4: fund name not recognized in DB
    // Skipped when knownFundNames is empty — Phase 1 discovers entirely new funds.
    if (knownFundNames.length > 0) {
      const { name: bestMatch, score } = bestFundMatch(c.fundName, knownFundNames);
      if (score < FUZZY_THRESHOLD) {
        return {
          ...c,
          rejected: true,
          rejectionReason: `fund '${c.fundName}' unrecognized in DB (best match: '${bestMatch}' at ${Math.round(score * 100)}%)`,
        };
      }
    }

    // Rule 5: low confidence with no corroborating signal for same fund + company
    if (c.confidence === "low") {
      const corroborated = candidates.some(
        (other) =>
          other.tempId !== c.tempId &&
          other.fundName === c.fundName &&
          other.portfolioCompanyName === c.portfolioCompanyName &&
          other.confidence !== "low"
      );
      if (!corroborated) {
        return {
          ...c,
          rejected: true,
          rejectionReason: "low confidence with no corroborating signal",
        };
      }
    }

    // Rule 6: future date
    if (c.signalDate && c.signalDate > today) {
      return {
        ...c,
        rejected: true,
        rejectionReason: `signal date is in the future: ${c.signalDate}`,
      };
    }

    // Rule 7: semantic duplicate already in DB
    const key = makeDuplicateKey(
      c.fundName,
      c.portfolioCompanyName,
      signalTypeDb,
      c.signalDate ?? ""
    );
    if (existingHashes.has(key)) {
      return { ...c, rejected: true, rejectionReason: "duplicate: already in DB" };
    }

    return { ...c, rejected: false };
  });

  // Summary
  const accepted = reviewed.filter((r) => !r.rejected);
  const rejected = reviewed.filter((r) => r.rejected);
  console.log(`\n── Critic: ${accepted.length} accepted, ${rejected.length} rejected`);
  for (const r of rejected) {
    console.log(`   ⊘ ${r.fundName ?? "(unknown fund)"}: ${r.rejectionReason}`);
  }

  return reviewed;
}
