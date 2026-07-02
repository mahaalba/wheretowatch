import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return NextResponse.json({ ok: true });

  try {
    const data = await req.json();
    const sports = (data.sports as string[] | undefined) ?? [];
    const methods = (data.booking_methods as string[] | undefined) ?? [];

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `*New venue submission* 🏟️\n\n*Venue:* ${data.venue_name}\n*Area:* ${data.area}\n*Type:* ${data.venue_type}\n*Contact:* ${data.contact_name} (${data.contact_email})\n*Sports:* ${sports.join(', ') || 'Not set'}\n*Booking:* ${methods.join(', ') || 'Not set'}${data.additional_comments ? `\n*Notes:* ${data.additional_comments}` : ''}`,
      }),
    });
  } catch {
    // Don't let Slack errors break the submission
  }

  return NextResponse.json({ ok: true });
}
