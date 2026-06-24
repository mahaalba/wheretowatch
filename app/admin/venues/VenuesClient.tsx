'use client';

import { useState } from 'react';
import type { AdminVenue } from './page';

const C = {
  navy: '#0A1A33', green: '#00B368', greenDark: '#0A6B45',
  white: '#fff', bg: '#F6F7F4',
  textMuted: '#9AA3B0', textSub: '#5B6577',
  border: 'rgba(10,26,51,0.08)', borderMed: 'rgba(10,26,51,0.14)',
};
const FONT_DISPLAY = "'Anton', sans-serif";
const FONT_BODY    = "'DM Sans', sans-serif";
const FONT_MONO    = "'IBM Plex Mono', monospace";

export default function VenuesClient({ venues: initial, fetchError }: { venues: AdminVenue[]; fetchError: string | null }) {
  const [venues, setVenues] = useState(initial);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const visible = search
    ? venues.filter(v =>
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        (v.area ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : venues;

  async function toggleVerified(id: string, current: boolean | null) {
    setUpdating(id);
    setError('');
    const next = !current;
    const res = await fetch(`/api/admin/venues/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verified: next }),
    });
    setUpdating(null);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? 'Update failed');
      return;
    }
    setVenues(prev => prev.map(v => v.id === id ? { ...v, verified: next } : v));
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: C.greenDark, marginBottom: 4 }}>
          Admin
        </div>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 'clamp(24px,4vw,32px)', textTransform: 'uppercase', letterSpacing: 0.4, color: C.navy, margin: '0 0 4px' }}>
          Venues
        </h1>
        <div style={{ fontSize: 13, color: C.textSub }}>{venues.length} venues total</div>
      </div>

      {fetchError && (
        <div style={{ background: '#FBE3E0', color: '#9A2A2A', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13 }}>
          Error loading venues: {fetchError}
        </div>
      )}

      {error && (
        <div style={{ background: '#FBE3E0', color: '#9A2A2A', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Search */}
      <input
        type="search"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Filter by name or area…"
        style={{ width: '100%', maxWidth: 340, boxSizing: 'border-box', border: `1.5px solid ${C.borderMed}`, borderRadius: 10, padding: '9px 14px', fontFamily: FONT_BODY, fontSize: 13, color: C.navy, outline: 'none', marginBottom: 16 }}
      />

      <div style={{ background: C.white, borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(10,26,51,0.06)' }}>
        {/* Header row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 110px 100px 90px 74px',
          gap: 12, padding: '11px 20px',
          background: C.bg, borderBottom: `1px solid ${C.border}`,
          fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: C.textMuted,
        }}>
          <div>Venue</div>
          <div>Type</div>
          <div>Tags</div>
          <div>Owner</div>
          <div>Verified</div>
        </div>

        {visible.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: C.textMuted, fontSize: 14 }}>
            {search ? 'No venues match your search.' : 'No venues found.'}
          </div>
        ) : (
          visible.map((venue, i) => (
            <div
              key={venue.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 110px 100px 90px 74px',
                gap: 12, padding: '13px 20px', alignItems: 'center',
                borderBottom: i < visible.length - 1 ? `1px solid ${C.border}` : 'none',
              }}
            >
              {/* Name + area */}
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: C.navy, marginBottom: 1 }}>{venue.name}</div>
                {venue.area && <div style={{ fontSize: 11, color: C.textMuted }}>{venue.area}</div>}
              </div>

              {/* Type */}
              <div style={{ fontSize: 12, color: C.textSub, textTransform: 'capitalize' }}>
                {venue.type ?? '—'}
              </div>

              {/* Auto tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {(venue.auto_tags ?? []).slice(0, 3).map(tag => (
                  <span key={tag} style={{ fontFamily: FONT_MONO, fontSize: 9, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', background: '#DDF4E8', color: C.greenDark, borderRadius: 4, padding: '2px 5px' }}>
                    {tag}
                  </span>
                ))}
              </div>

              {/* Owner */}
              <div style={{ fontSize: 11, color: venue.owner_id ? C.greenDark : C.textMuted, fontWeight: venue.owner_id ? 700 : 400 }}>
                {venue.owner_id ? '✓ Claimed' : '—'}
              </div>

              {/* Verified toggle */}
              <div>
                <button
                  onClick={() => toggleVerified(venue.id, venue.verified)}
                  disabled={updating === venue.id}
                  aria-pressed={!!venue.verified}
                  aria-label={`Toggle verified for ${venue.name}`}
                  style={{
                    width: 42, height: 22, borderRadius: 999, border: 'none',
                    cursor: updating === venue.id ? 'wait' : 'pointer',
                    position: 'relative',
                    background: venue.verified ? C.green : '#D1D5DB',
                    transition: 'background 0.2s',
                    opacity: updating === venue.id ? 0.6 : 1,
                  }}
                >
                  <span style={{
                    position: 'absolute', top: 2,
                    left: venue.verified ? 22 : 2,
                    width: 18, height: 18, borderRadius: 999,
                    background: C.white, boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    transition: 'left 0.15s',
                  }} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
