import { createHash, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  createSessionToken,
  SESSION_MAX_AGE,
  type AdminSession,
} from '@/lib/session-token';

export async function POST(request: Request) {
  const configuredPassword = process.env.ADMIN_PASSWORD;
  const sessionSecret = process.env.SESSION_SECRET;
  if (!configuredPassword || configuredPassword.length < 12 || !sessionSecret || new TextEncoder().encode(sessionSecret).length < 32) {
    return NextResponse.json(
      { success: false, message: 'Admin sign-in is not configured. Set an ADMIN_PASSWORD of at least 12 characters and a 32-character SESSION_SECRET.' },
      { status: 503 },
    );
  }

  let body: { password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Enter the admin password.' }, { status: 400 });
  }
  const password = typeof body.password === 'string' ? body.password : '';
  const submittedHash = createHash('sha256').update(password).digest();
  const configuredHash = createHash('sha256').update(configuredPassword).digest();
  if (!password || !timingSafeEqual(submittedHash, configuredHash)) {
    return NextResponse.json({ success: false, message: 'The admin password is incorrect.' }, { status: 401 });
  }

  const session: AdminSession = {
    kind: 'admin',
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  };
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, await createSessionToken(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}
