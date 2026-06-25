'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { VenuePin } from './components/MapView';
import PhotoCarousel from './components/PhotoCarousel';
import { supabase } from '@/lib/supabase';
import { flagFor } from '@/lib/teamFlags';

const MapView = dynamic(() => import('./components/MapView'), { ssr: false });

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

// ─── Tournament stage (update dates here if schedule changes) ─────────────────
// NOTE: web sources show R32 Jun 29–Jul 6, R16 Jul 9–12 — verify against live schedule
const STAGES = [
  { label: 'GROUP STAGE',    start: [2026,  6, 11], end: [2026,  6, 27], display: '11–27 JUN' },
  { label: 'ROUND OF 32',    start: [2026,  6, 28], end: [2026,  7,  3], display: '28 JUN–3 JUL' },
  { label: 'ROUND OF 16',    start: [2026,  7,  4], end: [2026,  7,  7], display: '4–7 JUL' },
  { label: 'QUARTER-FINALS', start: [2026,  7,  9], end: [2026,  7, 11], display: '9–11 JUL' },
  { label: 'SEMI-FINALS',    start: [2026,  7, 14], end: [2026,  7, 15], display: '14–15 JUL' },
  { label: 'FINAL',          start: [2026,  7, 19], end: [2026,  7, 19], display: '19 JUL' },
] as const;

function getTournamentStage() {
  const n = new Date();
  const today = new Date(n.getFullYear(), n.getMonth(), n.getDate());
  for (const s of STAGES) {
    const start = new Date(s.start[0], s.start[1] - 1, s.start[2]);
    const end   = new Date(s.end[0],   s.end[1]   - 1, s.end[2]);
    if (today >= start && today <= end) return { ...s, isLive: true };
  }
  // Between stages — show next upcoming round
  for (const s of STAGES) {
    const start = new Date(s.start[0], s.start[1] - 1, s.start[2]);
    if (today < start) return { ...s, isLive: false };
  }
  return null;
}

// ─── Kickoff helpers ──────────────────────────────────────────────────────────
function kickoffInfo(isoStr: string): { display: string; koRank: number; late: boolean } {
  const d = new Date(isoStr);
  const bstH = (d.getUTCHours() + 1) % 24;
  const bstM = d.getUTCMinutes();
  const h12 = bstH % 12 || 12;
  const ampm = bstH < 12 ? 'am' : 'pm';
  return {
    display: `${h12}:${String(bstM).padStart(2, '0')}${ampm}`,
    koRank: bstH * 60 + bstM,
    late: bstH >= 22 || bstH < 5,
  };
}

function isOvernight(isoStr: string): boolean {
  const bstH = (new Date(isoStr).getUTCHours() + 1) % 24;
  return bstH >= 1 && bstH < 6;
}

function isLateKickoff(isoStr: string): boolean {
  const bstH = (new Date(isoStr).getUTCHours() + 1) % 24;
  return bstH >= 21 || bstH < 6;
}

function dayLabel(isoStr: string): string {
  const d = new Date(isoStr);
  const now = new Date();
  const todayMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const dayMs = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const diff = Math.round((dayMs - todayMs) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return d.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

const TYPE_HUE: Record<string, number> = {
  pub: 210, bar: 270, restaurant: 24, 'sports bar': 0,
  'café-bar': 150, 'event space': 190, club: 300,
};
const venueHue = (type: string) => TYPE_HUE[type?.toLowerCase()] ?? 210;


// ─── Types ────────────────────────────────────────────────────────────────────
type Space = 'now' | 'filling' | 'full';
const SPACE_META: Record<Space, { label: string; color: string; bg: string; dot: string; pulse: boolean; rank: number }> = {
  now:     { label: 'Space now',    color: '#0A6B45', bg: '#DDF4E8', dot: '#00B368', pulse: true,  rank: 0 },
  filling: { label: 'Filling up',   color: '#8A5A00', bg: '#FFF0D1', dot: '#E0922A', pulse: false, rank: 1 },
  full:    { label: 'Full tonight', color: '#9A2A2A', bg: '#FBE3E0', dot: '#E5484D', pulse: false, rank: 2 },
};

interface FixtureLink {
  id: string; home: string; away: string;
  homeFlag: string; awayFlag: string;
  kickoff: string; kickoffIso: string;
  confirmed: boolean; koRank: number;
}

interface DbFixture {
  id: string; home_team: string; away_team: string;
  kickoff_at: string; status: string;
}

interface Venue {
  id: string; name: string; type: string; area: string;
  lat: number; lng: number;
  phone?: string; email?: string; website?: string;
  bookingMethod: string; capacity: number; setupTags: string[]; autoTags: string[];
  isFeatured: boolean; verified: boolean; listingScope: string; claimed: boolean;
  hue: number; space: Space; priceLevel: string; photos: string[];
  gamesPolicy: string; bookable: string; bookingUrl?: string;
  primaryFixture: FixtureLink | null; allFixtures: FixtureLink[];
  crowdTeam?: string; tier?: 1 | 2 | 3; tierNation?: string;
}

interface RawVenueFixture {
  confirmed: boolean;
  games_policy?: string;
  fixtures: { id: string; home_team: string; away_team: string; kickoff_at: string } | null;
}

interface RawDbVenue {
  id: string; name: string; type?: string; area?: string;
  lat?: number; lng?: number;
  phone?: string; email?: string; website?: string; booking_method?: string;
  capacity?: number; setup_tags?: string[]; price_level?: string;
  is_featured?: boolean; verified?: boolean; listing_scope?: string; claimed?: boolean;
  crowd_team?: string;
  bookable?: string; booking_url?: string; photo_url?: string; auto_tags?: string[] | null;
  venue_photos?: Array<{ photo_url: string; display_order: number }>;
  venue_fixtures?: RawVenueFixture[];
}

function mapDbVenue(raw: RawDbVenue, selectedFixtureId: string): Venue {
  const vfLinks = (raw.venue_fixtures as RawVenueFixture[]) ?? [];
  const allFixtures: FixtureLink[] = vfLinks
    .filter(vf => vf.fixtures != null)
    .map(vf => {
      const fx = vf.fixtures!;
      const { display, koRank } = kickoffInfo(fx.kickoff_at);
      return {
        id: fx.id, home: fx.home_team, away: fx.away_team,
        homeFlag: flagFor(fx.home_team), awayFlag: flagFor(fx.away_team),
        kickoff: display, kickoffIso: fx.kickoff_at,
        confirmed: vf.confirmed, koRank,
      };
    })
    .sort((a, b) => new Date(a.kickoffIso).getTime() - new Date(b.kickoffIso).getTime());

  const primaryFixture =
    (selectedFixtureId !== 'all' ? allFixtures.find(f => f.id === selectedFixtureId) : undefined)
    ?? allFixtures[0]
    ?? null;

  return {
    id: raw.id, name: raw.name, type: raw.type ?? 'Venue', area: raw.area ?? '',
    lat: raw.lat ?? 0, lng: raw.lng ?? 0,
    phone: raw.phone ?? undefined, email: raw.email ?? undefined, website: raw.website ?? undefined,
    bookingMethod: raw.booking_method ?? 'walkins',
    capacity: raw.capacity ?? 0, setupTags: raw.setup_tags ?? [], autoTags: raw.auto_tags ?? [],
    isFeatured: raw.is_featured ?? false, verified: raw.verified ?? false,
    listingScope: raw.listing_scope ?? 'permanent', claimed: raw.claimed ?? false,
    hue: venueHue(raw.type ?? ''), space: 'now',
    gamesPolicy: vfLinks[0]?.games_policy ?? 'unknown',
    bookable: raw.bookable ?? 'unknown',
    bookingUrl: raw.booking_url ?? undefined,
    priceLevel: raw.price_level ?? '',
    photos: (raw.venue_photos ?? [])
      .sort((a, b) => a.display_order - b.display_order)
      .map(p => p.photo_url)
      .concat(
        !(raw.venue_photos?.length) && raw.photo_url ? [raw.photo_url] : []
      ),
    primaryFixture, allFixtures,
    crowdTeam: raw.crowd_team ?? undefined,
  };
}

// ─── Filter logic ─────────────────────────────────────────────────────────────
const PRICE_MAP: Record<string, string> = { p1: '£', p2: '££', p3: '£££' };

function matchesFilters(v: Venue, f: Record<string, boolean>): boolean {
  const activePriceKeys = ['p1', 'p2', 'p3'].filter(k => f[k]);
  if (activePriceKeys.length > 0 && !activePriceKeys.some(k => v.priceLevel === PRICE_MAP[k])) {
    return false;
  }
  const otherKeys = Object.keys(f).filter(k => f[k] && !['space', 'p1', 'p2', 'p3'].includes(k));
  return otherKeys.every(k => {
    switch (k) {
      case 'great_food': return v.autoTags.includes('great_food');
      case 'chilled':    return v.autoTags.includes('chilled');
      case 'lively':     return v.autoTags.includes('lively');
      case 'outdoor':    return v.autoTags.includes('outdoor_confirmed') || v.setupTags.includes('outdoor');
      case 'late':       return v.autoTags.includes('late_friendly');
      case 'book':       return v.bookable === 'yes' || !!v.bookingUrl;
      default:           return v.setupTags.includes(k);
    }
  });
}

// ─── Three-tier venue resolution ─────────────────────────────────────────────
function getVenueTier(v: Venue, fx: DbFixture): { tier: 1 | 2 | 3 | null; nation?: string } {
  const bstH = (new Date(fx.kickoff_at).getUTCHours() + 1) % 24;
  const needsLate = bstH >= 21 || bstH < 6;
  const isLateEnough = !needsLate || v.autoTags.includes('late_friendly') || v.setupTags.includes('late');
  if (!isLateEnough) return { tier: null };

  const home = fx.home_team.toLowerCase();
  const away = fx.away_team.toLowerCase();
  if (v.crowdTeam) {
    const ct = v.crowdTeam.toLowerCase();
    if (ct.includes(home) || ct.includes(away) || home.includes(ct) || away.includes(ct)) {
      const nation = ct.includes(home) ? fx.home_team : fx.away_team;
      return { tier: 1, nation };
    }
  }
  if (v.gamesPolicy === 'all_games') return { tier: 2 };
  return { tier: 3 };
}

// ─── Config ───────────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'space',       label: 'Most space' },
  { value: 'kickoff',     label: 'Kickoff soonest' },
];

const FILTER_GROUPS = [
  { title: 'Vibe',            keys: ['chilled', 'lively', 'great_food'] },
  { title: 'Screens & space', keys: ['outdoor'] },
  { title: 'Booking & hours', keys: ['book', 'late'] },
  { title: 'Price',           keys: ['p1', 'p2', 'p3'] },
];

const FILTER_LABELS: Record<string, string> = {
  chilled: 'Chilled', lively: 'Lively', great_food: 'Great food',
  outdoor: 'Outdoor screen',
  book: 'Book a table', late: 'Open late',
  p1: '£', p2: '££', p3: '£££',
};

const MOBILE_FILTERS = [
  { key: 'outdoor',    label: 'Outdoor' },
  { key: 'chilled',    label: 'Chilled' },
  { key: 'lively',     label: 'Lively' },
  { key: 'great_food', label: 'Great food' },
  { key: 'late',       label: 'Late night' },
  { key: 'book',       label: 'Bookable' },
  { key: 'p1',         label: '£' },
  { key: 'p2',         label: '££' },
  { key: 'p3',         label: '£££' },
];

// ─── Icons ────────────────────────────────────────────────────────────────────
function SearchIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="6.5" stroke="#fff" strokeWidth="2.4"/><path d="M16 16l4.5 4.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"/></svg>;
}
function PinIcon({ color = C.green }: { color?: string }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z" stroke={color} strokeWidth="2" strokeLinejoin="round"/><circle cx="12" cy="10" r="2.4" stroke={color} strokeWidth="2"/></svg>;
}
function CalIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3.5" y="5" width="17" height="15" rx="2.5" stroke={C.navy} strokeWidth="2"/><path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" stroke={C.navy} strokeWidth="2" strokeLinecap="round"/></svg>;
}
function BallIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke={C.navy} strokeWidth="2"/><path d="M12 7.5V12l3 2" stroke={C.navy} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function FilterIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 6h13M3 12h9M3 18h5" stroke={C.navy} strokeWidth="2" strokeLinecap="round"/><circle cx="19" cy="6" r="2.4" stroke={C.navy} strokeWidth="2"/><circle cx="15" cy="12" r="2.4" stroke={C.navy} strokeWidth="2"/><circle cx="11" cy="18" r="2.4" stroke={C.navy} strokeWidth="2"/></svg>;
}


// ─── Watch-at-home card ───────────────────────────────────────────────────────
interface WatchAtHomeProps { fixture: DbFixture; kickoff: string; onBrowse: () => void; }
function WatchAtHomeCard({ fixture, kickoff, onBrowse }: WatchAtHomeProps) {
  const STARS: Array<[number, number, number]> = [
    [40,22,1.8],[110,14,1.2],[190,30,1.5],[270,10,1],[340,24,1.8],
    [75,70,1.2],[200,60,1.5],[300,75,1],[155,88,1.8],[370,55,1.2],
  ];
  return (
    <div style={{ background: C.navy, borderRadius: 20, overflow: 'hidden', marginBottom: 18 }}>
      {/* Starfield header */}
      <div style={{ position: 'relative', height: 148, background: 'linear-gradient(160deg, #060F1F 0%, #0E2244 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 400 148" preserveAspectRatio="xMidYMid slice">
          {STARS.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="rgba(255,255,255,0.45)" />)}
        </svg>
        <span style={{ fontSize: 34, position: 'relative' }}>🌙</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 26, position: 'relative' }}>
          <span>{flagFor(fixture.home_team)}</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>v</span>
          <span>{flagFor(fixture.away_team)}</span>
        </div>
      </div>
      {/* Body */}
      <div style={{ padding: '20px 22px 24px' }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: C.white, textTransform: 'uppercase', letterSpacing: 0.4, lineHeight: 1.05, marginBottom: 8 }}>
          {fixture.home_team} v {fixture.away_team}
        </div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 600, color: C.amber, marginBottom: 16 }}>
          Kicks off {kickoff} UK time
        </div>
        <p style={{ fontSize: 14, color: C.textBlue, lineHeight: 1.65, margin: '0 0 22px' }}>
          Most venues are closed this late. This one&apos;s best enjoyed from the sofa. Snacks optional, staying up mandatory.
        </p>
        <button onClick={onBrowse} style={{ width: '100%', background: 'rgba(255,255,255,0.09)', color: C.white, border: '1px solid rgba(255,255,255,0.18)', borderRadius: 12, padding: '12px 20px', fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.2 }}>
          Browse earlier games instead
        </button>
      </div>
    </div>
  );
}

// ─── Late-night banner ────────────────────────────────────────────────────────
function LateNightBanner({ kickoff, count }: { kickoff: string; count: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13, background: 'rgba(255,178,46,0.07)', border: '1px solid rgba(255,178,46,0.32)', borderRadius: 16, padding: '14px 18px', marginBottom: 20 }}>
      <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1.1 }}>🌙</span>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>
          Only {count === 1 ? 'one place is' : `${count} places are`} open this late
        </div>
        <div style={{ fontSize: 13, color: C.textSub, marginTop: 3, lineHeight: 1.45 }}>
          These venues confirmed they&apos;ll be showing this {kickoff} kickoff. Worth booking ahead.
        </div>
      </div>
    </div>
  );
}

// ─── Venue card ───────────────────────────────────────────────────────────────
interface VenueCardProps {
  venue: Venue; index: number; active: boolean;
  onActivate: () => void;
  matchIsLate?: boolean;
}
function VenueCard({ venue: v, index, active, onActivate, matchIsLate }: VenueCardProps) {
  const full = v.space === 'full';
  const energyTag = v.autoTags.includes('lively') ? 'Lively' : v.autoTags.includes('chilled') ? 'Chilled' : null;

  return (
    <article id={`venue-${v.id}`} onClick={onActivate} style={{ background: C.white, border: `1px solid ${active ? C.green : C.border}`, borderRadius: 20, overflow: 'hidden', boxShadow: active ? `0 0 0 3px rgba(0,179,104,0.2), 0 8px 24px rgba(10,26,51,0.08)` : '0 8px 24px rgba(10,26,51,0.05)', marginBottom: 18, transition: 'box-shadow .2s, border-color .2s', opacity: full ? 0.85 : 1, cursor: 'pointer' }}>
      {/* Cover — carousel + overlay badges */}
      <div style={{ position: 'relative', height: 188 }}>
        <PhotoCarousel photos={v.photos} venueName={v.name} height={188} grayscale={full} />
        {/* Verified badge */}
        {v.verified && (
          <span style={{ position: 'absolute', top: 12, left: 12, zIndex: 6, display: 'inline-flex', alignItems: 'center', gap: 5, background: C.green, color: C.white, borderRadius: 999, padding: '5px 11px', fontSize: 11, fontWeight: 800, letterSpacing: 0.4, boxShadow: '0 4px 12px rgba(0,0,0,0.18)' }}>
            ✓ Verified
          </span>
        )}
        {/* Featured badge (only when not verified) */}
        {v.isFeatured && !v.verified && (
          <span style={{ position: 'absolute', top: 12, left: 12, zIndex: 6, background: C.amber, color: C.navy, borderRadius: 999, padding: '5px 11px', fontSize: 11, fontWeight: 800, letterSpacing: 0.4, textTransform: 'uppercase', boxShadow: '0 4px 12px rgba(0,0,0,0.18)' }}>★ Featured</span>
        )}
        {/* Scope tag */}
        {v.listingScope === 'tournament' && (
          <span style={{ position: 'absolute', top: v.verified || v.isFeatured ? 44 : 12, left: 12, zIndex: 6, background: 'rgba(10,26,51,0.72)', color: C.amber, borderRadius: 999, padding: '4px 10px', fontSize: 10, fontWeight: 700, backdropFilter: 'blur(4px)', letterSpacing: 0.3, textTransform: 'uppercase' }}>
            World Cup screenings
          </span>
        )}
        {v.listingScope === 'event' && (
          <span style={{ position: 'absolute', top: v.verified || v.isFeatured ? 44 : 12, left: 12, zIndex: 6, background: 'rgba(10,26,51,0.72)', color: C.amber, borderRadius: 999, padding: '4px 10px', fontSize: 10, fontWeight: 700, backdropFilter: 'blur(4px)', letterSpacing: 0.3, textTransform: 'uppercase' }}>
            Pop-up
          </span>
        )}
        <span style={{ position: 'absolute', top: 12, right: 12, zIndex: 6, background: 'rgba(10,26,51,0.72)', color: C.white, borderRadius: 999, padding: '5px 12px', fontSize: 12, fontWeight: 600, backdropFilter: 'blur(4px)' }}>{v.area}</span>
        <span style={{ position: 'absolute', bottom: 12, left: 12, zIndex: 6, width: 28, height: 28, borderRadius: 999, background: C.bg, color: C.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, boxShadow: '0 3px 8px rgba(0,0,0,0.2)' }}>{index + 1}</span>
      </div>

      {/* Body */}
      <div style={{ padding: '16px 18px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 25, letterSpacing: 0.4, textTransform: 'uppercase', margin: 0, lineHeight: 1, color: C.navy }}>{v.name}</h3>
        </div>
        <div style={{ fontSize: 13, color: C.textSub, marginTop: 7 }}>
          {capitalise(v.type)}{v.area ? ` · ${v.area}` : ''}{v.priceLevel ? ` · ${v.priceLevel}` : ''}
        </div>

        {/* Availability — hidden until venues can update live */}
        {/* <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 13, borderRadius: 12, padding: '9px 13px', background: m.bg, color: m.color }}>
          <span className={m.pulse ? 'wtw-pulse-slow' : ''} style={{ width: 9, height: 9, borderRadius: 999, flexShrink: 0, background: m.dot }} />
          <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: 0.2 }}>{m.label}</span>
        </div> */}

        {/* Fixture display — controlled by games_policy */}
        {v.gamesPolicy === 'all_games' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 10, background: C.bg, borderRadius: 12, padding: '10px 13px' }}>
            <span className="wtw-pulse-slow" style={{ width: 8, height: 8, borderRadius: 999, background: C.green, flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: C.greenDark }}>Showing all World Cup fixtures</span>
          </div>
        ) : (
          <>
            {v.primaryFixture ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 10, background: v.primaryFixture.confirmed ? C.bg : '#FFFBF0', borderRadius: 12, padding: '10px 13px', border: v.primaryFixture.confirmed ? 'none' : `1px solid rgba(255,178,46,0.3)` }}>
                <span className={v.primaryFixture.confirmed ? 'wtw-pulse-slow' : ''} style={{ width: 8, height: 8, borderRadius: 999, background: v.primaryFixture.confirmed ? C.green : C.amber, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: v.primaryFixture.confirmed ? C.greenDark : '#8A5A00', textTransform: 'uppercase', letterSpacing: 0.4, flexShrink: 0 }}>
                  {v.primaryFixture.confirmed ? 'Showing' : 'Unconfirmed'}
                </span>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600, textAlign: 'right' }}>
                  {v.primaryFixture.homeFlag} {v.primaryFixture.home} v {v.primaryFixture.away} {v.primaryFixture.awayFlag}
                </span>
                <span style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 600, color: C.navy, flexShrink: 0 }}>{v.primaryFixture.kickoff}</span>
              </div>
            ) : null}
            {v.allFixtures.length > 1 && v.allFixtures.slice(1, 3).map(fx => (
              <div key={fx.id} style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 6, background: C.bg, borderRadius: 10, padding: '8px 13px' }}>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: fx.confirmed ? C.green : C.amber, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: C.textSub, flex: 1 }}>
                  {fx.homeFlag} {fx.home} v {fx.away} {fx.awayFlag}
                </span>
                <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.textSub }}>{fx.kickoff}</span>
              </div>
            ))}
          </>
        )}

        {/* Energy tag */}
        {energyTag && (
          <span style={{ display: 'inline-block', marginTop: 9, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', borderRadius: 999, padding: '4px 10px', background: energyTag === 'Lively' ? 'rgba(255,178,46,0.2)' : '#DDF4E8', color: energyTag === 'Lively' ? '#7A4A00' : '#0A6B45' }}>
            {energyTag}
          </span>
        )}

        {/* Tier badges — shown when a specific match is selected */}
        {v.tier === 1 && v.tierNation && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, borderRadius: 999, padding: '5px 11px', fontSize: 12, fontWeight: 700, background: 'rgba(0,179,104,0.12)', color: C.greenDark }}>
            {flagFor(v.tierNation)} {v.tierNation} fans here
          </span>
        )}
        {v.tier === 3 && matchIsLate && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, borderRadius: 999, padding: '5px 11px', fontSize: 12, fontWeight: 700, background: 'rgba(255,178,46,0.12)', color: '#7A4A00' }}>
            🌙 Open late
          </span>
        )}

        {/* See full listing */}
        <Link
          href={`/venues/${v.id}`}
          onClick={e => e.stopPropagation()}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 14, background: C.navy, color: C.white, borderRadius: 12, padding: '12px 16px', textDecoration: 'none', fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, letterSpacing: 0.2 }}
        >
          See full listing
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

  const [activeMatch, setActiveMatch] = useState('all');
  const [locQuery, setLocQuery] = useState('');
  const [locOpen, setLocOpen] = useState(false);
  const [whenLabel, setWhenLabel] = useState('Tonight');
  const [whenOpen, setWhenOpen] = useState(false);
  const [sortBy, setSortBy] = useState('recommended');
  const [filters, setFilters] = useState<Record<string, boolean>>({});
  const [draftFilters, setDraftFilters] = useState<Record<string, boolean>>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [spaceOnly, setSpaceOnly] = useState(false);
  const [activeVenue, setActiveVenue] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  const [vw, setVw] = useState(1400);

  const resultsRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const railPaused = useRef(false);
  const dragState = useRef<{ x: number; sl: number } | null>(null);

  // ── Fetch from Supabase ──
  useEffect(() => {
    async function load() {
      const now = new Date().toISOString();
      const [venueRes, fixtureRes, photosRes] = await Promise.all([
        supabase
          .from('venues')
          .select('*, venue_fixtures(confirmed, games_policy, fixtures(id, home_team, away_team, kickoff_at, status))')
          .eq('status', 'active')
          .or(`active_until.is.null,active_until.gte.${now}`)
          .order('is_featured', { ascending: false }),
        supabase
          .from('fixtures')
          .select('id, home_team, away_team, kickoff_at, status')
          .gte('kickoff_at', now)
          .order('kickoff_at', { ascending: true })
          .limit(48),
        supabase
          .from('venue_photos')
          .select('venue_id, photo_url, display_order')
          .order('display_order', { ascending: true }),
      ]);
      if (venueRes.data) {
        // Merge photos into venue rows — works whether or not venue_photos table exists yet
        const photosByVenue = new Map<string, Array<{ photo_url: string; display_order: number }>>();
        (photosRes.data ?? []).forEach((p: { venue_id: string; photo_url: string; display_order: number }) => {
          if (!photosByVenue.has(p.venue_id)) photosByVenue.set(p.venue_id, []);
          photosByVenue.get(p.venue_id)!.push({ photo_url: p.photo_url, display_order: p.display_order });
        });
        const merged = venueRes.data.map(v => ({ ...v, venue_photos: photosByVenue.get(v.id) ?? [] }));
        setRawVenues(merged as RawDbVenue[]);
      }
      if (fixtureRes.data) setDbFixtures(fixtureRes.data);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const el = railRef.current;
      if (!el || railPaused.current) return;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 1) el.scrollLeft = 0;
      else el.scrollLeft += 0.4;
    }, 28);
    return () => clearInterval(id);
  }, []);

  const narrow = vw < 768;

  // ── Derived data ──
  const venues = useMemo(
    () => rawVenues.map(r => mapDbVenue(r, activeMatch)),
    [rawVenues, activeMatch],
  );

  const areaOptions = useMemo(() => {
    const seen: Record<string, true> = {};
    rawVenues.forEach(v => { if (v.area) seen[v.area] = true; });
    return Object.keys(seen).sort();
  }, [rawVenues]);

  const matchOptions = useMemo(() => {
    const seen: Record<string, true> = {};
    const opts: Array<{ value: string; label: string }> = [{ value: 'all', label: 'Any fixture' }];
    dbFixtures.forEach(fx => {
      if (!seen[fx.id]) {
        seen[fx.id] = true;
        opts.push({ value: fx.id, label: `${flagFor(fx.home_team)} ${fx.home_team} v ${fx.away_team} ${flagFor(fx.away_team)}` });
      }
    });
    return opts;
  }, [dbFixtures]);

  // ── Filter + sort ──
  const loc = locQuery.trim().toLowerCase();
  const selectedDbFixture = activeMatch !== 'all' ? (dbFixtures.find(f => f.id === activeMatch) ?? null) : null;

  // Three-tier venue resolution: when a match is selected, assign each venue a tier
  // Tier 1 = nation affinity (crowd_team matches), Tier 2 = all_games policy, Tier 3 = any open venue
  const tieredVenues: Venue[] = activeMatch === 'all' || !selectedDbFixture
    ? venues
    : venues.map(v => {
        const { tier, nation } = getVenueTier(v, selectedDbFixture);
        return { ...v, tier: tier ?? undefined, tierNation: nation };
      });

  let list = tieredVenues.filter(v =>
    (activeMatch === 'all' || v.tier !== undefined) &&
    (!loc || v.area.toLowerCase().includes(loc) || v.name.toLowerCase().includes(loc)) &&
    (!spaceOnly && !filters.space || v.space === 'now') &&
    matchesFilters(v, filters),
  );

  if (sortBy === 'space') list = [...list].sort((a, b) => SPACE_META[a.space].rank - SPACE_META[b.space].rank);
  else if (sortBy === 'kickoff') list = [...list].sort((a, b) => (a.primaryFixture?.koRank ?? 9999) - (b.primaryFixture?.koRank ?? 9999));
  else list = [...list].sort((a, b) => {
    if (activeMatch !== 'all') {
      const ta = a.tier ?? 4, tb = b.tier ?? 4;
      if (ta !== tb) return ta - tb;
    }
    return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
  });

  // ── Late-night treatment ──
  const isLateMatch = selectedDbFixture ? isLateKickoff(selectedDbFixture.kickoff_at) : false;
  const isOvernightMatch = selectedDbFixture ? isOvernight(selectedDbFixture.kickoff_at) : false;
  const displayList = list;
  const watchAtHome = isOvernightMatch && displayList.length === 0;
  const selectedKickoff = selectedDbFixture ? kickoffInfo(selectedDbFixture.kickoff_at).display : '';

  const pins: VenuePin[] = displayList
    .filter(v => v.lat && v.lng)
    .map(v => ({ id: v.id, name: v.name, type: v.type, priceLevel: v.priceLevel, space: v.space, kickoff: v.primaryFixture?.kickoff ?? '', coords: [v.lat, v.lng], active: activeVenue === v.id }));

  const handlePinClick = useCallback((id: string) => {
    setActiveVenue(id);
    setMobileView('list');
    setTimeout(() => {
      const el = document.getElementById(`venue-${id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('wtw-highlight');
        setTimeout(() => el.classList.remove('wtw-highlight'), 650);
      }
    }, 50);
  }, []);

  const filterCount = Object.values(filters).filter(Boolean).length + (spaceOnly ? 1 : 0);

  const toggleDraft = (key: string) => setDraftFilters(f => { const n = { ...f }; if (n[key]) delete n[key]; else n[key] = true; return n; });
  const toggleFilter = (key: string) => setFilters(f => { const n = { ...f }; if (n[key]) delete n[key]; else n[key] = true; return n; });

  const scrollToResults = useCallback(() => {
    const el = resultsRef.current;
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 72, behavior: 'smooth' });
  }, []);

  const draftCount = venues.filter(v => matchesFilters(v, draftFilters)).length;

  const venueListContent = loading ? (
    <div style={{ textAlign: 'center', padding: '56px 24px', color: C.textMuted }}>
      <div style={{ fontSize: 32, marginBottom: 16 }}>⚽</div>
      <div style={{ fontSize: 16, fontWeight: 600 }}>Loading venues…</div>
    </div>
  ) : watchAtHome ? (
    <WatchAtHomeCard fixture={selectedDbFixture!} kickoff={selectedKickoff} onBrowse={() => setActiveMatch('all')} />
  ) : displayList.length === 0 ? (
    isLateMatch ? (
      <div style={{ textAlign: 'center', padding: '56px 24px', color: C.textMuted }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🌙</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.navy, marginBottom: 8 }}>No venues confirmed open for this late kickoff yet</div>
        <div style={{ fontSize: 14, lineHeight: 1.5 }}>Check back closer to the match, or browse venues open late.</div>
        <button onClick={() => { setActiveMatch('all'); toggleFilter('late'); }} style={{ marginTop: 20, background: C.navy, color: C.white, border: 'none', borderRadius: 12, padding: '12px 24px', fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          See late-night venues
        </button>
      </div>
    ) : (
      <div style={{ textAlign: 'center', padding: '56px 24px', color: C.textMuted }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.navy, marginBottom: 8 }}>No venues match</div>
        <div style={{ fontSize: 14 }}>Try clearing some filters or searching a different area.</div>
        <button onClick={() => { setFilters({}); setSpaceOnly(false); setActiveMatch('all'); setLocQuery(''); }} style={{ marginTop: 20, background: C.green, color: C.white, border: 'none', borderRadius: 12, padding: '12px 24px', fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          Clear all filters
        </button>
      </div>
    )
  ) : (
    <>
      {isLateMatch && <LateNightBanner kickoff={selectedKickoff} count={displayList.length} />}
      {displayList.map((v, i) => (
        <VenueCard key={v.id} venue={v} index={i} active={activeVenue === v.id}
          onActivate={() => setActiveVenue(id => id === v.id ? null : v.id)}
          matchIsLate={isLateMatch} />
      ))}
    </>
  );

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: FONT_BODY, color: C.navy, WebkitFontSmoothing: 'antialiased' }}>

      {/* ── Nav ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(246,247,244,0.88)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '13px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 13, height: 13, borderRadius: 999, background: C.green, boxShadow: '0 0 0 4px rgba(0,179,104,0.18)' }} />
            <span style={{ fontFamily: FONT_DISPLAY, fontSize: 22, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              Where We <span style={{ color: C.green }}>Watch</span>
            </span>
          </div>
          <div style={{ flex: 1 }} />
          <a href="/list-venue" style={{ textDecoration: 'none', background: C.navy, color: C.white, borderRadius: 999, padding: '10px 18px', fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, letterSpacing: 0.2 }}>
            List your venue
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ position: 'relative', overflow: 'hidden', background: `linear-gradient(160deg, ${C.navy} 0%, ${C.navyMid} 100%)` }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <svg viewBox="0 0 1400 600" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <line x1="700" y1="-40" x2="700" y2="640" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
            <circle cx="700" cy="300" r="130" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
            <circle cx="700" cy="300" r="5" fill="rgba(255,255,255,0.07)" />
          </svg>
        </div>
        <div style={{ position: 'absolute', top: -130, left: -90, width: 400, height: 400, borderRadius: 999, background: 'radial-gradient(circle, rgba(0,179,104,0.30), transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -150, right: -90, width: 440, height: 440, borderRadius: 999, background: 'radial-gradient(circle, rgba(255,178,46,0.20), transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: 1400, margin: '0 auto', padding: '40px 24px 28px', color: C.white }}>
          {(stg => stg && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, fontFamily: FONT_MONO, fontSize: 12, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', color: C.amber }}>
              {stg.isLive && <span className="wtw-pulse" style={{ width: 9, height: 9, borderRadius: 999, background: C.red, boxShadow: '0 0 0 4px rgba(229,72,77,0.22)' }} />}
              WORLD CUP · {stg.label}{stg.isLive ? ' LIVE' : ''} · {stg.display}
            </div>
          ))(getTournamentStage())}
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 'clamp(36px, 5.2vw, 62px)', lineHeight: 1.02, letterSpacing: 0.3, textTransform: 'uppercase', margin: '16px 0 0', maxWidth: '20ch' }}>
            Where we watch the <span style={{ color: C.green }}>World Cup</span>
          </h1>
          <p style={{ fontSize: 17, color: C.textBlue, margin: '16px 0 0', maxWidth: '54ch', lineHeight: 1.5 }}>
            Last minute? Find a venue showing World Cup games in seconds.
          </p>

          {/* Search bar */}
          <div style={{ marginTop: 24, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'stretch', maxWidth: 1040 }}>
            {/* Where */}
            <div style={{ flex: '1.3', minWidth: 220, position: 'relative' }}>
              <button onClick={() => { setLocOpen(o => !o); setWhenOpen(false); }} style={{ width: '100%', height: '100%', textAlign: 'left', background: C.white, border: '1px solid #E7E9E4', borderRadius: 14, padding: '11px 16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 5, boxShadow: '0 18px 44px rgba(0,0,0,0.28)' }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.7, color: C.textMuted, textTransform: 'uppercase' }}>Where</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <PinIcon />
                  <span style={{ fontSize: 16, fontWeight: 700, color: C.navy, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{locQuery.trim() || 'Search area'}</span>
                </span>
              </button>
              {locOpen && (
                <>
                  <div onClick={() => setLocOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                  <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 41, background: C.white, border: '1px solid #E7E9E4', borderRadius: 16, boxShadow: '0 24px 60px rgba(0,0,0,0.24)', padding: 8 }}>
                    <input autoFocus value={locQuery} onChange={e => setLocQuery(e.target.value)} placeholder="Type an area or postcode"
                      style={{ width: '100%', boxSizing: 'border-box', border: '1.5px solid #E7E9E4', borderRadius: 11, padding: '10px 12px', fontFamily: FONT_BODY, fontSize: 14, color: C.navy, outline: 'none', marginBottom: 6 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 176, overflowY: 'auto' }}>
                      {areaOptions.filter(a => !locQuery.trim() || a.toLowerCase().includes(locQuery.toLowerCase())).map(a => (
                        <button key={a} onClick={() => { setLocQuery(a); setLocOpen(false); }}
                          style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 9, background: C.white, border: 'none', borderRadius: 9, padding: '9px 11px', cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: C.navy }}>
                          <PinIcon color="#C7CCD3" />{a}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* When */}
            <div style={{ flex: 1, minWidth: 160, position: 'relative' }}>
              <button onClick={() => { setWhenOpen(o => !o); setLocOpen(false); }} style={{ width: '100%', height: '100%', textAlign: 'left', background: C.white, border: '1px solid #E7E9E4', borderRadius: 14, padding: '11px 16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 5, boxShadow: '0 18px 44px rgba(0,0,0,0.28)' }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.7, color: C.textMuted, textTransform: 'uppercase' }}>When</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <CalIcon />
                  <span style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>{whenLabel}</span>
                </span>
              </button>
              {whenOpen && (
                <>
                  <div onClick={() => setWhenOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                  <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 41, width: 280, background: C.white, border: '1px solid #E7E9E4', borderRadius: 16, boxShadow: '0 24px 60px rgba(0,0,0,0.24)', padding: 14 }}>
                    <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                      {['Tonight', 'Tomorrow', 'This weekend'].map(d => (
                        <button key={d} onClick={() => { setWhenLabel(d); setWhenOpen(false); }}
                          style={{ borderRadius: 999, padding: '7px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT_BODY, border: `1.5px solid ${whenLabel === d ? C.green : C.borderHeavy}`, background: whenLabel === d ? '#DDF4E8' : C.white, color: whenLabel === d ? C.greenDark : C.navy }}>
                          {d}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setWhenOpen(false)} style={{ width: '100%', marginTop: 14, background: C.green, color: C.white, border: 'none', borderRadius: 12, padding: 12, fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Done</button>
                  </div>
                </>
              )}
            </div>

            {/* Match */}
            <div style={{ flex: '1.5', minWidth: 200, background: C.white, border: '1px solid #E7E9E4', borderRadius: 14, padding: '11px 16px', display: 'flex', flexDirection: 'column', gap: 5, boxShadow: '0 18px 44px rgba(0,0,0,0.28)' }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.7, color: C.textMuted, textTransform: 'uppercase' }}>Match</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <BallIcon />
                <select value={activeMatch} onChange={e => setActiveMatch(e.target.value)} style={{ border: 'none', outline: 'none', fontFamily: FONT_BODY, fontSize: 15, fontWeight: 700, color: C.navy, background: 'transparent', cursor: 'pointer', width: '100%', appearance: 'none', WebkitAppearance: 'none' }}>
                  {matchOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </span>
            </div>

            {/* Find */}
            <button onClick={scrollToResults} style={{ background: C.green, color: C.white, border: 'none', borderRadius: 14, padding: '0 26px', minHeight: 62, fontFamily: FONT_BODY, fontSize: 15, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.2, display: 'flex', alignItems: 'center', gap: 9, boxShadow: '0 18px 44px rgba(0,0,0,0.28)', whiteSpace: 'nowrap' }}>
              <SearchIcon />Find screens
            </button>
          </div>
        </div>

        {/* ── Fixtures rail ── */}
        <div style={{ position: 'relative', maxWidth: 1400, margin: '0 auto', padding: '2px 24px 36px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 11 }}>
            <span style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: '#7CF0BE' }}>Kicking off (UK time)</span>
            <span style={{ fontSize: 12, color: '#7C8AA0' }}>Tap a game to filter venues</span>
          </div>
          <div
            ref={railRef} className="wtw-rail"
            style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, scrollSnapType: 'x mandatory', cursor: 'grab' }}
            onMouseEnter={() => { railPaused.current = true; }}
            onMouseLeave={() => { railPaused.current = false; }}
            onPointerDown={e => { railPaused.current = true; if (railRef.current) { dragState.current = { x: e.clientX, sl: railRef.current.scrollLeft }; railRef.current.style.cursor = 'grabbing'; } }}
            onPointerMove={e => { if (dragState.current && railRef.current) railRef.current.scrollLeft = dragState.current.sl - (e.clientX - dragState.current.x); }}
            onPointerUp={() => { dragState.current = null; railPaused.current = false; if (railRef.current) railRef.current.style.cursor = 'grab'; }}
          >
            {dbFixtures.map(fx => {
              const { display, late } = kickoffInfo(fx.kickoff_at);
              const sel = activeMatch === fx.id;
              const day = dayLabel(fx.kickoff_at);
              return (
                <button key={fx.id} onClick={() => { setActiveMatch(fx.id); scrollToResults(); }}
                  style={{ minWidth: 232, flexShrink: 0, scrollSnapAlign: 'start', textAlign: 'left', background: sel ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)', border: `1px solid ${sel ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.12)'}`, borderRadius: 15, padding: '13px 15px', color: C.white, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 9, fontFamily: FONT_BODY, transition: 'all .15s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 20 }}>
                    <span>{flagFor(fx.home_team)}</span>
                    <span style={{ fontSize: 11, color: '#7C8AA0', fontWeight: 600 }}>v</span>
                    <span>{flagFor(fx.away_team)}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>{fx.home_team} v {fx.away_team}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 14, fontWeight: 600, color: C.amber }}>{day} {display}</span>
                    {late && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', borderRadius: 999, padding: '3px 8px', background: 'rgba(255,178,46,0.2)', color: '#FFD27A' }}>Late</span>}
                  </div>
                </button>
              );
            })}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                Loading fixtures…
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Filter bar ── */}
      <section style={{ maxWidth: 1400, margin: '0 auto', padding: narrow ? '14px 16px 8px' : '20px 24px 8px' }}>
        {narrow ? (
          /* ── Mobile: quick-filter pills + list/map toggle ── */
          <>
            <div className="wtw-filter-pills" style={{ marginBottom: 12 }}>
              {MOBILE_FILTERS.map(f => {
                const active = !!filters[f.key];
                return (
                  <button key={f.key} onClick={() => toggleFilter(f.key)} style={{ flexShrink: 0, borderRadius: 999, padding: '8px 16px', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', fontFamily: FONT_BODY, cursor: 'pointer', border: `1.5px solid ${active ? C.green : C.borderHeavy}`, background: active ? '#DDF4E8' : C.white, color: active ? C.greenDark : C.navy, transition: 'all .15s' }}>
                    {f.label}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8, background: C.navy, borderRadius: 10, padding: '8px 12px' }}>
                <select value={activeMatch} onChange={e => setActiveMatch(e.target.value)} style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: C.amber, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', minWidth: 0, width: '100%' }}>
                  {matchOptions.map(o => <option key={o.value} value={o.value} style={{ color: C.navy }}>{o.label}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexShrink: 0, borderRadius: 10, overflow: 'hidden', border: `1.5px solid ${C.borderHeavy}` }}>
                <button onClick={() => setMobileView('list')} style={{ padding: '8px 15px', fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', background: mobileView === 'list' ? C.navy : C.white, color: mobileView === 'list' ? C.white : C.navy, transition: 'all .15s' }}>List</button>
                <button onClick={() => setMobileView('map')} style={{ padding: '8px 15px', fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', borderLeft: `1px solid ${C.borderHeavy}`, background: mobileView === 'map' ? C.navy : C.white, color: mobileView === 'map' ? C.white : C.navy, transition: 'all .15s' }}>Map</button>
              </div>
            </div>
          </>
        ) : (
          /* ── Desktop: existing filter bar ── */
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: C.navy, color: C.white, borderRadius: 12, padding: '9px 14px' }}>
              <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 600 }}>Showing</span>
              <select value={activeMatch} onChange={e => setActiveMatch(e.target.value)} style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: C.amber, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }}>
                {matchOptions.map(o => <option key={o.value} value={o.value} style={{ color: C.navy }}>{o.label}</option>)}
              </select>
            </div>
            <span style={{ fontSize: 14, color: C.textSub }}>
              {loading ? 'Loading…' : watchAtHome
                ? <span style={{ color: C.amber }}>🌙 closed this late</span>
                : isOvernightMatch
                  ? <><strong style={{ color: C.navy }}>{displayList.length}</strong> open late 🌙</>
                  : <><strong style={{ color: C.navy }}>{displayList.length}</strong> venues</>}
            </span>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 13px' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Sort</span>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: C.navy, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <button onClick={() => { setDraftFilters({ ...filters }); setFiltersOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: 8, background: filterCount > 0 ? '#DDF4E8' : C.white, border: `1.5px solid ${filterCount > 0 ? C.green : C.borderHeavy}`, borderRadius: 12, padding: '9px 15px', fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: filterCount > 0 ? C.greenDark : C.navy, cursor: 'pointer' }}>
              <FilterIcon />Filters{filterCount > 0 ? ` (${filterCount})` : ''}
            </button>
          </div>
        )}
      </section>

      {/* ── Results ── */}
      <section ref={resultsRef} style={{ maxWidth: 1400, margin: '0 auto', padding: narrow ? '8px 16px 40px' : '8px 24px 56px' }}>
        {narrow ? (
          /* ── Mobile: list OR map (toggled) ── */
          mobileView === 'map' ? (
            <div style={{ height: '60vh', borderRadius: 16, overflow: 'hidden' }}>
              <MapView pins={pins} onPinClick={handlePinClick} />
            </div>
          ) : venueListContent
        ) : (
          /* ── Desktop: side-by-side ── */
          <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>{venueListContent}</div>
            <div style={{ width: '40%', maxWidth: 520, position: 'sticky', top: 88, height: 'calc(100vh - 110px)' }}>
              <MapView pins={pins} onPinClick={handlePinClick} />
            </div>
          </div>
        )}
      </section>

      {/* ── Venue CTA ── */}
      <section style={{ background: C.navy, color: C.white, marginTop: 10 }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '50px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap' }}>
          <div style={{ maxWidth: '30ch' }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: C.amber }}>For venues</div>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 'clamp(34px,4.4vw,52px)', letterSpacing: 0.5, textTransform: 'uppercase', margin: '10px 0 0', lineHeight: 0.98 }}>List your venue on matchday</h2>
            <p style={{ fontSize: 16, color: '#9AABC2', margin: '20px 0 0', lineHeight: 1.5 }}>Pack out your pub this World Cup. Get found by thousands of fans searching for somewhere to watch tonight.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a href="/list-venue" style={{ textDecoration: 'none', background: C.green, color: C.white, borderRadius: 12, padding: '15px 26px', fontFamily: FONT_BODY, fontSize: 15, fontWeight: 700, display: 'inline-block' }}>List your venue for free</a>
            <button style={{ background: 'transparent', color: C.white, border: '1.5px solid rgba(255,255,255,0.25)', borderRadius: 12, padding: '15px 26px', fontFamily: FONT_BODY, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>How it works</button>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: FONT_DISPLAY, fontSize: 16, letterSpacing: 0.5, textTransform: 'uppercase' }}>Where We <span style={{ color: C.green }}>Watch</span></span>
            <span style={{ fontSize: 13, color: '#7C8AA0' }}>London · 2026 World Cup · Map data © OpenStreetMap, © CARTO</span>
          </div>
        </div>
      </section>

      {/* ── Filters modal ── */}
      {filtersOpen && (
        <div onClick={() => setFiltersOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(10,26,51,0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: C.white, width: '100%', maxWidth: 520, maxHeight: '86vh', display: 'flex', flexDirection: 'column', borderRadius: 20, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.35)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #EEF0ED' }}>
              <button onClick={() => setFiltersOpen(false)} style={{ width: 32, height: 32, borderRadius: 999, background: C.bg, border: 'none', fontSize: 16, color: C.textSub, cursor: 'pointer' }}>✕</button>
              <span style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>Filters</span>
              <span style={{ width: 32 }} />
            </div>
            <div style={{ padding: '8px 20px 20px', overflowY: 'auto', flex: 1 }}>
              {FILTER_GROUPS.map(g => (
                <div key={g.title} style={{ padding: '16px 0', borderBottom: '1px solid #F0F1EE' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 12 }}>{g.title}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
                    {g.keys.map(k => {
                      const sel = !!draftFilters[k];
                      return (
                        <button key={k} onClick={() => toggleDraft(k)} style={{ borderRadius: 999, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT_BODY, border: `1.5px solid ${sel ? C.green : C.borderHeavy}`, background: sel ? '#DDF4E8' : C.white, color: sel ? C.greenDark : C.navy }}>
                          {FILTER_LABELS[k]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 20px', borderTop: '1px solid #EEF0ED' }}>
              <button onClick={() => setDraftFilters({})} style={{ background: 'transparent', border: 'none', fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: C.navy, textDecoration: 'underline', cursor: 'pointer' }}>Clear all</button>
              <button onClick={() => { setFilters({ ...draftFilters }); setFiltersOpen(false); }} style={{ background: C.green, color: C.white, border: 'none', borderRadius: 12, padding: '13px 24px', fontFamily: FONT_BODY, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                Show {draftCount} venues
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
