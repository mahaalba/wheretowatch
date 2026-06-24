import { createAdminClient } from '@/lib/supabaseAdmin';
import ClaimsClient from './ClaimsClient';

export const dynamic = 'force-dynamic';

export interface VenueClaim {
  id: string;
  venue_id: string | null;
  venue_name: string | null;
  user_id: string | null;
  email: string | null;
  details: { role?: string; note?: string } | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  venues?: { name: string; area: string | null } | null;
}

export default async function ClaimsPage() {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('venue_claims')
    .select('id, venue_id, venue_name, user_id, email, details, status, created_at, reviewed_at, venues(name, area)')
    .order('created_at', { ascending: false });

  return (
    <ClaimsClient
      claims={(data ?? []) as unknown as VenueClaim[]}
      fetchError={error?.message ?? null}
    />
  );
}
