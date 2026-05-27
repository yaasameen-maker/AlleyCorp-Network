# AlleyCorp Relationship Intelligence Platform — Data Model

**Version:** 1.0  
**Date:** May 2026  
**Owner:** Luba Kaper  
**Status:** Draft — pending team review

---

## Design Principles

1. **Signals are stored independently from warmth tier.** The warmth tier is a derived classification. The underlying signals are the ground truth. This means the tier can be recalibrated, overridden, or audited without touching signal data.

2. **Investor and Fund are separate entities.** A fund has multiple partners. Partners change firms. Tracking individual role changes is a core relationship intelligence signal. Merging them would lose this capability.

3. **Built for extensibility.** The data model supports Deep Tech, Healthcare, and General team workflows without a structural rewrite. Profile types and signal types are extensible via the `profile_type` and `signal_type` fields.

4. **No AI scoring in Phase 1.** Warmth tier is calculated deterministically from signal data. The schema reflects this: warmth tier is a computed field, not an AI output.

5. **Relationship intelligence is not anonymously accessible.** All access is authenticated. This is enforced at the application layer, not the schema layer.

---

## Entities

### 1. Fund

A venture fund, angel syndicate, or emerging manager. The primary profile type for the Deep Tech team.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| name | TEXT | Yes | Fund name (e.g. "Lux Capital") |
| website | TEXT | No | Fund website URL |
| focus | TEXT | No | Investment focus (e.g. "deep tech, life sciences") |
| stage | TEXT | No | Typical stage (e.g. "Seed", "Series A", "Multi-stage") |
| aum_tier | TEXT | No | AUM range (e.g. "< $100M", "$100M–$500M", "> $1B") |
| emerging_manager | BOOLEAN | No | True if emerging manager or solo GP |
| hq_location | TEXT | No | City, state (e.g. "New York, NY") |
| linkedin_url | TEXT | No | Fund LinkedIn page |
| notes | TEXT | No | Free-text notes from AlleyCorp team |
| created_at | TIMESTAMPTZ | Yes | Record creation timestamp |
| updated_at | TIMESTAMPTZ | Yes | Last update timestamp |

**Design note:** `aum_tier` uses ranges not exact figures. AUM data from public sources is often approximate or lagged.

---

### 2. Investor

An individual partner, angel, or emerging manager. Links to a Fund. Tracks role changes over time.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| fund_id | UUID | No | FK → Fund. Null if independent angel. |
| name | TEXT | Yes | Full name (e.g. "Josh Wolfe") |
| role | TEXT | No | Current role (e.g. "Co-Founder & Managing Partner") |
| linkedin_url | TEXT | No | Personal LinkedIn URL |
| email | TEXT | No | Contact email (Phase 2 only) |
| stage_focus | TEXT | No | Preferred investment stage |
| sector_focus | TEXT | No | Preferred sectors |
| location | TEXT | No | City, state |
| alley_contact | TEXT | No | AlleyCorp team member who owns this relationship |
| notes | TEXT | No | Free-text notes |
| created_at | TIMESTAMPTZ | Yes | Record creation timestamp |
| updated_at | TIMESTAMPTZ | Yes | Last update timestamp |

**Design note:** When a partner moves firms, create a new `fund_id` link and update the role. Keep the original record for history. Do not delete or overwrite.

---

### 3. Portfolio Company

An AlleyCorp portfolio company. The anchor for all co-investment relationships.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| name | TEXT | Yes | Company name (e.g. "Viam") |
| website | TEXT | No | Company website URL |
| sector | TEXT | No | Sector (e.g. "Robotics", "Nuclear", "Space") |
| stage | TEXT | No | Current stage (e.g. "Series B") |
| alley_role | TEXT | No | AlleyCorp's role (e.g. "Lead", "Participant", "Incubator") |
| team | TEXT | No | AlleyCorp team (e.g. "Deep Tech", "Healthcare", "General") |
| status | TEXT | Yes | "active" or "alumni" |
| founded_year | INTEGER | No | Year founded |
| notes | TEXT | No | Free-text notes |
| created_at | TIMESTAMPTZ | Yes | Record creation timestamp |
| updated_at | TIMESTAMPTZ | Yes | Last update timestamp |

**Seed data (20 active Deep Tech companies confirmed by Lauren Young, May 2026):**
Glacier, Valar Atomics, Eyebot, Cargo Robotics, Portal Space Systems, Appetronix, Civ Robotics, Koop Technologies, Renovate Robotics, Mapless AI, Earth Force, Aon 3D, Avatar, Root Access, Halo Braid, dolaGon, ARIX Technologies, Inductive Bio, Viam, Archer Aviation.

**Alumni (exited, do not include in active data model):**
Spaero Bio, Dexai Robotics, Aescape.

---

### 4. Relationship

The core entity. Links a Fund (or Investor) to a Portfolio Company. Stores the warmth tier and the AlleyCorp team member who owns the relationship. Signals are stored separately.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| fund_id | UUID | No | FK → Fund. Null if individual investor. |
| investor_id | UUID | No | FK → Investor. Null if fund-level only. |
| portfolio_company_id | UUID | Yes | FK → Portfolio Company |
| alley_partner | TEXT | No | AlleyCorp team member who manages this relationship |
| warmth_tier | TEXT | Yes | "hot", "warm", "stale", or "cold" |
| warmth_calculated_at | TIMESTAMPTZ | No | When warmth tier was last calculated |
| last_signal_date | DATE | No | Date of the most recent signal |
| override | BOOLEAN | No | True if warmth tier has been manually overridden |
| override_note | TEXT | No | Explanation of manual override |
| override_by | TEXT | No | Who overrode the tier |
| override_at | TIMESTAMPTZ | No | When the override was set |
| notes | TEXT | No | Free-text relationship notes |
| created_at | TIMESTAMPTZ | Yes | Record creation timestamp |
| updated_at | TIMESTAMPTZ | Yes | Last update timestamp |

**Design note:** `warmth_tier` is stored here for fast querying but is derived from Signal data. When signals are updated, warmth_tier should be recalculated. `override` flag allows a human to lock the tier against recalculation when they know something the data does not.

**Warmth tier definitions:**
- `hot`: 3+ active signals, co-investment within 18 months
- `warm`: 2 active signals, relationship confirmed but not recently reinforced
- `stale`: signal dropped or co-investor did not return at a subsequent round. Signals decay over time if not reinforced.
- `cold`: no confirmed relationship. Target co-investor to build toward.

**Warmth calibration anchors (Lauren Young, May 2026):**
Riot Ventures = Hot, Snowpoint Ventures = Hot, General Catalyst = Hot, Mach33 = Hot.

---

### 5. Signal

One signal row per observed relationship event. Signals are the ground truth. Warmth tier is derived from them.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| relationship_id | UUID | Yes | FK → Relationship |
| signal_type | TEXT | Yes | See signal types below |
| signal_date | DATE | Yes | Date the signal was observed |
| source | TEXT | Yes | Where the data came from (e.g. "Crunchbase", "Swoogo", "LinkedIn export", "TechCrunch") |
| value | TEXT | No | Signal value or description (e.g. "Series A · $25M · Lead") |
| weight | TEXT | Yes | "high", "medium", or "low" |
| confidence | TEXT | Yes | "confirmed", "inferred", or "pending" |
| created_at | TIMESTAMPTZ | Yes | Record creation timestamp |

**Signal types and weights:**

| signal_type | Weight | Source | Notes |
|-------------|--------|--------|-------|
| co_investment | High | Crunchbase, press releases | One row per round |
| event_attendance | High | Swoogo export, Luma export | One row per event |
| linkedin_connection | Medium | LinkedIn export | One row per confirmed connection |
| press_mention | Medium | Google News, TechCrunch, AlleyCorp Substack | One row per mention |
| co_investment_recency | Medium | Derived from co_investment date | Recalculated automatically |
| email_contact | High | Email inbox (Phase 2 only) | Do not build in Phase 1 |

**Design note:** Signals decay over time. A co_investment signal from 30 months ago should carry less weight than one from 6 months ago. Recency should be factored into warmth scoring logic, not stored as a separate field.

---

## Relationships Between Entities

```
Fund (1) ──── (many) Investor
Fund (1) ──── (many) Relationship
Investor (1) ──── (many) Relationship
Portfolio Company (1) ──── (many) Relationship
Relationship (1) ──── (many) Signal
```

---

## Seed Data — First Sprint

Seed these relationships before the holiday. Enough to validate the full vertical slice.

### Confirmed Hot (Lauren's calibration anchors)
| Fund | Portfolio Company | Round | Date |
|------|------------------|-------|------|
| Riot Ventures | Valar Atomics | Seed (lead) | 2022 |
| Snowpoint Ventures | Valar Atomics | Series A | 2023 |
| General Catalyst | (confirm from research) | — | — |
| Mach33 | Portal Space Systems | (confirm from research) | — |

### Stale (vertical slice example)
| Fund | Portfolio Company | Round | Note |
|------|------------------|-------|------|
| Lux Capital | Inductive Bio | Seed Dec 2023 | Lux returned at Series A May 2025. AlleyCorp did not. |

### Warm (contrast example)
| Fund | Portfolio Company | Round | Note |
|------|------------------|-------|------|
| USV (Albert Wenger) | Viam | Series B + C | Active but not recently reinforced |

---

## Open Questions

- [ ] Confirm General Catalyst and Mach33 portfolio company connections from public sources (Person 2 pre-holiday task)
- [ ] Event data: Swoogo and Luma export files pending from Lauren. Map event fields to `signal_type = event_attendance` when received.
- [ ] Manual override layer: design decision pending. Schema has override fields ready but UI for managing overrides is not yet scoped.
- [ ] Role change tracking: when an investor moves firms, how do we handle historical signals tied to the old fund_id? Needs a decision before Phase 2.

---

## Phase 2 Additions (Do Not Build Yet)

- `email_contact` signal type (Kabir's enrichment layer, available ~June 1)
- Healthcare team profile types: executive contacts at pharma, health systems, payers
- General team profile types: operators at post-IPO companies, angels, emerging managers
- Automated enrichment from PitchBook or LinkedIn APIs

---

*SCHEMA.md v1.0 · May 2026 · Luba Kaper · AlleyCorp Relationship Intelligence Platform*
