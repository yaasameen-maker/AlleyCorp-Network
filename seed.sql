-- AlleyCorp Relationship Intelligence Platform
-- Seed Data v1.0
-- Source: Lauren Young (May 2026) · confirmed against SCHEMA.md
-- Run after schema.sql. Wrapped in a transaction — rolls back fully on any error.

BEGIN;

-- Wipe all data before re-seeding so this file is safe to run multiple times.
-- CASCADE handles FK order automatically (signal → relationship → portfolio_company / fund).
TRUNCATE TABLE signal, relationship, investor, portfolio_company, fund RESTART IDENTITY CASCADE;

-- ─────────────────────────────────────────
-- 1. Portfolio Companies — 20 Active Deep Tech
--    Source: Lauren Young confirmed list, May 2026
-- ─────────────────────────────────────────
INSERT INTO portfolio_company (id, name, website, team, status, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Glacier',              'https://endwaste.io',          'Deep Tech', 'active', now(), now()),
  (gen_random_uuid(), 'Valar Atomics',        'https://valaratomics.com',     'Deep Tech', 'active', now(), now()),
  (gen_random_uuid(), 'Eyebot',               'https://eyebot.tech',          'Deep Tech', 'active', now(), now()),
  (gen_random_uuid(), 'Cargo Robotics',       'https://withcargo.com',        'Deep Tech', 'active', now(), now()),
  (gen_random_uuid(), 'Portal Space Systems', 'https://portalsystems.space',  'Deep Tech', 'active', now(), now()),
  (gen_random_uuid(), 'Appetronix',           'https://appetronix.com',       'Deep Tech', 'active', now(), now()),
  (gen_random_uuid(), 'Civ Robotics',         'https://civrobotics.com',      'Deep Tech', 'active', now(), now()),
  (gen_random_uuid(), 'Koop Technologies',    'https://koop.ai',              'Deep Tech', 'active', now(), now()),
  (gen_random_uuid(), 'Renovate Robotics',    'https://renovaterobotics.com', 'Deep Tech', 'active', now(), now()),
  (gen_random_uuid(), 'Mapless AI',           'https://mapless.ai',           'Deep Tech', 'active', now(), now()),
  (gen_random_uuid(), 'Earth Force',          'https://earthforce.io',        'Deep Tech', 'active', now(), now()),
  (gen_random_uuid(), 'Aon 3D',              'https://aon3d.com',            'Deep Tech', 'active', now(), now()),
  (gen_random_uuid(), 'Avatar',               'https://avatarsystems.com',    'Deep Tech', 'active', now(), now()),
  (gen_random_uuid(), 'Root Access',          'https://rootaccess.ai',        'Deep Tech', 'active', now(), now()),
  (gen_random_uuid(), 'Halo Braid',           'https://halobraid.com',        'Deep Tech', 'active', now(), now()),
  (gen_random_uuid(), 'dolaGon',              'https://dolagon.com',          'Deep Tech', 'active', now(), now()),
  (gen_random_uuid(), 'ARIX Technologies',    'https://arix-tech.com',        'Deep Tech', 'active', now(), now()),
  (gen_random_uuid(), 'Inductive Bio',        'https://inductive.bio',        'Deep Tech', 'active', now(), now()),
  (gen_random_uuid(), 'Viam',                 'https://viam.com',             'Deep Tech', 'active', now(), now()),
  (gen_random_uuid(), 'Archer Aviation',      'https://archer.com',           'Deep Tech', 'active', now(), now());

-- ─────────────────────────────────────────
-- 2. Funds
-- ─────────────────────────────────────────
INSERT INTO fund (id, name, focus, stage, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Lux Capital',           'Life sciences and deep tech', 'Multi-stage',      now(), now()),
  (gen_random_uuid(), 'Union Square Ventures', 'Early stage tech',            'Seed to Series B', now(), now()),
  (gen_random_uuid(), 'Riot Ventures',         'Deep tech',                   'Seed',             now(), now()),
  (gen_random_uuid(), 'Snowpoint Ventures',    'Deep tech',                   'Series A',         now(), now()),
  (gen_random_uuid(), 'General Catalyst',      'Multi-sector',                'Multi-stage',      now(), now()),
  (gen_random_uuid(), 'Mach33',                'Space tech',                  'Seed to Series A', now(), now());

-- ─────────────────────────────────────────
-- 3. Relationships
--    IDs are resolved by name via subquery — no hardcoded UUIDs.
-- ─────────────────────────────────────────

-- Lux Capital + Inductive Bio · stale
INSERT INTO relationship (id, fund_id, portfolio_company_id, warmth_tier, last_signal_date, created_at, updated_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM fund WHERE name = 'Lux Capital'),
  (SELECT id FROM portfolio_company WHERE name = 'Inductive Bio'),
  'stale',
  '2023-12-01',
  now(), now();

-- Union Square Ventures + Viam · warm
INSERT INTO relationship (id, fund_id, portfolio_company_id, warmth_tier, last_signal_date, created_at, updated_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM fund WHERE name = 'Union Square Ventures'),
  (SELECT id FROM portfolio_company WHERE name = 'Viam'),
  'warm',
  '2023-06-01',
  now(), now();

-- Riot Ventures + Valar Atomics · hot
INSERT INTO relationship (id, fund_id, portfolio_company_id, warmth_tier, created_at, updated_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM fund WHERE name = 'Riot Ventures'),
  (SELECT id FROM portfolio_company WHERE name = 'Valar Atomics'),
  'hot',
  now(), now();

-- Snowpoint Ventures + Valar Atomics · hot
INSERT INTO relationship (id, fund_id, portfolio_company_id, warmth_tier, created_at, updated_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM fund WHERE name = 'Snowpoint Ventures'),
  (SELECT id FROM portfolio_company WHERE name = 'Valar Atomics'),
  'hot',
  now(), now();

-- Mach33 + Portal Space Systems · hot
INSERT INTO relationship (id, fund_id, portfolio_company_id, warmth_tier, created_at, updated_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM fund WHERE name = 'Mach33'),
  (SELECT id FROM portfolio_company WHERE name = 'Portal Space Systems'),
  'hot',
  now(), now();

-- ─────────────────────────────────────────
-- 4. Signals
--    relationship_id resolved by joining fund + portfolio_company by name.
-- ─────────────────────────────────────────

-- Lux Capital + Inductive Bio: co_investment Seed Dec 2023
INSERT INTO signal (id, relationship_id, signal_type, signal_date, source, value, weight, confidence, created_at)
SELECT
  gen_random_uuid(),
  r.id,
  'co_investment',
  '2023-12-01',
  'Crunchbase',
  'Seed · Dec 2023 · co-led alongside a16z Bio + Health',
  'high',
  'confirmed',
  now()
FROM relationship r
JOIN fund f             ON f.id  = r.fund_id
JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE f.name = 'Lux Capital' AND pc.name = 'Inductive Bio';

-- Union Square Ventures + Viam: co_investment Series B + C
INSERT INTO signal (id, relationship_id, signal_type, signal_date, source, value, weight, confidence, created_at)
SELECT
  gen_random_uuid(),
  r.id,
  'co_investment',
  '2023-06-01',
  'Crunchbase',
  'Series B + Series C',
  'high',
  'confirmed',
  now()
FROM relationship r
JOIN fund f             ON f.id  = r.fund_id
JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE f.name = 'Union Square Ventures' AND pc.name = 'Viam';

COMMIT;
