'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PhotoCarousel from '@/app/components/PhotoCarousel';
import { supabase } from '@/lib/supabase';
import { flagFor } from '@/lib/teamFlags';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  navy: '#0A1A33', navyMid: '#12294D', green: '#00B368', greenDark: '#0A6B45',
  amber: '#FFB22E', red: '#E5484D', bg: '#F6F7F4', white: '#fff',
  textMuted: '#9AA3B0', textSub: '#5B6577',
  border: 'rgba(10,26,51,0.08)', borderMed: 'rgba(10,26,51,0.12)',
};
const FONT_DISPLAY = "'Anton', sans-serif";
const FONT_BODY    = "'DM Sans', sans-serif";
const FONT_MONO    = "'IBM Plex Mono', monospace";

function kickoffDisplay(isoStr: string): string {
  const d = new Date(isoStr);
  const bstH = (d.getUTCHours() + 1) % 24;
  const bstM = d.getUTCMinutes();
  const h12 = bstH % 12 || 12;
  const ampm = bstH < 12 ? 'am' : 'pm';
  const day = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
  return `${day}, ${h12}:${String(bstM).padStart(2, '0')}${ampm}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface VenueFixtureRow {
  confirmed: boolean;
  games_policy?: string;
  fixtures: { id: string; home_team: string; away_team: string; kickoff_at: string; status?: string } | null;
}

interface VenueRow {
  id: string;
  name: string;
  type?: string;
  area?: string;
  phone?: string;
  website?: string;
  booking_url?: string;
  bookable?: string;
  opening_times?: string;
  price_level?: string;
  setup_tags?: string[];
  auto_tags?: string[];
  notes?: string;
  lat?: number;
  lng?: number;
  verified?: boolean;
  is_featured?: boolean;
  claimed?: boolean;
  venue_photos?: Array<{ photo_url: string; display_order: number }>;
  venue_fixtures?: VenueFixtureRow[];
}

// ─── Tag pill ─────────────────────────────────────────────────────────────────
function TagPill({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', fontSize: 12, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase', borderRadius: 999, padding: '6px 13px', background: bg, color }}>
      {label}
    </span>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function VenuePage() {
  const params = useParams();
  const id = params?.id as string;
  const [venue, setVenue] = useState<VenueRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('venues')
      .select('*, venue_photos(photo_url, display_order), venue_fixtures(confirmed, games_policy, fixtures(id, home_team, away_team, kickoff_at, status))')
      .eq('id', id)
      .single()
      .then(({ data }) => { setVenue(data as VenueRow); setLoading(false); });
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_BODY }}>
        <div style={{ textAlign: 'center', color: C.textMuted }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚽</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Loading venue...</div>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_BODY, gap: 16 }}>
        <div style={{ fontSize: 40 }}>🔍</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.navy }}>Venue not found</div>
        <Link href="/" style={{ color: C.greenDark, fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>Back to all venues</Link>
      </div>
    );
  }

  // Derived
  const photos = (venue.venue_photos ?? [])
    .sort((a, b) => a.display_order - b.display_order)
    .map(p => p.photo_url);

  const autoTags = venue.auto_tags ?? [];
  const setupTags = venue.setup_tags ?? [];

  const vf = venue.venue_fixtures ?? [];
  const gamesPolicy = vf.length > 0 ? (vf[0]?.games_policy ?? 'unknown') : 'unknown';
  const confirmedFixtures = vf.filter(f => f.fixtures != null);

  const hoursRows = (venue.opening_times && venue.opening_times !== 'unknown')
    ? venue.opening_times.split(' / ')
    : [];

  const directionsUrl = venue.lat && venue.lng
    ? `https://maps.google.com/?q=${venue.lat},${venue.lng}`
    : `https://maps.google.com/?q=${encodeURIComponent(`${venue.name} ${venue.area ?? ''} London`)}`;

  const hasBookingUrl = !!venue.booking_url;

  // Tag pills
  type Pill = { label: string; bg: string; color: string };
  const tagPills: Pill[] = [];
  if (autoTags.includes('lively')) tagPills.push({ label: 'Lively', bg: 'rgba(255,178,46,0.2)', color: '#7A4A00' });
  else if (autoTags.includes('chilled')) tagPills.push({ label: 'Chilled', bg: '#DDF4E8', color: '#0A6B45' });
  if (autoTags.includes('outdoor_confirmed') || setupTags.includes('outdoor'))
    tagPills.push({ label: 'Outdoor screen', bg: '#E8F0FC', color: '#1A3A6A' });
  if (autoTags.includes('late_friendly'))
    tagPills.push({ label: 'Open late', bg: '#F0E8F8', color: '#4A1A6A' });
  if (autoTags.includes('good_for_groups'))
    tagPills.push({ label: 'Good for groups', bg: '#E8EEFA', color: '#1A2A6A' });
  if (hasBookingUrl) tagPills.push({ label: 'Book a table', bg: '#DDF4E8', color: '#0A6B45' });
  else tagPills.push({ label: 'Walk-ins welcome', bg: '#F0F2F5', color: C.textSub });

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: FONT_BODY, color: C.navy, WebkitFontSmoothing: 'antialiased' }}>

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(246,247,244,0.92)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '13px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 999, background: C.bg, border: `1px solid ${C.borderMed}`, color: C.navy, textDecoration: 'none', fontSize: 18 }}>
            ←
          </Link>
          <span style={{ fontFamily: FONT_DISPLAY, fontSize: 18, letterSpacing: 0.5, textTransform: 'uppercase', color: C.navy }}>
            Where We <span style={{ color: C.green }}>Watch</span>
          </span>
        </div>
      </nav>

      {/* Photo carousel */}
      <div style={{ width: '100%', maxHeight: 360, overflow: 'hidden' }}>
        <PhotoCarousel photos={photos} venueName={venue.name} height={320} />
      </div>

      {/* Content */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 0 120px' }}>

        {/* Venue header */}
        <div style={{ background: C.white, margin: '0 16px', marginTop: -20, borderRadius: 20, padding: '20px 20px 16px', boxShadow: '0 8px 32px rgba(10,26,51,0.09)', position: 'relative', zIndex: 2 }}>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 'clamp(28px,6vw,38px)', letterSpacing: 0.4, textTransform: 'uppercase', margin: '0 0 6px', lineHeight: 1, color: C.navy }}>
            {venue.name}
          </h1>
          <div style={{ fontSize: 14, color: C.textSub }}>
            {[venue.type, venue.area, venue.price_level].filter(Boolean).join(' · ')}
          </div>
          {venue.verified && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 10, background: C.green, color: C.white, borderRadius: 999, padding: '4px 11px', fontSize: 11, fontWeight: 800, letterSpacing: 0.4 }}>
              ✓ Verified listing
            </span>
          )}
        </div>

        {/* Tag pills */}
        {tagPills.length > 0 && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '16px 16px 4px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {tagPills.map(p => <TagPill key={p.label} {...p} />)}
          </div>
        )}

        {/* Fixtures */}
        <div style={{ margin: '16px 16px 0', background: C.white, borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '16px 18px 8px', borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: C.textMuted }}>Fixtures</span>
          </div>
          <div style={{ padding: '10px 18px 16px' }}>
            {gamesPolicy === 'all_games' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="wtw-pulse-slow" style={{ width: 8, height: 8, borderRadius: 999, background: C.green, flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: C.greenDark }}>Showing all World Cup group stage fixtures</span>
              </div>
            ) : gamesPolicy === 'unknown' ? (
              <div style={{ fontSize: 13, color: C.textSub, lineHeight: 1.5 }}>
                Check the venue&apos;s website or give them a call to find out which fixtures they&apos;re showing.
              </div>
            ) : confirmedFixtures.length === 0 ? (
              <div style={{ fontSize: 13, color: C.textMuted, fontStyle: 'italic' }}>Fixture schedule not confirmed yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {confirmedFixtures.map(vfr => {
                  const fx = vfr.fixtures!;
                  return (
                    <div key={fx.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: vfr.confirmed ? C.bg : '#FFFBF0', borderRadius: 12, padding: '10px 14px', border: vfr.confirmed ? 'none' : `1px solid rgba(255,178,46,0.3)` }}>
                      <span style={{ width: 7, height: 7, borderRadius: 999, background: vfr.confirmed ? C.green : C.amber, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: vfr.confirmed ? C.greenDark : '#8A5A00', textTransform: 'uppercase', letterSpacing: 0.4, flexShrink: 0, minWidth: 88 }}>
                        {vfr.confirmed ? 'Confirmed' : 'Unconfirmed'}
                      </span>
                      <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>
                        {flagFor(fx.home_team)} {fx.home_team} v {fx.away_team} {flagFor(fx.away_team)}
                      </span>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.textSub, flexShrink: 0 }}>{kickoffDisplay(fx.kickoff_at)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Opening times */}
        {hoursRows.length > 0 && (
          <div style={{ margin: '16px 16px 0', background: C.white, borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '16px 18px 8px', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: C.textMuted }}>Opening times</span>
            </div>
            <div style={{ padding: '10px 18px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {hoursRows.map((row, i) => {
                const colonIdx = row.indexOf(':');
                const day = colonIdx > -1 ? row.slice(0, colonIdx) : row;
                const hours = colonIdx > -1 ? row.slice(colonIdx + 1).trim() : '';
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 13 }}>
                    <span style={{ fontWeight: 700, color: C.navy, minWidth: 80 }}>{day}</span>
                    <span style={{ color: C.textSub, textAlign: 'right' }}>{hours || row}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* About */}
        {venue.notes && (
          <div style={{ margin: '16px 16px 0', background: C.white, borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '16px 18px 8px', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: C.textMuted }}>About</span>
            </div>
            <div style={{ padding: '12px 18px 18px', fontSize: 14, color: C.textSub, lineHeight: 1.6 }}>
              {venue.notes}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ margin: '20px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {hasBookingUrl && (
            <a
              href={`/api/track?venue=${venue.id}&type=booking&url=${encodeURIComponent(venue.booking_url!)}`}
              target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: C.green, color: C.white, borderRadius: 14, padding: '15px 20px', textDecoration: 'none', fontFamily: FONT_BODY, fontSize: 15, fontWeight: 700, letterSpacing: 0.2 }}
            >
              Book a table
            </a>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <a
              href={directionsUrl}
              target="_blank" rel="noopener noreferrer"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.white, color: C.navy, border: `1.5px solid ${C.borderMed}`, borderRadius: 14, padding: '13px 16px', textDecoration: 'none', fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700 }}
            >
              Get directions
            </a>
            {venue.website && (
              <a
                href={`/api/track?venue=${venue.id}&type=website&url=${encodeURIComponent(venue.website)}`}
                target="_blank" rel="noopener noreferrer"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.white, color: C.navy, border: `1.5px solid ${C.borderMed}`, borderRadius: 14, padding: '13px 16px', textDecoration: 'none', fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700 }}
              >
                Visit website
              </a>
            )}
          </div>
        </div>

      </div>

      {/* Sticky claim bar */}
      {!venue.claimed && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40, background: 'rgba(246,247,244,0.95)', backdropFilter: 'blur(8px)', borderTop: `1px solid ${C.border}`, padding: '12px 20px' }}>
          <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <span style={{ fontSize: 13, color: C.textSub }}>Is this your venue?</span>
            <Link
              href={`/claim?venue=${venue.id}`}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.navy, color: C.white, borderRadius: 999, padding: '9px 18px', textDecoration: 'none', fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, letterSpacing: 0.2 }}
            >
              Claim your listing
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
