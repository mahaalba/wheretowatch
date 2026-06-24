'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const C = {
  navy: '#0A1A33', green: '#00B368', greenDark: '#0A6B45',
  bg: '#F6F7F4', white: '#fff',
  textMuted: '#9AA3B0', textSub: '#5B6577',
  border: 'rgba(10,26,51,0.08)', borderMed: 'rgba(10,26,51,0.14)',
};
const FONT_DISPLAY = "'Anton', sans-serif";
const FONT_BODY    = "'DM Sans', sans-serif";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [initError, setInitError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) {
      setInitError('Invalid or expired reset link. Please request a new one.');
      return;
    }
    supabase.auth.exchangeCodeForSession(code).then(({ error: err }) => {
      if (err) setInitError('This reset link has expired. Please request a new one.');
      else setReady(true);
    });
  }, []);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { setError("Passwords don't match."); return; }
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setDone(true);
    setTimeout(() => router.push('/dashboard'), 2000);
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: FONT_BODY, color: C.navy, WebkitFontSmoothing: 'antialiased' as const }}>
      <nav style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: '14px 24px' }}>
        <Link href="/" style={{ textDecoration: 'none', fontFamily: FONT_DISPLAY, fontSize: 20, letterSpacing: 0.5, textTransform: 'uppercase' as const, color: C.navy }}>
          Where We <span style={{ color: C.green }}>Watch</span>
        </Link>
      </nav>

      <div style={{ maxWidth: 440, margin: '0 auto', padding: '64px 24px 80px' }}>

        {initError ? (
          <div>
            <p style={{ fontSize: 14, color: '#9A2A2A', marginBottom: 20 }}>{initError}</p>
            <Link href="/claim" style={{ fontSize: 13, fontWeight: 700, color: C.greenDark, textDecoration: 'underline' }}>
              Back to sign in
            </Link>
          </div>

        ) : !ready ? (
          <div style={{ textAlign: 'center' as const, color: C.textMuted, fontSize: 14 }}>Verifying link…</div>

        ) : done ? (
          <div style={{ textAlign: 'center' as const }}>
            <div style={{ width: 56, height: 56, borderRadius: 999, background: '#DDF4E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 20px' }}>✓</div>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 28, textTransform: 'uppercase' as const, letterSpacing: 0.4, color: C.navy, margin: '0 0 10px' }}>
              Password updated
            </h1>
            <p style={{ fontSize: 14, color: C.textSub }}>Redirecting to your dashboard…</p>
          </div>

        ) : (
          <>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 'clamp(26px,5vw,36px)', textTransform: 'uppercase' as const, letterSpacing: 0.4, color: C.navy, margin: '0 0 28px' }}>
              Set new password
            </h1>
            <div style={{ background: C.white, borderRadius: 20, padding: '28px', boxShadow: '0 8px 40px rgba(10,26,51,0.08)' }}>
              <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                <input
                  type="password" required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="New password (min 8 characters)"
                  style={{ width: '100%', boxSizing: 'border-box' as const, border: `1.5px solid ${C.borderMed}`, borderRadius: 11, padding: '12px 14px', fontFamily: FONT_BODY, fontSize: 14, color: C.navy, outline: 'none' }}
                />
                <input
                  type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  style={{ width: '100%', boxSizing: 'border-box' as const, border: `1.5px solid ${C.borderMed}`, borderRadius: 11, padding: '12px 14px', fontFamily: FONT_BODY, fontSize: 14, color: C.navy, outline: 'none' }}
                />
                {error && (
                  <div style={{ fontSize: 13, color: '#9A2A2A', background: '#FBE3E0', borderRadius: 10, padding: '10px 14px' }}>{error}</div>
                )}
                <button
                  type="submit" disabled={loading}
                  style={{ background: C.green, color: C.white, border: 'none', borderRadius: 12, padding: '13px', fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer' }}
                >
                  {loading ? 'Saving…' : 'Set new password'}
                </button>
              </form>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
