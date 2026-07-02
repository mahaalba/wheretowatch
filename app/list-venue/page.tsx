'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

const C = {
  green: '#00B368', darkGreen: '#0A6B45', lightGreen: '#DDF4E8',
  navy: '#0A1A33', border: '#E7E9E4', bg: '#F6F7F4',
  white: '#fff', textMuted: '#5B6577', error: '#C0392B',
};
const FB = "'Inter', system-ui, sans-serif";
const FD = "'Anton', sans-serif";

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  border: `1.5px solid ${C.border}`, borderRadius: 12,
  padding: '13px 14px', fontFamily: FB, fontSize: 15,
  color: C.navy, background: C.white, outline: 'none',
};

export default function ListVenuePage() {
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [venueName, setVenueName] = useState('');
  const [yourName, setYourName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [sameDetails, setSameDetails] = useState(false);
  const [venuePhone, setVenuePhone] = useState('');
  const [venueEmail, setVenueEmail] = useState('');

  const canSubmit = venueName.trim() && yourName.trim() && email.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await supabase.from('venue_submissions').insert([{
        venue_name: venueName.trim(),
        contact_name: yourName.trim(),
        contact_phone: phone.trim() || null,
        contact_email: email.trim(),
        venue_phone: (sameDetails ? phone : venuePhone).trim() || null,
        venue_email: (sameDetails ? email : venueEmail).trim() || null,
      }]);
    } catch {
      // Proceed to confirmation even if insert fails
    }
    setDone(true);
  };

  if (done) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: FB, color: C.navy, display: 'flex', flexDirection: 'column' }}>
        <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(246,247,244,0.92)', backdropFilter: 'blur(12px)', borderBottom: `1.5px solid ${C.border}` }}>
          <div style={{ maxWidth: 600, margin: '0 auto', padding: '14px 20px' }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 12, height: 12, borderRadius: 999, background: C.green, boxShadow: '0 0 0 4px rgba(0,179,104,0.18)' }} />
              <span style={{ fontFamily: FD, fontSize: 20, letterSpacing: 0.5, textTransform: 'uppercase', color: C.navy }}>Where We <span style={{ color: C.green }}>Watch</span></span>
            </Link>
          </div>
        </nav>

        <main style={{ flex: 1, maxWidth: 600, width: '100%', margin: '0 auto', padding: '64px 20px', boxSizing: 'border-box', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 24 }}>✅</div>
          <h1 style={{ fontFamily: FD, fontSize: 'clamp(28px,5vw,38px)', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 16px', color: C.navy }}>
            Your venue is under review
          </h1>
          <p style={{ fontSize: 17, color: C.textMuted, margin: '0 0 32px', lineHeight: 1.55 }}>
            We&apos;ll be in touch within 24 hours to confirm your listing and get you on the map.
          </p>
          <Link href="/" style={{ textDecoration: 'none', background: C.navy, color: C.white, borderRadius: 12, padding: '14px 28px', fontFamily: FB, fontSize: 15, fontWeight: 700, display: 'inline-block' }}>
            Back to Where We Watch
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: FB, color: C.navy, display: 'flex', flexDirection: 'column' }}>

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(246,247,244,0.92)', backdropFilter: 'blur(12px)', borderBottom: `1.5px solid ${C.border}` }}>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '14px 20px' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 12, height: 12, borderRadius: 999, background: C.green, boxShadow: '0 0 0 4px rgba(0,179,104,0.18)' }} />
            <span style={{ fontFamily: FD, fontSize: 20, letterSpacing: 0.5, textTransform: 'uppercase', color: C.navy }}>Where We <span style={{ color: C.green }}>Watch</span></span>
          </Link>
        </div>
      </nav>

      {/* Main */}
      <main style={{ flex: 1, maxWidth: 600, width: '100%', margin: '0 auto', padding: '48px 20px 80px', boxSizing: 'border-box' }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: C.darkGreen, marginBottom: 14 }}>
          For venues
        </div>
        <h1 style={{ fontFamily: FB, fontWeight: 700, fontSize: 'clamp(26px,5vw,34px)', lineHeight: 1.15, margin: '0 0 10px', letterSpacing: '-0.01em' }}>
          List your venue on <span style={{ color: C.green }}>Where We Watch</span>
        </h1>
        <p style={{ fontSize: 15, color: C.textMuted, margin: '0 0 36px', lineHeight: 1.55 }}>
          Fill in the form below and we&apos;ll get your venue on the map within 24 hours — free, no commission, no catch.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

          {/* Venue name */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 7 }}>
              Venue name <span style={{ color: C.error }}>*</span>
            </label>
            <input
              value={venueName} onChange={e => setVenueName(e.target.value)}
              placeholder="e.g. The Red Lion" required
              style={inputStyle}
            />
          </div>

          {/* Your name */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 7 }}>
              Your name <span style={{ color: C.error }}>*</span>
            </label>
            <input
              value={yourName} onChange={e => setYourName(e.target.value)}
              placeholder="First and last name" required
              style={inputStyle}
            />
          </div>

          {/* Phone */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 7 }}>
              Your phone
            </label>
            <input
              value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="020 0000 0000"
              inputMode="tel"
              style={inputStyle}
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 7 }}>
              Your email <span style={{ color: C.error }}>*</span>
            </label>
            <input
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@email.com" required type="email"
              style={inputStyle}
            />
          </div>

          {/* Same details checkbox */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', marginBottom: sameDetails ? 28 : 20, padding: '14px 16px', background: C.white, border: `1.5px solid ${sameDetails ? C.green : C.border}`, borderRadius: 12, transition: 'border-color .12s' }}>
            <input
              type="checkbox" checked={sameDetails} onChange={e => setSameDetails(e.target.checked)}
              style={{ width: 18, height: 18, marginTop: 1, flexShrink: 0, accentColor: C.green, cursor: 'pointer' }}
            />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>Use same details as above</div>
              <div style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>My phone and email are also the venue&apos;s contact details</div>
            </div>
          </label>

          {/* Venue-specific contact details (when not same) */}
          {!sameDetails && (
            <div style={{ marginBottom: 28, background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: '20px 18px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 }}>Venue contact details</div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 7 }}>Venue phone</label>
                <input value={venuePhone} onChange={e => setVenuePhone(e.target.value)} placeholder="020 0000 0000" inputMode="tel" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 7 }}>Venue email</label>
                <input value={venueEmail} onChange={e => setVenueEmail(e.target.value)} placeholder="hello@yourvenue.co.uk" type="email" style={inputStyle} />
              </div>
            </div>
          )}

          {error && (
            <div style={{ fontSize: 13, color: C.error, fontWeight: 600, marginBottom: 16 }}>{error}</div>
          )}

          <button
            type="submit" disabled={!canSubmit || submitting}
            style={{ border: 'none', borderRadius: 12, padding: '14px 28px', fontFamily: FB, fontSize: 15, fontWeight: 700, cursor: canSubmit && !submitting ? 'pointer' : 'not-allowed', background: canSubmit && !submitting ? C.green : '#D5DAE0', color: C.white, boxShadow: canSubmit && !submitting ? '0 6px 16px rgba(0,179,104,0.28)' : 'none', transition: 'all .15s' }}
          >
            {submitting ? 'Submitting…' : 'Submit venue →'}
          </button>

          <p style={{ fontSize: 13, color: C.textMuted, margin: '16px 0 0', lineHeight: 1.5 }}>
            We review every submission manually and will be in touch within 24 hours.
          </p>
        </form>
      </main>
    </div>
  );
}
