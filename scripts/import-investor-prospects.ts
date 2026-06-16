/**
 * Investor Prospect Importer
 *
 * Safe first slice of the broader deep-tech investor discovery loop.
 * Reads candidate investors from a local JSON file, applies source policy, writes
 * a run report, and only writes accepted market-prospect fund rows with --write.
 *
 * This script never creates relationship rows, signal rows, warmth tiers, or VIPs.
 *
 * Usage:
 *   npm run import:prospects -- --input data/investor-prospects.json
 *   npm run import:prospects -- --input data/investor-prospects.json --write
 */

import dotenv from "dotenv";
dotenv.config({ override: true });

import { createHash } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import { pool } from "../lib/db.js";
import {
  reviewInvestorProspectCandidate,
  type InvestorProspectCandidate,
  type ReviewedInvestorProspect,
} from "../lib/investor-prospect-policy.js";

const DRY_RUN = !process.argv.includes("--write");

function getArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const idx = process.argv.indexOf(`--${name}`);
  return idx >= 0 ? process.argv[idx + 1] : undefined;
}

function asCandidateArray(input: unknown): InvestorProspectCandidate[] {
  if (Array.isArray(input)) return input as InvestorProspectCandidate[];
  if (
    input &&
    typeof input === "object" &&
    Array.isArray((input as { candidates?: unknown }).candidates)
  ) {
    return (input as { candidates: InvestorProspectCandidate[] }).candidates;
  }
  throw new Error("Input must be an array or an object with a candidates array.");
}

async function loadCandidates(filePath: string): Promise<InvestorProspectCandidate[]> {
  const raw = await readFile(filePath, "utf8");
  return asCandidateArray(JSON.parse(raw));
}

function provenanceNote(candidate: ReviewedInvestorProspect): string {
  const profileSources = candidate.acceptedProfileSources.join(", ");
  const evidenceSummary = candidate.acceptedFieldEvidence
    .map((evidence) => `${evidence.field}: ${evidence.sourceUrl}`)
    .join("; ");
  return [
    "Market prospect imported from candidate discovery.",
    `Discovery source: ${candidate.discoverySourceTitle ?? candidate.sourceName} (${candidate.discoverySourceUrl}).`,
    profileSources ? `Profile sources: ${profileSources}.` : "",
    evidenceSummary ? `Field evidence: ${evidenceSummary}.` : "",
    candidate.deepTechEvidence ? `Deep tech evidence: ${candidate.deepTechEvidence}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function valueOrNull(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  if (!value.trim()) return null;
  if (/\bunknown\b|verify before/i.test(value)) return null;
  return value;
}

async function upsertMarketProspect(
  candidate: ReviewedInvestorProspect
): Promise<"inserted" | "updated"> {
  const matchNames = [candidate.fundName, ...(candidate.aliases ?? [])];
  const existing = await pool.query<{ id: string }>(
    `SELECT id FROM fund WHERE LOWER(name) = ANY($1::text[]) ORDER BY name LIMIT 1`,
    [matchNames.map((name) => name.toLowerCase())]
  );

  if (!existing.rows[0]) {
    await pool.query(
      `INSERT INTO fund (
         id, name, website, focus, stage, aum_tier, hq_location,
         geography_focus, check_size_proxy, deep_tech_signal,
         investor_status, is_vip, profile_last_checked_at, notes,
         created_at, updated_at
       )
       VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6,
         $7, $8, $9,
         'market_prospect', false, now(), $10,
         now(), now()
       )`,
      [
        candidate.fundName,
        valueOrNull(candidate.website),
        valueOrNull(candidate.deepTechEvidence),
        valueOrNull(candidate.stageFocus),
        valueOrNull(candidate.aumTier),
        valueOrNull(candidate.teamLocation),
        valueOrNull(candidate.geographyFocus),
        valueOrNull(candidate.checkSizeProxy),
        valueOrNull(candidate.deepTechEvidence),
        provenanceNote(candidate),
      ]
    );
    return "inserted";
  }

  await pool.query(
    `UPDATE fund
     SET
       website = COALESCE(website, $2),
       focus = COALESCE(focus, $3),
       stage = COALESCE(stage, $4),
       aum_tier = COALESCE(aum_tier, $5),
       hq_location = COALESCE(hq_location, $6),
       geography_focus = COALESCE(geography_focus, $7),
       check_size_proxy = COALESCE(check_size_proxy, $8),
       deep_tech_signal = COALESCE(deep_tech_signal, $9),
       investor_status = COALESCE(investor_status, 'market_prospect'),
       profile_last_checked_at = now(),
       notes = COALESCE(notes, $10),
       updated_at = now()
     WHERE id = $1`,
    [
      existing.rows[0].id,
      valueOrNull(candidate.website),
      valueOrNull(candidate.deepTechEvidence),
      valueOrNull(candidate.stageFocus),
      valueOrNull(candidate.aumTier),
      valueOrNull(candidate.teamLocation),
      valueOrNull(candidate.geographyFocus),
      valueOrNull(candidate.checkSizeProxy),
      valueOrNull(candidate.deepTechEvidence),
      provenanceNote(candidate),
    ]
  );
  return "updated";
}

async function writeRunReport(reviewed: ReviewedInvestorProspect[], inputPath: string) {
  const endedAt = new Date().toISOString();
  const report = {
    agent: "investor-prospect-importer",
    mode: DRY_RUN ? "dry_run" : "write",
    inputPath,
    endedAt,
    summary: {
      total: reviewed.length,
      acceptedForMarketMap: reviewed.filter((c) => c.status === "accepted_for_market_map").length,
      candidateOnly: reviewed.filter((c) => c.status === "candidate_only").length,
      rejected: reviewed.filter((c) => c.status === "rejected").length,
    },
    candidates: reviewed,
  };

  await mkdir(".agent-runs", { recursive: true });
  const inputHash = createHash("sha256").update(inputPath).digest("hex").slice(0, 8);
  const fileName = `.agent-runs/investor-prospects-${endedAt.replace(/[:.]/g, "-")}-${inputHash}.json`;
  await writeFile(fileName, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return fileName;
}

async function run() {
  const inputPath = getArg("input");
  if (!inputPath) {
    throw new Error(
      "Missing --input path. Example: npm run import:prospects -- --input data/investor-prospects.json"
    );
  }

  console.log("=== Investor Prospect Importer ===");
  console.log(`Mode:  ${DRY_RUN ? "DRY RUN — no DB writes" : "LIVE — writing market prospects"}`);
  console.log(`Input: ${inputPath}`);

  const candidates = await loadCandidates(inputPath);
  const reviewed = candidates.map(reviewInvestorProspectCandidate);

  let inserted = 0;
  let updated = 0;

  for (const candidate of reviewed) {
    console.log(`\n── ${candidate.fundName || "(missing fund)"} · ${candidate.status}`);
    if (candidate.rejectionReasons.length > 0) {
      console.log(`   ${candidate.rejectionReasons.join("; ")}`);
    }

    if (DRY_RUN || candidate.status !== "accepted_for_market_map") continue;

    const result = await upsertMarketProspect(candidate);
    if (result === "inserted") inserted++;
    if (result === "updated") updated++;
    console.log(`   ✓ ${result}`);
  }

  const reportPath = await writeRunReport(reviewed, inputPath);
  console.log("\n=== Summary ===");
  console.log(
    `Accepted for market map: ${reviewed.filter((c) => c.status === "accepted_for_market_map").length}`
  );
  console.log(
    `Candidate-only leads:    ${reviewed.filter((c) => c.status === "candidate_only").length}`
  );
  console.log(`Rejected:                ${reviewed.filter((c) => c.status === "rejected").length}`);
  if (!DRY_RUN) {
    console.log(`Inserted:                ${inserted}`);
    console.log(`Updated:                 ${updated}`);
  }
  console.log(`Run report:              ${reportPath}`);

  await pool.end();
}

run().catch(async (err) => {
  console.error("Fatal:", err);
  await pool.end();
  process.exit(1);
});
