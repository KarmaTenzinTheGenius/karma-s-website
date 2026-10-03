import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_SESSION_COOKIE, CUSTOMER_SESSION_COOKIE, verifySessionToken } from '@/lib/session-token';

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isPublicRoute =
    pathname === '/account' ||
    pathname === '/admin' ||
    pathname.startsWith('/api/auth/');

  const customerSession = await verifySessionToken(request.cookies.get(CUSTOMER_SESSION_COOKIE)?.value);
  const adminSession = await verifySessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  const isAuthenticated = customerSession?.kind === 'customer' || adminSession?.kind === 'admin';

  if (pathname === '/account' && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  if (isPublicRoute) return NextResponse.next();
  if (isAuthenticated) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ success: false, message: 'Please sign in to continue.' }, { status: 401 });
  }

  const signInUrl = new URL('/account', request.url);
  signInUrl.searchParams.set('next', `${pathname}${search}`);
  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|image/|robots.txt|sitemap.xml).*)'],
};
