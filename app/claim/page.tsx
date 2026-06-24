'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

const C = {
  navy: '#0A1A33', green: '#00B368', greenDark: '#0A6B45',
  bg: '#F6F7F4', white: '#fff',
  textMuted: '#9AA3B0', textSub: '#5B6577',
  border: 'rgba(10,26,51,0.08)', borderMed: 'rgba(10,26,51,0.14)',
};
const FONT_DISPLAY = "'Anton', sans-serif";
const FONT_BODY    = "'DM Sans', sans-serif";
const FONT_MONO    = "'IBM Plex Mono', monospace";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function friendlyError(msg: string): string {
  if (/invalid login credentials/i.test(msg))      return 'Incorrect email or password.';
  if (/user already registered|already been registered/i.test(msg))
    return 'An account with this email already exists. Sign in instead.';
  if (/password should be at least/i.test(msg))    return 'Password must be at least 8 characters.';
  if (/email not confirmed/i.test(msg))             return 'Please confirm your email address — check your inbox.';
  if (/rate limit/i.test(msg))                      return 'Too many attempts. Please wait a moment and try again.';
  return msg;
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div style={{ fontSize: 13, color: '#9A2A2A', background: '#FBE3E0', borderRadius: 10, padding: '10px 14px' }}>
      {msg}
    </div>
  );
}

const INPUT: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  border: `1.5px solid ${C.borderMed}`, borderRadius: 11,
  padding: '12px 14px', fontFamily: FONT_BODY, fontSize: 14, color: C.navy, outline: 'none',
};

function PrimaryBtn({ disabled, loading, label, loadingLabel }: { disabled: boolean; loading: boolean; label: string; loadingLabel: string }) {
  return (
    <button
      type="submit" disabled={disabled || loading}
      style={{ background: (disabled || loading) ? '#D1D5DB' : C.green, color: (disabled || loading) ? '#9AA3B0' : C.white, border: 'none', borderRadius: 12, padding: '13px', fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, cursor: (disabled || loading) ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}
    >
      {loading ? loadingLabel : label}
    </button>
  );
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, height: 1, background: C.border }} />
      <span style={{ fontSize: 12, fontWeight: 600, color: C.textMuted }}>or</span>
      <div style={{ flex: 1, height: 1, background: C.border }} />
    </div>
  );
}

function GoogleButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button" onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', background: C.white, color: C.navy, border: `1.5px solid ${C.borderMed}`, borderRadius: 12, padding: '12px 16px', fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
        <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z" fill="#FBBC05"/>
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
      </svg>
      Continue with Google
    </button>
  );
}
// Apple OAuth — add later once an Apple Developer account is set up

// ─── Auth section ─────────────────────────────────────────────────────────────
type AuthMode = 'signin' | 'signup' | 'forgot';

function AuthSection() {
  const [mode, setMode]                   = useState<AuthMode>('signin');
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [confirmPw, setConfirmPw]         = useState('');
  const [loading, setLoading]             = useState(false);
  const [authError, setAuthError]         = useState('');
  const [emailSent, setEmailSent]         = useState<'verify' | 'reset' | null>(null);
  const [marketing, setMarketing]         = useState(false);

  function switchMode(next: AuthMode) {
    setMode(next);
    setAuthError('');
    setPassword('');
    setConfirmPw('');
  }

  function callbackUrl(): string {
    if (typeof window === 'undefined') return '';
    const sp = new URLSearchParams(window.location.search);
    const after = sp.get('redirect') ?? (sp.get('venue') ? `/claim?venue=${sp.get('venue')}` : '/dashboard');
    return `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(after)}`;
  }

  async function signInGoogle() {
    setAuthError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl() },
    });
    if (error) setAuthError(error.message);
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) setAuthError(friendlyError(error.message));
    // success → onAuthStateChange in ClaimPageContent handles redirect
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setAuthError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPw) { setAuthError("Passwords don't match."); return; }
    setLoading(true); setAuthError('');
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
    setLoading(false);
    if (error) { setAuthError(friendlyError(error.message)); return; }
    if (!data.session) setEmailSent('verify'); // email confirmation required
    // if data.session exists, onAuthStateChange fires and parent redirects
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setAuthError('');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : '',
    });
    setLoading(false);
    if (error) setAuthError(error.message);
    else setEmailSent('reset');
  }

  // ── Email-sent success states ─────────────────────────────────────────────
  if (emailSent) {
    return (
      <div style={{ background: C.white, borderRadius: 20, padding: '36px 28px', textAlign: 'center', boxShadow: '0 8px 40px rgba(10,26,51,0.08)' }}>
        <div style={{ fontSize: 42, marginBottom: 16 }}>📬</div>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 24, textTransform: 'uppercase', letterSpacing: 0.4, color: C.navy, margin: '0 0 10px' }}>
          Check your inbox
        </h2>
        <p style={{ fontSize: 14, color: C.textSub, lineHeight: 1.55, margin: '0 0 24px' }}>
          {emailSent === 'verify'
            ? <>We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.</>
            : <>We sent a password reset link to <strong>{email}</strong>.</>}
        </p>
        <button
          onClick={() => { setEmailSent(null); setMode('signin'); }}
          style={{ background: 'transparent', border: 'none', fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: C.greenDark, cursor: 'pointer', textDecoration: 'underline' }}
        >
          Back to sign in
        </button>
      </div>
    );
  }

  // ── Forgot password ───────────────────────────────────────────────────────
  if (mode === 'forgot') {
    return (
      <div style={{ background: C.white, borderRadius: 20, padding: '28px', boxShadow: '0 8px 40px rgba(10,26,51,0.08)' }}>
        <button
          onClick={() => switchMode('signin')}
          style={{ background: 'none', border: 'none', fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: C.greenDark, cursor: 'pointer', padding: '0 0 18px 0', textDecoration: 'underline', display: 'block' }}
        >
          ← Back to sign in
        </button>
        <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: C.textMuted, marginBottom: 14 }}>
          Reset password
        </div>
        <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" style={INPUT} />
          {authError && <ErrorBox msg={authError} />}
          <PrimaryBtn disabled={!email.trim()} loading={loading} label="Send reset link" loadingLabel="Sending…" />
        </form>
      </div>
    );
  }

  // ── Sign in ───────────────────────────────────────────────────────────────
  if (mode === 'signin') {
    return (
      <div style={{ background: C.white, borderRadius: 20, padding: '28px', boxShadow: '0 8px 40px rgba(10,26,51,0.08)', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <GoogleButton onClick={signInGoogle} />
        <Divider />
        <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" style={INPUT} />
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" style={INPUT} />
          {authError && <ErrorBox msg={authError} />}
          <PrimaryBtn disabled={!email.trim() || !password} loading={loading} label="Sign in" loadingLabel="Signing in…" />
          <button
            type="button" onClick={() => switchMode('forgot')}
            style={{ background: 'none', border: 'none', fontFamily: FONT_BODY, fontSize: 12, color: C.textSub, cursor: 'pointer', textAlign: 'left', padding: 0 }}
          >
            Forgot password?
          </button>
        </form>
        <p style={{ textAlign: 'center', fontSize: 13, color: C.textSub, margin: 0 }}>
          Don&apos;t have an account?{' '}
          <button onClick={() => switchMode('signup')} style={{ background: 'none', border: 'none', fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: C.greenDark, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
            Create one
          </button>
        </p>
      </div>
    );
  }

  // ── Sign up ───────────────────────────────────────────────────────────────
  return (
    <div style={{ background: C.white, borderRadius: 20, padding: '28px', boxShadow: '0 8px 40px rgba(10,26,51,0.08)', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <GoogleButton onClick={signInGoogle} />
      <Divider />
      <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" style={INPUT} />
        <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (min 8 characters)" style={INPUT} />
        <input type="password" required value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Confirm password" style={INPUT} />
        {authError && <ErrorBox msg={authError} />}
        <PrimaryBtn disabled={!email.trim() || !password || !confirmPw} loading={loading} label="Create account" loadingLabel="Creating account…" />
      </form>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ fontSize: 11, color: C.textMuted, margin: 0, lineHeight: 1.6 }}>
          By signing up you agree to our{' '}
          <Link href="/privacy" style={{ color: C.greenDark, textDecoration: 'underline' }}>privacy policy</Link>
          {' '}and{' '}
          <Link href="/terms" style={{ color: C.greenDark, textDecoration: 'underline' }}>terms and conditions</Link>.
        </p>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, cursor: 'pointer' }}>
          <input type="checkbox" checked={marketing} onChange={e => setMarketing(e.target.checked)} style={{ marginTop: 2, cursor: 'pointer', flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.6 }}>
            I&apos;d like to receive email updates about growing my venue&apos;s reach.
          </span>
        </label>
      </div>
      <p style={{ textAlign: 'center', fontSize: 13, color: C.textSub, margin: 0 }}>
        Already have an account?{' '}
        <button onClick={() => switchMode('signin')} style={{ background: 'none', border: 'none', fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: C.greenDark, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
          Sign in
        </button>
      </p>
    </div>
  );
}

// ─── Verification form (authenticated) ───────────────────────────────────────
function VerifyForm({ session, venueId, venueName }: { session: Session; venueId: string | null; venueName: string }) {
  const [role, setRole]           = useState('');
  const [note, setNote]           = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]           = useState(false);
  const [error, setError]         = useState('');

  const userEmail = session.user?.email ?? '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setError('');
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
        {error && <ErrorBox msg={error} />}
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
  const venueId          = params.get('venue');
  const redirectAfterAuth = params.get('redirect');

  const [venueName, setVenueName] = useState('');
  const [authState, setAuthState] = useState<'loading' | 'unauthenticated' | 'authenticated'>('loading');
  const [session, setSession]     = useState<Session | null>(null);

  useEffect(() => {
    async function init() {
      const { data: { session: s } } = await supabase.auth.getSession();
      setSession(s);
      setAuthState(s ? 'authenticated' : 'unauthenticated');
      if (s && redirectAfterAuth?.startsWith('/')) {
        router.push(redirectAfterAuth);
      }
    }
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => {
      setSession(s);
      setAuthState(s ? 'authenticated' : 'unauthenticated');
      if (s && redirectAfterAuth?.startsWith('/')) router.push(redirectAfterAuth);
    });
    return () => subscription.unsubscribe();
  }, [router, redirectAfterAuth]);

  useEffect(() => {
    if (!venueId) return;
    supabase.from('venues').select('name').eq('id', venueId).single().then(({ data }) => {
      if (data) setVenueName(data.name);
    });
  }, [venueId]);

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '48px 20px 80px' }}>
      {authState === 'loading' ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: C.textMuted, fontSize: 14 }}>Loading…</div>

      ) : authState === 'authenticated' && session ? (
        <>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 'clamp(32px,6vw,44px)', textTransform: 'uppercase', letterSpacing: 0.4, color: C.navy, margin: 0, lineHeight: 1.05 }}>
              Claim your listing{venueName ? ` for ${venueName}` : ''}
            </h1>
          </div>
          <VerifyForm session={session} venueId={venueId} venueName={venueName} />
        </>

      ) : (
        <>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 'clamp(28px,5vw,38px)', textTransform: 'uppercase', letterSpacing: 0.4, color: C.navy, margin: 0, lineHeight: 1.05 }}>
              Sign in or create<br />an account
            </h1>
          </div>
          <AuthSection />
        </>
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
