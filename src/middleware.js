import { NextResponse } from 'next/server';

/**
 * Protects /corporate/dashboard routes.
 *
 * Since this project uses @supabase/supabase-js with localStorage (not cookie)
 * storage, the real auth + role check happens client-side inside the dashboard
 * page via supabase.auth.getSession(). API routes enforce it server-side via JWT.
 *
 * This middleware checks for a lightweight flag cookie (otgj_corp) that is set
 * by /corporate/login after a successful role-verified sign-in. It acts as a
 * URL-bar guard: a user who has never logged in via the corporate portal will be
 * redirected immediately instead of seeing a flash of the dashboard.
 *
 * Security: the flag cookie is NOT the auth token. The dashboard page and every
 * API route in /api/corporate/* independently verify the JWT + corporate role
 * via supabaseAdmin.auth.getUser(token), making the real auth server-enforced.
 */
export function middleware(request) {
  const corpCookie = request.cookies.get('otgj_corp');
  if (!corpCookie) {
    const loginUrl = new URL('/corporate/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/corporate/dashboard/:path*'],
};
