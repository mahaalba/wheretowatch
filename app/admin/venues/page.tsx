import { createAdminClient } from '@/lib/supabaseAdmin';
import VenuesClient from './VenuesClient';

export const dynamic = 'force-dynamic';

export interface AdminVenue {
  id: string;
  name: string;
  area: string | null;
  type: string | null;
  verified: boolean | null;
  auto_tags: string[] | null;
  owner_id: string | null;
}

export default async function VenuesPage() {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('venues')
    .select('id, name, area, type, verified, auto_tags, owner_id')
    .order('name');

  return (
    <VenuesClient
      venues={(data ?? []) as AdminVenue[]}
      fetchError={error?.message ?? null}
    />
  );
}
