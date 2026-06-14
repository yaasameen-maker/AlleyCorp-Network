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
  -- Active Deep Tech — Lauren Young confirmed list, May 2026
  (gen_random_uuid(), 'Glacier',              'https://endwaste.io',           'Deep Tech', 'active', now(), now()),
  (gen_random_uuid(), 'Valar Atomics',        'https://valaratomics.com',      'Deep Tech', 'active', now(), now()),
  (gen_random_uuid(), 'Eyebot',               'https://eyebot.tech',           'Deep Tech', 'active', now(), now()),
  (gen_random_uuid(), 'Cargo Robotics',       'https://withcargo.com',         'Deep Tech', 'active', now(), now()),
  (gen_random_uuid(), 'Portal Space Systems', 'https://portalsystems.space',   'Deep Tech', 'active', now(), now()),
  (gen_random_uuid(), 'Appetronix',           'https://appetronix.com',        'Deep Tech', 'active', now(), now()),
  (gen_random_uuid(), 'Civ Robotics',         'https://civrobotics.com',       'Deep Tech', 'active', now(), now()),
  (gen_random_uuid(), 'Koop Technologies',    'https://koop.ai',               'Deep Tech', 'active', now(), now()),
  (gen_random_uuid(), 'Renovate Robotics',    'https://renovaterobotics.com',  'Deep Tech', 'active', now(), now()),
  (gen_random_uuid(), 'Mapless AI',           'https://mapless.ai',            'Deep Tech', 'active', now(), now()),
  (gen_random_uuid(), 'Earth Force',          'https://earthforce.io',         'Deep Tech', 'active', now(), now()),
  (gen_random_uuid(), 'Aon 3D',               'https://aon3d.com',             'Deep Tech', 'active', now(), now()),
  (gen_random_uuid(), 'Avatar',               'https://avatarsystems.com',     'Deep Tech', 'active', now(), now()),
  (gen_random_uuid(), 'Root Access',          'https://rootaccess.ai',         'Deep Tech', 'active', now(), now()),
  (gen_random_uuid(), 'Halo Braid',           'https://halobraid.com',         'Deep Tech', 'active', now(), now()),
  (gen_random_uuid(), 'dolaGon',              'https://dolagon.com',           'Deep Tech', 'active', now(), now()),
  (gen_random_uuid(), 'ARIX Technologies',    'https://arix-tech.com',         'Deep Tech', 'active', now(), now()),
  -- Alumni — exited AlleyCorp ownership (Lauren Young confirmed, May 2026)
  (gen_random_uuid(), 'Spaero Bio',           'https://spaero.bio',            'Deep Tech', 'alumni', now(), now()),
  (gen_random_uuid(), 'Dexai Robotics',       'https://dexai.com',             'Deep Tech', 'alumni', now(), now()),
  (gen_random_uuid(), 'Aescape',              'https://aescape.co',            'Deep Tech', 'alumni', now(), now());

-- NOTE: Inductive Bio and Viam were in early planning docs but are NOT on
-- Lauren Young's confirmed Deep Tech portfolio list (May 2026). Do not re-add
-- without explicit confirmation. See PORTFOLIO.md.

-- ─────────────────────────────────────────
-- 2. Funds
-- ─────────────────────────────────────────
INSERT INTO fund (id, name, website, focus, stage, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Lux Capital',              'luxcapital.com',        'Life sciences and deep tech',       'Multi-stage',      now(), now()),
  (gen_random_uuid(), 'Union Square Ventures',    'usv.com',               'Early stage tech',                  'Seed to Series B', now(), now()),
  (gen_random_uuid(), 'Riot Ventures',            'riotvc.com',            'Deep tech',                         'Seed',             now(), now()),
  (gen_random_uuid(), 'Snowpoint Ventures',       'snowpoint.vc',          'Deep tech',                         'Series A',         now(), now()),
  (gen_random_uuid(), 'General Catalyst',         'generalcatalyst.com',   'Multi-sector',                      'Multi-stage',      now(), now()),
  (gen_random_uuid(), 'Mach33',                   '33fg.com',              'Space tech',                        'Seed to Series A', now(), now()),
  -- Cold-tier targets: top deep tech funds AlleyCorp has not yet co-invested with
  (gen_random_uuid(), 'a16z American Dynamism',   'a16z.com',              'Defense, aerospace, manufacturing', 'Multi-stage',      now(), now()),
  (gen_random_uuid(), 'Eclipse Ventures',         'eclipse.vc',            'Deep tech, industrial robotics',    'Series A/B',       now(), now()),
  (gen_random_uuid(), 'Founders Fund',            'foundersfund.com',      'Deep tech, defense, biotech',       'Multi-stage',      now(), now()),
  -- Avatar Robotics co-investors — Seed $6.01M, Jan 30 2026
  -- Source: Crunchbase. Round led by ARV alongside Defy Partners and REFASHIOND Ventures.
  (gen_random_uuid(), 'Defy Partners',            'defy.vc',               'Early-stage technology',            'Pre-Seed to Series A', now(), now()),
  (gen_random_uuid(), 'REFASHIOND Ventures',      'refashiond.vc',         'Supply chain technology',           'Early-stage',          now(), now());

-- ─────────────────────────────────────────
-- 3. Relationships
--    IDs are resolved by name via subquery — no hardcoded UUIDs.
-- ─────────────────────────────────────────

-- NOTE: Lux Capital + Inductive Bio (stale) and USV + Viam (stale) were in
-- early planning docs. Inductive Bio and Viam are NOT on Lauren's confirmed
-- Deep Tech portfolio list. These relationships are removed until a confirmed
-- replacement portfolio company is identified. See PORTFOLIO.md.

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

-- General Catalyst + Eyebot · hot (led Series A Aug 2025; co-led Seed Jun 2024)
INSERT INTO relationship (id, fund_id, portfolio_company_id, warmth_tier, last_signal_date, created_at, updated_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM fund WHERE name = 'General Catalyst'),
  (SELECT id FROM portfolio_company WHERE name = 'Eyebot'),
  'hot',
  '2025-08-26',
  now(), now();

-- a16z American Dynamism · cold (target — no co-investment yet, portfolio_company_id NULL)
INSERT INTO relationship (id, fund_id, portfolio_company_id, warmth_tier, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM fund WHERE name = 'a16z American Dynamism'),
  NULL,
  'cold',
  now(), now()
);

-- Eclipse Ventures · cold (target — no co-investment yet, portfolio_company_id NULL)
INSERT INTO relationship (id, fund_id, portfolio_company_id, warmth_tier, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM fund WHERE name = 'Eclipse Ventures'),
  NULL,
  'cold',
  now(), now()
);

-- Founders Fund + Valar Atomics · cold (target — no co-investment yet)
INSERT INTO relationship (id, fund_id, portfolio_company_id, warmth_tier, created_at, updated_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM fund WHERE name = 'Founders Fund'),
  (SELECT id FROM portfolio_company WHERE name = 'Valar Atomics'),
  'cold',
  now(), now();

-- Defy Partners + Avatar · warm (Seed $6.01M co-investment Jan 2026)
INSERT INTO relationship (id, fund_id, portfolio_company_id, warmth_tier, last_signal_date, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM fund WHERE name = 'Defy Partners'),
  (SELECT id FROM portfolio_company WHERE name = 'Avatar'),
  'warm',
  '2026-01-30',
  now(), now()
);

-- REFASHIOND Ventures + Avatar · warm (Seed $6.01M co-investment Jan 2026)
INSERT INTO relationship (id, fund_id, portfolio_company_id, warmth_tier, last_signal_date, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM fund WHERE name = 'REFASHIOND Ventures'),
  (SELECT id FROM portfolio_company WHERE name = 'Avatar'),
  'warm',
  '2026-01-30',
  now(), now()
);

-- ─────────────────────────────────────────
-- 4. Signals
--    relationship_id resolved by joining fund + portfolio_company by name.
-- ─────────────────────────────────────────

-- Lux Capital and USV signals removed — portfolio companies (Inductive Bio,
-- Viam) are not on Lauren's confirmed list. See PORTFOLIO.md.

-- Riot Ventures + Valar Atomics: co_investment Seed Mar 2025
INSERT INTO signal (id, relationship_id, signal_type, signal_date, source, value, weight, confidence, created_at)
SELECT
  gen_random_uuid(),
  r.id,
  'co_investment',
  '2025-03-15',
  'Crunchbase',
  'Seed · Mar 2025 · co-led alongside AlleyCorp',
  'high',
  'confirmed',
  now()
FROM relationship r
JOIN fund f              ON f.id  = r.fund_id
JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE f.name = 'Riot Ventures' AND pc.name = 'Valar Atomics';

-- Snowpoint Ventures + Valar Atomics: co_investment Series A Jan 2025
INSERT INTO signal (id, relationship_id, signal_type, signal_date, source, value, weight, confidence, created_at)
SELECT
  gen_random_uuid(),
  r.id,
  'co_investment',
  '2025-11-10',
  'AlleyCorp Substack',
  'Series A $130M · Nov 2025 · lead alongside AlleyCorp',
  'high',
  'confirmed',
  now()
FROM relationship r
JOIN fund f              ON f.id  = r.fund_id
JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE f.name = 'Snowpoint Ventures' AND pc.name = 'Valar Atomics';

-- General Catalyst + Eyebot: co-lead Seed Jun 2024
INSERT INTO signal (id, relationship_id, signal_type, signal_date, source, value, weight, confidence, created_at)
SELECT
  gen_random_uuid(),
  r.id,
  'co_investment',
  '2024-06-01',
  'PRWeb',
  'Seed $6M · Jun 2024 · co-lead with AlleyCorp and Ubiquity Ventures',
  'high',
  'confirmed',
  now()
FROM relationship r
JOIN fund f              ON f.id  = r.fund_id
JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE f.name = 'General Catalyst' AND pc.name = 'Eyebot';

-- General Catalyst + Eyebot: led Series A Aug 2025
INSERT INTO signal (id, relationship_id, signal_type, signal_date, source, value, weight, confidence, created_at)
SELECT
  gen_random_uuid(),
  r.id,
  'co_investment',
  '2025-08-26',
  'TechCrunch',
  'Series A $20M · Aug 2025 · lead',
  'high',
  'confirmed',
  now()
FROM relationship r
JOIN fund f              ON f.id  = r.fund_id
JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE f.name = 'General Catalyst' AND pc.name = 'Eyebot';

-- Mach33 + Portal Space Systems: co_investment Seed Apr 2025
INSERT INTO signal (id, relationship_id, signal_type, signal_date, source, value, weight, confidence, created_at)
SELECT
  gen_random_uuid(),
  r.id,
  'co_investment',
  '2025-04-01',
  'Crunchbase',
  'Seed · Apr 2025 · co-led with AlleyCorp',
  'high',
  'confirmed',
  now()
FROM relationship r
JOIN fund f              ON f.id  = r.fund_id
JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE f.name = 'Mach33' AND pc.name = 'Portal Space Systems';

-- ─────────────────────────────────────────
-- 5. Additional Co-Investor Funds
--    Source: Crunchbase, TechCrunch, SOSV, GlobeNewswire (May 2026 research)
-- ─────────────────────────────────────────
INSERT INTO fund (id, name, website, focus, stage, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Day One Ventures',           'dayoneventures.com',    'Deep tech, hard tech',                  'Seed to Series A', now(), now()),
  (gen_random_uuid(), 'NEA',                        'nea.com',               'Multi-sector technology',               'Multi-stage',      now(), now()),
  (gen_random_uuid(), 'Ubiquity Ventures',          'ubiquity.vc',           'Deep tech, AI hardware',                'Seed',             now(), now()),
  (gen_random_uuid(), 'ff Venture Capital',         'ffvc.com',              'Deep tech, robotics, defense',          'Seed to Series A', now(), now()),
  (gen_random_uuid(), 'Geodesic Capital',           'geodesiccap.com',       'Defense tech, space',                   'Series A/B',       now(), now()),
  (gen_random_uuid(), 'Amazon Climate Pledge Fund', NULL,                    'Climate tech',                          'Multi-stage',      now(), now()),
  (gen_random_uuid(), 'Flybridge',                  'flybridge.com',         'Enterprise, deep tech',                 'Seed to Series A', now(), now()),
  (gen_random_uuid(), 'Cherubic Ventures',          'cherubic.com',          'Deep tech, robotics',                   'Seed',             now(), now()),
  (gen_random_uuid(), 'SOSV',                       'sosv.com',              'Hard tech, biotech (HAX accelerator)',  'Pre-Seed/Seed',    now(), now()),
  (gen_random_uuid(), 'Trimble Ventures',           'trimbleventures.com',   'Construction tech, geospatial',         'Seed to Series A', now(), now()),
  (gen_random_uuid(), 'BOLD Capital Partners',      'boldcap.com',           'Robotics, AI, defense',                 'Seed to Series A', now(), now()),
  (gen_random_uuid(), 'SineWave Ventures',          'sinewaveventures.com',  'Deep tech, advanced manufacturing',     'Series A/B',       now(), now());

-- ─────────────────────────────────────────
-- 6. Additional Relationships
-- ─────────────────────────────────────────

-- HOT — co-invested within 18 months of May 26, 2026 (after Nov 26, 2024)

-- Day One Ventures + Valar Atomics · hot (Series A Nov 2025)
INSERT INTO relationship (id, fund_id, portfolio_company_id, warmth_tier, last_signal_date, created_at, updated_at)
SELECT gen_random_uuid(),
  (SELECT id FROM fund WHERE name = 'Day One Ventures'),
  (SELECT id FROM portfolio_company WHERE name = 'Valar Atomics'),
  'hot', '2025-11-10', now(), now();

-- NEA + Glacier · hot (Series A Apr 2025)
INSERT INTO relationship (id, fund_id, portfolio_company_id, warmth_tier, last_signal_date, created_at, updated_at)
SELECT gen_random_uuid(),
  (SELECT id FROM fund WHERE name = 'NEA'),
  (SELECT id FROM portfolio_company WHERE name = 'Glacier'),
  'hot', '2025-04-28', now(), now();

-- Ubiquity Ventures + Eyebot · hot (Series A Aug 2025)
INSERT INTO relationship (id, fund_id, portfolio_company_id, warmth_tier, last_signal_date, created_at, updated_at)
SELECT gen_random_uuid(),
  (SELECT id FROM fund WHERE name = 'Ubiquity Ventures'),
  (SELECT id FROM portfolio_company WHERE name = 'Eyebot'),
  'hot', '2025-08-26', now(), now();

-- ff Venture Capital + Civ Robotics · hot (Series A Jul 2025)
INSERT INTO relationship (id, fund_id, portfolio_company_id, warmth_tier, last_signal_date, created_at, updated_at)
SELECT gen_random_uuid(),
  (SELECT id FROM fund WHERE name = 'ff Venture Capital'),
  (SELECT id FROM portfolio_company WHERE name = 'Civ Robotics'),
  'hot', '2025-07-15', now(), now();

-- Geodesic Capital + Portal Space Systems · hot (Series A Apr 2026)
INSERT INTO relationship (id, fund_id, portfolio_company_id, warmth_tier, last_signal_date, created_at, updated_at)
SELECT gen_random_uuid(),
  (SELECT id FROM fund WHERE name = 'Geodesic Capital'),
  (SELECT id FROM portfolio_company WHERE name = 'Portal Space Systems'),
  'hot', '2026-04-15', now(), now();

-- Amazon Climate Pledge Fund + Glacier · hot (Series A Apr 2025)
INSERT INTO relationship (id, fund_id, portfolio_company_id, warmth_tier, last_signal_date, created_at, updated_at)
SELECT gen_random_uuid(),
  (SELECT id FROM fund WHERE name = 'Amazon Climate Pledge Fund'),
  (SELECT id FROM portfolio_company WHERE name = 'Glacier'),
  'hot', '2025-04-28', now(), now();

-- WARM — most recent co-investment 18–24 months ago (May–Nov 2024)

-- Flybridge + Halo Braid · warm (Seed Jun 2024 — 23 months ago)
INSERT INTO relationship (id, fund_id, portfolio_company_id, warmth_tier, last_signal_date, created_at, updated_at)
SELECT gen_random_uuid(),
  (SELECT id FROM fund WHERE name = 'Flybridge'),
  (SELECT id FROM portfolio_company WHERE name = 'Halo Braid'),
  'warm', '2024-06-15', now(), now();

-- Cherubic Ventures + Cargo Robotics · warm (Seed Oct 2024 — 19 months ago)
INSERT INTO relationship (id, fund_id, portfolio_company_id, warmth_tier, last_signal_date, created_at, updated_at)
SELECT gen_random_uuid(),
  (SELECT id FROM fund WHERE name = 'Cherubic Ventures'),
  (SELECT id FROM portfolio_company WHERE name = 'Cargo Robotics'),
  'warm', '2024-10-01', now(), now();

-- STALE — most recent co-investment > 24 months ago (before May 2024)

-- SOSV + Renovate Robotics · hot (HAX Seed VC-II Aug 2025 — 9 months ago)
-- NOTE: SOSV returned at the Aug 2025 follow-on round. Relationship is active, not stale.
INSERT INTO relationship (id, fund_id, portfolio_company_id, warmth_tier, last_signal_date, created_at, updated_at)
SELECT gen_random_uuid(),
  (SELECT id FROM fund WHERE name = 'SOSV'),
  (SELECT id FROM portfolio_company WHERE name = 'Renovate Robotics'),
  'hot', '2025-08-27', now(), now();

-- Trimble Ventures + Civ Robotics · stale (Seed Sep 2022 — 44 months ago)
INSERT INTO relationship (id, fund_id, portfolio_company_id, warmth_tier, last_signal_date, created_at, updated_at)
SELECT gen_random_uuid(),
  (SELECT id FROM fund WHERE name = 'Trimble Ventures'),
  (SELECT id FROM portfolio_company WHERE name = 'Civ Robotics'),
  'stale', '2022-09-21', now(), now();

-- BOLD Capital Partners + Earth Force · stale (Seed Nov 2022 — 42 months ago)
INSERT INTO relationship (id, fund_id, portfolio_company_id, warmth_tier, last_signal_date, created_at, updated_at)
SELECT gen_random_uuid(),
  (SELECT id FROM fund WHERE name = 'BOLD Capital Partners'),
  (SELECT id FROM portfolio_company WHERE name = 'Earth Force'),
  'stale', '2022-11-29', now(), now();

-- SineWave Ventures + Aon 3D · stale (Series A Sep 2021 — 56 months ago)
INSERT INTO relationship (id, fund_id, portfolio_company_id, warmth_tier, last_signal_date, created_at, updated_at)
SELECT gen_random_uuid(),
  (SELECT id FROM fund WHERE name = 'SineWave Ventures'),
  (SELECT id FROM portfolio_company WHERE name = 'Aon 3D'),
  'stale', '2021-09-02', now(), now();

-- ─────────────────────────────────────────
-- 7. Signals for additional co-investors
-- ─────────────────────────────────────────

-- Day One Ventures + Valar Atomics: Seed Feb 2025 + Series A Nov 2025
INSERT INTO signal (id, relationship_id, signal_type, signal_date, source, value, weight, confidence, created_at)
SELECT gen_random_uuid(), r.id, 'co_investment', '2025-02-20', 'TechCrunch',
  'Seed $19M · Feb 2025 · co-investor alongside Riot Ventures', 'high', 'confirmed', now()
FROM relationship r JOIN fund f ON f.id = r.fund_id JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE f.name = 'Day One Ventures' AND pc.name = 'Valar Atomics';

INSERT INTO signal (id, relationship_id, signal_type, signal_date, source, value, weight, confidence, created_at)
SELECT gen_random_uuid(), r.id, 'co_investment', '2025-11-10', 'AlleyCorp Substack',
  'Series A $130M · Nov 2025 · led by Snowpoint Ventures, co-investors: Day One Ventures, Dream Ventures', 'high', 'confirmed', now()
FROM relationship r JOIN fund f ON f.id = r.fund_id JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE f.name = 'Day One Ventures' AND pc.name = 'Valar Atomics';

-- NEA + Glacier: Seed Apr 2022 + Seed Extension Mar 2024 + Series A Apr 2025
INSERT INTO signal (id, relationship_id, signal_type, signal_date, source, value, weight, confidence, created_at)
SELECT gen_random_uuid(), r.id, 'co_investment', '2022-04-19', 'TechCrunch',
  'Seed $4.5M · Apr 2022 · lead', 'high', 'confirmed', now()
FROM relationship r JOIN fund f ON f.id = r.fund_id JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE f.name = 'NEA' AND pc.name = 'Glacier';

INSERT INTO signal (id, relationship_id, signal_type, signal_date, source, value, weight, confidence, created_at)
SELECT gen_random_uuid(), r.id, 'co_investment', '2024-03-01', 'Waste Dive',
  'Seed Extension $7.7M · Mar 2024 · lead', 'high', 'confirmed', now()
FROM relationship r JOIN fund f ON f.id = r.fund_id JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE f.name = 'NEA' AND pc.name = 'Glacier';

INSERT INTO signal (id, relationship_id, signal_type, signal_date, source, value, weight, confidence, created_at)
SELECT gen_random_uuid(), r.id, 'co_investment', '2025-04-28', 'TechCrunch',
  'Series A $16M · Apr 2025 · participant', 'high', 'confirmed', now()
FROM relationship r JOIN fund f ON f.id = r.fund_id JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE f.name = 'NEA' AND pc.name = 'Glacier';

-- Ubiquity Ventures + Eyebot: Seed Jun 2024 + Series A Aug 2025
INSERT INTO signal (id, relationship_id, signal_type, signal_date, source, value, weight, confidence, created_at)
SELECT gen_random_uuid(), r.id, 'co_investment', '2024-06-01', 'PRWeb',
  'Seed $6M · Jun 2024 · co-lead with AlleyCorp', 'high', 'confirmed', now()
FROM relationship r JOIN fund f ON f.id = r.fund_id JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE f.name = 'Ubiquity Ventures' AND pc.name = 'Eyebot';

INSERT INTO signal (id, relationship_id, signal_type, signal_date, source, value, weight, confidence, created_at)
SELECT gen_random_uuid(), r.id, 'co_investment', '2025-08-26', 'TechCrunch',
  'Series A $20M · Aug 2025 · participant', 'high', 'confirmed', now()
FROM relationship r JOIN fund f ON f.id = r.fund_id JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE f.name = 'Ubiquity Ventures' AND pc.name = 'Eyebot';

-- ff Venture Capital + Civ Robotics: Seed Sep 2022 + Series A Jul 2025
INSERT INTO signal (id, relationship_id, signal_type, signal_date, source, value, weight, confidence, created_at)
SELECT gen_random_uuid(), r.id, 'co_investment', '2022-09-21', 'Crunchbase',
  'Seed $5M · Sep 2022 · co-investor alongside ff Venture Capital and others', 'high', 'confirmed', now()
FROM relationship r JOIN fund f ON f.id = r.fund_id JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE f.name = 'ff Venture Capital' AND pc.name = 'Civ Robotics';

INSERT INTO signal (id, relationship_id, signal_type, signal_date, source, value, weight, confidence, created_at)
SELECT gen_random_uuid(), r.id, 'co_investment', '2025-07-15', 'AlleyCorp Substack',
  'Series A $7.5M · Jul 2025 · participant (AlleyCorp led)', 'high', 'confirmed', now()
FROM relationship r JOIN fund f ON f.id = r.fund_id JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE f.name = 'ff Venture Capital' AND pc.name = 'Civ Robotics';

-- Geodesic Capital + Portal Space Systems: Series A Apr 2026
INSERT INTO signal (id, relationship_id, signal_type, signal_date, source, value, weight, confidence, created_at)
SELECT gen_random_uuid(), r.id, 'co_investment', '2026-04-20', 'AlleyCorp Substack',
  'Series A $50M · Apr 2026 · co-lead alongside Mach33 (AlleyCorp participated, $250M valuation)', 'high', 'confirmed', now()
FROM relationship r JOIN fund f ON f.id = r.fund_id JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE f.name = 'Geodesic Capital' AND pc.name = 'Portal Space Systems';

-- Mach33 co-led the same Portal Space Systems Series A
INSERT INTO signal (id, relationship_id, signal_type, signal_date, source, value, weight, confidence, created_at)
SELECT gen_random_uuid(), r.id, 'co_investment', '2026-04-20', 'AlleyCorp Substack',
  'Series A $50M · Apr 2026 · co-lead alongside Geodesic Capital (AlleyCorp participated, $250M valuation)', 'high', 'confirmed', now()
FROM relationship r JOIN fund f ON f.id = r.fund_id JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE f.name = 'Mach33' AND pc.name = 'Portal Space Systems';

-- Amazon Climate Pledge Fund + Glacier: Seed Extension Mar 2024 + Series A Apr 2025
INSERT INTO signal (id, relationship_id, signal_type, signal_date, source, value, weight, confidence, created_at)
SELECT gen_random_uuid(), r.id, 'co_investment', '2024-03-01', 'Waste Dive',
  'Seed Extension $7.7M · Mar 2024 · participant', 'medium', 'confirmed', now()
FROM relationship r JOIN fund f ON f.id = r.fund_id JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE f.name = 'Amazon Climate Pledge Fund' AND pc.name = 'Glacier';

INSERT INTO signal (id, relationship_id, signal_type, signal_date, source, value, weight, confidence, created_at)
SELECT gen_random_uuid(), r.id, 'co_investment', '2025-04-28', 'TechCrunch',
  'Series A $16M · Apr 2025 · participant', 'high', 'confirmed', now()
FROM relationship r JOIN fund f ON f.id = r.fund_id JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE f.name = 'Amazon Climate Pledge Fund' AND pc.name = 'Glacier';

-- Flybridge + Halo Braid: Seed Jun 2024
INSERT INTO signal (id, relationship_id, signal_type, signal_date, source, value, weight, confidence, created_at)
SELECT gen_random_uuid(), r.id, 'co_investment', '2024-06-15', 'Crunchbase',
  'Pre-Seed/Seed · Jun 2024 · co-investor', 'medium', 'confirmed', now()
FROM relationship r JOIN fund f ON f.id = r.fund_id JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE f.name = 'Flybridge' AND pc.name = 'Halo Braid';

-- Cherubic Ventures + Cargo Robotics: Seed Oct 2024
INSERT INTO signal (id, relationship_id, signal_type, signal_date, source, value, weight, confidence, created_at)
SELECT gen_random_uuid(), r.id, 'co_investment', '2024-10-01', 'Crunchbase',
  'Seed · Oct 2024 · co-investor', 'medium', 'confirmed', now()
FROM relationship r JOIN fund f ON f.id = r.fund_id JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE f.name = 'Cherubic Ventures' AND pc.name = 'Cargo Robotics';

-- SOSV + Renovate Robotics: Pre-Seed Mar 2023 + Seed VC-II Aug 2025 (HAX returned)
INSERT INTO signal (id, relationship_id, signal_type, signal_date, source, value, weight, confidence, created_at)
SELECT gen_random_uuid(), r.id, 'co_investment', '2023-02-01', 'AlleyCorp Substack',
  'Pre-Seed $2.5M · Feb 2023 · AlleyCorp (via Alley Robotics Ventures) led, SOSV/HAX co-investor', 'high', 'confirmed', now()
FROM relationship r JOIN fund f ON f.id = r.fund_id JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE f.name = 'SOSV' AND pc.name = 'Renovate Robotics';

INSERT INTO signal (id, relationship_id, signal_type, signal_date, source, value, weight, confidence, created_at)
SELECT gen_random_uuid(), r.id, 'co_investment', '2025-08-27', 'Tracxn / PitchBook',
  'Seed VC-II · Aug 2025 · HAX returned for follow-on', 'high', 'confirmed', now()
FROM relationship r JOIN fund f ON f.id = r.fund_id JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE f.name = 'SOSV' AND pc.name = 'Renovate Robotics';

-- Trimble Ventures + Civ Robotics: Seed Sep 2022
INSERT INTO signal (id, relationship_id, signal_type, signal_date, source, value, weight, confidence, created_at)
SELECT gen_random_uuid(), r.id, 'co_investment', '2022-09-21', 'Converge VC',
  'Seed $5M · Sep 2022 · strategic participant', 'medium', 'confirmed', now()
FROM relationship r JOIN fund f ON f.id = r.fund_id JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE f.name = 'Trimble Ventures' AND pc.name = 'Civ Robotics';

-- BOLD Capital Partners + Earth Force: Seed Nov 2022
INSERT INTO signal (id, relationship_id, signal_type, signal_date, source, value, weight, confidence, created_at)
SELECT gen_random_uuid(), r.id, 'co_investment', '2022-11-29', 'GlobeNewswire',
  'Seed $8.6M · Nov 2022 · participant', 'medium', 'confirmed', now()
FROM relationship r JOIN fund f ON f.id = r.fund_id JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE f.name = 'BOLD Capital Partners' AND pc.name = 'Earth Force';

-- SineWave Ventures + Aon 3D: Series A Sep 2021
INSERT INTO signal (id, relationship_id, signal_type, signal_date, source, value, weight, confidence, created_at)
SELECT gen_random_uuid(), r.id, 'co_investment', '2021-09-02', 'TechCrunch',
  'Series A $11.5M · Sep 2021 · lead', 'high', 'confirmed', now()
FROM relationship r JOIN fund f ON f.id = r.fund_id JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE f.name = 'SineWave Ventures' AND pc.name = 'Aon 3D';

-- Founders Fund: leadership relationship (not a co-investment).
-- Kevin Ryan (AlleyCorp) and Keith Rabois (Founders Fund) co-host the monthly
-- podcast "This Won't Last" — 4 episodes Sep 2024–May 2025. Verified via Apple
-- Podcasts. Founders Fund stays Cold (no shared deal), but this surfaces the
-- active leadership tie in the engagement history. Attached to the Founders Fund
-- relationship row (Valar Atomics target).
INSERT INTO signal (id, relationship_id, signal_type, signal_date, source, value, weight, confidence, source_url, source_title, created_at)
SELECT gen_random_uuid(), r.id, 'press_mention', '2025-05-08', 'This Won''t Last Podcast',
  'Kevin Ryan (AlleyCorp) and Keith Rabois (Founders Fund) co-host a monthly podcast: This Won''t Last. 4 episodes since Sep 2024, most recent May 2025.',
  'medium', 'confirmed',
  'https://podcasts.apple.com/us/podcast/this-wont-last-with-keith-rabois-kevin-ryan-logan/id1765665937',
  'This Won''t Last — Apple Podcasts', now()
FROM relationship r JOIN fund f ON f.id = r.fund_id
WHERE f.name = 'Founders Fund';

-- NOTE: Additional signals for Trimble, General Catalyst, Riot should be added
-- only after verifying sources on Crunchbase / TechCrunch / fund websites.
-- Do not add signals you cannot verify — Lauren will fact-check live.

-- ─────────────────────────────────────────
-- 8. Verified source URLs — small QA batch
-- Add only source URLs that were verified directly. Do not use publication
-- homepages or inferred profile slugs as evidence links.
-- ─────────────────────────────────────────
UPDATE signal s
SET
  source = 'Axios',
  source_url = 'https://www.axios.com/newsletters/axios-pro-rata-d119cf31-901c-4c24-ad91-18e1951a66fb',
  source_title = 'Axios Pro Rata: Trump prediction'
FROM relationship r
JOIN fund f ON f.id = r.fund_id
JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE s.relationship_id = r.id
  AND pc.name = 'Eyebot'
  AND f.name IN ('General Catalyst', 'Ubiquity Ventures')
  AND s.signal_date = '2025-08-26'
  AND s.value ILIKE '%Series A $20M%';

UPDATE signal s
SET
  source = 'TechCrunch',
  source_url = 'https://techcrunch.com/2024/06/06/eyebot-raised-6m-for-ai-powered-kiosks-that-provide-90-second-eye-exams-without-optometrist/',
  source_title = 'Eyebot raised $6M for AI-powered kiosks that provide 90-second vision exams without an on-site optometrist'
FROM relationship r
JOIN fund f ON f.id = r.fund_id
JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE s.relationship_id = r.id
  AND pc.name = 'Eyebot'
  AND f.name = 'Ubiquity Ventures'
  AND s.signal_date = '2024-06-01'
  AND s.value ILIKE '%Seed $6M%';

UPDATE signal s
SET
  source = 'TechCrunch',
  source_url = 'https://techcrunch.com/2025/04/28/amazon-backed-glacier-gets-16m-to-expand-its-robot-recycling-fleet/',
  source_title = 'Amazon-backed Glacier gets $16M to expand its robot recycling fleet'
FROM relationship r
JOIN fund f ON f.id = r.fund_id
JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE s.relationship_id = r.id
  AND pc.name = 'Glacier'
  AND f.name IN ('NEA', 'Amazon Climate Pledge Fund')
  AND s.signal_date = '2025-04-28'
  AND s.value ILIKE '%Series A $16M%';

UPDATE signal s
SET
  source = 'Glacier',
  source_url = 'https://endwaste.io/glacier-amazon-partnership-html/',
  source_title = 'GLACIER + AMAZON'
FROM relationship r
JOIN fund f ON f.id = r.fund_id
JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE s.relationship_id = r.id
  AND pc.name = 'Glacier'
  AND f.name IN ('NEA', 'Amazon Climate Pledge Fund')
  AND s.signal_date = '2024-03-01'
  AND s.value ILIKE '%Seed Extension $7.7M%';

UPDATE signal s
SET
  source = 'TechCrunch',
  source_url = 'https://techcrunch.com/2021/09/02/3d-printing-startup-aon3d-closes-11-5m-series-a/',
  source_title = 'AON3D closes $11.5M Series A, partners with Astrobotic to send 3D-printed parts to the moon'
FROM relationship r
JOIN fund f ON f.id = r.fund_id
JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE s.relationship_id = r.id
  AND pc.name = 'Aon 3D'
  AND f.name = 'SineWave Ventures'
  AND s.signal_date = '2021-09-02'
  AND s.value ILIKE '%Series A $11.5M%';

UPDATE signal s
SET
  source = 'GlobeNewswire',
  source_url = 'https://www.globenewswire.com/news-release/2022/11/29/2564034/0/en/Earth-Force-Technologies-Announces-8-6-Million-Raise-to-Prevent-Catastrophic-Wildfire.html',
  source_title = 'Earth Force Technologies Announces $8.6 Million Raise to Prevent Catastrophic Wildfire'
FROM relationship r
JOIN fund f ON f.id = r.fund_id
JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE s.relationship_id = r.id
  AND pc.name = 'Earth Force'
  AND f.name = 'BOLD Capital Partners'
  AND s.signal_date = '2022-11-29'
  AND s.value ILIKE '%Seed $8.6M%';

-- ─────────────────────────────────────────
-- 9. Signal traceability defaults
-- Keep specific source URLs only when verified. Do not use publication
-- homepages as evidence links — they look clickable but do not prove the claim.
-- Source title/snippet still give the UI and agent pipeline enough provenance
-- to distinguish manual/internal evidence from agent-verified evidence.
-- ─────────────────────────────────────────
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

-- Avatar Robotics co-investment signals — Seed $6.01M, Jan 30 2026
-- Source: Crunchbase. Round led by ARV, co-investors: Defy Partners, REFASHIOND Ventures.
INSERT INTO signal (id, relationship_id, signal_type, signal_date, source, value, weight, confidence, created_at)
SELECT
  gen_random_uuid(),
  r.id,
  'co_investment',
  '2026-01-30',
  'Crunchbase',
  'Seed $6.01M — Avatar Robotics warehouse robot fleet',
  'high',
  'confirmed',
  now()
FROM relationship r
JOIN fund f ON f.id = r.fund_id
JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE f.name IN ('Defy Partners', 'REFASHIOND Ventures')
  AND pc.name = 'Avatar'
  AND NOT EXISTS (
    SELECT 1 FROM signal s WHERE s.relationship_id = r.id AND s.signal_type = 'co_investment'
  );

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

-- ─────────────────────────────────────────
-- 10. Investor market-map metadata
-- Supports the June 11 pivot: broader deep tech investor universe with
-- co-investors as VIP/starred nodes. Values are deliberately coarse for Demo
-- Day query routing; precise AUM/check-size should be verified before being
-- presented as exact.
-- ─────────────────────────────────────────
UPDATE fund
SET
  investor_status = CASE
    WHEN name IN ('Lux Capital', 'Union Square Ventures', 'a16z American Dynamism', 'Eclipse Ventures', 'Founders Fund') THEN 'market_prospect'
    ELSE 'vip_co_investor'
  END,
  is_vip = CASE
    WHEN name IN ('Lux Capital', 'Union Square Ventures', 'a16z American Dynamism', 'Eclipse Ventures', 'Founders Fund') THEN false
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
    WHEN focus ILIKE '%deep tech%' OR focus ILIKE '%hard tech%' OR focus ILIKE '%space%' OR focus ILIKE '%robotics%' OR focus ILIKE '%defense%' OR focus ILIKE '%climate%' THEN focus
    WHEN name IN ('Founders Fund', 'General Catalyst', 'NEA', 'Lux Capital', 'a16z American Dynamism', 'Eclipse Ventures') THEN focus
    ELSE 'Deep tech relevance inferred from AlleyCorp co-investment context'
  END,
  profile_last_checked_at = now();

-- ─────────────────────────────────────────
-- 11. Logo URLs (Google favicon service)
-- ─────────────────────────────────────────
UPDATE fund
SET logo_url = 'https://www.google.com/s2/favicons?domain=' || website || '&sz=128'
WHERE website IS NOT NULL AND website != '';

COMMIT;
