'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

const C = {
  navy: '#0A1A33', green: '#00B368', greenDark: '#0A6B45',
  amber: '#FFB22E', bg: '#F6F7F4', white: '#fff',
  textMuted: '#9AA3B0', textSub: '#5B6577',
  border: 'rgba(10,26,51,0.08)', borderMed: 'rgba(10,26,51,0.14)',
};
const FONT_DISPLAY = "'Anton', sans-serif";
const FONT_BODY    = "'DM Sans', sans-serif";
const FONT_MONO    = "'IBM Plex Mono', monospace";

const BENEFITS = [
  { icon: '✓', text: 'Confirm exactly which World Cup fixtures you are showing' },
  { icon: '✓', text: 'Update your opening times, outdoor setup, and late-night hours' },
  { icon: '✓', text: 'Get the Verified badge and priority placement in search results' },
];

// ─── Auth section (no session) ────────────────────────────────────────────────
function AuthSection({ venueName }: { venueName: string }) {
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const redirectTo = typeof window !== 'undefined'
    ? `${window.location.origin}/claim${window.location.search}`
    : '';

  async function signInGoogle() {
    setAuthError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) setAuthError(error.message);
  }

  async function signInApple() {
    setAuthError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo },
    });
    if (error) setAuthError(error.message);
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setEmailLoading(true);
    setAuthError('');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    });
    setEmailLoading(false);
    if (error) setAuthError(error.message);
    else setEmailSent(true);
  }

  if (emailSent) {
    return (
      <div style={{ background: C.white, borderRadius: 20, padding: '36px 28px', textAlign: 'center', boxShadow: '0 8px 40px rgba(10,26,51,0.08)' }}>
        <div style={{ fontSize: 42, marginBottom: 16 }}>📬</div>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, textTransform: 'uppercase', letterSpacing: 0.4, color: C.navy, margin: '0 0 10px' }}>
          Check your inbox
        </h2>
        <p style={{ fontSize: 14, color: C.textSub, lineHeight: 1.55, margin: '0 0 24px' }}>
          We sent a sign-in link to <strong>{email}</strong>. Click it to continue claiming {venueName || 'your venue'}.
        </p>
        <button
          onClick={() => setEmailSent(false)}
          style={{ background: 'transparent', border: 'none', fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: C.greenDark, cursor: 'pointer', textDecoration: 'underline' }}
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: C.white, borderRadius: 20, padding: '28px', boxShadow: '0 8px 40px rgba(10,26,51,0.08)' }}>
      <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: C.greenDark, marginBottom: 6 }}>
        Sign in to continue
      </div>
      <div style={{ fontSize: 14, color: C.textSub, marginBottom: 22 }}>
        Takes under a minute. No password needed.
      </div>

      {/* OAuth buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        <button
          onClick={signInGoogle}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', background: C.white, color: C.navy, border: `1.5px solid ${C.borderMed}`, borderRadius: 12, padding: '13px 16px', fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
        >
          <span style={{ fontSize: 18 }}>G</span> Continue with Google
        </button>
        <button
          onClick={signInApple}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', background: C.navy, color: C.white, border: 'none', borderRadius: 12, padding: '13px 16px', fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
        >
          <span style={{ fontSize: 18 }}></span> Continue with Apple
        </button>
      </div>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, height: 1, background: C.border }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: C.textMuted }}>or use email</span>
        <div style={{ flex: 1, height: 1, background: C.border }} />
      </div>

      {/* Email magic link */}
      <form onSubmit={sendMagicLink} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input
          type="email" required value={email} onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          style={{ width: '100%', boxSizing: 'border-box', border: `1.5px solid ${C.borderMed}`, borderRadius: 11, padding: '12px 14px', fontFamily: FONT_BODY, fontSize: 14, color: C.navy, outline: 'none' }}
        />
        <button
          type="submit" disabled={emailLoading || !email.trim()}
          style={{ background: C.green, color: C.white, border: 'none', borderRadius: 12, padding: '13px', fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, cursor: emailLoading ? 'wait' : 'pointer', opacity: !email.trim() ? 0.5 : 1 }}
        >
          {emailLoading ? 'Sending…' : 'Send magic link'}
        </button>
      </form>

      {authError && (
        <div style={{ marginTop: 12, fontSize: 13, color: '#9A2A2A', background: '#FBE3E0', borderRadius: 10, padding: '10px 14px' }}>
          {authError}
        </div>
      )}

      <p style={{ fontSize: 11, color: C.textMuted, marginTop: 16, lineHeight: 1.5 }}>
        By signing in you agree to our terms. We use your identity to verify venue ownership only.
      </p>
    </div>
  );
}

// ─── Verification form (authenticated) ───────────────────────────────────────
function VerifyForm({ session, venueId, venueName }: { session: Session; venueId: string | null; venueName: string }) {
  const [role, setRole] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const userEmail = session.user?.email ?? '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const { error: err } = await supabase.from('venue_claims').insert({
      venue_id: venueId ?? null,
      venue_name: venueName || null,
      user_id: session.user?.id ?? null,
      email: userEmail,
      details: { role, note: note.trim() || null },
    });
    setSubmitting(false);
    if (err) setError('Something went wrong. Please try again or email hello@wherewewatch.co.uk');
    else setDone(true);
  }

  if (done) {
    return (
      <div style={{ background: C.white, borderRadius: 20, padding: '48px 28px', textAlign: 'center', boxShadow: '0 8px 40px rgba(10,26,51,0.08)' }}>
        <div style={{ width: 56, height: 56, borderRadius: 999, background: '#DDF4E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 20px' }}>✓</div>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 28, textTransform: 'uppercase', letterSpacing: 0.4, color: C.navy, margin: '0 0 12px' }}>
          Claim received
        </h2>
        <p style={{ fontSize: 15, color: C.textSub, lineHeight: 1.55, margin: '0 0 28px' }}>
          We will review your claim and be in touch within 24 hours. Once verified, you can confirm fixtures and update your listing in real time.
        </p>
        <Link
          href={venueId ? `/venues/${venueId}` : '/'}
          style={{ display: 'inline-block', background: C.green, color: C.white, borderRadius: 12, padding: '13px 28px', fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}
        >
          Back to listing
        </Link>
      </div>
    );
  }

  return (
    <div style={{ background: C.white, borderRadius: 20, padding: '28px', boxShadow: '0 8px 40px rgba(10,26,51,0.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '10px 14px', background: '#DDF4E8', borderRadius: 10 }}>
        <span style={{ fontSize: 16 }}>✓</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.greenDark }}>Signed in as {userEmail}</span>
      </div>

      <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: C.greenDark, marginBottom: 6 }}>
        Almost done
      </div>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, textTransform: 'uppercase', letterSpacing: 0.4, color: C.navy, margin: '0 0 6px', lineHeight: 1.05 }}>
        {venueName || 'Confirm your listing'}
      </h2>
      <p style={{ fontSize: 13, color: C.textSub, margin: '0 0 24px' }}>
        Just confirm your role and we will get you verified within 24 hours.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 6, letterSpacing: 0.3 }}>Your role at {venueName || 'this venue'}</label>
          <select
            value={role} onChange={e => setRole(e.target.value)} required
            style={{ width: '100%', boxSizing: 'border-box', border: `1.5px solid ${C.borderMed}`, borderRadius: 11, padding: '12px 14px', fontFamily: FONT_BODY, fontSize: 14, color: role ? C.navy : C.textMuted, outline: 'none', background: C.white }}
          >
            <option value="" disabled>Select your role</option>
            <option>Owner</option>
            <option>Manager</option>
            <option>Marketing / events</option>
            <option>Other</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 6, letterSpacing: 0.3 }}>
            Anything to add? <span style={{ fontWeight: 400, color: C.textMuted }}>(optional)</span>
          </label>
          <textarea
            value={note} onChange={e => setNote(e.target.value)}
            placeholder="e.g. which fixtures you are planning to show..."
            rows={3}
            style={{ width: '100%', boxSizing: 'border-box', border: `1.5px solid ${C.borderMed}`, borderRadius: 11, padding: '11px 14px', fontFamily: FONT_BODY, fontSize: 14, color: C.navy, outline: 'none', resize: 'vertical' }}
          />
        </div>
        {error && (
          <div style={{ fontSize: 13, color: '#9A2A2A', background: '#FBE3E0', borderRadius: 10, padding: '10px 14px' }}>{error}</div>
        )}
        <button
          type="submit" disabled={submitting || !role}
          style={{ background: C.green, color: C.white, border: 'none', borderRadius: 12, padding: '14px', fontFamily: FONT_BODY, fontSize: 15, fontWeight: 700, cursor: submitting ? 'wait' : 'pointer', opacity: !role ? 0.5 : 1 }}
        >
          {submitting ? 'Submitting…' : 'Submit claim'}
        </button>
      </form>
    </div>
  );
}

// ─── Page shell ───────────────────────────────────────────────────────────────
function ClaimPageContent() {
  const params = useSearchParams();
  const router = useRouter();
  const venueId = params.get('venue');
  const redirectAfterAuth = params.get('redirect');

  const [venueName, setVenueName] = useState('');
  const [authState, setAuthState] = useState<'loading' | 'unauthenticated' | 'authenticated'>('loading');
  const [session, setSession] = useState<Session | null>(null);

  // Handle OAuth / magic-link redirect code exchange + listen for auth changes
  useEffect(() => {
    async function init() {
      // PKCE flow: exchange ?code= if present
      const code = new URLSearchParams(window.location.search).get('code');
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }
      const { data: { session: s } } = await supabase.auth.getSession();
      setSession(s);
      setAuthState(s ? 'authenticated' : 'unauthenticated');
      if (s && redirectAfterAuth && redirectAfterAuth.startsWith('/')) {
        router.push(redirectAfterAuth);
        return;
      }
    }
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => {
      setSession(s);
      setAuthState(s ? 'authenticated' : 'unauthenticated');
      if (s && redirectAfterAuth && redirectAfterAuth.startsWith('/')) {
        router.push(redirectAfterAuth);
      }
    });
    return () => subscription.unsubscribe();
  }, [router, redirectAfterAuth]);

  // Fetch venue name
  useEffect(() => {
    if (!venueId) return;
    supabase.from('venues').select('name').eq('id', venueId).single().then(({ data }) => {
      if (data) setVenueName(data.name);
    });
  }, [venueId]);

  const isLoading = authState === 'loading';

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '48px 20px 80px' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: C.greenDark, marginBottom: 10 }}>
          Venue owners
        </div>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 'clamp(32px,6vw,44px)', textTransform: 'uppercase', letterSpacing: 0.4, color: C.navy, margin: '0 0 14px', lineHeight: 1.05 }}>
          Claim your listing{venueName ? ` for ${venueName}` : ''}
        </h1>
        <p style={{ fontSize: 15, color: C.textSub, lineHeight: 1.6, maxWidth: '42ch', margin: '0 auto 28px' }}>
          Takes under a minute. No recurring fee.
        </p>

        {/* Benefits */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left', marginBottom: 32 }}>
          {BENEFITS.map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: C.white, borderRadius: 12, padding: '13px 16px', boxShadow: '0 2px 12px rgba(10,26,51,0.06)' }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: C.green, flexShrink: 0 }}>{b.icon}</span>
              <span style={{ fontSize: 13, color: C.textSub, lineHeight: 1.4 }}>{b.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Auth / verify state */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: C.textMuted, fontSize: 14 }}>Loading…</div>
      ) : authState === 'authenticated' && session ? (
        <VerifyForm session={session} venueId={venueId} venueName={venueName} />
      ) : (
        <AuthSection venueName={venueName} />
      )}
    </div>
  );
}

export default function ClaimPage() {
  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: FONT_BODY, color: C.navy, WebkitFontSmoothing: 'antialiased' }}>
      <nav style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: '14px 24px' }}>
        <Link href="/" style={{ textDecoration: 'none', fontFamily: FONT_DISPLAY, fontSize: 20, letterSpacing: 0.5, textTransform: 'uppercase', color: C.navy }}>
          Where We <span style={{ color: C.green }}>Watch</span>
        </Link>
      </nav>
      <Suspense fallback={<div style={{ textAlign: 'center', padding: '80px 24px', color: C.textMuted }}>Loading…</div>}>
        <ClaimPageContent />
      </Suspense>
    </div>
  );
}
