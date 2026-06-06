-- Migration 001: Add scraper signal fields
-- Extends the signal table to support web-scraped signals with
-- full traceability (source URL, title, raw content) and deduplication.
--
-- Safe to run multiple times — uses IF NOT EXISTS / DO blocks.

BEGIN;

ALTER TABLE signal
  ADD COLUMN IF NOT EXISTS source_url   text,
  ADD COLUMN IF NOT EXISTS source_title text,
  ADD COLUMN IF NOT EXISTS raw_snippet  text,
  ADD COLUMN IF NOT EXISTS unique_hash  text;

-- Unique constraint for deduplication — re-running the scraper never creates duplicates.
-- Hash is built from: fund_name + company_name + signal_type + source_url + signal_date
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'signal_unique_hash_key'
  ) THEN
    ALTER TABLE signal ADD CONSTRAINT signal_unique_hash_key UNIQUE (unique_hash);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_signal_unique_hash ON signal (unique_hash);
CREATE INDEX IF NOT EXISTS idx_signal_source_url  ON signal (source_url);

COMMIT;
