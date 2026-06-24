import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirectParam = searchParams.get('redirect') ?? '/dashboard';
  // Reject external URLs — only follow same-origin paths
  const safeRedirect = redirectParam.startsWith('/') ? redirectParam : '/dashboard';

  if (code) {
    const cookieStore = cookies();
    // Create the redirect response first so we can set session cookies on it
    const response = NextResponse.redirect(new URL(safeRedirect, origin));

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return response;
  }

  // Code missing or exchange failed — back to sign-in with error flag
  return NextResponse.redirect(new URL('/claim?error=auth_failed', origin));
}
