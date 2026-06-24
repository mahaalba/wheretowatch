'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminSignOutBtn() {
  const router = useRouter();
  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
  }
  return (
    <button
      onClick={handleSignOut}
      style={{
        background: 'transparent',
        border: '1px solid rgba(10,26,51,0.14)',
        borderRadius: 999,
        padding: '6px 14px',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 12,
        fontWeight: 600,
        color: '#5B6577',
        cursor: 'pointer',
      }}
    >
      Sign out
    </button>
  );
}
