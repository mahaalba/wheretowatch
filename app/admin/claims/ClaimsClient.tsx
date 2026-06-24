'use client';

import { useState } from 'react';
import type { VenueClaim } from './page';

const C = {
  navy: '#0A1A33', green: '#00B368', greenDark: '#0A6B45',
  white: '#fff', bg: '#F6F7F4',
  textMuted: '#9AA3B0', textSub: '#5B6577',
  border: 'rgba(10,26,51,0.08)', borderMed: 'rgba(10,26,51,0.14)',
};
const FONT_DISPLAY = "'Anton', sans-serif";
const FONT_BODY    = "'DM Sans', sans-serif";
const FONT_MONO    = "'IBM Plex Mono', monospace";

type Filter = 'all' | 'pending' | 'approved' | 'rejected';

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string }> = {
    pending:  { bg: '#FFF8E6', color: '#7A4A00' },
    approved: { bg: '#DDF4E8', color: '#0A6B45' },
    rejected: { bg: '#FBE3E0', color: '#9A2A2A' },
  };
  const s = cfg[status] ?? { bg: '#F0F0F0', color: '#444' };
  return (
    <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', borderRadius: 6, padding: '3px 8px', background: s.bg, color: s.color }}>
      {status}
    </span>
  );
}

export default function ClaimsClient({ claims: initial, fetchError }: { claims: VenueClaim[]; fetchError: string | null }) {
  const [claims, setClaims] = useState(initial);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const counts = {
    all:      claims.length,
    pending:  claims.filter(c => c.status === 'pending').length,
    approved: claims.filter(c => c.status === 'approved').length,
    rejected: claims.filter(c => c.status === 'rejected').length,
  };
  const visible = filter === 'all' ? claims : claims.filter(c => c.status === filter);

  async function updateClaim(id: string, action: 'approve' | 'reject') {
    setLoading(id + action);
    setActionError('');
    const res = await fetch(`/api/admin/claims/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    setLoading(null);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setActionError(body.error ?? 'Something went wrong');
      return;
    }
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    setClaims(prev =>
      prev.map(c => c.id === id ? { ...c, status: newStatus, reviewed_at: new Date().toISOString() } : c)
    );
  }

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all',      label: 'All' },
    { key: 'pending',  label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: C.greenDark, marginBottom: 4 }}>
          Admin
        </div>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 'clamp(24px,4vw,32px)', textTransform: 'uppercase', letterSpacing: 0.4, color: C.navy, margin: 0 }}>
          Venue Claims
        </h1>
      </div>

      {fetchError && (
        <div style={{ background: '#FBE3E0', color: '#9A2A2A', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13 }}>
          Could not load claims: {fetchError}. Make sure the <code>venue_claims</code> table exists in Supabase.
        </div>
      )}

      {actionError && (
        <div style={{ background: '#FBE3E0', color: '#9A2A2A', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13 }}>
          {actionError}
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              background: filter === f.key ? C.navy : C.white,
              color: filter === f.key ? C.white : C.textSub,
              border: `1px solid ${filter === f.key ? C.navy : C.borderMed}`,
              borderRadius: 999, padding: '7px 14px',
              fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {f.label}{' '}
            <span style={{ opacity: 0.55 }}>{counts[f.key]}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: C.textMuted, fontSize: 14 }}>
          No {filter === 'all' ? '' : filter + ' '}claims yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {visible.map(claim => {
            const venueName = claim.venues?.name ?? claim.venue_name ?? '—';
            const venueArea = claim.venues?.area ?? null;
            const date = new Date(claim.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
            const isPending = claim.status === 'pending';

            return (
              <div key={claim.id} style={{ background: C.white, borderRadius: 16, padding: '18px 20px', boxShadow: '0 2px 12px rgba(10,26,51,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: C.navy, marginBottom: 2 }}>
                      {venueName}{venueArea ? <span style={{ fontWeight: 400, color: C.textSub }}> · {venueArea}</span> : null}
                    </div>
                    <div style={{ fontSize: 13, color: C.textSub }}>
                      {claim.email ?? '—'}{claim.details?.role ? <span style={{ color: C.textMuted }}> · {claim.details.role}</span> : null}
                    </div>
                    {claim.details?.note && (
                      <div style={{ fontSize: 12, color: C.textMuted, marginTop: 5, fontStyle: 'italic', lineHeight: 1.4 }}>
                        &ldquo;{claim.details.note}&rdquo;
                      </div>
                    )}
                    <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textMuted, marginTop: 5 }}>
                      {claim.id}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <StatusBadge status={claim.status} />
                      <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{date}</div>
                    </div>

                    {isPending && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => updateClaim(claim.id, 'approve')}
                          disabled={!!loading}
                          style={{ background: C.green, color: C.white, border: 'none', borderRadius: 10, padding: '8px 16px', fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', opacity: loading === claim.id + 'approve' ? 0.65 : 1 }}
                        >
                          {loading === claim.id + 'approve' ? '…' : 'Approve'}
                        </button>
                        <button
                          onClick={() => updateClaim(claim.id, 'reject')}
                          disabled={!!loading}
                          style={{ background: '#FBE3E0', color: '#9A2A2A', border: 'none', borderRadius: 10, padding: '8px 16px', fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', opacity: loading === claim.id + 'reject' ? 0.65 : 1 }}
                        >
                          {loading === claim.id + 'reject' ? '…' : 'Reject'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
