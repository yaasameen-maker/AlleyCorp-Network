-- seed-contacts.sql
-- Curated fund contacts researched by Michael, June 2026.
-- Safe to re-run — uses INSERT ... ON CONFLICT DO NOTHING.
-- Run after seed.sql: psql $DATABASE_URL -f seed-contacts.sql

INSERT INTO investor (fund_id, name, role, linkedin_url, notes) VALUES

-- Riot Ventures
((SELECT id FROM fund WHERE name = 'Riot Ventures'), 'Will Coffield',    'Co-Founder & General Partner', 'https://www.linkedin.com/in/will-coffield-130b1426/', 'Deep tech GP; focuses on AI / robotics / aerospace & defense / space. Led EnduroSat $104M Series B-II alongside Google Ventures & Lux.'),
((SELECT id FROM fund WHERE name = 'Riot Ventures'), 'Stephen Marcus',   'Co-Founder & General Partner', 'https://www.linkedin.com/in/smarcus/',                  'Six-time founder/CEO; board seats at Shield AI / EnduroSat / Blue Water Autonomy / Valar Atomics. Strong defense & space portfolio.'),

-- Snowpoint Ventures
((SELECT id FROM fund WHERE name = 'Snowpoint Ventures'), 'Doug Philippone',  'Co-Founder & Managing Partner', 'https://www.linkedin.com/in/dougphilippone/',           'Former Palantir Head of Global Defense (2008–2024); 18-yr Army Special Forces vet. Board: Merlin Labs / RED 6 / Shield AI.'),
((SELECT id FROM fund WHERE name = 'Snowpoint Ventures'), 'Alexander Creasey','Founder & Managing Partner',   'https://www.linkedin.com/in/alexander-creasey-90998436/', 'Navy cryptologist; co-led Forge Capital before Snowpoint. Portfolio: Gecko Robotics / Shield AI.'),

-- General Catalyst
((SELECT id FROM fund WHERE name = 'General Catalyst'), 'Hemant Taneja',    'CEO & Managing Director',      'https://www.linkedin.com/in/hemanttaneja/',             'GC strategy focuses on AI transformation in defense / industrials / energy / healthcare. Portfolio: Anduril / Applied Intuition.'),
((SELECT id FROM fund WHERE name = 'General Catalyst'), 'Quentin Clark',    'Managing Director',            'https://www.linkedin.com/in/quentin-clark',             'Former CTO of Dropbox; leads data infra / enterprise AI investments at GC. Second contact for warm outreach.'),

-- Mach33
((SELECT id FROM fund WHERE name = 'Mach33'), 'Aaron Burnett',    'Founder & CEO',                'https://www.linkedin.com/in/aarontburnett/',            'Research-driven asset manager focused on space infrastructure & deep tech; $50M+ AUM. Portfolio: Portal Space / Stoke Space / SpaceX.'),
((SELECT id FROM fund WHERE name = 'Mach33'), 'J. Brant Arseneau','Group Chairman & CIO',         'https://www.linkedin.com/in/jbarseneau/',               'Co-founder; former CIO at Bank of Montreal; capital markets / space industry finance background.'),

-- SOSV
((SELECT id FROM fund WHERE name = 'SOSV'), 'Cyril Ebersweiler','General Partner',              'https://www.linkedin.com/in/cyrilebersweiler/',          'Founded HAX (world''s first hard tech VC program); 250+ deep tech investments globally. Board: Formlabs.'),
((SELECT id FROM fund WHERE name = 'SOSV'), 'Duncan Turner',    'General Partner & Managing Director HAX', 'https://www.linkedin.com/in/duncan-turner-b08630', 'Global MD of HAX; 100+ hard tech investments; Fortune top VC in seed-stage climate tech. Focus: climate / industrial / healthcare hardware.'),

-- Trimble Ventures
((SELECT id FROM fund WHERE name = 'Trimble Ventures'), 'Chris Stern',      'Corporate VP & Managing Director', 'https://www.linkedin.com/in/ctstern/',              'Founded Trimble''s $200M CVC arm (2021); invests in construction / geospatial / industrial tech.'),
((SELECT id FROM fund WHERE name = 'Trimble Ventures'), 'Eliot Jones',      'Principal',                    'https://www.linkedin.com/in/eliot-jones-57082448/',     'Global Venturing Rising Star 2025; joined Trimble 2014 / ventures team 2022. Key contact for startup partnerships with Trimble business units.'),

-- BOLD Capital Partners
((SELECT id FROM fund WHERE name = 'BOLD Capital Partners'), 'Neal Bhadkamkar',  'Managing Partner',             'https://www.linkedin.com/in/neal-bhadkamkar-b501051/', '30+ years investment experience; co-founded Monitor Ventures; PhD EE Stanford / MBA Harvard. Primary investment decision-maker.'),
((SELECT id FROM fund WHERE name = 'BOLD Capital Partners'), 'Peter Diamandis',  'General Partner & Co-Founder', 'https://www.linkedin.com/in/peterdiamandis/',           'Founder XPRIZE; co-founded 20+ companies in space / biotech / longevity. Strong deep tech / exponential tech brand.'),

-- SineWave Ventures
((SELECT id FROM fund WHERE name = 'SineWave Ventures'), 'Yanev Suissa',     'Founder & Managing Partner',   'https://www.linkedin.com/in/yanevsuissa',               'Former NEA; invests across commercial & government sectors; portfolio: Databricks / SentinelOne / Evolv. Defense & cybersecurity focus.'),
((SELECT id FROM fund WHERE name = 'SineWave Ventures'), 'Patricia Muoio',   'General Partner',              'https://www.linkedin.com/in/patricia-muoio-10037775/', '30-year Intelligence Community career; retired as Chief of NSA''s Trusted Systems Group. Deep cybersecurity & national security expertise.'),

-- Flybridge
((SELECT id FROM fund WHERE name = 'Flybridge'), 'Jeff Bussgang',    'General Partner & Co-Founder', 'https://www.linkedin.com/in/bussgang',                  '$1B+ AUM; Harvard Business School faculty. Flybridge 2025 fund ($100M) focused on AI infrastructure & agentic apps.'),
((SELECT id FROM fund WHERE name = 'Flybridge'), 'Chip Hazard',      'General Partner & Co-Founder', 'https://www.linkedin.com/in/chiphazard/',               'Co-founder; invests in data infrastructure / developer platforms for AI. Former Greylock GP; board member at MongoDB.'),

-- Cherubic Ventures
((SELECT id FROM fund WHERE name = 'Cherubic Ventures'), 'Matt Cheng',       'Founder & Managing Partner',   'https://www.linkedin.com/in/chengmatt/',                '$400M AUM; seed stage; global (SF / Taipei / Tokyo / Waterloo). Portfolio: Hims & Hers / Calm / Flexport / Wish.'),
((SELECT id FROM fund WHERE name = 'Cherubic Ventures'), 'Danielle Dudum',   'Partner & Head of US Operations', 'https://www.linkedin.com/in/danielledudum/',         'Leads US investments and operations; former Google (8 years). Primary US-based point of contact for Cherubic.'),

-- Eclipse Ventures
((SELECT id FROM fund WHERE name = 'Eclipse Ventures'), 'Lior Susan',       'Founder & Managing Partner',   'https://www.linkedin.com/in/liorsusan',                 'Founded Eclipse 2015 to transform physical industries (manufacturing / supply chain / transportation / defense). Former Flex Lab IX.'),
((SELECT id FROM fund WHERE name = 'Eclipse Ventures'), 'Greg Reichow',     'Partner',                      'https://www.linkedin.com/in/gregreichow/',              'Former Tesla VP Manufacturing; invests in technical teams tackling complex hardware. Board: Enovix / VulcanForms.'),

-- Union Square Ventures
((SELECT id FROM fund WHERE name = 'Union Square Ventures'), 'Albert Wenger',    'Managing Partner',             'https://www.linkedin.com/in/albertwenger/',             'Most tech-forward GP at USV; focus includes AI infrastructure / climate / deep tech transitions. Author of "World After Capital".'),
((SELECT id FROM fund WHERE name = 'Union Square Ventures'), 'Fred Wilson',      'Managing Partner',             'https://www.linkedin.com/in/fredwilson/',               'USV co-founder; still active and investing from USV''s 2024 Core Fund. Focus: crypto / consumer / platforms. Confirmed active 2025–2026.')

ON CONFLICT DO NOTHING;
