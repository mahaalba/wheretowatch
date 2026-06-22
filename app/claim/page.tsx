'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const C = {
  navy: '#0A1A33', green: '#00B368', greenDark: '#0A6B45',
  amber: '#FFB22E', bg: '#F6F7F4', white: '#fff',
  textMuted: '#9AA3B0', textSub: '#5B6577',
  border: 'rgba(10,26,51,0.08)', borderMed: 'rgba(10,26,51,0.12)',
};
const FONT_DISPLAY = "'Anton', sans-serif";
const FONT_BODY = "'Inter', system-ui, sans-serif";
const FONT_MONO = "'IBM Plex Mono', monospace";

function ClaimForm() {
  const params = useSearchParams();
  const venueId = params.get('venue');

  const [venueName, setVenueName] = useState('');
  const [loading, setLoading] = useState(!!venueId);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!venueId) { setLoading(false); return; }
    supabase.from('venues').select('name').eq('id', venueId).single().then(({ data }) => {
      if (data) setVenueName(data.name);
      setLoading(false);
    });
  }, [venueId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setSubmitting(true);
    setError('');
    const { error: err } = await supabase.from('venue_submissions').insert({
      venue_id: venueId ?? null,
      venue_name: venueName || null,
      contact_name: name.trim(),
      contact_email: email.trim(),
      contact_role: role.trim() || null,
      note: note.trim() || null,
      type: 'claim',
    });
    setSubmitting(false);
    if (err) {
      setError('Something went wrong. Please email us directly at hello@wherewewatch.co.uk');
    } else {
      setDone(true);
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px', color: C.textMuted, fontFamily: FONT_BODY }}>
        Loading…
      </div>
    );
  }

  if (done) {
    return (
      <div style={{ background: C.white, borderRadius: 20, padding: '48px 32px', textAlign: 'center', boxShadow: '0 8px 40px rgba(10,26,51,0.08)', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ width: 56, height: 56, borderRadius: 999, background: '#DDF4E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 20px' }}>✓</div>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 28, textTransform: 'uppercase', letterSpacing: 0.4, color: C.navy, margin: '0 0 12px' }}>Claim received</h2>
        <p style={{ fontSize: 15, color: C.textSub, lineHeight: 1.55, margin: 0 }}>
          We&apos;ll review your claim and be in touch within 24 hours. Once verified, you&apos;ll be able to confirm fixtures and update your listing in real time.
        </p>
        <a href="/" style={{ display: 'inline-block', marginTop: 28, background: C.green, color: C.white, borderRadius: 12, padding: '13px 28px', fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
          Back to venues
        </a>
      </div>
    );
  }

  return (
    <div style={{ background: C.white, borderRadius: 20, padding: '32px', boxShadow: '0 8px 40px rgba(10,26,51,0.08)', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: C.greenDark, marginBottom: 8 }}>
        Claim your listing
      </div>
      <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 30, textTransform: 'uppercase', letterSpacing: 0.4, color: C.navy, margin: '0 0 6px', lineHeight: 1.05 }}>
        {venueName || 'Your venue'}
      </h1>
      <p style={{ fontSize: 14, color: C.textSub, margin: '0 0 28px', lineHeight: 1.5 }}>
        Verify you own or manage this venue and we&apos;ll give you access to confirm fixtures, update availability, and keep your listing accurate.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 6, letterSpacing: 0.3 }}>Your name *</label>
          <input
            required value={name} onChange={e => setName(e.target.value)}
            placeholder="Jane Smith"
            style={{ width: '100%', boxSizing: 'border-box', border: `1.5px solid ${C.borderMed}`, borderRadius: 11, padding: '11px 14px', fontFamily: FONT_BODY, fontSize: 14, color: C.navy, outline: 'none' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 6, letterSpacing: 0.3 }}>Work email *</label>
          <input
            required type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="jane@yourpub.co.uk"
            style={{ width: '100%', boxSizing: 'border-box', border: `1.5px solid ${C.borderMed}`, borderRadius: 11, padding: '11px 14px', fontFamily: FONT_BODY, fontSize: 14, color: C.navy, outline: 'none' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 6, letterSpacing: 0.3 }}>Your role</label>
          <select
            value={role} onChange={e => setRole(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', border: `1.5px solid ${C.borderMed}`, borderRadius: 11, padding: '11px 14px', fontFamily: FONT_BODY, fontSize: 14, color: role ? C.navy : C.textMuted, outline: 'none', background: C.white }}
          >
            <option value="">Select your role</option>
            <option>Owner</option>
            <option>Manager</option>
            <option>Marketing / events</option>
            <option>Other</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 6, letterSpacing: 0.3 }}>Anything else? <span style={{ fontWeight: 400, color: C.textMuted }}>(optional)</span></label>
          <textarea
            value={note} onChange={e => setNote(e.target.value)}
            placeholder="e.g. which fixtures you're showing, any corrections needed..."
            rows={3}
            style={{ width: '100%', boxSizing: 'border-box', border: `1.5px solid ${C.borderMed}`, borderRadius: 11, padding: '11px 14px', fontFamily: FONT_BODY, fontSize: 14, color: C.navy, outline: 'none', resize: 'vertical' }}
          />
        </div>

        {error && (
          <div style={{ fontSize: 13, color: '#9A2A2A', background: '#FBE3E0', borderRadius: 10, padding: '10px 14px' }}>{error}</div>
        )}

        <button
          type="submit" disabled={submitting || !name.trim() || !email.trim()}
          style={{ background: C.green, color: C.white, border: 'none', borderRadius: 12, padding: '14px', fontFamily: FONT_BODY, fontSize: 15, fontWeight: 700, cursor: submitting ? 'wait' : 'pointer', opacity: (!name.trim() || !email.trim()) ? 0.5 : 1 }}
        >
          {submitting ? 'Sending…' : 'Claim this listing'}
        </button>
      </form>
    </div>
  );
}

export default function ClaimPage() {
  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: FONT_BODY, color: C.navy, WebkitFontSmoothing: 'antialiased' }}>
      <nav style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: '14px 24px' }}>
        <a href="/" style={{ textDecoration: 'none', fontFamily: FONT_DISPLAY, fontSize: 20, letterSpacing: 0.5, textTransform: 'uppercase', color: C.navy }}>
          Where We <span style={{ color: C.green }}>Watch</span>
        </a>
      </nav>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '48px 24px' }}>
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '80px 24px', color: C.textMuted }}>Loading…</div>}>
          <ClaimForm />
        </Suspense>
      </div>
    </div>
  );
}
