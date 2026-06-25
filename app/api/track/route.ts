import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const venueId  = searchParams.get('venue') ?? 'unknown';
  const linkType = searchParams.get('type') ?? 'unknown';
  const rawUrl   = searchParams.get('url') ?? '';

  // Only redirect to http(s) URLs — reject anything else
  let destination = '/';
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      destination = rawUrl;
    }
  } catch {}

  // Fire PostHog capture — fire-and-forget, never blocks the redirect
  const phKey  = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const phHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.posthog.com';
  if (phKey && destination !== '/') {
    fetch(`${phHost}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: phKey,
        event: 'venue_link_click',
        distinct_id: `venue_${venueId}`,
        properties: {
          venue_id: venueId,
          link_type: linkType,
          destination_url: destination,
        },
      }),
    }).catch(() => {});
  }

  return NextResponse.redirect(destination, { status: 302 });
}
