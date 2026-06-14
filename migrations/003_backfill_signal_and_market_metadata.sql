-- Migration 003: Backfill signal provenance and investor market metadata
-- Non-destructive: updates existing rows in place after migrations 001 and 002.

BEGIN;

UPDATE signal
SET
  source_title = COALESCE(source_title, source),
  raw_snippet = COALESCE(raw_snippet, value),
  unique_hash = COALESCE(
    unique_hash,
    encode(
      digest(
        relationship_id::text || '|' || signal_type || '|' || signal_date::text || '|' || source || '|' || COALESCE(value, ''),
        'sha256'
      ),
      'hex'
    )
  );

UPDATE fund
SET
  investor_status = CASE
    WHEN name IN (
      'Lux Capital',
      'Union Square Ventures',
      'a16z American Dynamism',
      'Eclipse Ventures',
      'Founders Fund'
    )
      THEN 'market_prospect'
    ELSE 'vip_co_investor'
  END,
  is_vip = CASE
    WHEN name IN (
      'Lux Capital',
      'Union Square Ventures',
      'a16z American Dynamism',
      'Eclipse Ventures',
      'Founders Fund'
    )
      THEN false
    ELSE true
  END,
  hq_location = CASE name
    WHEN 'Lux Capital' THEN 'New York'
    WHEN 'Union Square Ventures' THEN 'New York'
    WHEN 'Riot Ventures' THEN 'Los Angeles'
    WHEN 'Snowpoint Ventures' THEN 'San Francisco'
    WHEN 'General Catalyst' THEN 'Cambridge / New York / San Francisco'
    WHEN 'Mach33' THEN 'Los Angeles'
    WHEN 'a16z American Dynamism' THEN 'San Francisco'
    WHEN 'Eclipse Ventures' THEN 'Palo Alto'
    WHEN 'Founders Fund' THEN 'San Francisco'
    WHEN 'Defy Partners' THEN 'Bay Area'
    WHEN 'REFASHIOND Ventures' THEN 'New York'
    WHEN 'Day One Ventures' THEN 'San Francisco'
    WHEN 'NEA' THEN 'Menlo Park'
    WHEN 'Ubiquity Ventures' THEN 'Palo Alto'
    WHEN 'ff Venture Capital' THEN 'New York'
    WHEN 'Geodesic Capital' THEN 'San Francisco'
    WHEN 'Amazon Climate Pledge Fund' THEN 'Seattle'
    WHEN 'Flybridge' THEN 'Boston / New York'
    WHEN 'Cherubic Ventures' THEN 'San Francisco'
    WHEN 'SOSV' THEN 'Newark / Global'
    WHEN 'Trimble Ventures' THEN 'Westminster, CO'
    WHEN 'BOLD Capital Partners' THEN 'Los Angeles'
    WHEN 'SineWave Ventures' THEN 'Washington, DC'
    ELSE hq_location
  END,
  geography_focus = CASE name
    WHEN 'Union Square Ventures' THEN 'US, New York network'
    WHEN 'Lux Capital' THEN 'US, New York and Bay Area network'
    WHEN 'a16z American Dynamism' THEN 'US, defense and national resilience'
    WHEN 'Eclipse Ventures' THEN 'US industrial technology'
    WHEN 'Founders Fund' THEN 'US, hard tech and frontier technology'
    WHEN 'Geodesic Capital' THEN 'US and global growth-stage network'
    WHEN 'Amazon Climate Pledge Fund' THEN 'Climate and sustainability network'
    ELSE 'US deep tech network'
  END,
  check_size_proxy = CASE
    WHEN stage ILIKE '%Series A%' OR stage ILIKE '%Series B%' OR stage ILIKE '%Multi%' THEN 'Series A+ capable'
    WHEN stage ILIKE '%Pre-Seed%' THEN 'Pre-seed / seed'
    WHEN stage ILIKE '%Seed%' THEN 'Seed / early Series A'
    ELSE 'Unknown; verify before matching to raise amount'
  END,
  deep_tech_signal = CASE
    WHEN focus ILIKE '%deep tech%'
      OR focus ILIKE '%hard tech%'
      OR focus ILIKE '%space%'
      OR focus ILIKE '%robotics%'
      OR focus ILIKE '%defense%'
      OR focus ILIKE '%climate%'
      THEN focus
    WHEN name IN (
      'Founders Fund',
      'General Catalyst',
      'NEA',
      'Lux Capital',
      'a16z American Dynamism',
      'Eclipse Ventures'
    )
      THEN focus
    ELSE 'Deep tech relevance inferred from AlleyCorp co-investment context'
  END,
  profile_last_checked_at = now();

COMMIT;
