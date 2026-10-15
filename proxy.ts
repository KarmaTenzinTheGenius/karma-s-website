import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_SESSION_COOKIE, CUSTOMER_SESSION_COOKIE, verifySessionToken } from '@/lib/session-token';

/**
 * Routes that require a signed-in customer.
 * Everything else is public: the storefront must be browsable and indexable
 * without an account. Sign-in is only required to place an order.
 */
const PROTECTED_PREFIXES = ['/checkout'];

const PROTECTED_API_PREFIXES = ['/api/orders'];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const needsAuth =
    PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) ||
    PROTECTED_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (!needsAuth) return NextResponse.next();

  const customerSession = await verifySessionToken(request.cookies.get(CUSTOMER_SESSION_COOKIE)?.value);
  const adminSession = await verifySessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  const isAuthenticated = customerSession?.kind === 'customer' || adminSession?.kind === 'admin';

  if (isAuthenticated) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ success: false, message: 'Please sign in to continue.' }, { status: 401 });
  }

  const signInUrl = new URL('/account', request.url);
  signInUrl.searchParams.set('next', `${pathname}${search}`);
  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: [
    '/checkout/:path*',
    '/api/orders/:path*',
  ],
};
