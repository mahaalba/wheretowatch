'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

// ─── Stat placeholder card ────────────────────────────────────────────────────
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: C.white, borderRadius: 16, padding: '18px 20px', boxShadow: '0 2px 12px rgba(10,26,51,0.06)' }}>
      <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: C.textMuted, marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 32, letterSpacing: 0.3, color: C.navy }}>{value}</div>
    </div>
  );
}

// ─── Toggle row ───────────────────────────────────────────────────────────────
function ToggleRow({ label, sublabel, checked, onChange }: { label: string; sublabel?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '14px 0', borderBottom: `1px solid ${C.border}` }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{label}</div>
        {sublabel && <div style={{ fontSize: 12, color: C.textSub, marginTop: 2 }}>{sublabel}</div>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{ flexShrink: 0, width: 48, height: 26, borderRadius: 999, border: 'none', cursor: 'pointer', position: 'relative', background: checked ? C.green : '#D1D5DB', transition: 'background 0.2s' }}
        aria-pressed={checked}
      >
        <span style={{ position: 'absolute', top: 3, left: checked ? 25 : 3, width: 20, height: 20, borderRadius: 999, background: C.white, boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.15s' }} />
      </button>
    </div>
  );
}

// ─── Edit button ─────────────────────────────────────────────────────────────
function EditBtn({ label }: { label: string }) {
  return (
    <button
      disabled
      style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.bg, color: C.textSub, border: `1px solid ${C.border}`, borderRadius: 999, padding: '6px 14px', fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, cursor: 'not-allowed', opacity: 0.7 }}
    >
      {label} (coming soon)
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [wcScreening, setWcScreening] = useState(true);
  const [spaceAvailable, setSpaceAvailable] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!s) {
        router.push('/claim');
      } else {
        setSession(s);
        setAuthLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => {
      if (!s) router.push('/claim');
      else setSession(s);
    });
    return () => subscription.unsubscribe();
  }, [router]);

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_BODY }}>
        <div style={{ textAlign: 'center', color: C.textMuted }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚽</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Loading dashboard...</div>
        </div>
      </div>
    );
  }

  const userEmail = session?.user?.email ?? '';

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: FONT_BODY, color: C.navy, WebkitFontSmoothing: 'antialiased' }}>

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(246,247,244,0.92)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '13px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/" style={{ fontFamily: FONT_DISPLAY, fontSize: 18, letterSpacing: 0.5, textTransform: 'uppercase', color: C.navy, textDecoration: 'none' }}>
            Where We <span style={{ color: C.green }}>Watch</span>
          </Link>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 13, color: C.textSub }}>{userEmail}</span>
          <button
            onClick={handleSignOut}
            style={{ background: 'transparent', border: `1px solid ${C.borderMed}`, borderRadius: 999, padding: '6px 14px', fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: C.textSub, cursor: 'pointer' }}
          >
            Sign out
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 20px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: C.greenDark, marginBottom: 6 }}>
            Venue dashboard
          </div>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 'clamp(28px,5vw,38px)', letterSpacing: 0.4, textTransform: 'uppercase', margin: 0, color: C.navy }}>
            Your listing
          </h1>
        </div>

        {/* Verification pending notice */}
        <div style={{ background: '#FFF8E6', border: '1px solid rgba(255,178,46,0.3)', borderRadius: 16, padding: '16px 20px', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>🕐</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>Claim under review</div>
            <div style={{ fontSize: 13, color: C.textSub, marginTop: 3, lineHeight: 1.4 }}>
              We are verifying your ownership. You will get full edit access within 24 hours. Toggles below are saved immediately.
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: C.textMuted, marginBottom: 12 }}>
          This week
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 28 }}>
          <StatCard label="Listing views" value="--" />
          <StatCard label="Direction taps" value="--" />
          <StatCard label="Website clicks" value="--" />
        </div>
        <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 28, marginTop: -16 }}>
          PostHog analytics active once listing goes live.
        </div>

        {/* Availability toggles */}
        <div style={{ background: C.white, borderRadius: 16, padding: '18px 20px', boxShadow: '0 2px 12px rgba(10,26,51,0.06)', marginBottom: 20 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: C.textMuted, marginBottom: 4 }}>
            Live status
          </div>
          <ToggleRow
            label="World Cup screenings"
            sublabel="Show the screening badge on your listing"
            checked={wcScreening}
            onChange={setWcScreening}
          />
          <ToggleRow
            label="Space available tonight"
            sublabel="Show the 'Space now' badge in search results"
            checked={spaceAvailable}
            onChange={setSpaceAvailable}
          />
        </div>

        {/* Edit actions */}
        <div style={{ background: C.white, borderRadius: 16, padding: '18px 20px', boxShadow: '0 2px 12px rgba(10,26,51,0.06)' }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: C.textMuted, marginBottom: 14 }}>
            Edit listing
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <EditBtn label="Edit photos" />
            <EditBtn label="Edit opening times" />
            <EditBtn label="Edit about text" />
            <EditBtn label="Manage fixtures" />
          </div>
        </div>

      </div>
    </div>
  );
}
