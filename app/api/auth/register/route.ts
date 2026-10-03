import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
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
  const secret = process.env.SESSION_SECRET;
  if (!secret || new TextEncoder().encode(secret).length < 32) {
    return NextResponse.json(
      { success: false, message: 'Account sign-in is not configured. Set a 32-character SESSION_SECRET.' },
      { status: 503 },
    );
  }

  let body: { name?: unknown; email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Enter a valid name, email address, and password.' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!name || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || password.length < 10 || password.length > 256) {
    return NextResponse.json(
      { success: false, message: 'Use a valid email address and a password between 10 and 256 characters.' },
      { status: 400 },
    );
  }

  try {
    const salt = randomBytes(16).toString('base64url');
    const passwordHash = `scrypt$${salt}$${(await hashPassword(password, salt)).toString('base64url')}`;
    const user = await prisma.user.create({ data: { name, email, passwordHash } });
    const session: CustomerSession = {
      kind: 'customer',
      userId: user.id,
      exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
    };
    const response = NextResponse.json({ success: true }, { status: 201 });
    response.cookies.set(CUSTOMER_SESSION_COOKIE, await createSessionToken(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    });
    return response;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ success: false, message: 'An account already exists for that email address.' }, { status: 409 });
    }
    console.error('Account registration failed.', error);
    return NextResponse.json(
      { success: false, message: 'Account creation is temporarily unavailable. Check the database configuration and try again.' },
      { status: 503 },
    );
  }
}
