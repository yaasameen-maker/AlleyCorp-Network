-- Migration 002: Add investor market-map fields
-- Supports the June 11 pivot from co-investor-only tracking to the broader
-- deep tech investor universe.
--
-- Safe to run multiple times.

BEGIN;

ALTER TABLE fund
  ADD COLUMN IF NOT EXISTS geography_focus text,
  ADD COLUMN IF NOT EXISTS check_size_proxy text,
  ADD COLUMN IF NOT EXISTS deep_tech_signal text,
  ADD COLUMN IF NOT EXISTS investor_status text,
  ADD COLUMN IF NOT EXISTS is_vip boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS profile_last_checked_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_fund_investor_status ON fund (investor_status);
CREATE INDEX IF NOT EXISTS idx_fund_is_vip ON fund (is_vip);
CREATE INDEX IF NOT EXISTS idx_fund_hq_location ON fund (hq_location);

COMMIT;
