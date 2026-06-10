/**
 * Fund Enrichment Pipeline
 *
 * Runs automatically (GitHub Actions, weekly) and on-demand.
 * For every fund in the DB that has a website:
 *
 *   1. Clearbit Logo API (free, no key) → writes logo_url to fund table
 *   2. Exa neural search (linkedin.com) + Claude tool_use → finds managing partners
 *
 * Staleness-aware: skips funds whose contacts were refreshed within ENRICH_MAX_AGE_DAYS
 * (default 30). Use --force to override.
 *
 * Change detection: if Exa finds a different role for an existing contact, logs the
 * change prominently and updates the DB — stale contacts are the #1 reason relationship
 * intelligence tools become useless. See project intake: "Role changes and external
 * updates are important to avoid stale records."
 *
 * Usage:
 *   npm run enrich:funds                    # dry run — shows what would change
 *   npm run enrich:funds -- --write         # live run — only enriches stale funds
 *   npm run enrich:funds -- --write --force # re-enrich all funds regardless of age
 */

import dotenv from "dotenv";
dotenv.config({ override: true });

import Exa from "exa-js";
import Anthropic from "@anthropic-ai/sdk";
import { pool } from "../lib/db.js";
import { buildLogoUrl, searchLinkedIn, extractContacts } from "../lib/enrichment.js";

const DRY_RUN = !process.argv.includes("--write");
const FORCE = process.argv.includes("--force");

// How many days before a fund's contacts are considered stale and re-enriched.
// Configurable via env so AlleyCorp can tune without a code change.
const MAX_AGE_DAYS = parseInt(process.env.ENRICH_MAX_AGE_DAYS ?? "30", 10);

const exa = new Exa(process.env.EXA_API_KEY!);
const claude = new Anthropic();

// ── Types ─────────────────────────────────────────────────────────────────────

interface FundRow {
  id: string;
  name: string;
  website: string | null;
  logoUrl: string | null;
}

interface ExistingContact {
  name: string;
  role: string;
  updatedAt: Date;
}

interface ExtractedContact {
  name: string;
  role: string;
  linkedinUrl: string;
}

type ContactWriteResult = "inserted" | "confirmed" | "role_changed";

// EXTRACT_CONTACTS_TOOL imported from lib/enrichment.ts

// ── Step 1: Clearbit logo (buildLogoUrl imported from lib/enrichment.ts) ─────

// ── Step 2: Staleness check ───────────────────────────────────────────────────

async function getExistingContacts(fundId: string): Promise<ExistingContact[]> {
  const { rows } = await pool.query<ExistingContact>(
    `SELECT name, role, updated_at AS "updatedAt"
     FROM investor
     WHERE fund_id = $1
     ORDER BY updated_at DESC`,
    [fundId]
  );
  return rows;
}

function isStale(contacts: ExistingContact[]): boolean {
  if (contacts.length === 0) return true; // never enriched
  const mostRecent = contacts[0].updatedAt;
  const ageInDays = (Date.now() - new Date(mostRecent).getTime()) / 86_400_000;
  return ageInDays >= MAX_AGE_DAYS;
}

// ── Steps 3 & 4: searchLinkedIn + extractContacts imported from lib/enrichment.ts

// ── Step 5: Write to DB with change detection ─────────────────────────────────

async function writeLogo(fundId: string, logoUrl: string): Promise<void> {
  await pool.query(
    `UPDATE fund SET logo_url = $1, updated_at = now() WHERE id = $2 AND logo_url IS NULL`,
    [logoUrl, fundId]
  );
}

async function writeContact(
  fundId: string,
  contact: ExtractedContact,
  existing: ExistingContact[]
): Promise<ContactWriteResult> {
  const match = existing.find((e) => e.name.toLowerCase() === contact.name.toLowerCase());

  if (!match) {
    // New contact — insert
    await pool.query(
      `INSERT INTO investor (id, fund_id, name, role, linkedin_url, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, now(), now())`,
      [fundId, contact.name, contact.role, contact.linkedinUrl]
    );
    return "inserted";
  }

  if (match.role !== contact.role) {
    // Role changed — update and flag
    await pool.query(
      `UPDATE investor SET role = $1, linkedin_url = $2, updated_at = now()
       WHERE fund_id = $3 AND name = $4`,
      [contact.role, contact.linkedinUrl, fundId, contact.name]
    );
    return "role_changed";
  }

  // Same name, same role — bump updated_at so staleness clock resets
  await pool.query(`UPDATE investor SET updated_at = now() WHERE fund_id = $1 AND name = $2`, [
    fundId,
    contact.name,
  ]);
  return "confirmed";
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  console.log("=== AlleyCorp Fund Enrichment Pipeline ===");
  console.log(`Mode:     ${DRY_RUN ? "DRY RUN (no DB writes)" : "LIVE (writing to Railway)"}`);
  console.log(
    `Staleness: ${FORCE ? "FORCE — re-enriching all funds" : `skip if contacts updated within ${MAX_AGE_DAYS} days`}`
  );
  console.log();

  const { rows: funds } = await pool.query<FundRow>(
    `SELECT id, name, website, logo_url AS "logoUrl" FROM fund ORDER BY name`
  );
  console.log(`Found ${funds.length} funds in DB\n`);

  let logosWritten = 0;
  let contactsInserted = 0;
  let contactsConfirmed = 0;
  let roleChanges = 0;
  let fundsSkipped = 0;
  const roleChangeLog: string[] = [];

  for (const fund of funds) {
    console.log(`\n── ${fund.name}`);

    if (!fund.website) {
      console.log(`   ⚠ No website — skipping`);
      continue;
    }

    // ── Logo (only write if missing) ──────────────────────────────────────
    if (fund.logoUrl) {
      console.log(`   Logo already set`);
    } else {
      const logoUrl = buildLogoUrl(fund.website);
      console.log(`   ✓ Logo: ${logoUrl}`);
      if (!DRY_RUN) {
        await writeLogo(fund.id, logoUrl);
        logosWritten++;
      }
    }

    // ── Staleness check ───────────────────────────────────────────────────
    const existing = await getExistingContacts(fund.id);
    const stale = isStale(existing);

    if (!stale && !FORCE) {
      const ageInDays = Math.round(
        (Date.now() - new Date(existing[0].updatedAt).getTime()) / 86_400_000
      );
      console.log(`   Contacts fresh (${ageInDays}d old, threshold ${MAX_AGE_DAYS}d) — skipping`);
      fundsSkipped++;
      continue;
    }

    if (existing.length > 0) {
      console.log(`   Contacts stale — re-enriching`);
    }

    // ── Exa + Claude ──────────────────────────────────────────────────────
    console.log(`   Exa: "${fund.name}" managing partner...`);
    const pages = await searchLinkedIn(fund.name, exa);
    console.log(`   Exa returned ${pages.length} LinkedIn profile(s)`);

    if (pages.length === 0) {
      console.log(`   No results — skipping contacts`);
      continue;
    }

    const contacts = await extractContacts(fund.name, pages, claude);
    console.log(`   Claude extracted ${contacts.length} contact(s)`);

    for (const c of contacts) {
      console.log(`   → ${c.name} · ${c.role} · ${c.linkedinUrl}`);

      if (!DRY_RUN) {
        const result = await writeContact(fund.id, c, existing);
        if (result === "inserted") {
          contactsInserted++;
          console.log(`     ✓ Inserted (new contact)`);
        } else if (result === "role_changed") {
          roleChanges++;
          const prev = existing.find((e) => e.name.toLowerCase() === c.name.toLowerCase());
          const msg = `⚠ ROLE CHANGE: ${fund.name} / ${c.name}: "${prev?.role}" → "${c.role}"`;
          console.log(`     ${msg}`);
          roleChangeLog.push(msg);
        } else {
          contactsConfirmed++;
          console.log(`     ✓ Confirmed (re-verified, no change)`);
        }
      }
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Funds skipped (fresh):  ${fundsSkipped}`);
  if (!DRY_RUN) {
    console.log(`Logos written:          ${logosWritten}`);
    console.log(`Contacts inserted:      ${contactsInserted}`);
    console.log(`Contacts confirmed:     ${contactsConfirmed}`);
    console.log(`Role changes detected:  ${roleChanges}`);
    if (roleChangeLog.length > 0) {
      console.log(`\n⚠ Role changes (review these):`);
      for (const msg of roleChangeLog) console.log(`  ${msg}`);
    }
  } else {
    console.log(`\nRun with --write to commit to Railway.`);
    console.log(`Run with --write --force to re-enrich all funds.`);
  }

  await pool.end();
}

run().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
