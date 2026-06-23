// Upsert venue photos from photos.csv into the venue_photos table.
// Also writes the cover photo (display_order 0) to venues.photo_url.
//
// Run after fetch_photos.py has produced photos.csv:
//   npx tsx scripts/upsert-photos.ts
//
// Override CSV path:
//   PHOTOS_CSV_PATH=/path/to/photos.csv npx tsx scripts/upsert-photos.ts

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// ── Env ────────────────────────────────────────────────────────────────────────
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([^#\s=][^=]*)=(.*)/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('❌ Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(url, key);

// ── CSV parser ─────────────────────────────────────────────────────────────────
function parseCSVRow(line: string): string[] {
  const cells: string[] = [];
  let cur = '', inQ = false;
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ; }
    else if (ch === ',' && !inQ) { cells.push(cur); cur = ''; }
    else { cur += ch; }
  }
  cells.push(cur);
  return cells.map(c => c.trim().replace(/^"|"$/g, ''));
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n');
  const headers = parseCSVRow(lines[0]);
  return lines.slice(1)
    .filter(l => l.trim())
    .map(line => {
      const vals = parseCSVRow(line);
      return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']));
    });
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  const csvPath =
    process.env.PHOTOS_CSV_PATH ??
    path.resolve(process.cwd(), '../Downloads/wherewewatch_enrichment/photos.csv');

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV not found: ${csvPath}\n   Set PHOTOS_CSV_PATH env var to override.`);
    process.exit(1);
  }

  const rows = parseCSV(fs.readFileSync(csvPath, 'utf-8'));
  console.log(`\n📂 ${rows.length} photo rows from ${path.basename(csvPath)}\n`);

  // Fetch all venues once — name → id map
  const { data: venues, error: fetchErr } = await supabase.from('venues').select('id, name');
  if (fetchErr) { console.error('❌ Could not fetch venues:', fetchErr.message); process.exit(1); }

  const nameToId = new Map<string, string>(
    (venues ?? []).map(v => [v.name.toLowerCase().trim(), v.id])
  );

  // Group rows by venue
  type PhotoRow = { photo_url: string; display_order: number };
  const byVenue = new Map<string, PhotoRow[]>();
  for (const row of rows) {
    const k = row.venue_name.toLowerCase().trim();
    if (!byVenue.has(k)) byVenue.set(k, []);
    byVenue.get(k)!.push({ photo_url: row.photo_url, display_order: parseInt(row.display_order, 10) });
  }

  let updated = 0, skipped = 0, errors = 0;

  for (const [venueKey, photos] of byVenue) {
    const venueId = nameToId.get(venueKey);
    if (!venueId) {
      console.warn(`  ⚠  no DB venue for "${venueKey}" — skipping`);
      skipped++;
      continue;
    }

    // Replace all photos for this venue
    await supabase.from('venue_photos').delete().eq('venue_id', venueId);

    const insertRows = photos
      .sort((a, b) => a.display_order - b.display_order)
      .map(p => ({ venue_id: venueId, photo_url: p.photo_url, display_order: p.display_order, source: 'google' }));

    const { error: insertErr } = await supabase.from('venue_photos').insert(insertRows);
    if (insertErr) {
      console.error(`  ✗  "${venueKey}": ${insertErr.message}`);
      errors++;
      continue;
    }

    // Update venues.photo_url with the cover (display_order 0) for backward compat
    const cover = photos.find(p => p.display_order === 0)?.photo_url;
    if (cover) {
      await supabase.from('venues').update({ photo_url: cover }).eq('id', venueId);
    }

    console.log(`  ✓  ${venueKey}: ${photos.length} photos`);
    updated++;
  }

  console.log(`\n✅ Done — ${updated} venues updated, ${skipped} skipped, ${errors} errors`);
}

main().catch(err => { console.error(err); process.exit(1); });
