'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import PhotoCarousel from './components/PhotoCarousel';
import { supabase } from '@/lib/supabase';
import { flagFor } from '@/lib/teamFlags';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  navy: '#0A1A33', navyMid: '#12294D', green: '#00B368', greenDark: '#0A6B45',
  amber: '#FFB22E', red: '#E5484D', bg: '#F6F7F4', white: '#fff',
  textMuted: '#9AA3B0', textSub: '#5B6577', textBlue: '#AEBED4',
  border: 'rgba(10,26,51,0.08)', borderMed: 'rgba(10,26,51,0.12)', borderHeavy: 'rgba(10,26,51,0.16)',
};
const FONT_MONO = "'IBM Plex Mono', monospace";
const FONT_DISPLAY = "'Anton', sans-serif";
const FONT_BODY = "'Inter', system-ui, sans-serif";
const capitalise = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

// ─── Types ────────────────────────────────────────────────────────────────────
interface DbFixture {
  id: string; home_team: string; away_team: string;
  kickoff_at: string; status: string;
}

interface Venue {
  id: string; name: string; type: string; area: string;
  phone?: string; bookingUrl?: string;
  isFeatured: boolean; verified: boolean;
  photos: string[]; priceLevel: string;
  gamesPolicy: string; bookable: string;
  crowdTeam?: string; tier?: 1 | 2 | 3;
}

interface RawDbVenue {
  id: string; name: string; type?: string; area?: string;
  phone?: string; booking_url?: string; photo_url?: string;
  price_level?: string; is_featured?: boolean; verified?: boolean;
  bookable?: string; crowd_team?: string;
  auto_tags?: string[] | null;
  venue_fixtures?: Array<{ games_policy?: string }>;
  venue_photos?: Array<{ photo_url: string; display_order: number }>;
}

function mapVenue(raw: RawDbVenue): Venue {
  const photos = (raw.venue_photos ?? [])
    .sort((a, b) => a.display_order - b.display_order)
    .map(p => p.photo_url)
    .concat(!(raw.venue_photos?.length) && raw.photo_url ? [raw.photo_url] : []);
  return {
    id: raw.id, name: raw.name, type: raw.type ?? 'Venue', area: raw.area ?? '',
    phone: raw.phone ?? undefined, bookingUrl: raw.booking_url ?? undefined,
    isFeatured: raw.is_featured ?? false, verified: raw.verified ?? false,
    photos, priceLevel: raw.price_level ?? '',
    gamesPolicy: raw.venue_fixtures?.[0]?.games_policy ?? 'unknown',
    bookable: raw.bookable ?? 'unknown',
    crowdTeam: raw.crowd_team ?? undefined,
  };
}

// ─── Kickoff helpers ──────────────────────────────────────────────────────────
function kickoffBstH(isoStr: string) {
  return (new Date(isoStr).getUTCHours() + 1) % 24;
}
function isLate(isoStr: string) {
  const h = kickoffBstH(isoStr);
  return h >= 21 || h < 6;
}
function bstTimeStr(isoStr: string) {
  const d = new Date(isoStr);
  const h = (d.getUTCHours() + 1) % 24;
  const m = d.getUTCMinutes();
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')}${h < 12 ? 'am' : 'pm'}`;
}
function dayLabel(isoStr: string) {
  const d = new Date(isoStr);
  const now = new Date();
  const todayMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const dayMs = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const diff = Math.round((dayMs - todayMs) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return d.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

// BST date string "YYYY-MM-DD" for a given ISO UTC timestamp
function bstDateStr(isoStr: string) {
  const d = new Date(isoStr);
  const bst = new Date(d.getTime() + 3600000);
  return bst.toISOString().slice(0, 10);
}

// ─── Three-tier match resolution ──────────────────────────────────────────────
function getVenueTier(v: Venue, fx: DbFixture): 1 | 2 | 3 | null {
  const h = kickoffBstH(fx.kickoff_at);
  const needsLate = h >= 21 || h < 6;
  if (needsLate) return null; // simplified: late matches shown by late_friendly only, but we dropped that complexity
  if (v.crowdTeam) {
    const ct = v.crowdTeam.toLowerCase();
    const home = fx.home_team.toLowerCase();
    const away = fx.away_team.toLowerCase();
    if (ct.includes(home) || ct.includes(away) || home.includes(ct) || away.includes(ct)) return 1;
  }
  if (v.gamesPolicy === 'all_games') return 2;
  return 3;
}

// ─── Countdown hook ───────────────────────────────────────────────────────────
function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// ─── Booking CTA ─────────────────────────────────────────────────────────────
function BookingCTA({ venue: v, large = false }: { venue: Venue; large?: boolean }) {
  const pad = large ? '14px 20px' : '11px 16px';
  const fs = large ? 15 : 13;
  const rad = 12;
  if (v.bookingUrl) {
    return (
      <a href={`/api/track?venue=${v.id}&type=booking&url=${encodeURIComponent(v.bookingUrl)}`}
        target="_blank" rel="noopener noreferrer"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.green, color: C.white, borderRadius: rad, padding: pad, textDecoration: 'none', fontFamily: FONT_BODY, fontSize: fs, fontWeight: 700 }}>
        Book for tonight →
      </a>
    );
  }
  if (v.phone) {
    return (
      <a href={`/api/track?venue=${v.id}&type=phone&url=${encodeURIComponent(`tel:${v.phone.replace(/\s/g, '')}`)}`}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.navy, color: C.white, borderRadius: rad, padding: pad, textDecoration: 'none', fontFamily: FONT_BODY, fontSize: fs, fontWeight: 700 }}>
        Call to check →
      </a>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0F2F5', color: C.textSub, borderRadius: rad, padding: pad, fontFamily: FONT_BODY, fontSize: fs, fontWeight: 700 }}>
      Walk in — no booking needed
    </div>
  );
}

// ─── Featured venue card ──────────────────────────────────────────────────────
function FeaturedCard({ venue: v }: { venue: Venue }) {
  return (
    <article style={{ background: C.white, borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(10,26,51,0.07)', border: `1px solid ${C.border}` }}>
      <div style={{ position: 'relative', height: 220 }}>
        <PhotoCarousel photos={v.photos} venueName={v.name} height={220} />
        {v.verified && (
          <span style={{ position: 'absolute', top: 12, left: 12, zIndex: 6, background: C.green, color: C.white, borderRadius: 999, padding: '5px 11px', fontSize: 11, fontWeight: 800 }}>
            ✓ Verified
          </span>
        )}
        <span style={{ position: 'absolute', top: 12, right: 12, zIndex: 6, background: 'rgba(10,26,51,0.72)', color: C.white, borderRadius: 999, padding: '5px 12px', fontSize: 12, fontWeight: 600, backdropFilter: 'blur(4px)' }}>
          {v.area}
        </span>
      </div>
      <div style={{ padding: '18px 20px 20px' }}>
        <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, letterSpacing: 0.3, textTransform: 'uppercase', margin: '0 0 4px', lineHeight: 1, color: C.navy }}>{v.name}</h3>
        <div style={{ fontSize: 13, color: C.textSub, marginBottom: 16 }}>
          {capitalise(v.type)}{v.area ? ` · ${v.area}` : ''}{v.priceLevel ? ` · ${v.priceLevel}` : ''}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <BookingCTA venue={v} />
          </div>
          <Link href={`/venues/${v.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${C.borderHeavy}`, color: C.textSub, borderRadius: 12, padding: '11px 16px', textDecoration: 'none', fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
            More info
          </Link>
        </div>
      </div>
    </article>
  );
}

// ─── Browse venue row ─────────────────────────────────────────────────────────
function BrowseRow({ venue: v, matchSelected }: { venue: Venue; matchSelected: boolean }) {
  return (
    <article style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, letterSpacing: 0.3, textTransform: 'uppercase', margin: 0, color: C.navy }}>{v.name}</h3>
          {matchSelected && v.tier === 1 && (
            <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(0,179,104,0.12)', color: C.greenDark, borderRadius: 999, padding: '3px 8px' }}>Nation hub</span>
          )}
        </div>
        <div style={{ fontSize: 13, color: C.textSub, marginTop: 3 }}>
          {capitalise(v.type)}{v.area ? ` · ${v.area}` : ''}{v.priceLevel ? ` · ${v.priceLevel}` : ''}
          {v.gamesPolicy === 'all_games' && <span style={{ marginLeft: 8, color: C.greenDark, fontWeight: 600 }}>· All World Cup fixtures</span>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <div style={{ minWidth: 140 }}><BookingCTA venue={v} /></div>
        <Link href={`/venues/${v.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${C.borderHeavy}`, color: C.textSub, borderRadius: 12, padding: '11px 16px', textDecoration: 'none', fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
          More info
        </Link>
      </div>
    </article>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Page() {
  const [rawVenues, setRawVenues] = useState<RawDbVenue[]>([]);
  const [dbFixtures, setDbFixtures] = useState<DbFixture[]>([]);
  const [loading, setLoading] = useState(true);

  // 3 filters
  const [areaFilter, setAreaFilter] = useState('');
  const [matchFilter, setMatchFilter] = useState('all');
  const [bookableFilter, setBookableFilter] = useState<'all' | 'bookable' | 'walkin'>('all');
  const [browseOpen, setBrowseOpen] = useState(false);

  const now = useNow();

  // ── Fetch ──
  useEffect(() => {
    async function load() {
      const nowIso = new Date().toISOString();
      const [venueRes, fixtureRes, photosRes] = await Promise.all([
        supabase.from('venues')
          .select('*, venue_fixtures(games_policy)')
          .eq('status', 'active')
          .or(`active_until.is.null,active_until.gte.${nowIso}`)
          .order('is_featured', { ascending: false })
          .order('name', { ascending: true }),
        supabase.from('fixtures')
          .select('id, home_team, away_team, kickoff_at, status')
          .gte('kickoff_at', nowIso)
          .order('kickoff_at', { ascending: true })
          .limit(48),
        supabase.from('venue_photos')
          .select('venue_id, photo_url, display_order')
          .order('display_order', { ascending: true }),
      ]);
      if (venueRes.data) {
        const photosByVenue = new Map<string, Array<{ photo_url: string; display_order: number }>>();
        (photosRes.data ?? []).forEach((p: { venue_id: string; photo_url: string; display_order: number }) => {
          if (!photosByVenue.has(p.venue_id)) photosByVenue.set(p.venue_id, []);
          photosByVenue.get(p.venue_id)!.push(p);
        });
        setRawVenues(venueRes.data.map(v => ({ ...v, venue_photos: photosByVenue.get(v.id) ?? [] })) as RawDbVenue[]);
      }
      if (fixtureRes.data) setDbFixtures(fixtureRes.data);
      setLoading(false);
    }
    load();
  }, []);

  const venues = useMemo(() => rawVenues.map(mapVenue), [rawVenues]);

  // ── Featured ──
  const featuredVenues = useMemo(() => venues.filter(v => v.isFeatured), [venues]);

  // ── Area options ──
  const areaOptions = useMemo(() => {
    const seen: Record<string, true> = {};
    venues.forEach(v => { if (v.area) seen[v.area] = true; });
    return Object.keys(seen).sort();
  }, [venues]);

  // ── Today's fixtures for match filter ──
  const todayBst = bstDateStr(now.toISOString());
  const todayFixtures = useMemo(
    () => dbFixtures.filter(fx => bstDateStr(fx.kickoff_at) === todayBst),
    [dbFixtures, todayBst],
  );

  // ── Next/live match ──
  const nextMatch = dbFixtures[0] ?? null;
  const liveMatch = useMemo(() => {
    const ms = now.getTime();
    return dbFixtures.find(fx => {
      const ko = new Date(fx.kickoff_at).getTime();
      return ms >= ko && ms < ko + 95 * 60000;
    }) ?? null;
  }, [dbFixtures, now]);

  // ── Browse list (apply 3 filters) ──
  const selectedFx = matchFilter !== 'all' ? (dbFixtures.find(f => f.id === matchFilter) ?? null) : null;

  const browseList = useMemo(() => {
    let list = venues;
    if (areaFilter) list = list.filter(v => v.area === areaFilter);
    if (selectedFx) {
      list = list.map(v => ({ ...v, tier: getVenueTier(v, selectedFx) ?? undefined }))
        .filter(v => v.tier !== undefined);
      list = [...list].sort((a, b) => (a.tier ?? 4) - (b.tier ?? 4));
    }
    if (bookableFilter === 'bookable') list = list.filter(v => v.bookingUrl || v.phone);
    if (bookableFilter === 'walkin') list = list.filter(v => !v.bookingUrl && !v.phone);
    return list;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venues, areaFilter, selectedFx, bookableFilter]);

  const scrollToFeatured = useCallback(() => {
    document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // ── Countdown display ──
  const countdownEl = useMemo(() => {
    const target = liveMatch ?? nextMatch;
    if (!target) return null;
    const ko = new Date(target.kickoff_at);
    const diffMs = ko.getTime() - now.getTime();

    if (liveMatch) {
      const elapsed = Math.floor((now.getTime() - ko.getTime()) / 60000);
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="wtw-pulse" style={{ width: 10, height: 10, borderRadius: 999, background: C.red, boxShadow: '0 0 0 4px rgba(229,72,77,0.22)', flexShrink: 0 }} />
          <span style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 700, color: C.red }}>LIVE</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.white }}>
            {flagFor(target.home_team)} {target.home_team} v {target.away_team} {flagFor(target.away_team)}
          </span>
          <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.textBlue }}>{elapsed}′</span>
        </div>
      );
    }
    if (diffMs <= 0) return null;
    const totalMin = Math.floor(diffMs / 60000);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    const day = dayLabel(target.kickoff_at);
    const timeStr = bstTimeStr(target.kickoff_at);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 28, fontWeight: 700, color: C.white, letterSpacing: -1 }}>
          {day === 'Today' ? (h > 0 ? `${h}h ${m}m` : `${m}m`) : timeStr}
        </div>
        <div>
          <div style={{ fontSize: 12, color: C.textBlue, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{day === 'Today' ? 'Until kickoff' : `${day} · ${timeStr} BST`}</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.white, marginTop: 2 }}>
            {flagFor(target.home_team)} {target.home_team} v {target.away_team} {flagFor(target.away_team)}
          </div>
        </div>
      </div>
    );
  }, [liveMatch, nextMatch, now]);

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: FONT_BODY, color: C.navy, WebkitFontSmoothing: 'antialiased' }}>

      {/* ── Nav ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(246,247,244,0.88)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '13px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 13, height: 13, borderRadius: 999, background: C.green, boxShadow: '0 0 0 4px rgba(0,179,104,0.18)' }} />
            <span style={{ fontFamily: FONT_DISPLAY, fontSize: 22, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              Where We <span style={{ color: C.green }}>Watch</span>
            </span>
          </div>
          <div style={{ flex: 1 }} />
          <Link href="/list-venue" style={{ textDecoration: 'none', background: C.navy, color: C.white, borderRadius: 999, padding: '10px 18px', fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700 }}>
            List your venue
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ position: 'relative', overflow: 'hidden', background: `linear-gradient(160deg, ${C.navy} 0%, ${C.navyMid} 100%)`, paddingBottom: 0 }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <svg viewBox="0 0 1400 480" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <line x1="700" y1="-40" x2="700" y2="520" stroke="rgba(255,255,255,0.04)" strokeWidth="2" />
            <circle cx="700" cy="240" r="110" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="2" />
          </svg>
        </div>
        <div style={{ position: 'absolute', top: -100, left: -60, width: 360, height: 360, borderRadius: 999, background: 'radial-gradient(circle, rgba(0,179,104,0.25), transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -120, right: -60, width: 400, height: 400, borderRadius: 999, background: 'radial-gradient(circle, rgba(255,178,46,0.15), transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: 1200, margin: '0 auto', padding: '44px 24px 0', color: C.white }}>
          {/* Stage badge */}
          {(() => {
            const STAGES = [
              { label: 'GROUP STAGE',    start: new Date('2026-06-11'), end: new Date('2026-06-27'), display: '11–27 JUN' },
              { label: 'ROUND OF 32',    start: new Date('2026-06-28'), end: new Date('2026-07-03'), display: '28 JUN–3 JUL' },
              { label: 'ROUND OF 16',    start: new Date('2026-07-04'), end: new Date('2026-07-07'), display: '4–7 JUL' },
              { label: 'QUARTER-FINALS', start: new Date('2026-07-09'), end: new Date('2026-07-11'), display: '9–11 JUL' },
              { label: 'SEMI-FINALS',    start: new Date('2026-07-14'), end: new Date('2026-07-15'), display: '14–15 JUL' },
              { label: 'FINAL',          start: new Date('2026-07-19'), end: new Date('2026-07-19'), display: '19 JUL' },
            ];
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const stg = STAGES.find(s => today >= s.start && today <= s.end)
              ?? STAGES.find(s => today < s.start);
            if (!stg) return null;
            const isLive = today >= stg.start && today <= stg.end;
            return (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, fontFamily: FONT_MONO, fontSize: 12, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', color: C.amber, marginBottom: 18 }}>
                {isLive && <span className="wtw-pulse" style={{ width: 9, height: 9, borderRadius: 999, background: C.red, boxShadow: '0 0 0 4px rgba(229,72,77,0.22)' }} />}
                WORLD CUP · {stg.label}{isLive ? ' LIVE' : ''} · {stg.display}
              </div>
            );
          })()}

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 40, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 300 }}>
              <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 'clamp(38px,5.5vw,66px)', lineHeight: 1.0, letterSpacing: 0.3, textTransform: 'uppercase', margin: '0 0 16px' }}>
                Watching<br /><span style={{ color: C.green }}>tonight?</span>
              </h1>
              <p style={{ fontSize: 17, color: C.textBlue, margin: '0 0 28px', maxWidth: '42ch', lineHeight: 1.5 }}>
                Find a pub, bar or restaurant showing World Cup games near you.
              </p>
              <button onClick={scrollToFeatured} style={{ background: C.green, color: C.white, border: 'none', borderRadius: 14, padding: '14px 28px', fontFamily: FONT_BODY, fontSize: 15, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.1, boxShadow: '0 8px 24px rgba(0,179,104,0.3)' }}>
                Find venues →
              </button>
            </div>

            {/* Countdown card */}
            {countdownEl && (
              <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, padding: '22px 26px', backdropFilter: 'blur(8px)', flexShrink: 0, maxWidth: 380 }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: C.textBlue, marginBottom: 14 }}>
                  {liveMatch ? 'Match in progress' : 'Next kickoff'}
                </div>
                {countdownEl}
              </div>
            )}
          </div>

          {/* ── Fixture rail ── */}
          <div style={{ marginTop: 36, paddingBottom: 36 }}>
            <div style={{ fontSize: 12, fontFamily: FONT_MONO, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: '#7CF0BE', marginBottom: 10 }}>
              Upcoming fixtures (UK time)
            </div>
            <div className="wtw-rail" style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6, scrollSnapType: 'x mandatory' }}>
              {dbFixtures.slice(0, 20).map(fx => {
                const day = dayLabel(fx.kickoff_at);
                const time = bstTimeStr(fx.kickoff_at);
                const isSelected = matchFilter === fx.id;
                const late = isLate(fx.kickoff_at);
                return (
                  <button key={fx.id}
                    onClick={() => { setMatchFilter(fx.id); setBrowseOpen(true); setTimeout(() => document.getElementById('browse')?.scrollIntoView({ behavior: 'smooth' }), 100); }}
                    style={{ minWidth: 210, flexShrink: 0, scrollSnapAlign: 'start', textAlign: 'left', background: isSelected ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.06)', border: `1px solid ${isSelected ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 14, padding: '12px 14px', color: C.white, cursor: 'pointer', fontFamily: FONT_BODY, transition: 'all .15s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 20, marginBottom: 7 }}>
                      <span>{flagFor(fx.home_team)}</span>
                      <span style={{ fontSize: 10, color: '#7C8AA0', fontWeight: 600 }}>v</span>
                      <span>{flagFor(fx.away_team)}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.25, marginBottom: 7 }}>{fx.home_team} v {fx.away_team}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 600, color: C.amber }}>{day} {time}</span>
                      {late && <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.3, borderRadius: 999, padding: '2px 7px', background: 'rgba(255,178,46,0.2)', color: '#FFD27A' }}>Late</span>}
                    </div>
                  </button>
                );
              })}
              {loading && <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>Loading…</div>}
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured venues ── */}
      <section id="featured" style={{ maxWidth: 1200, margin: '0 auto', padding: '56px 24px 48px' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: C.green, marginBottom: 8 }}>Featured</div>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 'clamp(28px,3.5vw,40px)', letterSpacing: 0.3, textTransform: 'uppercase', margin: 0, color: C.navy }}>Best spots to watch</h2>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: C.textMuted }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>⚽</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Loading venues…</div>
          </div>
        ) : featuredVenues.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: C.textMuted }}>
            <div style={{ fontSize: 14 }}>Featured venues coming soon.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 20 }}>
            {featuredVenues.map(v => <FeaturedCard key={v.id} venue={v} />)}
          </div>
        )}
      </section>

      {/* ── Browse all venues ── */}
      <section id="browse" style={{ background: C.white, borderTop: `1px solid ${C.borderMed}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 56px' }}>

          {/* Expand toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: browseOpen ? 24 : 0 }}>
            <div>
              <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 'clamp(22px,2.8vw,32px)', letterSpacing: 0.3, textTransform: 'uppercase', margin: 0, color: C.navy }}>
                More venues
              </h2>
              {!browseOpen && (
                <p style={{ fontSize: 14, color: C.textSub, margin: '6px 0 0' }}>
                  Browse all {venues.length} World Cup screening venues in London
                </p>
              )}
            </div>
            <button onClick={() => setBrowseOpen(o => !o)} style={{ flexShrink: 0, background: browseOpen ? C.bg : C.navy, color: browseOpen ? C.navy : C.white, border: `1.5px solid ${browseOpen ? C.borderHeavy : 'transparent'}`, borderRadius: 12, padding: '11px 20px', fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              {browseOpen ? 'Collapse' : `Browse all ${venues.length} venues`}
            </button>
          </div>

          {browseOpen && (
            <>
              {/* 3-filter bar */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24, padding: '16px', background: C.bg, borderRadius: 14 }}>
                {/* Area filter */}
                <div style={{ flex: '1 1 180px', minWidth: 160 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: C.textMuted, marginBottom: 6 }}>Area</label>
                  <select value={areaFilter} onChange={e => setAreaFilter(e.target.value)} style={{ width: '100%', border: `1.5px solid ${C.borderHeavy}`, borderRadius: 10, padding: '10px 12px', fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: C.navy, background: C.white, outline: 'none', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }}>
                    <option value="">All areas</option>
                    {areaOptions.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>

                {/* Tonight's match filter */}
                <div style={{ flex: '1.4 1 220px', minWidth: 200 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: C.textMuted, marginBottom: 6 }}>Tonight&apos;s match</label>
                  <select value={matchFilter} onChange={e => setMatchFilter(e.target.value)} style={{ width: '100%', border: `1.5px solid ${C.borderHeavy}`, borderRadius: 10, padding: '10px 12px', fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: C.navy, background: C.white, outline: 'none', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }}>
                    <option value="all">Any fixture</option>
                    {(todayFixtures.length > 0 ? todayFixtures : dbFixtures.slice(0, 6)).map(fx => (
                      <option key={fx.id} value={fx.id}>
                        {flagFor(fx.home_team)} {fx.home_team} v {fx.away_team} {flagFor(fx.away_team)} · {bstTimeStr(fx.kickoff_at)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Walk-in / Bookable */}
                <div style={{ flex: '1 1 160px', minWidth: 150 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: C.textMuted, marginBottom: 6 }}>Booking</label>
                  <div style={{ display: 'flex', border: `1.5px solid ${C.borderHeavy}`, borderRadius: 10, overflow: 'hidden', background: C.white }}>
                    {(['all', 'bookable', 'walkin'] as const).map(opt => (
                      <button key={opt} onClick={() => setBookableFilter(opt)} style={{ flex: 1, padding: '10px 8px', fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', borderLeft: opt !== 'all' ? `1px solid ${C.borderHeavy}` : 'none', background: bookableFilter === opt ? C.navy : C.white, color: bookableFilter === opt ? C.white : C.navy, transition: 'all .12s' }}>
                        {opt === 'all' ? 'All' : opt === 'bookable' ? 'Bookable' : 'Walk-in'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clear filters */}
                {(areaFilter || matchFilter !== 'all' || bookableFilter !== 'all') && (
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button onClick={() => { setAreaFilter(''); setMatchFilter('all'); setBookableFilter('all'); }} style={{ background: 'transparent', border: 'none', fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: C.textSub, cursor: 'pointer', textDecoration: 'underline', padding: '10px 4px' }}>
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {/* Count */}
              <div style={{ fontSize: 14, color: C.textSub, marginBottom: 16 }}>
                <strong style={{ color: C.navy }}>{browseList.length}</strong> venues{areaFilter ? ` in ${areaFilter}` : ''}
                {selectedFx ? ` · filtered for ${selectedFx.home_team} v ${selectedFx.away_team}` : ''}
              </div>

              {/* Venue list */}
              {browseList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 24px', color: C.textMuted }}>
                  <div style={{ fontSize: 14, marginBottom: 12 }}>No venues match these filters.</div>
                  <button onClick={() => { setAreaFilter(''); setMatchFilter('all'); setBookableFilter('all'); }} style={{ background: C.green, color: C.white, border: 'none', borderRadius: 12, padding: '11px 22px', fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                    Clear filters
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {browseList.map(v => (
                    <BrowseRow key={v.id} venue={v} matchSelected={matchFilter !== 'all'} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── Venue CTA ── */}
      <section style={{ background: C.navy, color: C.white }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '52px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap' }}>
          <div style={{ maxWidth: '34ch' }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: C.amber, marginBottom: 10 }}>For venues</div>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 'clamp(32px,4vw,50px)', letterSpacing: 0.5, textTransform: 'uppercase', margin: '0 0 16px', lineHeight: 0.98 }}>Get found on matchday</h2>
            <p style={{ fontSize: 16, color: '#9AABC2', margin: 0, lineHeight: 1.5 }}>Pack out your pub this World Cup. Get found by thousands of fans searching for somewhere to watch tonight.</p>
          </div>
          <Link href="/list-venue" style={{ textDecoration: 'none', background: C.green, color: C.white, borderRadius: 12, padding: '16px 28px', fontFamily: FONT_BODY, fontSize: 15, fontWeight: 700, display: 'inline-block', boxShadow: '0 8px 24px rgba(0,179,104,0.3)' }}>
            List your venue for free →
          </Link>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: FONT_DISPLAY, fontSize: 15, letterSpacing: 0.5, textTransform: 'uppercase' }}>Where We <span style={{ color: C.green }}>Watch</span></span>
            <div style={{ display: 'flex', gap: 20, fontSize: 13, color: '#7C8AA0' }}>
              <Link href="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</Link>
              <Link href="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>Terms</Link>
              <span>London · 2026 World Cup</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
