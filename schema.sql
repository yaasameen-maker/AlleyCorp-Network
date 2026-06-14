-- AlleyCorp Relationship Intelligence Platform
-- PostgreSQL Schema v1.0
-- Generated from SCHEMA.md v1.0 · May 2026
-- Idempotent: safe to run multiple times (IF NOT EXISTS throughout)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────
-- 1. Fund
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fund (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name             TEXT         NOT NULL,
    website          TEXT,
    focus            TEXT,
    stage            TEXT,
    aum_tier         TEXT,
    emerging_manager BOOLEAN,
    hq_location      TEXT,
    geography_focus  TEXT,
    check_size_proxy TEXT,
    deep_tech_signal TEXT,
    investor_status  TEXT,
    is_vip           BOOLEAN      NOT NULL DEFAULT false,
    profile_last_checked_at TIMESTAMPTZ,
    linkedin_url     TEXT,
    logo_url         TEXT,
    notes            TEXT,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────
-- 2. Investor
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS investor (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    fund_id        UUID         REFERENCES fund(id),
    name           TEXT         NOT NULL,
    role           TEXT,
    linkedin_url   TEXT,
    email          TEXT,
    stage_focus    TEXT,
    sector_focus   TEXT,
    location       TEXT,
    alley_contact  TEXT,
    notes          TEXT,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────
-- 3. Portfolio Company
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portfolio_company (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT         NOT NULL,
    website       TEXT,
    sector        TEXT,
    stage         TEXT,
    alley_role    TEXT,
    team          TEXT,
    status        TEXT         NOT NULL CHECK (status IN ('active', 'alumni')),
    founded_year  INTEGER,
    notes         TEXT,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────
-- 4. Relationship
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS relationship (
    id                      UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    fund_id                 UUID         REFERENCES fund(id),
    investor_id             UUID         REFERENCES investor(id),
    portfolio_company_id    UUID         REFERENCES portfolio_company(id),  -- nullable: event-only / target relationships have no co-investment yet
    alley_partner           TEXT,
    warmth_tier             TEXT         NOT NULL CHECK (warmth_tier IN ('hot', 'warm', 'stale', 'cold')),
    warmth_calculated_at    TIMESTAMPTZ,
    last_signal_date        DATE,
    override                BOOLEAN,
    override_note           TEXT,
    override_by             TEXT,
    override_at             TIMESTAMPTZ,
    notes                   TEXT,
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────
-- 5. Signal
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS signal (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    relationship_id UUID         NOT NULL REFERENCES relationship(id),
    signal_type     TEXT         NOT NULL CHECK (signal_type IN (
                                     'co_investment',
                                     'event_attendance',
                                     'linkedin_connection',
                                     'press_mention',
                                     'co_investment_recency',
                                     'email_contact'
                                 )),
    signal_date     DATE         NOT NULL,
    source          TEXT         NOT NULL,
    source_url      TEXT,
    source_title    TEXT,
    raw_snippet     TEXT,
    unique_hash     TEXT,
    value           TEXT,
    weight          TEXT         NOT NULL CHECK (weight IN ('high', 'medium', 'low')),
    confidence      TEXT         NOT NULL CHECK (confidence IN ('confirmed', 'inferred', 'pending')),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Idempotent migrations for existing Railway tables.
-- Safe to re-run — ADD COLUMN IF NOT EXISTS is a no-op when the column already exists.
ALTER TABLE signal ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE signal ADD COLUMN IF NOT EXISTS source_title TEXT;
ALTER TABLE signal ADD COLUMN IF NOT EXISTS raw_snippet TEXT;
ALTER TABLE signal ADD COLUMN IF NOT EXISTS unique_hash TEXT;

-- ─────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_investor_fund_id              ON investor(fund_id);
CREATE INDEX IF NOT EXISTS idx_relationship_fund_id          ON relationship(fund_id);
CREATE INDEX IF NOT EXISTS idx_relationship_investor_id      ON relationship(investor_id);
CREATE INDEX IF NOT EXISTS idx_relationship_portfolio_co_id  ON relationship(portfolio_company_id);
CREATE INDEX IF NOT EXISTS idx_relationship_warmth_tier      ON relationship(warmth_tier);
CREATE INDEX IF NOT EXISTS idx_signal_relationship_id        ON signal(relationship_id);
CREATE INDEX IF NOT EXISTS idx_signal_signal_type            ON signal(signal_type);
CREATE INDEX IF NOT EXISTS idx_signal_signal_date            ON signal(signal_date);
CREATE INDEX IF NOT EXISTS idx_signal_source_url             ON signal(source_url);
CREATE INDEX IF NOT EXISTS idx_signal_unique_hash            ON signal(unique_hash);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'signal_unique_hash_key') THEN
        ALTER TABLE signal ADD CONSTRAINT signal_unique_hash_key UNIQUE (unique_hash);
    END IF;
END $$;

-- ─────────────────────────────────────────
-- Auto-update updated_at trigger
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_fund_updated_at') THEN
        CREATE TRIGGER trg_fund_updated_at
            BEFORE UPDATE ON fund
            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_investor_updated_at') THEN
        CREATE TRIGGER trg_investor_updated_at
            BEFORE UPDATE ON investor
            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_portfolio_company_updated_at') THEN
        CREATE TRIGGER trg_portfolio_company_updated_at
            BEFORE UPDATE ON portfolio_company
            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_relationship_updated_at') THEN
        CREATE TRIGGER trg_relationship_updated_at
            BEFORE UPDATE ON relationship
            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

-- ─────────────────────────────────────────
-- Column additions (idempotent — safe to re-run on Railway)
-- ─────────────────────────────────────────
ALTER TABLE fund ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE fund ADD COLUMN IF NOT EXISTS geography_focus TEXT;
ALTER TABLE fund ADD COLUMN IF NOT EXISTS check_size_proxy TEXT;
ALTER TABLE fund ADD COLUMN IF NOT EXISTS deep_tech_signal TEXT;
ALTER TABLE fund ADD COLUMN IF NOT EXISTS investor_status TEXT;
ALTER TABLE fund ADD COLUMN IF NOT EXISTS is_vip BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE fund ADD COLUMN IF NOT EXISTS profile_last_checked_at TIMESTAMPTZ;

-- discovery_source: why is this fund in the system?
--   manual           → seeded by Luba / Lauren's confirmed list
--   portfolio_scan   → Phase 1: found via AlleyCorp portfolio funding news
--   network_expansion → Phase 2: found through a hot/warm fund's orbit (6-degrees)
ALTER TABLE relationship ADD COLUMN IF NOT EXISTS discovery_source TEXT
  CHECK (discovery_source IN ('manual', 'portfolio_scan', 'network_expansion'));

-- discovery_context: structured explanation of why this fund surfaced.
-- Phase 1 shape: { source_url, round, company, summary }
-- Phase 2 shape: { via_fund, shared_rounds, companies, oldest_signal_months, summary }
ALTER TABLE relationship ADD COLUMN IF NOT EXISTS discovery_context JSONB;

-- Make portfolio_company_id nullable for event-only and target relationships.
-- Funds that attended an event but have no co-investment should not be forced
-- to reference an arbitrary portfolio company.
ALTER TABLE relationship ALTER COLUMN portfolio_company_id DROP NOT NULL;
