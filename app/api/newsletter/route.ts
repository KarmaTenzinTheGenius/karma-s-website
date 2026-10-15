import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ success: false, message: 'Enter a valid email address.' }, { status: 400 });
  }

  try {
    await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: {},
      create: { email },
    });
    return NextResponse.json({ success: true, message: 'You are on the list. Thank you for joining.' }, { status: 201 });
  } catch (error) {
    console.error('Newsletter signup failed.', error);
    return NextResponse.json({ success: false, message: 'Subscription is temporarily unavailable. Please try again.' }, { status: 503 });
  }
}
