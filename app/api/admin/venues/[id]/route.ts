import { NextResponse, type NextRequest } from 'next/server';
import { getCallerEmail } from '@/lib/supabaseServer';
import { createAdminClient } from '@/lib/supabaseAdmin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const email = await getCallerEmail();
  if (!email || email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.verified !== 'boolean') {
    return NextResponse.json({ error: 'Body must contain { verified: boolean }' }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from('venues')
    .update({ verified: body.verified })
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
