import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// Proxy Google Places photos server-side so the API key stays secret
// and photo_name references in the DB never expire.
// Usage: /api/photo?name=places/ChIJ.../photos/AXCi2...
export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name');

  if (!name || !/^places\/[^/]+\/photos\/[^/]+$/.test(name)) {
    return new Response('Bad request', { status: 400 });
  }

  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return new Response('Not configured', { status: 500 });

  const apiUrl =
    `https://places.googleapis.com/v1/${name}/media` +
    `?maxWidthPx=800&skipHttpRedirect=true&key=${key}`;

  const res = await fetch(apiUrl, { cache: 'no-store' });
  if (!res.ok) return new Response('Photo not found', { status: 404 });

  const data = (await res.json()) as { photoUri?: string };
  if (!data.photoUri) return new Response('No photo URI', { status: 502 });

  return new Response(null, {
    status: 302,
    headers: {
      Location: data.photoUri,
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
