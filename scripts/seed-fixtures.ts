// One-time seed: remaining 2026 FIFA World Cup fixtures from 19 Jun onwards
// Run: npx tsx scripts/seed-fixtures.ts

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env.local (no extra packages needed)
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([^#\s=][^=]*)=(.*)/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(url, key);

const WC = 'FIFA World Cup 2026';
const U = 'upcoming';

// All times are UTC. BST (UK) = UTC+1, so subtract 1h from BST to get UTC.
const fixtures = [

  // ══════════════════════════════════════════════════
  // MATCHDAY 2 — REMAINING  (from 19 Jun 22:00 UTC)
  // ══════════════════════════════════════════════════

  // Group C  |  19 Jun 22:00 UTC  (11pm BST)
  { home_team: 'Scotland',     away_team: 'Morocco',    competition: WC, kickoff_at: '2026-06-19T22:00:00Z', status: U },
  // Group C  |  20 Jun 00:30 UTC  (1:30am BST)
  { home_team: 'Brazil',       away_team: 'Haiti',      competition: WC, kickoff_at: '2026-06-20T00:30:00Z', status: U },
  // Group D  |  20 Jun 03:00 UTC  (4am BST)
  { home_team: 'Türkiye',      away_team: 'Paraguay',   competition: WC, kickoff_at: '2026-06-20T03:00:00Z', status: U },

  // Group F  |  20 Jun 17:00 UTC  (6pm BST)
  { home_team: 'Netherlands',  away_team: 'Sweden',     competition: WC, kickoff_at: '2026-06-20T17:00:00Z', status: U },
  // Group E  |  20 Jun 20:00 UTC  (9pm BST)
  { home_team: 'Germany',      away_team: 'Ivory Coast',competition: WC, kickoff_at: '2026-06-20T20:00:00Z', status: U },

  // Group E  |  21 Jun 00:00 UTC  (1am BST)
  { home_team: 'Ecuador',      away_team: 'Curaçao',    competition: WC, kickoff_at: '2026-06-21T00:00:00Z', status: U },
  // Group F  |  21 Jun 04:00 UTC  (5am BST)
  { home_team: 'Tunisia',      away_team: 'Japan',      competition: WC, kickoff_at: '2026-06-21T04:00:00Z', status: U },
  // Group H  |  21 Jun 16:00 UTC  (5pm BST)
  { home_team: 'Spain',        away_team: 'Saudi Arabia',competition: WC, kickoff_at: '2026-06-21T16:00:00Z', status: U },
  // Group G  |  21 Jun 19:00 UTC  (8pm BST)
  { home_team: 'Belgium',      away_team: 'Iran',       competition: WC, kickoff_at: '2026-06-21T19:00:00Z', status: U },
  // Group H  |  21 Jun 22:00 UTC  (11pm BST)
  { home_team: 'Uruguay',      away_team: 'Cape Verde', competition: WC, kickoff_at: '2026-06-21T22:00:00Z', status: U },

  // Group G  |  22 Jun 01:00 UTC  (2am BST)
  { home_team: 'New Zealand',  away_team: 'Egypt',      competition: WC, kickoff_at: '2026-06-22T01:00:00Z', status: U },
  // Group J  |  22 Jun 17:00 UTC  (6pm BST)
  { home_team: 'Argentina',    away_team: 'Austria',    competition: WC, kickoff_at: '2026-06-22T17:00:00Z', status: U },
  // Group I  |  22 Jun 21:00 UTC  (10pm BST)
  { home_team: 'France',       away_team: 'Iraq',       competition: WC, kickoff_at: '2026-06-22T21:00:00Z', status: U },

  // Group I  |  23 Jun 00:00 UTC  (1am BST)
  { home_team: 'Norway',       away_team: 'Senegal',    competition: WC, kickoff_at: '2026-06-23T00:00:00Z', status: U },
  // Group J  |  23 Jun 03:00 UTC  (4am BST)
  { home_team: 'Jordan',       away_team: 'Algeria',    competition: WC, kickoff_at: '2026-06-23T03:00:00Z', status: U },
  // Group K  |  23 Jun 17:00 UTC  (6pm BST)
  { home_team: 'Portugal',     away_team: 'Uzbekistan', competition: WC, kickoff_at: '2026-06-23T17:00:00Z', status: U },
  // Group L  |  23 Jun 20:00 UTC  (9pm BST)
  { home_team: 'England',      away_team: 'Ghana',      competition: WC, kickoff_at: '2026-06-23T20:00:00Z', status: U },
  // Group L  |  23 Jun 23:00 UTC  (midnight BST 24 Jun)
  { home_team: 'Panama',       away_team: 'Croatia',    competition: WC, kickoff_at: '2026-06-23T23:00:00Z', status: U },
  // Group K  |  24 Jun 02:00 UTC  (3am BST)
  { home_team: 'Colombia',     away_team: 'DR Congo',   competition: WC, kickoff_at: '2026-06-24T02:00:00Z', status: U },

  // ══════════════════════════════════════════════════
  // MATCHDAY 3 — FINAL GROUP GAMES (simultaneous pairs)
  // ══════════════════════════════════════════════════

  // Group B  |  24 Jun 19:00 UTC  (8pm BST)
  { home_team: 'Switzerland',       away_team: 'Canada',       competition: WC, kickoff_at: '2026-06-24T19:00:00Z', status: U },
  { home_team: 'Bosnia-Herzegovina',away_team: 'Qatar',        competition: WC, kickoff_at: '2026-06-24T19:00:00Z', status: U },
  // Group C  |  24 Jun 22:00 UTC  (11pm BST)
  { home_team: 'Scotland',          away_team: 'Brazil',       competition: WC, kickoff_at: '2026-06-24T22:00:00Z', status: U },
  { home_team: 'Morocco',           away_team: 'Haiti',        competition: WC, kickoff_at: '2026-06-24T22:00:00Z', status: U },
  // Group A  |  25 Jun 01:00 UTC  (2am BST)
  { home_team: 'Czech Republic',    away_team: 'Mexico',       competition: WC, kickoff_at: '2026-06-25T01:00:00Z', status: U },
  { home_team: 'South Africa',      away_team: 'South Korea',  competition: WC, kickoff_at: '2026-06-25T01:00:00Z', status: U },
  // Group E  |  25 Jun 20:00 UTC  (9pm BST)
  { home_team: 'Ecuador',           away_team: 'Germany',      competition: WC, kickoff_at: '2026-06-25T20:00:00Z', status: U },
  { home_team: 'Curaçao',           away_team: 'Ivory Coast',  competition: WC, kickoff_at: '2026-06-25T20:00:00Z', status: U },
  // Group F  |  25 Jun 23:00 UTC  (midnight BST 26 Jun)
  { home_team: 'Japan',             away_team: 'Sweden',       competition: WC, kickoff_at: '2026-06-25T23:00:00Z', status: U },
  { home_team: 'Tunisia',           away_team: 'Netherlands',  competition: WC, kickoff_at: '2026-06-25T23:00:00Z', status: U },
  // Group D  |  26 Jun 02:00 UTC  (3am BST)
  { home_team: 'Türkiye',           away_team: 'USA',          competition: WC, kickoff_at: '2026-06-26T02:00:00Z', status: U },
  { home_team: 'Paraguay',          away_team: 'Australia',    competition: WC, kickoff_at: '2026-06-26T02:00:00Z', status: U },
  // Group I  |  26 Jun 19:00 UTC  (8pm BST)
  { home_team: 'Norway',            away_team: 'France',       competition: WC, kickoff_at: '2026-06-26T19:00:00Z', status: U },
  { home_team: 'Senegal',           away_team: 'Iraq',         competition: WC, kickoff_at: '2026-06-26T19:00:00Z', status: U },
  // Group H  |  27 Jun 00:00 UTC  (1am BST)
  { home_team: 'Cape Verde',        away_team: 'Saudi Arabia', competition: WC, kickoff_at: '2026-06-27T00:00:00Z', status: U },
  { home_team: 'Uruguay',           away_team: 'Spain',        competition: WC, kickoff_at: '2026-06-27T00:00:00Z', status: U },
  // Group G  |  27 Jun 03:00 UTC  (4am BST)
  { home_team: 'Egypt',             away_team: 'Iran',         competition: WC, kickoff_at: '2026-06-27T03:00:00Z', status: U },
  { home_team: 'New Zealand',       away_team: 'Belgium',      competition: WC, kickoff_at: '2026-06-27T03:00:00Z', status: U },
  // Group L  |  27 Jun 21:00 UTC  (10pm BST)
  { home_team: 'Panama',            away_team: 'England',      competition: WC, kickoff_at: '2026-06-27T21:00:00Z', status: U },
  { home_team: 'Croatia',           away_team: 'Ghana',        competition: WC, kickoff_at: '2026-06-27T21:00:00Z', status: U },
  // Group K  |  27 Jun 23:30 UTC  (12:30am BST 28 Jun)
  { home_team: 'Colombia',          away_team: 'Portugal',     competition: WC, kickoff_at: '2026-06-27T23:30:00Z', status: U },
  { home_team: 'DR Congo',          away_team: 'Uzbekistan',   competition: WC, kickoff_at: '2026-06-27T23:30:00Z', status: U },
  // Group J  |  28 Jun 02:00 UTC  (3am BST)
  { home_team: 'Algeria',           away_team: 'Austria',      competition: WC, kickoff_at: '2026-06-28T02:00:00Z', status: U },
  { home_team: 'Jordan',            away_team: 'Argentina',    competition: WC, kickoff_at: '2026-06-28T02:00:00Z', status: U },

  // ══════════════════════════════════════════════════
  // ROUND OF 32  (28 Jun – 4 Jul)
  // Teams TBD — labels reflect bracket position
  // ══════════════════════════════════════════════════

  // M73  |  28 Jun 19:00 UTC  (8pm BST)  — Los Angeles
  { home_team: 'Group A Runner-up',  away_team: 'Group B Runner-up',  competition: WC, kickoff_at: '2026-06-28T19:00:00Z', status: U },
  // M76  |  29 Jun 17:00 UTC  (6pm BST)  — Houston
  { home_team: 'Group C Winner',     away_team: 'Group F Runner-up',  competition: WC, kickoff_at: '2026-06-29T17:00:00Z', status: U },
  // M74  |  29 Jun 20:30 UTC  (9:30pm BST)  — Foxborough
  { home_team: 'Group E Winner',     away_team: 'Best 3rd-Place',     competition: WC, kickoff_at: '2026-06-29T20:30:00Z', status: U },
  // M75  |  30 Jun 01:00 UTC  (2am BST)  — Guadalupe (MX)
  { home_team: 'Group F Winner',     away_team: 'Group C Runner-up',  competition: WC, kickoff_at: '2026-06-30T01:00:00Z', status: U },
  // M78  |  30 Jun 17:00 UTC  (6pm BST)  — Arlington
  { home_team: 'Group E Runner-up',  away_team: 'Group I Runner-up',  competition: WC, kickoff_at: '2026-06-30T17:00:00Z', status: U },
  // M77  |  30 Jun 21:00 UTC  (10pm BST)  — New Jersey
  { home_team: 'Group I Winner',     away_team: 'Best 3rd-Place',     competition: WC, kickoff_at: '2026-06-30T21:00:00Z', status: U },
  // M79  |  1 Jul 01:00 UTC  (2am BST)  — Mexico City
  { home_team: 'Group A Winner',     away_team: 'Best 3rd-Place',     competition: WC, kickoff_at: '2026-07-01T01:00:00Z', status: U },
  // M80  |  1 Jul 16:00 UTC  (5pm BST)  — Atlanta
  { home_team: 'Group L Winner',     away_team: 'Best 3rd-Place',     competition: WC, kickoff_at: '2026-07-01T16:00:00Z', status: U },
  // M82  |  1 Jul 20:00 UTC  (9pm BST)  — Seattle
  { home_team: 'Group G Winner',     away_team: 'Best 3rd-Place',     competition: WC, kickoff_at: '2026-07-01T20:00:00Z', status: U },
  // M81  |  2 Jul 00:00 UTC  (1am BST)  — Santa Clara
  { home_team: 'Group D Winner',     away_team: 'Best 3rd-Place',     competition: WC, kickoff_at: '2026-07-02T00:00:00Z', status: U },
  // M84  |  2 Jul 19:00 UTC  (8pm BST)  — Los Angeles
  { home_team: 'Group H Winner',     away_team: 'Group J Runner-up',  competition: WC, kickoff_at: '2026-07-02T19:00:00Z', status: U },
  // M83  |  2 Jul 23:00 UTC  (midnight BST 3 Jul)  — Toronto
  { home_team: 'Group K Runner-up',  away_team: 'Group L Runner-up',  competition: WC, kickoff_at: '2026-07-02T23:00:00Z', status: U },
  // M85  |  3 Jul 03:00 UTC  (4am BST)  — Vancouver
  { home_team: 'Group B Winner',     away_team: 'Best 3rd-Place',     competition: WC, kickoff_at: '2026-07-03T03:00:00Z', status: U },
  // M88  |  3 Jul 18:00 UTC  (7pm BST)  — Arlington
  { home_team: 'Group D Runner-up',  away_team: 'Group G Runner-up',  competition: WC, kickoff_at: '2026-07-03T18:00:00Z', status: U },
  // M86  |  3 Jul 22:00 UTC  (11pm BST)  — Miami
  { home_team: 'Group J Winner',     away_team: 'Group H Runner-up',  competition: WC, kickoff_at: '2026-07-03T22:00:00Z', status: U },
  // M87  |  4 Jul 01:30 UTC  (2:30am BST)  — Kansas City
  { home_team: 'Group K Winner',     away_team: 'Best 3rd-Place',     competition: WC, kickoff_at: '2026-07-04T01:30:00Z', status: U },

  // ══════════════════════════════════════════════════
  // ROUND OF 16  (4–7 Jul)
  // ══════════════════════════════════════════════════

  // M90  |  4 Jul 17:00 UTC  (6pm BST)  — Houston
  { home_team: 'R32 Winner', away_team: 'R32 Winner', competition: WC, kickoff_at: '2026-07-04T17:00:00Z', status: U },
  // M89  |  4 Jul 21:00 UTC  (10pm BST)  — Philadelphia
  { home_team: 'R32 Winner', away_team: 'R32 Winner', competition: WC, kickoff_at: '2026-07-04T21:00:00Z', status: U },
  // M91  |  5 Jul 20:00 UTC  (9pm BST)  — New Jersey
  { home_team: 'R32 Winner', away_team: 'R32 Winner', competition: WC, kickoff_at: '2026-07-05T20:00:00Z', status: U },
  // M92  |  6 Jul 00:00 UTC  (1am BST)  — Mexico City
  { home_team: 'R32 Winner', away_team: 'R32 Winner', competition: WC, kickoff_at: '2026-07-06T00:00:00Z', status: U },
  // M93  |  6 Jul 19:00 UTC  (8pm BST)  — Arlington
  { home_team: 'R32 Winner', away_team: 'R32 Winner', competition: WC, kickoff_at: '2026-07-06T19:00:00Z', status: U },
  // M94  |  7 Jul 00:00 UTC  (1am BST)  — Seattle
  { home_team: 'R32 Winner', away_team: 'R32 Winner', competition: WC, kickoff_at: '2026-07-07T00:00:00Z', status: U },
  // M95  |  7 Jul 16:00 UTC  (5pm BST)  — Atlanta
  { home_team: 'R32 Winner', away_team: 'R32 Winner', competition: WC, kickoff_at: '2026-07-07T16:00:00Z', status: U },
  // M96  |  7 Jul 20:00 UTC  (9pm BST)  — Vancouver
  { home_team: 'R32 Winner', away_team: 'R32 Winner', competition: WC, kickoff_at: '2026-07-07T20:00:00Z', status: U },

  // ══════════════════════════════════════════════════
  // QUARTER-FINALS  (9–12 Jul)
  // ══════════════════════════════════════════════════

  // M97  |  9 Jul 20:00 UTC  (9pm BST)  — Foxborough
  { home_team: 'R16 Winner', away_team: 'R16 Winner', competition: WC, kickoff_at: '2026-07-09T20:00:00Z', status: U },
  // M98  |  10 Jul 19:00 UTC  (8pm BST)  — Los Angeles
  { home_team: 'R16 Winner', away_team: 'R16 Winner', competition: WC, kickoff_at: '2026-07-10T19:00:00Z', status: U },
  // M99  |  11 Jul 21:00 UTC  (10pm BST)  — Miami
  { home_team: 'R16 Winner', away_team: 'R16 Winner', competition: WC, kickoff_at: '2026-07-11T21:00:00Z', status: U },
  // M100  |  12 Jul 01:00 UTC  (2am BST)  — Kansas City
  { home_team: 'R16 Winner', away_team: 'R16 Winner', competition: WC, kickoff_at: '2026-07-12T01:00:00Z', status: U },

  // ══════════════════════════════════════════════════
  // SEMI-FINALS  (14–15 Jul)
  // ══════════════════════════════════════════════════

  // M101  |  14 Jul 19:00 UTC  (8pm BST)  — Arlington
  { home_team: 'QF Winner', away_team: 'QF Winner', competition: WC, kickoff_at: '2026-07-14T19:00:00Z', status: U },
  // M102  |  15 Jul 19:00 UTC  (8pm BST)  — Atlanta
  { home_team: 'QF Winner', away_team: 'QF Winner', competition: WC, kickoff_at: '2026-07-15T19:00:00Z', status: U },

  // ══════════════════════════════════════════════════
  // THIRD PLACE  (18 Jul)  &  FINAL  (19 Jul)
  // ══════════════════════════════════════════════════

  // M103  |  18 Jul 21:00 UTC  (10pm BST)  — Miami
  { home_team: 'SF Runner-up', away_team: 'SF Runner-up', competition: WC, kickoff_at: '2026-07-18T21:00:00Z', status: U },
  // M104  |  19 Jul 19:00 UTC  (8pm BST)  — New Jersey (MetLife)
  { home_team: 'SF Winner',    away_team: 'SF Winner',    competition: WC, kickoff_at: '2026-07-19T19:00:00Z', status: U },
];

async function main() {
  console.log(`Inserting ${fixtures.length} fixtures into Supabase...`);

  // Insert in two batches to stay well within API limits
  const mid = Math.ceil(fixtures.length / 2);
  const batches = [fixtures.slice(0, mid), fixtures.slice(mid)];

  for (const [i, batch] of batches.entries()) {
    const { error } = await supabase.from('fixtures').insert(batch);
    if (error) {
      console.error(`Batch ${i + 1} failed:`, error.message);
      process.exit(1);
    }
    console.log(`  ✓ Batch ${i + 1}/${batches.length} (${batch.length} rows)`);
  }

  console.log(`\n✓ Done — ${fixtures.length} fixtures seeded.`);
}

main().catch(err => { console.error(err); process.exit(1); });
