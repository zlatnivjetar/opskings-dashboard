import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/sign-in', '/sign-up', '/api/auth'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public/auth paths — but redirect already-authenticated
  // users away from sign-in/sign-up to their home page.
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    if (pathname === '/sign-in' || pathname === '/sign-up') {
      const res = await fetch(new URL('/api/auth/get-session', request.url), {
        headers: { cookie: request.headers.get('cookie') ?? '' },
      }).catch(() => null);
      const session: { user?: { role?: string } } | null = res?.ok ? await res.json() : null;
      if (session?.user) {
        return NextResponse.redirect(
          new URL(session.user.role === 'team_member' ? '/dashboard' : '/portal', request.url),
        );
      }
    }
    return NextResponse.next();
  }

  // Server actions and protected API route handlers validate auth internally
  // via getUserContext(); skip redundant middleware session self-fetch checks.
  if (request.headers.has('Next-Action')) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Fetch session via BetterAuth's API (avoids postgres.js in Edge Runtime)
  let session: { user: { role?: string } } | null = null;
  try {
    const res = await fetch(new URL('/api/auth/get-session', request.url), {
      headers: { cookie: request.headers.get('cookie') ?? '' },
    });
    session = res.ok ? await res.json() : null;
  } catch {
    // network error — treat as unauthenticated
  }

  if (!session?.user) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  const { role } = session.user;

  // Redirect root to role home
  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(role === 'team_member' ? '/dashboard' : '/portal', request.url),
    );
  }

  // Redirect removed distribution page to dashboard
  if (pathname === '/distribution') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (role === 'team_member' && pathname.startsWith('/portal')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (role === 'client' && !pathname.startsWith('/portal')) {
    return NextResponse.redirect(new URL('/portal', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
};
