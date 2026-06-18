'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { VenuePin } from './components/MapView';

const MapView = dynamic(() => import('./components/MapView'), { ssr: false });

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  navy: '#0A1A33',
  navyMid: '#12294D',
  green: '#00B368',
  greenDark: '#0A6B45',
  amber: '#FFB22E',
  red: '#E5484D',
  bg: '#F6F7F4',
  white: '#fff',
  textMuted: '#9AA3B0',
  textSub: '#5B6577',
  textBlue: '#AEBED4',
  border: 'rgba(10,26,51,0.08)',
  borderMed: 'rgba(10,26,51,0.12)',
  borderHeavy: 'rgba(10,26,51,0.16)',
};

const FONT_MONO = "'IBM Plex Mono', monospace";
const FONT_DISPLAY = "'Anton', sans-serif";
const FONT_BODY = "'Inter', system-ui, sans-serif";

// ─── Data ──────────────────────────────────────────────────────────────────────
const FIXTURES = [
  { id: 'fra-sen', home: '🇫🇷', away: '🇸🇳', title: 'France v Senegal',    when: 'Tonight', time: '20:00', late: false, isLive: true,  liveScore: '1–0', liveMin: "23'" },
  { id: 'irq-nor', home: '🇮🇶', away: '🇳🇴', title: 'Iraq v Norway',       when: 'Tonight', time: '23:00', late: true,  isLive: false, liveScore: '',    liveMin: '' },
  { id: 'arg-alg', home: '🇦🇷', away: '🇩🇿', title: 'Argentina v Algeria', when: 'Tonight', time: '02:00', late: true,  isLive: false, liveScore: '',    liveMin: '' },
  { id: 'eng-cro', home: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', away: '🇭🇷', title: 'England v Croatia',  when: 'Wed',     time: '21:00', late: false, isLive: false, liveScore: '',    liveMin: '' },
  { id: 'eng-gha', home: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', away: '🇬🇭', title: 'England v Ghana',   when: 'Tue',     time: '21:00', late: false, isLive: false, liveScore: '',    liveMin: '' },
];

const MATCH_OPTIONS = [
  { value: 'all',     label: 'Any fixture — or search a game' },
  { value: 'fra-sen', label: 'France v Senegal' },
  { value: 'irq-nor', label: 'Iraq v Norway' },
  { value: 'arg-alg', label: 'Argentina v Algeria' },
  { value: 'eng-cro', label: 'England v Croatia' },
  { value: 'eng-gha', label: 'England v Ghana' },
];

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'space',       label: 'Most space' },
  { value: 'rating',      label: 'Top rated' },
  { value: 'closest',     label: 'Closest' },
  { value: 'kickoff',     label: 'Kickoff soonest' },
];

const AREA_OPTIONS = ['Shoreditch','Soho','Peckham','Camden','Clapham','Dalston'];

const FILTER_GROUPS = [
  { title: 'Screens & space', keys: ['outdoor','bigscreen','space'] },
  { title: 'Good for',        keys: ['family','walkins','kitchen'] },
  { title: 'Booking & hours', keys: ['book','late'] },
];
const FILTER_LABELS: Record<string,string> = {
  space: 'Space now', outdoor: 'Outdoor screen', bigscreen: 'Big screen',
  family: 'Family friendly', walkins: 'Walk-ins', kitchen: 'Full kitchen',
  book: 'Book a table', late: 'Open late',
};

type Space = 'now' | 'filling' | 'full';
const SPACE_META: Record<Space, { label: string; color: string; bg: string; dot: string; pulse: boolean; rank: number }> = {
  now:     { label: 'Space now',    color: '#0A6B45', bg: '#DDF4E8', dot: '#00B368', pulse: true,  rank: 0 },
  filling: { label: 'Filling up',   color: '#8A5A00', bg: '#FFF0D1', dot: '#E0922A', pulse: false, rank: 1 },
  full:    { label: 'Full tonight', color: '#9A2A2A', bg: '#FBE3E0', dot: '#E5484D', pulse: false, rank: 2 },
};

interface Crowd { flag: string; name: string; code: string; pct: number }
interface Venue {
  id: string; name: string; type: string; neigh: string; walk: string;
  matchKey: string; matchLabel: string; kickoff: string; koRank: number;
  features: string[]; featureKeys: string[];
  space: Space; updatedMin: number;
  bookMethod: 'website' | 'phone' | 'walkins' | 'email';
  website?: string; phone?: string; email?: string;
  rating: string; reviews: string; featured: boolean; hue: number;
  crowd: { home: Crowd; away: Crowd };
  coords: [number, number];
}

const VENUES: Venue[] = [
  {
    id: 'penalty-spot', name: 'The Penalty Spot', type: 'Sports bar', neigh: 'Shoreditch',
    walk: '4 min walk', matchKey: 'eng-cro', matchLabel: 'England v Croatia', kickoff: '9:00pm', koRank: 21*60,
    features: ['Outdoor screen','Open late','Big screen','Full kitchen'],
    featureKeys: ['outdoor','late','bigscreen','kitchen'],
    space: 'now', updatedMin: 3, bookMethod: 'website', website: 'thepenaltyspot.co.uk',
    phone: '020 7946 0101', email: 'hello@thepenaltyspot.co.uk',
    rating: '4.6', reviews: '1,243', featured: true, hue: 210,
    crowd: { home: { flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', name: 'England', code: 'ENG', pct: 74 }, away: { flag: '🇭🇷', name: 'Croatia', code: 'CRO', pct: 26 } },
    coords: [51.5266, -0.0780],
  },
  {
    id: 'estadio-peckham', name: 'Estádio Peckham', type: 'Café-bar', neigh: 'Peckham',
    walk: '8 min walk', matchKey: 'arg-alg', matchLabel: 'Argentina v Algeria', kickoff: '11:00pm', koRank: 23*60,
    features: ['Outdoor screen','Walk-ins','Open late'],
    featureKeys: ['outdoor','walkins','late'],
    space: 'now', updatedMin: 5, bookMethod: 'walkins',
    phone: '020 7639 0202', email: 'hola@estadiopeckham.co.uk',
    rating: '4.8', reviews: '2,104', featured: true, hue: 24,
    crowd: { home: { flag: '🇦🇷', name: 'Argentina', code: 'ARG', pct: 81 }, away: { flag: '🇩🇿', name: 'Algeria', code: 'ALG', pct: 19 } },
    coords: [51.4740, -0.0690],
  },
  {
    id: 'halfway-line', name: 'The Halfway Line', type: 'Pub', neigh: 'Clapham',
    walk: '5 min walk', matchKey: 'eng-cro', matchLabel: 'England v Croatia', kickoff: '9:00pm', koRank: 21*60,
    features: ['Big screen','Book a table','Open late'],
    featureKeys: ['bigscreen','book','late'],
    space: 'filling', updatedMin: 4, bookMethod: 'website', website: 'halfwaylineclapham.co.uk',
    phone: '020 7622 0303', email: 'tables@halfwayline.co.uk',
    rating: '4.4', reviews: '876', featured: false, hue: 190,
    crowd: { home: { flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', name: 'England', code: 'ENG', pct: 88 }, away: { flag: '🇭🇷', name: 'Croatia', code: 'CRO', pct: 12 } },
    coords: [51.4625, -0.1380],
  },
  {
    id: 'the-gaffer', name: 'The Gaffer', type: 'Pub', neigh: 'Camden',
    walk: '7 min walk', matchKey: 'fra-sen', matchLabel: 'France v Senegal', kickoff: '8:00pm', koRank: 20*60,
    features: ['Full kitchen','Family friendly','Walk-ins'],
    featureKeys: ['kitchen','family','walkins'],
    space: 'now', updatedMin: 2, bookMethod: 'phone',
    phone: '020 7485 0404', email: 'pour@thegaffer.co.uk',
    rating: '4.5', reviews: '760', featured: false, hue: 150,
    crowd: { home: { flag: '🇫🇷', name: 'France', code: 'FRA', pct: 55 }, away: { flag: '🇸🇳', name: 'Senegal', code: 'SEN', pct: 45 } },
    coords: [51.5390, -0.1426],
  },
  {
    id: 'la-roja', name: 'La Roja Tapas', type: 'Restaurant', neigh: 'Soho',
    walk: '6 min walk', matchKey: 'fra-sen', matchLabel: 'France v Senegal', kickoff: '8:00pm', koRank: 20*60,
    features: ['Big screen','Book a table','Full kitchen'],
    featureKeys: ['bigscreen','book','kitchen'],
    space: 'full', updatedMin: 6, bookMethod: 'email',
    phone: '020 7287 0505', email: 'hola@larojatapas.co.uk',
    rating: '4.7', reviews: '980', featured: false, hue: 0,
    crowd: { home: { flag: '🇫🇷', name: 'France', code: 'FRA', pct: 58 }, away: { flag: '🇸🇳', name: 'Senegal', code: 'SEN', pct: 42 } },
    coords: [51.5137, -0.1340],
  },
  {
    id: 'offside-tap', name: 'Offside Tap Room', type: 'Bar', neigh: 'Dalston',
    walk: '8 min walk', matchKey: 'arg-alg', matchLabel: 'Argentina v Algeria', kickoff: '11:00pm', koRank: 23*60,
    features: ['Outdoor screen','Open late','Walk-ins','Big screen'],
    featureKeys: ['outdoor','late','walkins','bigscreen'],
    space: 'filling', updatedMin: 7, bookMethod: 'walkins',
    phone: '020 7254 0606', email: 'tap@offsidebar.co.uk',
    rating: '4.7', reviews: '1,890', featured: false, hue: 270,
    crowd: { home: { flag: '🇦🇷', name: 'Argentina', code: 'ARG', pct: 63 }, away: { flag: '🇩🇿', name: 'Algeria', code: 'ALG', pct: 37 } },
    coords: [51.5460, -0.0750],
  },
];

function venueStripeGradient(hue: number) {
  return `repeating-linear-gradient(135deg, hsl(${hue},42%,16%), hsl(${hue},42%,16%) 16px, hsl(${hue},38%,22%) 16px, hsl(${hue},38%,22%) 32px)`;
}

// ─── Icons ─────────────────────────────────────────────────────────────────────
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
function ClockIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={C.textMuted} strokeWidth="2"/><path d="M12 7v5l3 2" stroke={C.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

// ─── Venue card ────────────────────────────────────────────────────────────────
interface VenueCardProps {
  venue: Venue; index: number; active: boolean;
  pick: 'home' | 'away' | null;
  onActivate: () => void; onPick: (s: 'home'|'away') => void; onReserve: () => void;
}
function VenueCard({ venue: v, index, active, pick, onActivate, onPick, onReserve }: VenueCardProps) {
  const m = SPACE_META[v.space];
  const full = v.space === 'full';
  const fx = FIXTURES.find(f => f.id === v.matchKey);
  const isLive = fx?.isLive ?? false;
  let homePct = v.crowd.home.pct;
  let awayPct = v.crowd.away.pct;
  if (pick === 'home') { homePct = Math.min(94, homePct + 4); awayPct = 100 - homePct; }
  if (pick === 'away') { awayPct = Math.min(94, awayPct + 4); homePct = 100 - awayPct; }

  const pillBase: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, borderRadius: 999, padding: '5px 11px', fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.2 };

  return (
    <article onClick={onActivate} style={{ background: C.white, border: `1px solid ${active ? C.green : C.border}`, borderRadius: 20, overflow: 'hidden', boxShadow: active ? `0 0 0 3px rgba(0,179,104,0.2), 0 8px 24px rgba(10,26,51,0.08)` : '0 8px 24px rgba(10,26,51,0.05)', marginBottom: 18, transition: 'box-shadow .2s, border-color .2s', opacity: full ? 0.85 : 1, cursor: 'pointer' }}>
      {/* Cover */}
      <div style={{ position: 'relative', height: 188, background: venueStripeGradient(v.hue), filter: full ? 'grayscale(1)' : undefined }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.32)' }}>venue photo</span>
        </div>
        {v.featured && <span style={{ position: 'absolute', top: 12, left: 12, background: C.amber, color: C.navy, borderRadius: 999, padding: '5px 11px', fontSize: 11, fontWeight: 800, letterSpacing: 0.4, textTransform: 'uppercase', boxShadow: '0 4px 12px rgba(0,0,0,0.18)' }}>★ Featured</span>}
        <span style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(10,26,51,0.72)', color: C.white, borderRadius: 999, padding: '5px 12px', fontSize: 12, fontWeight: 600, backdropFilter: 'blur(4px)' }}>{v.neigh}</span>
        <span style={{ position: 'absolute', bottom: 12, left: 12, width: 28, height: 28, borderRadius: 999, background: C.bg, color: C.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, boxShadow: '0 3px 8px rgba(0,0,0,0.2)' }}>{index + 1}</span>
        {isLive && (
          <span style={{ position: 'absolute', bottom: 12, right: 12, display: 'flex', alignItems: 'center', gap: 6, background: C.red, color: C.white, borderRadius: 999, padding: '5px 11px', fontSize: 12, fontWeight: 800, boxShadow: '0 4px 12px rgba(0,0,0,0.25)' }}>
            <span className="wtw-pulse-fast" style={{ width: 7, height: 7, borderRadius: 999, background: C.white, flexShrink: 0 }} />
            {fx?.liveScore} {fx?.liveMin}
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '16px 18px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 25, letterSpacing: 0.4, textTransform: 'uppercase', margin: 0, lineHeight: 1, color: C.navy }}>{v.name}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', background: C.bg, borderRadius: 999, padding: '5px 10px', marginTop: 2, flexShrink: 0 }}>
            <span style={{ color: C.amber, fontSize: 13 }}>★</span>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{v.rating}</span>
            <span style={{ fontSize: 12, color: C.textMuted }}>· {v.reviews}</span>
          </div>
        </div>
        <div style={{ fontSize: 13, color: C.textSub, marginTop: 7 }}>{v.type} · {v.neigh} · {v.walk}</div>

        {/* Availability */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 13, borderRadius: 12, padding: '9px 13px', background: m.bg, color: m.color }}>
          <span className={m.pulse ? 'wtw-pulse-slow' : ''} style={{ width: 9, height: 9, borderRadius: 999, flexShrink: 0, background: m.dot }} />
          <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: 0.2 }}>{m.label}</span>
          <span style={{ flex: 1, textAlign: 'right', fontSize: 11, fontWeight: 600, opacity: 0.72 }}>Updated {v.updatedMin} min ago</span>
        </div>

        {/* Showing */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 10, background: C.bg, borderRadius: 12, padding: '10px 13px' }}>
          <span className="wtw-pulse-slow" style={{ width: 8, height: 8, borderRadius: 999, background: C.green, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: C.greenDark, textTransform: 'uppercase', letterSpacing: 0.4 }}>Showing</span>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 600, textAlign: 'right' }}>{v.matchLabel}</span>
          <span style={{ fontFamily: FONT_MONO, fontSize: 14, fontWeight: 600, color: C.navy }}>{v.kickoff}</span>
        </div>

        {/* Feature tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 13 }}>
          {v.features.map(f => (
            <span key={f} style={{ fontSize: 12, fontWeight: 600, color: '#42506A', background: C.white, border: `1px solid ${C.borderMed}`, borderRadius: 8, padding: '5px 10px' }}>{f}</span>
          ))}
        </div>

        {/* Crowd backing */}
        <div style={{ marginTop: 14, background: C.bg, border: `1px solid rgba(10,26,51,0.07)`, borderRadius: 14, padding: '12px 13px 13px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
            <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: C.navy }}>Crowd backing</span>
            <span style={{ fontSize: 11, color: C.textMuted }}>who&apos;s in tonight</span>
          </div>
          <div style={{ display: 'flex', height: 11, borderRadius: 999, overflow: 'hidden', background: '#E7E9E4' }}>
            <div style={{ width: `${homePct}%`, background: C.green, transition: 'width .3s' }} />
            <div style={{ width: `${awayPct}%`, background: C.navy, transition: 'width .3s' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, fontSize: 12.5 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}><span style={{ fontSize: 15 }}>{v.crowd.home.flag}</span>{v.crowd.home.code} {homePct}%</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: C.textSub }}>{awayPct}% {v.crowd.away.code}<span style={{ fontSize: 15 }}>{v.crowd.away.flag}</span></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 11, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: C.textSub, fontWeight: 600 }}>I&apos;m in for</span>
            <button onClick={e => { e.stopPropagation(); onPick('home'); }} style={{ ...(pick === 'home' ? { background: C.amber, color: C.navy, border: `1.5px solid ${C.amber}` } : { background: C.white, color: C.navy, border: `1.5px solid ${C.borderHeavy}` }), ...pillBase }}>
              <span style={{ fontSize: 14 }}>{v.crowd.home.flag}</span>{v.crowd.home.code}
            </button>
            <button onClick={e => { e.stopPropagation(); onPick('away'); }} style={{ ...(pick === 'away' ? { background: C.amber, color: C.navy, border: `1.5px solid ${C.amber}` } : { background: C.white, color: C.navy, border: `1.5px solid ${C.borderHeavy}` }), ...pillBase }}>
              <span style={{ fontSize: 14 }}>{v.crowd.away.flag}</span>{v.crowd.away.code}
            </button>
            {pick && <span style={{ fontSize: 12, fontWeight: 600, color: C.greenDark }}>You&apos;re backing {pick === 'home' ? v.crowd.home.name : v.crowd.away.name}</span>}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
          <button onClick={e => { e.stopPropagation(); onReserve(); }} style={{ flex: 1, border: 'none', borderRadius: 12, padding: 12, fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, cursor: 'pointer', color: C.white, background: full ? C.navy : C.green }}>
            {full ? 'Join waitlist' : 'Reserve'}
          </button>
          <button style={{ flex: 1, background: C.white, color: C.navy, border: `1.5px solid ${C.borderHeavy}`, borderRadius: 12, padding: 12, fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            Get directions
          </button>
        </div>
      </div>
    </article>
  );
}

// ─── Booking modal ─────────────────────────────────────────────────────────────
interface BookingModalProps {
  venue: Venue; pick: 'home'|'away'|null;
  onPick: (s: 'home'|'away') => void; onClose: () => void;
}
function BookingModal({ venue: v, pick, onPick, onClose }: BookingModalProps) {
  const m = SPACE_META[v.space];
  const full = v.space === 'full';
  const fx = FIXTURES.find(f => f.id === v.matchKey);
  const methodTitle = { website: 'Book online', phone: 'Call to reserve', walkins: 'Walk-ins only', email: 'Email to book' }[v.bookMethod];
  const methodDesc: Record<string, string> = {
    website: `Head to ${v.website ?? 'their website'} to grab a table — takes 2 minutes and you'll get a confirmation.`,
    phone:   `Call ${v.phone ?? 'the venue'} to check availability and reserve. Lines open from midday until kickoff.`,
    walkins: "This venue doesn't take advance bookings — just show up early to bag the best spot.",
    email:   `Email ${v.email ?? 'the venue'} with your name, party size and the match you're coming for.`,
  };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 95, background: 'rgba(10,26,51,0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.white, width: '100%', maxWidth: 440, borderRadius: 20, padding: 22, boxShadow: '0 30px 80px rgba(0,0,0,0.35)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: C.greenDark }}>Reserve your spot</div>
            <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, letterSpacing: 0.4, textTransform: 'uppercase', margin: '6px 0 0', lineHeight: 1, color: C.navy }}>{v.name}</h3>
            <div style={{ fontSize: 13, color: C.textSub, marginTop: 5 }}>{v.matchLabel} · {v.kickoff}</div>
          </div>
          <button onClick={onClose} style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 999, background: C.bg, border: 'none', fontSize: 16, color: C.textSub, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 16, borderRadius: 12, padding: '9px 13px', background: m.bg, color: m.color }}>
          <span className={m.pulse ? 'wtw-pulse-slow' : ''} style={{ width: 9, height: 9, borderRadius: 999, flexShrink: 0, background: m.dot }} />
          <span style={{ fontSize: 13, fontWeight: 800 }}>{m.label}</span>
          <span style={{ flex: 1, textAlign: 'right', fontSize: 11, fontWeight: 600, opacity: 0.72 }}>Updated {v.updatedMin} min ago</span>
        </div>
        {fx && (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: '18px 0 9px' }}>Who are you supporting? <span style={{ color: C.textMuted, fontWeight: 500 }}>(optional)</span></div>
            <div style={{ display: 'flex', gap: 9 }}>
              {(['home','away'] as const).map(side => {
                const team = side === 'home' ? v.crowd.home : v.crowd.away;
                const sel = pick === side;
                return (
                  <button key={side} onClick={() => onPick(side)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: `2px solid ${sel ? C.green : C.borderMed}`, borderRadius: 12, padding: '12px 14px', background: sel ? '#DDF4E8' : C.white, fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, cursor: 'pointer', color: C.navy }}>
                    <span style={{ fontSize: 17 }}>{team.flag}</span>{team.name}
                  </button>
                );
              })}
            </div>
          </>
        )}
        <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: '18px 0 7px' }}>{methodTitle}</div>
        <p style={{ fontSize: 13, color: C.textSub, margin: '0 0 13px', lineHeight: 1.45 }}>{methodDesc[v.bookMethod]}</p>
        <button style={{ width: '100%', background: full ? C.navy : C.green, color: C.white, border: 'none', borderRadius: 13, padding: 14, fontFamily: FONT_BODY, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
          {full ? 'Join the waitlist' : v.bookMethod === 'walkins' ? "Got it — I'll walk in" : methodTitle}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function Page() {
  const [activeMatch, setActiveMatch] = useState('all');
  const [locQuery, setLocQuery] = useState('');
  const [locOpen, setLocOpen] = useState(false);
  const [whenLabel, setWhenLabel] = useState('Tonight');
  const [whenOpen, setWhenOpen] = useState(false);
  const [sortBy, setSortBy] = useState('recommended');
  const [filters, setFilters] = useState<Record<string,boolean>>({});
  const [draftFilters, setDraftFilters] = useState<Record<string,boolean>>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [spaceOnly, setSpaceOnly] = useState(false);
  const [activeVenue, setActiveVenue] = useState<string|null>(null);
  const [bookingId, setBookingId] = useState<string|null>(null);
  const [picks, setPicks] = useState<Record<string,'home'|'away'|null>>({});
  const [vw, setVw] = useState(1400);

  const resultsRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const railPaused = useRef(false);
  const dragState = useRef<{x:number;sl:number}|null>(null);

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

  const narrow = vw < 900;

  const activeFilterKeys = Object.keys(filters).filter(k => filters[k] && k !== 'space');
  const loc = locQuery.trim().toLowerCase();
  let list = VENUES.filter(v =>
    (activeMatch === 'all' || v.matchKey === activeMatch) &&
    (!loc || v.neigh.toLowerCase().includes(loc)) &&
    (!spaceOnly && !filters.space || v.space === 'now') &&
    activeFilterKeys.every(k => v.featureKeys.includes(k))
  );
  if (sortBy === 'space')    list = [...list].sort((a, b) => SPACE_META[a.space].rank - SPACE_META[b.space].rank);
  else if (sortBy === 'rating')  list = [...list].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
  else if (sortBy === 'kickoff') list = [...list].sort((a, b) => a.koRank - b.koRank);
  else list = [...list].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

  const pins: VenuePin[] = list.map(v => ({ id: v.id, name: v.name, space: v.space, kickoff: v.kickoff, coords: v.coords, active: activeVenue === v.id }));
  const filterCount = Object.values(filters).filter(Boolean).length + (spaceOnly ? 1 : 0);

  const toggleDraft = (key: string) => setDraftFilters(f => { const n={...f}; if(n[key]) delete n[key]; else n[key]=true; return n; });

  const scrollToResults = useCallback(() => {
    const el = resultsRef.current;
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 72, behavior: 'smooth' });
  }, []);

  const bookingVenue = bookingId ? VENUES.find(v => v.id === bookingId) ?? null : null;

  // Draft filter result count
  const draftActiveKeys = Object.keys(draftFilters).filter(k => draftFilters[k] && k !== 'space');
  const draftCount = VENUES.filter(v => draftActiveKeys.every(k => v.featureKeys.includes(k))).length;

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: FONT_BODY, color: C.navy, WebkitFontSmoothing: 'antialiased' }}>

      {/* ── Nav ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(246,247,244,0.88)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '13px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 13, height: 13, borderRadius: 999, background: C.green, boxShadow: '0 0 0 4px rgba(0,179,104,0.18)' }} />
            <span style={{ fontFamily: FONT_DISPLAY, fontSize: 22, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              Where To <span style={{ color: C.green }}>Watch</span>
            </span>
          </div>
          <div style={{ flex: 1 }} />
          <a href="/list-your-venue" style={{ textDecoration: 'none', background: C.navy, color: C.white, borderRadius: 999, padding: '10px 18px', fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, letterSpacing: 0.2 }}>
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, fontFamily: FONT_MONO, fontSize: 12, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', color: C.amber }}>
            <span className="wtw-pulse" style={{ width: 9, height: 9, borderRadius: 999, background: C.red, boxShadow: '0 0 0 4px rgba(229,72,77,0.22)' }} />
            World Cup · group stage live · 11 Jun – 19 Jul
          </div>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 'clamp(36px, 5.2vw, 62px)', lineHeight: 1.02, letterSpacing: 0.3, textTransform: 'uppercase', margin: '16px 0 0', maxWidth: '20ch' }}>
            Where to watch the <span style={{ color: C.green }}>World Cup</span>
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
                      {AREA_OPTIONS.filter(a => !locQuery.trim() || a.toLowerCase().includes(locQuery.toLowerCase())).map(a => (
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
                      {['Tonight','Tomorrow','This weekend'].map(d => (
                        <button key={d} onClick={() => { setWhenLabel(d); setWhenOpen(false); }}
                          style={{ borderRadius: 999, padding: '7px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT_BODY, border: `1.5px solid ${whenLabel===d ? C.green : C.borderHeavy}`, background: whenLabel===d ? '#DDF4E8' : C.white, color: whenLabel===d ? C.greenDark : C.navy }}>
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
                  {MATCH_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
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
            onPointerDown={e => { railPaused.current = true; if(railRef.current){ dragState.current={x:e.clientX,sl:railRef.current.scrollLeft}; railRef.current.style.cursor='grabbing'; } }}
            onPointerMove={e => { if(dragState.current && railRef.current) railRef.current.scrollLeft=dragState.current.sl-(e.clientX-dragState.current.x); }}
            onPointerUp={() => { dragState.current=null; railPaused.current=false; if(railRef.current) railRef.current.style.cursor='grab'; }}
          >
            {FIXTURES.map(fx => {
              const sel = activeMatch === fx.id;
              return (
                <button key={fx.id} onClick={() => { setActiveMatch(fx.id); setWhenLabel(fx.when); scrollToResults(); }}
                  style={{ minWidth: 232, flexShrink: 0, scrollSnapAlign: 'start', textAlign: 'left', background: sel ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)', border: `1px solid ${sel ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.12)'}`, borderRadius: 15, padding: '13px 15px', color: C.white, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 9, fontFamily: FONT_BODY, transition: 'all .15s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 20 }}>
                      <span>{fx.home}</span><span style={{ fontSize: 11, color: '#7C8AA0', fontWeight: 600 }}>v</span><span>{fx.away}</span>
                    </div>
                    {fx.isLive && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: C.red, color: C.white, borderRadius: 999, padding: '3px 8px', fontSize: 10, fontWeight: 800, letterSpacing: 0.4 }}>
                        <span className="wtw-pulse-fast" style={{ width: 6, height: 6, borderRadius: 999, background: C.white }} />LIVE
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.2, width: '100%' }}>{fx.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 14, fontWeight: 600, color: C.amber }}>{fx.when} {fx.time}</span>
                    {fx.isLive
                      ? <span style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 600 }}>{fx.liveScore} · {fx.liveMin}</span>
                      : fx.late && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', borderRadius: 999, padding: '3px 8px', background: 'rgba(255,178,46,0.2)', color: '#FFD27A' }}>Late</span>
                    }
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Filter bar ── */}
      <section style={{ maxWidth: 1400, margin: '0 auto', padding: '20px 24px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: C.navy, color: C.white, borderRadius: 12, padding: '9px 14px' }}>
            <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 600 }}>Showing</span>
            <select value={activeMatch} onChange={e => setActiveMatch(e.target.value)} style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: C.amber, cursor: 'pointer' }}>
              {MATCH_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ color: C.navy }}>{o.label}</option>)}
            </select>
          </div>
          <span style={{ fontSize: 14, color: C.textSub }}><strong style={{ color: C.navy }}>{list.length}</strong> venues</span>
          <div style={{ flex: 1 }} />
          <button onClick={() => setSpaceOnly(s => !s)} style={{ display: 'flex', alignItems: 'center', gap: 7, border: `1.5px solid ${spaceOnly ? C.green : C.borderHeavy}`, borderRadius: 12, padding: '8px 14px', background: spaceOnly ? '#DDF4E8' : C.white, color: spaceOnly ? C.greenDark : C.navy, fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            <span className={spaceOnly ? 'wtw-pulse-slow' : ''} style={{ width: 8, height: 8, borderRadius: 999, background: spaceOnly ? C.green : C.textMuted, flexShrink: 0 }} />
            Space now
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.white, border: `1px solid ${C.borderMed}`, borderRadius: 12, padding: '8px 13px' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Sort</span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: C.navy, cursor: 'pointer' }}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <button onClick={() => { setDraftFilters({...filters}); setFiltersOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: 8, background: filterCount>0 ? '#DDF4E8' : C.white, border: `1.5px solid ${filterCount>0 ? C.green : C.borderHeavy}`, borderRadius: 12, padding: '9px 15px', fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: filterCount>0 ? C.greenDark : C.navy, cursor: 'pointer' }}>
            <FilterIcon />Filters{filterCount>0 ? ` (${filterCount})` : ''}
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: C.textMuted, lineHeight: 1.4 }}>
          <ClockIcon />
          <span>Availability is set live by each venue — updated before kickoff and as tables fill. <strong style={{ color: C.greenDark, fontWeight: 700 }}>Space now</strong> means tables free right now.</span>
        </div>
      </section>

      {/* ── Results ── */}
      <section ref={resultsRef} style={{ maxWidth: 1400, margin: '0 auto', padding: '8px 24px 56px' }}>
        <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', flexDirection: narrow ? 'column' : 'row' }}>
          {/* List */}
          <div style={{ flex: 1, minWidth: 0, width: narrow ? '100%' : undefined }}>
            {list.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '56px 24px', color: C.textMuted }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.navy, marginBottom: 8 }}>No venues match</div>
                <div style={{ fontSize: 14 }}>Try clearing some filters or searching a different area.</div>
                <button onClick={() => { setFilters({}); setSpaceOnly(false); setActiveMatch('all'); setLocQuery(''); }} style={{ marginTop: 20, background: C.green, color: C.white, border: 'none', borderRadius: 12, padding: '12px 24px', fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  Clear all filters
                </button>
              </div>
            ) : list.map((v, i) => (
              <VenueCard key={v.id} venue={v} index={i} active={activeVenue===v.id}
                pick={picks[v.id] ?? null}
                onActivate={() => setActiveVenue(id => id===v.id ? null : v.id)}
                onPick={side => setPicks(p => ({...p, [v.id]: p[v.id]===side ? null : side}))}
                onReserve={() => setBookingId(v.id)} />
            ))}
          </div>
          {/* Map */}
          <div style={narrow ? { width: '100%', height: 380 } : { width: '40%', maxWidth: 520, position: 'sticky', top: 88, height: 'calc(100vh - 110px)' }}>
            <MapView pins={pins} onPinClick={id => setActiveVenue(cur => cur===id ? null : id)} />
          </div>
        </div>
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
            <a href="/list-your-venue" style={{ textDecoration: 'none', background: C.green, color: C.white, borderRadius: 12, padding: '15px 26px', fontFamily: FONT_BODY, fontSize: 15, fontWeight: 700, display: 'inline-block' }}>List your venue for free</a>
            <button style={{ background: 'transparent', color: C.white, border: '1.5px solid rgba(255,255,255,0.25)', borderRadius: 12, padding: '15px 26px', fontFamily: FONT_BODY, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>How it works</button>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: FONT_DISPLAY, fontSize: 16, letterSpacing: 0.5, textTransform: 'uppercase' }}>Where To <span style={{ color: C.green }}>Watch</span></span>
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
              <button onClick={() => { setFilters({...draftFilters}); setFiltersOpen(false); }} style={{ background: C.green, color: C.white, border: 'none', borderRadius: 12, padding: '13px 24px', fontFamily: FONT_BODY, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                Show {draftCount} venues
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Booking modal ── */}
      {bookingVenue && (
        <BookingModal venue={bookingVenue} pick={picks[bookingVenue.id] ?? null}
          onPick={side => setPicks(p => ({...p, [bookingVenue.id]: p[bookingVenue.id]===side ? null : side}))}
          onClose={() => setBookingId(null)} />
      )}
    </div>
  );
}
