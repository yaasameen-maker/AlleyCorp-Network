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
    linkedin_url     TEXT,
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
    portfolio_company_id    UUID         NOT NULL REFERENCES portfolio_company(id),
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
    value           TEXT,
    weight          TEXT         NOT NULL CHECK (weight IN ('high', 'medium', 'low')),
    confidence      TEXT         NOT NULL CHECK (confidence IN ('confirmed', 'inferred', 'pending')),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

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
