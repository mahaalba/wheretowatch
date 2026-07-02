import Link from 'next/link';

const C = {
  green: '#00B368',
  navy: '#0A1A33',
  border: '#E7E9E4',
  bg: '#F6F7F4',
  white: '#fff',
  textMuted: '#5B6577',
};
const FM = "'IBM Plex Mono', monospace";
const FB = "'Inter', sans-serif";

export default function SubmittedPage({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
  const email = searchParams.email ?? '';

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: FB, color: C.navy, display: 'flex', flexDirection: 'column' }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(246,247,244,0.92)', backdropFilter: 'blur(12px)', borderBottom: `1.5px solid ${C.border}` }}>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '14px 20px' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 12, height: 12, borderRadius: 999, background: C.green, boxShadow: '0 0 0 4px rgba(0,179,104,0.18)' }} />
            <span style={{ fontFamily: "'Anton', sans-serif", fontSize: 20, letterSpacing: 0.5, textTransform: 'uppercase', color: C.navy }}>
              Where We <span style={{ color: C.green }}>Watch</span>
            </span>
          </Link>
        </div>
      </nav>

      <main style={{ flex: 1, maxWidth: 600, width: '100%', margin: '0 auto', padding: '80px 20px', boxSizing: 'border-box', textAlign: 'center' }}>
        <div style={{ fontFamily: FM, fontSize: 12, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: C.green, marginBottom: 20 }}>
          Submitted
        </div>
        <h1 style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(36px,6vw,52px)', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 20px', color: C.navy, lineHeight: 1.05 }}>
          You&apos;re on the list.
        </h1>
        <p style={{ fontSize: 17, color: C.textMuted, lineHeight: 1.65, maxWidth: 400, margin: '0 auto 40px' }}>
          We&apos;ve received your venue details and will review them within 24 hours.
          {email && (
            <> We&apos;ll be in touch at <strong style={{ color: C.navy }}>{email}</strong> once you&apos;re live.</>
          )}
        </p>
        <Link href="/" style={{ textDecoration: 'none', background: C.navy, color: C.white, borderRadius: 12, padding: '14px 28px', fontFamily: FB, fontSize: 15, fontWeight: 700, display: 'inline-block' }}>
          Back to Where We Watch
        </Link>
      </main>
    </div>
  );
}
