import { NextResponse, type NextRequest } from 'next/server';
import { getCallerEmail } from '@/lib/supabaseServer';
import { createAdminClient } from '@/lib/supabaseAdmin';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const email = await getCallerEmail();
  if (!email || email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const action = body?.action as string | undefined;
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const claimId = params.id;
  const now = new Date().toISOString();

  if (action === 'approve') {
    const { data: claim, error: fetchErr } = await adminClient
      .from('venue_claims')
      .select('venue_id, user_id')
      .eq('id', claimId)
      .single();

    if (fetchErr || !claim) {
      return NextResponse.json({ error: fetchErr?.message ?? 'Claim not found' }, { status: 404 });
    }

    const { error: claimErr } = await adminClient
      .from('venue_claims')
      .update({ status: 'approved', reviewed_at: now })
      .eq('id', claimId);
    if (claimErr) return NextResponse.json({ error: claimErr.message }, { status: 500 });

    if (claim.venue_id && claim.user_id) {
      await adminClient
        .from('venues')
        .update({ owner_id: claim.user_id, claimed: true })
        .eq('id', claim.venue_id);
    }
  } else {
    const { error: claimErr } = await adminClient
      .from('venue_claims')
      .update({ status: 'rejected', reviewed_at: now })
      .eq('id', claimId);
    if (claimErr) return NextResponse.json({ error: claimErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
