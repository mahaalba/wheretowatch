import Link from 'next/link';

export const metadata = { title: 'Terms and Conditions — Where We Watch' };

export default function TermsPage() {
  return (
    <div style={{ background: '#F6F7F4', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", color: '#0A1A33' }}>
      <nav style={{ background: '#fff', borderBottom: '1px solid rgba(10,26,51,0.08)', padding: '14px 24px' }}>
        <Link href="/" style={{ textDecoration: 'none', fontFamily: "'Anton', sans-serif", fontSize: 20, letterSpacing: 0.5, textTransform: 'uppercase', color: '#0A1A33' }}>
          Where We <span style={{ color: '#00B368' }}>Watch</span>
        </Link>
      </nav>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '64px 24px 80px' }}>
        <h1 style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(28px,5vw,42px)', textTransform: 'uppercase', letterSpacing: 0.4, color: '#0A1A33', margin: '0 0 24px' }}>
          Terms and Conditions
        </h1>
        <p style={{ fontSize: 15, color: '#5B6577', lineHeight: 1.7 }}>
          Policy coming soon — contact{' '}
          <a href="mailto:info@wherewewatch.co.uk" style={{ color: '#0A6B45', textDecoration: 'underline' }}>
            info@wherewewatch.co.uk
          </a>{' '}
          for questions.
        </p>
      </div>
    </div>
  );
}
