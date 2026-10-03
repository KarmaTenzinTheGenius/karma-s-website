import { scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  createSessionToken,
  CUSTOMER_SESSION_COOKIE,
  SESSION_MAX_AGE,
  type CustomerSession,
} from '@/lib/session-token';

function hashPassword(password: string, salt: string) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, 64, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export async function POST(request: Request) {
  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Enter your email address and password.' }, { status: 400 });
  }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !password || password.length > 256) {
    return NextResponse.json({ success: false, message: 'Enter your email address and password.' }, { status: 400 });
  }
  const secret = process.env.SESSION_SECRET;
  if (!secret || new TextEncoder().encode(secret).length < 32) {
    return NextResponse.json(
      { success: false, message: 'Account sign-in is not configured. Set a 32-character SESSION_SECRET.' },
      { status: 503 },
    );
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    const [algorithm, salt, storedHash, extra] = user?.passwordHash?.split('$') ?? [];
    if (!user || algorithm !== 'scrypt' || !salt || !storedHash || extra !== undefined) {
      return NextResponse.json({ success: false, message: 'Email or password is incorrect.' }, { status: 401 });
    }
    const expected = Buffer.from(storedHash, 'base64url');
    const actual = await hashPassword(password, salt);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
      return NextResponse.json({ success: false, message: 'Email or password is incorrect.' }, { status: 401 });
    }

    const session: CustomerSession = {
      kind: 'customer',
      userId: user.id,
      exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
    };
    const response = NextResponse.json({ success: true });
    response.cookies.set(CUSTOMER_SESSION_COOKIE, await createSessionToken(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    });
    return response;
  } catch (error) {
    console.error('Account sign-in failed.', error);
    return NextResponse.json(
      { success: false, message: 'Sign-in is temporarily unavailable. Check the database configuration and try again.' },
      { status: 503 },
    );
  }
}
