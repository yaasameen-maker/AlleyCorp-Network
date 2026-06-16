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
  (gen_random_uuid(), 'Lux Capital',              'https://www.luxcapital.com', 'Science and technology venture capital', 'Any stage', now(), now()),
  (gen_random_uuid(), 'Union Square Ventures',    'usv.com',               'Early stage tech',                  'Seed to Series B', now(), now()),
  (gen_random_uuid(), 'Riot Ventures',            'riotvc.com',            'Deep tech',                         'Seed',             now(), now()),
  (gen_random_uuid(), 'Snowpoint Ventures',       'snowpoint.vc',          'Deep tech',                         'Series A',         now(), now()),
  (gen_random_uuid(), 'General Catalyst',         'generalcatalyst.com',   'Multi-sector',                      'Multi-stage',      now(), now()),
  (gen_random_uuid(), 'Mach33',                   '33fg.com',              'Space tech',                        'Seed to Series A', now(), now()),
  -- Cold-tier targets: top deep tech funds AlleyCorp has not yet co-invested with
  (gen_random_uuid(), 'a16z American Dynamism',   'https://a16z.com/american-dynamism/', 'American Dynamism: aerospace, defense, public safety, education, housing, supply chain, industrials, and manufacturing', NULL, now(), now()),
  (gen_random_uuid(), 'Eclipse',                  'https://eclipse.capital', 'Physical economy and critical systems', NULL, now(), now()),
  (gen_random_uuid(), 'Founders Fund',            'foundersfund.com',      'Deep tech, defense, biotech',       'Multi-stage',      now(), now()),
  -- Avatar Robotics co-investors — Seed $6.01M, Jan 30 2026
  -- Source: Crunchbase. Round led by ARV alongside Defy Partners and REFASHIOND Ventures.
  (gen_random_uuid(), 'Defy Partners',            'defy.vc',               'Early-stage technology',            'Pre-Seed to Series A', now(), now()),
  (gen_random_uuid(), 'REFASHIOND Ventures',      'refashiond.vc',         'Supply chain technology',           'Pre-Seed / Seed',      now(), now());

-- ─────────────────────────────────────────
-- 3. Relationships
--    IDs are resolved by name via subquery — no hardcoded UUIDs.
-- ─────────────────────────────────────────

-- NOTE: Lux Capital + Inductive Bio and USV + Viam co-investment SIGNALS were in
-- early planning docs. Inductive Bio and Viam are NOT on Lauren's confirmed Deep
-- Tech portfolio list, so those co-investment relationships are not seeded. After
-- the June 11 pivot, Lux Capital and USV are kept as deep tech MARKET PROSPECTS
-- (real funds, no confirmed AlleyCorp co-investment) — see section 9 metadata.

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

-- General Catalyst + Eyebot · hot (led Series A Aug 2025; GC was NOT in the Jun 2024 seed)
INSERT INTO relationship (id, fund_id, portfolio_company_id, warmth_tier, last_signal_date, created_at, updated_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM fund WHERE name = 'General Catalyst'),
  (SELECT id FROM portfolio_company WHERE name = 'Eyebot'),
  'hot',
  '2025-08-26',
  now(), now();

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

-- Lux Capital and USV have no co-investment signals — their portfolio companies
-- (Inductive Bio, Viam) are not on Lauren's confirmed list. Both remain in the DB
-- as deep tech market prospects (see section 9), not as co-investors.

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

-- General Catalyst + Eyebot SEED signal intentionally omitted.
-- Verified Jun 2024 seed was led by AlleyCorp + Ubiquity Ventures (PRWeb/TechCrunch);
-- General Catalyst did not participate until the Aug 2025 Series A. Do not re-add a
-- GC seed signal without a source that explicitly names GC in the seed round.

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
  (gen_random_uuid(), 'Trimble Ventures',           'trimbleventures.com',   'Construction tech, geospatial',         'Series A to Series D', now(), now()),
  (gen_random_uuid(), 'BOLD Capital Partners',      'boldcap.com',           'Robotics, AI, defense',                 'Seed to Series A', now(), now()),
  (gen_random_uuid(), 'SineWave Ventures',          'sinewaveventures.com',  'Deep tech, advanced manufacturing',     'Series A/B',       now(), now()),
  -- Portal Space Systems Series A participants (Apr 2026) — verified from press release
  -- Source: https://www.portalsystems.space/news/press-release-portal-space-systems-raises-50-million-series-a-to-advance-rapidly-maneuverable-spacecraft-capabilities
  (gen_random_uuid(), 'Booz Allen Ventures',        'boozallen.com',         'Defense tech, national security, deep tech', 'Series A+',    now(), now()),
  (gen_random_uuid(), 'ARK Invest',                 'ark-invest.com',        'Disruptive innovation, space, autonomous technology', 'Multi-stage', now(), now()),
  (gen_random_uuid(), 'FUSE',                       'fuse.vc',               'Space tech, deep tech, early-stage',        'Seed to Series A', now(), now());

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

-- Booz Allen Ventures + Portal Space Systems · hot (Series A Apr 2026)
INSERT INTO relationship (id, fund_id, portfolio_company_id, warmth_tier, last_signal_date, created_at, updated_at)
SELECT gen_random_uuid(),
  (SELECT id FROM fund WHERE name = 'Booz Allen Ventures'),
  (SELECT id FROM portfolio_company WHERE name = 'Portal Space Systems'),
  'hot', '2026-04-09', now(), now();

-- ARK Invest + Portal Space Systems · hot (Series A Apr 2026)
INSERT INTO relationship (id, fund_id, portfolio_company_id, warmth_tier, last_signal_date, created_at, updated_at)
SELECT gen_random_uuid(),
  (SELECT id FROM fund WHERE name = 'ARK Invest'),
  (SELECT id FROM portfolio_company WHERE name = 'Portal Space Systems'),
  'hot', '2026-04-09', now(), now();

-- FUSE + Portal Space Systems · hot (Series A Apr 2026)
INSERT INTO relationship (id, fund_id, portfolio_company_id, warmth_tier, last_signal_date, created_at, updated_at)
SELECT gen_random_uuid(),
  (SELECT id FROM fund WHERE name = 'FUSE'),
  (SELECT id FROM portfolio_company WHERE name = 'Portal Space Systems'),
  'hot', '2026-04-09', now(), now();

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

-- SOSV + Renovate Robotics · stale (HAX Pre-Seed Feb 2023 — no confirmed follow-on)
-- Aug 2025 follow-on was NOT confirmed: 2025 activity was Saint-Gobain NOVA + Beacon, not SOSV.
INSERT INTO relationship (id, fund_id, portfolio_company_id, warmth_tier, last_signal_date, created_at, updated_at)
SELECT gen_random_uuid(),
  (SELECT id FROM fund WHERE name = 'SOSV'),
  (SELECT id FROM portfolio_company WHERE name = 'Renovate Robotics'),
  'stale', '2023-02-01', now(), now();

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

-- Booz Allen Ventures + Portal Space Systems: Series A Apr 2026
INSERT INTO signal (id, relationship_id, signal_type, signal_date, source, source_url, source_title, raw_snippet, value, weight, confidence, created_at)
SELECT gen_random_uuid(), r.id, 'co_investment', '2026-04-09',
  'Portal Space Systems press release',
  'https://www.portalsystems.space/news/press-release-portal-space-systems-raises-50-million-series-a-to-advance-rapidly-maneuverable-spacecraft-capabilities',
  'Portal Space Systems Raises $50 Million Series A',
  'The round was led by Geodesic Capital and Mach33, with participation from Booz Allen Ventures, ARK Invest, AlleyCorp, and FUSE.',
  'Series A $50M · Apr 2026 · participant alongside Geodesic Capital, Mach33, ARK Invest, FUSE', 'high', 'confirmed', now()
FROM relationship r JOIN fund f ON f.id = r.fund_id JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE f.name = 'Booz Allen Ventures' AND pc.name = 'Portal Space Systems';

-- ARK Invest + Portal Space Systems: Series A Apr 2026
INSERT INTO signal (id, relationship_id, signal_type, signal_date, source, source_url, source_title, raw_snippet, value, weight, confidence, created_at)
SELECT gen_random_uuid(), r.id, 'co_investment', '2026-04-09',
  'Portal Space Systems press release',
  'https://www.portalsystems.space/news/press-release-portal-space-systems-raises-50-million-series-a-to-advance-rapidly-maneuverable-spacecraft-capabilities',
  'Portal Space Systems Raises $50 Million Series A',
  'The round was led by Geodesic Capital and Mach33, with participation from Booz Allen Ventures, ARK Invest, AlleyCorp, and FUSE.',
  'Series A $50M · Apr 2026 · participant alongside Geodesic Capital, Mach33, Booz Allen Ventures, FUSE', 'high', 'confirmed', now()
FROM relationship r JOIN fund f ON f.id = r.fund_id JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE f.name = 'ARK Invest' AND pc.name = 'Portal Space Systems';

-- FUSE + Portal Space Systems: Seed Apr 2025
INSERT INTO signal (id, relationship_id, signal_type, signal_date, source, source_url, source_title, raw_snippet, value, weight, confidence, created_at)
SELECT gen_random_uuid(), r.id, 'co_investment', '2025-04-03',
  'GeekWire',
  'https://www.geekwire.com/2025/portal-space-systems-raises-17-5m-for-orbital-spacecraft-powered-by-solar-heating/',
  'Portal Space Systems raises $17.5M for orbital spacecraft powered by solar heating',
  'Portal Space Systems raised a $17.5M seed round led by AlleyCorp, with FUSE among the participants.',
  'Seed $17.5M · Apr 2025 · participant (AlleyCorp led)', 'high', 'confirmed', now()
FROM relationship r JOIN fund f ON f.id = r.fund_id JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE f.name = 'FUSE' AND pc.name = 'Portal Space Systems';

-- FUSE + Portal Space Systems: Series A Apr 2026
INSERT INTO signal (id, relationship_id, signal_type, signal_date, source, source_url, source_title, raw_snippet, value, weight, confidence, created_at)
SELECT gen_random_uuid(), r.id, 'co_investment', '2026-04-09',
  'Portal Space Systems press release',
  'https://www.portalsystems.space/news/press-release-portal-space-systems-raises-50-million-series-a-to-advance-rapidly-maneuverable-spacecraft-capabilities',
  'Portal Space Systems Raises $50 Million Series A',
  'The round was led by Geodesic Capital and Mach33, with participation from Booz Allen Ventures, ARK Invest, AlleyCorp, and FUSE.',
  'Series A $50M · Apr 2026 · participant alongside Geodesic Capital, Mach33, Booz Allen Ventures, ARK Invest', 'high', 'confirmed', now()
FROM relationship r JOIN fund f ON f.id = r.fund_id JOIN portfolio_company pc ON pc.id = r.portfolio_company_id
WHERE f.name = 'FUSE' AND pc.name = 'Portal Space Systems';

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

-- SOSV + Renovate Robotics: Pre-Seed Feb 2023 (HAX program)
-- Aug 2025 follow-on removed — unverified. 2025 activity was Saint-Gobain NOVA + Beacon.
INSERT INTO signal (id, relationship_id, signal_type, signal_date, source, value, weight, confidence, created_at)
SELECT gen_random_uuid(), r.id, 'co_investment', '2023-02-01', 'AlleyCorp Substack',
  'Pre-Seed $2.5M · Feb 2023 · AlleyCorp (via Alley Robotics Ventures) led, SOSV/HAX co-investor', 'high', 'confirmed', now()
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
  source = 'TechCrunch',
  source_url = 'https://techcrunch.com/2025/08/26/eyebot-gets-20m-series-a-to-boost-to-expand-eye-care-access/',
  source_title = 'Eyebot gets $20M Series A to expand eye care access'
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
-- 8b. Verified source URLs — batch 2 (researched Jun 14 2026)
-- Mirrors migrations/005. Every URL was checked to confirm the article names the
-- fund + company + round. Funds findable only via candidate-only directories
-- (Crunchbase/PitchBook/Tracxn) and DTNY event signals are intentionally left blank.
-- ─────────────────────────────────────────
UPDATE signal s SET source='PR Newswire',
  source_url='https://www.prnewswire.com/news-releases/glacier-raises-4-5m-to-combat-climate-change-with-ai-powered-recycling-robots-301527666.html',
  source_title='Glacier Raises $4.5M to Combat Climate Change with AI-Powered Recycling Robots'
FROM relationship r JOIN fund f ON f.id=r.fund_id JOIN portfolio_company pc ON pc.id=r.portfolio_company_id
WHERE s.relationship_id=r.id AND f.name='NEA' AND pc.name='Glacier' AND s.signal_date='2022-04-19' AND s.value ILIKE '%Seed%';

UPDATE signal s SET signal_date='2025-02-20',
  value='Seed $19M · Feb 2025 · led by Riot Ventures (AlleyCorp participated)',
  source='TechCrunch',
  source_url='https://techcrunch.com/2025/02/20/valar-atomics-comes-out-of-stealth-with-19m-and-a-pilot-reactor-site/',
  source_title='Valar Atomics comes out of stealth with $19M and a pilot reactor site'
FROM relationship r JOIN fund f ON f.id=r.fund_id JOIN portfolio_company pc ON pc.id=r.portfolio_company_id
WHERE s.relationship_id=r.id AND f.name='Riot Ventures' AND pc.name='Valar Atomics' AND s.value ILIKE '%Seed%';

UPDATE signal s SET source='TechCrunch',
  source_url='https://techcrunch.com/2025/02/20/valar-atomics-comes-out-of-stealth-with-19m-and-a-pilot-reactor-site/',
  source_title='Valar Atomics comes out of stealth with $19M and a pilot reactor site'
FROM relationship r JOIN fund f ON f.id=r.fund_id JOIN portfolio_company pc ON pc.id=r.portfolio_company_id
WHERE s.relationship_id=r.id AND f.name='Day One Ventures' AND pc.name='Valar Atomics' AND s.value ILIKE '%Seed%';

UPDATE signal s SET source='TradedVC',
  source_url='https://traded.co/vc/deal/valar-atomics-closes-130-million-series-a-funding-round-led-by-snowpoint-ventures/',
  source_title='Valar Atomics Closes $130 Million Series A Funding Round Led By Snowpoint Ventures'
FROM relationship r JOIN fund f ON f.id=r.fund_id JOIN portfolio_company pc ON pc.id=r.portfolio_company_id
WHERE s.relationship_id=r.id AND f.name='Snowpoint Ventures' AND pc.name='Valar Atomics' AND s.value ILIKE '%Series A%';

UPDATE signal s SET source='SpaceNews',
  source_url='https://spacenews.com/portal-space-systems-raises-50-million-to-accelerate-spacecraft-development/',
  source_title='Portal Space Systems raises $50 million to accelerate spacecraft development'
FROM relationship r JOIN fund f ON f.id=r.fund_id JOIN portfolio_company pc ON pc.id=r.portfolio_company_id
WHERE s.relationship_id=r.id AND f.name='Geodesic Capital' AND pc.name='Portal Space Systems' AND s.value ILIKE '%Series A%';

UPDATE signal s SET source='SpaceNews',
  source_url='https://spacenews.com/portal-space-systems-raises-50-million-to-accelerate-spacecraft-development/',
  source_title='Portal Space Systems raises $50 million to accelerate spacecraft development'
FROM relationship r JOIN fund f ON f.id=r.fund_id JOIN portfolio_company pc ON pc.id=r.portfolio_company_id
WHERE s.relationship_id=r.id AND f.name='Mach33' AND pc.name='Portal Space Systems' AND s.value ILIKE '%Series A%';

UPDATE signal s SET source='PR Newswire',
  source_url='https://www.prnewswire.com/news-releases/trimble-ventures-invests-in-civ-roboticsa-construction-tech-startup-focused-on-autonomous-surveying-solutions-301629136.html',
  source_title='Trimble Ventures Invests in Civ Robotics'
FROM relationship r JOIN fund f ON f.id=r.fund_id JOIN portfolio_company pc ON pc.id=r.portfolio_company_id
WHERE s.relationship_id=r.id AND f.name='Trimble Ventures' AND pc.name='Civ Robotics' AND s.value ILIKE '%Seed%';

UPDATE signal s SET source='GlobeNewswire',
  source_url='https://www.globenewswire.com/news-release/2022/09/21/2520253/0/en/Civ-Robotics-Raises-5-Million-Seed-Funding-Round.html',
  source_title='Civ Robotics Raises $5 Million Seed Funding Round'
FROM relationship r JOIN fund f ON f.id=r.fund_id JOIN portfolio_company pc ON pc.id=r.portfolio_company_id
WHERE s.relationship_id=r.id AND f.name='ff Venture Capital' AND pc.name='Civ Robotics' AND s.value ILIKE '%Seed%';

UPDATE signal s SET signal_date='2025-07-01', source='The Robot Report',
  source_url='https://www.therobotreport.com/civ-robotics-spots-series-a-funding-automated-surveying/',
  source_title='Civ Robotics spots Series A funding for automated surveying'
FROM relationship r JOIN fund f ON f.id=r.fund_id JOIN portfolio_company pc ON pc.id=r.portfolio_company_id
WHERE s.relationship_id=r.id AND f.name='ff Venture Capital' AND pc.name='Civ Robotics' AND s.value ILIKE '%Series A%';

UPDATE signal s SET source='SOSV',
  source_url='https://sosv.com/haxs-renovate-robotics-closes-2-5m-pre-seed-to-automate-roofing/',
  source_title='HAX''s Renovate Robotics closes $2.5M pre-seed to automate roofing'
FROM relationship r JOIN fund f ON f.id=r.fund_id JOIN portfolio_company pc ON pc.id=r.portfolio_company_id
WHERE s.relationship_id=r.id AND f.name='SOSV' AND pc.name='Renovate Robotics' AND s.value ILIKE '%Pre-Seed%';

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
    WHEN name IN ('Lux Capital', 'Union Square Ventures', 'a16z American Dynamism', 'Eclipse', 'Founders Fund') THEN 'market_prospect'
    WHEN name IN ('Riot Ventures', 'Snowpoint Ventures', 'General Catalyst', 'Mach33') THEN 'vip_co_investor'
    ELSE 'known_co_investor'
  END,
  is_vip = CASE
    WHEN name IN ('Riot Ventures', 'Snowpoint Ventures', 'General Catalyst', 'Mach33') THEN true
    ELSE false
  END,
  hq_location = CASE name
    WHEN 'Lux Capital' THEN 'New York City / Silicon Valley'
    WHEN 'Union Square Ventures' THEN 'New York'
    WHEN 'Riot Ventures' THEN 'Los Angeles'
    WHEN 'Snowpoint Ventures' THEN 'San Francisco'
    WHEN 'General Catalyst' THEN 'Cambridge / New York / San Francisco'
    WHEN 'Mach33' THEN 'Los Angeles'
    WHEN 'a16z American Dynamism' THEN NULL
    WHEN 'Eclipse' THEN NULL
    WHEN 'Founders Fund' THEN 'San Francisco'
    WHEN 'Defy Partners' THEN 'Woodside, CA (Bay Area)'
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
    WHEN 'Booz Allen Ventures' THEN 'McLean, VA'
    WHEN 'ARK Invest' THEN 'New York / St. Petersburg, FL'
    WHEN 'FUSE' THEN 'Seattle, WA'
    ELSE hq_location
  END,
  geography_focus = CASE name
    WHEN 'Union Square Ventures' THEN 'US, New York network'
    WHEN 'Lux Capital' THEN 'New York City and Silicon Valley network'
    WHEN 'a16z American Dynamism' THEN 'US national-interest sectors with companies across all 50 states and global impact'
    WHEN 'Eclipse' THEN 'Physical economy and critical systems'
    WHEN 'Founders Fund' THEN 'US, hard tech and frontier technology'
    WHEN 'Geodesic Capital' THEN 'US and global growth-stage network'
    WHEN 'Amazon Climate Pledge Fund' THEN 'Climate and sustainability network'
    ELSE 'US deep tech network'
  END,
  check_size_proxy = CASE
    WHEN name = 'Lux Capital' THEN '$100K to $100M stated investment range'
    WHEN name = 'BOLD Capital Partners' THEN '$100K–$5M per deal (sweet spot ~$1.5M)'
    WHEN name = 'REFASHIOND Ventures' THEN '$25K–$750K (minority, non-lead; rolling fund)'
    WHEN name = 'Defy Partners' THEN '$3M–$10M initial check (Seed to Series A)'
    WHEN name = 'Trimble Ventures' THEN 'Series A+ capable (CVC, $200M fund, undisclosed check size)'
    WHEN name = 'FUSE' THEN 'Seed / early Series A (check size undisclosed)'
    WHEN name = 'Booz Allen Ventures' THEN '$5M–$10M (strategic co-investor, does not lead)'
    WHEN name IN ('a16z American Dynamism', 'Eclipse') THEN NULL
    WHEN stage ILIKE '%Series A%' OR stage ILIKE '%Series B%' OR stage ILIKE '%Multi%' THEN 'Series A+ capable'
    WHEN stage ILIKE '%Pre-Seed%' THEN 'Pre-seed / seed'
    WHEN stage ILIKE '%Seed%' THEN 'Seed / early Series A'
    ELSE NULL
  END,
  deep_tech_signal = CASE
    WHEN name = 'BOLD Capital Partners' THEN 'Advanced robotics, AI, biotechnology, and longevity technology (Peter Diamandis / XPRIZE)'
    WHEN name = 'REFASHIOND Ventures' THEN 'Supply chain technology reinventing legacy industrial networks (Pre-Seed/Seed, rolling fund)'
    WHEN name = 'Defy Partners' THEN 'Early-stage technology; deep tech co-investor via Avatar Systems (robotics)'
    WHEN name = 'Trimble Ventures' THEN 'Construction tech, geospatial, and physical-world technology (corporate venture arm of Trimble Inc.)'
    WHEN name = 'FUSE' THEN 'Space tech and deep tech; early-stage investor in Portal Space Systems (seed + Series A)'
    WHEN name = 'Booz Allen Ventures' THEN 'Defense tech, AI, cyber, quantum computing, and US manufacturing/reindustrialization (Booz Allen Hamilton CVC)'
    WHEN focus ILIKE '%deep tech%' OR focus ILIKE '%hard tech%' OR focus ILIKE '%space%' OR focus ILIKE '%robotics%' OR focus ILIKE '%defense%' OR focus ILIKE '%climate%' THEN focus
    WHEN name IN ('Founders Fund', 'General Catalyst', 'NEA', 'Lux Capital', 'a16z American Dynamism', 'Eclipse') THEN focus
    ELSE 'Deep tech relevance inferred from AlleyCorp co-investment context'
  END,
  profile_last_checked_at = now();

-- ─────────────────────────────────────────
-- 10b. Verified AUM tiers
-- Researched June 14–16 2026 from credible public sources (firm press releases,
-- official fund pages, SEC-registered AUM, reputable VC databases). Coarse tier +
-- approximate figure. REFASHIOND Ventures left NULL — no clean public AUM verifiable.
-- BOLD Capital Partners: ~$500M–$600M across main funds (Peter Diamandis, June 2026).
-- ─────────────────────────────────────────
UPDATE fund
SET aum_tier = CASE name
  WHEN 'General Catalyst'           THEN 'Mega (~$43B)'
  WHEN 'NEA'                        THEN 'Mega (~$28B)'
  WHEN 'Founders Fund'              THEN 'Mega (~$17B)'
  WHEN 'Lux Capital'                THEN 'Large ($7B+ AUM)'
  WHEN 'SOSV'                       THEN 'Large (~$1.5B)'
  WHEN 'Union Square Ventures'      THEN 'Large (~$1.5B)'
  WHEN 'Amazon Climate Pledge Fund' THEN 'Large ($2B)'
  WHEN 'Flybridge'                  THEN 'Large (~$1B)'
  WHEN 'Geodesic Capital'           THEN 'Large (~$1B)'
  WHEN 'Riot Ventures'              THEN 'Large (~$1B)'
  WHEN 'ff Venture Capital'         THEN 'Mid (~$500M)'
  WHEN 'Cherubic Ventures'          THEN 'Mid (~$460M)'
  WHEN 'Day One Ventures'           THEN 'Mid (~$450M)'
  WHEN 'Defy Partners'              THEN 'Mid (~$410M)'
  WHEN 'SineWave Ventures'          THEN 'Mid (~$300M)'
  WHEN 'Ubiquity Ventures'          THEN 'Emerging (~$200M)'
  WHEN 'Trimble Ventures'           THEN 'Emerging ($200M)'
  WHEN 'Snowpoint Ventures'         THEN 'Emerging (~$185M)'
  WHEN 'Mach33'                     THEN 'Emerging (~$14M)'
  WHEN 'BOLD Capital Partners'      THEN 'Mid (~$550M)'
  WHEN 'REFASHIOND Ventures'        THEN 'Emerging (~$10M/yr rolling fund)'
  WHEN 'ARK Invest'                 THEN 'Emerging (~$110M — ARK Venture Fund ARKVX, as of end 2024)'
  WHEN 'Booz Allen Ventures'        THEN 'Mid (~$300M)'
  ELSE aum_tier
END;

-- ─────────────────────────────────────────
-- 11. Logo URLs (Google favicon service)
-- ─────────────────────────────────────────
UPDATE fund
SET logo_url = 'https://www.google.com/s2/favicons?domain=' || website || '&sz=128'
WHERE website IS NOT NULL AND website != '';

COMMIT;
