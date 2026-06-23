// Upsert venues from enriched.csv into Supabase venues table.
// Matches on name (case-insensitive), updates existing rows, inserts new ones.
//
// Run:
//   npx tsx scripts/upsert-venues.ts
//
// Override CSV path:
//   CSV_PATH=/path/to/enriched.csv npx tsx scripts/upsert-venues.ts

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
  console.error('❌ Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and/or SUPABASE_SERVICE_ROLE_KEY in .env.local');
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

// ── Row mapper ─────────────────────────────────────────────────────────────────
// Maps enriched.csv columns → venues table columns.
// Columns confirmed present in DB: name, type, area, phone, email, website, capacity.
//
// If you've added opening_times / price_level columns to the venues table,
// uncomment those two lines in the return below.
function toDbRow(r: Record<string, string>): Record<string, unknown> {
  const capacity = parseInt(r.capacity_estimate, 10);
  const row: Record<string, unknown> = {
    name:     r.name,
    type:     r.type     || undefined,
    area:     r.area     || undefined,
    phone:    r.phone    || undefined,
    website:  r.website  || undefined,
    capacity: isNaN(capacity) ? undefined : capacity,
  };

  if (r.opening_times && r.opening_times !== 'unknown') row.opening_times = r.opening_times;
  if (r.price_level)   row.price_level = r.price_level;
  if (r.bookable)      row.bookable = r.bookable;

  const lat = parseFloat(r.lat), lng = parseFloat(r.lng);
  if (!isNaN(lat)) row.lat = lat;
  if (!isNaN(lng)) row.lng = lng;

  // Strip undefined keys so Supabase doesn't try to null them out
  return Object.fromEntries(Object.entries(row).filter(([, v]) => v !== undefined));
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  const csvPath = process.env.CSV_PATH
    ?? path.resolve(process.cwd(), '../Downloads/wherewewatch_enrichment/enriched.csv');

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV not found: ${csvPath}\n   Set CSV_PATH env var to override.`);
    process.exit(1);
  }

  const rows = parseCSV(fs.readFileSync(csvPath, 'utf-8'));
  console.log(`\n📂 ${rows.length} venues from ${path.basename(csvPath)}\n`);

  // Fetch all existing venues so we can match by name without N round-trips
  const { data: existing, error: fetchErr } = await supabase
    .from('venues')
    .select('id, name');
  if (fetchErr) {
    console.error('❌ Could not fetch existing venues:', fetchErr.message);
    process.exit(1);
  }

  const nameToId = new Map<string, string>(
    (existing ?? []).map(v => [v.name.toLowerCase().trim(), v.id])
  );

  console.log(`   ${nameToId.size} existing venues in DB\n`);

  let updated = 0, inserted = 0, errors = 0;

  for (const row of rows) {
    const dbRow = toDbRow(row);
    const existingId = nameToId.get(row.name.toLowerCase().trim());

    if (existingId) {
      const { error } = await supabase
        .from('venues')
        .update(dbRow)
        .eq('id', existingId);
      if (error) {
        console.error(`  ✗ UPDATE  "${row.name}": ${error.message}`);
        errors++;
      } else {
        console.log(`  ✓ updated  ${row.name}`);
        updated++;
      }
    } else {
      const { error } = await supabase
        .from('venues')
        .insert(dbRow);
      if (error) {
        console.error(`  ✗ INSERT  "${row.name}": ${error.message}`);
        errors++;
      } else {
        console.log(`  + inserted ${row.name}`);
        inserted++;
      }
    }
  }

  console.log(`\n✅ Done — ${updated} updated, ${inserted} inserted, ${errors} errors`);
}

main().catch(err => { console.error(err); process.exit(1); });
