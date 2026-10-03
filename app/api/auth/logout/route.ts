import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, CUSTOMER_SESSION_COOKIE } from '@/lib/session-token';

export async function POST() {
  const response = NextResponse.json({ success: true });
  for (const name of [CUSTOMER_SESSION_COOKIE, ADMIN_SESSION_COOKIE]) {
    response.cookies.set(name, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
  }
  return response;
}
