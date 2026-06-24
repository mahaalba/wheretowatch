import Link from 'next/link';
import AdminSignOutBtn from './AdminSignOutBtn';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#F6F7F4', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", color: '#0A1A33' }}>
      <nav style={{ background: '#fff', borderBottom: '1px solid rgba(10,26,51,0.08)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={{ fontFamily: "'Anton', sans-serif", fontSize: 16, letterSpacing: 0.5, textTransform: 'uppercase', color: '#0A1A33', textDecoration: 'none', flexShrink: 0 }}>
            Where We <span style={{ color: '#00B368' }}>Watch</span>
          </Link>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', background: '#FBE3E0', color: '#9A2A2A', borderRadius: 6, padding: '3px 8px', flexShrink: 0 }}>
            Admin
          </span>
          <div style={{ display: 'flex', gap: 2, flex: 1 }}>
            <Link href="/admin/claims" style={{ fontSize: 13, fontWeight: 700, color: '#0A1A33', textDecoration: 'none', padding: '6px 12px', borderRadius: 8, transition: 'background 0.1s' }}>
              Claims
            </Link>
            <Link href="/admin/venues" style={{ fontSize: 13, fontWeight: 700, color: '#0A1A33', textDecoration: 'none', padding: '6px 12px', borderRadius: 8 }}>
              Venues
            </Link>
          </div>
          <AdminSignOutBtn />
        </div>
      </nav>
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px 80px' }}>
        {children}
      </main>
    </div>
  );
}
