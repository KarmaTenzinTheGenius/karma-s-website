import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  const orderId = typeof body?.orderId === 'string' ? body.orderId.trim().slice(0, 40) : '';

  if (!name || name.length > 80 || !/^\S+@\S+\.\S+$/.test(email) || email.length > 254 || message.length < 10 || message.length > 2000) {
    return NextResponse.json(
      { success: false, message: 'Enter your name, a valid email and a message of at least 10 characters.' },
      { status: 400 },
    );
  }

  try {
    await prisma.contactMessage.create({
      data: { name, email, message, orderId: orderId || null },
    });
    return NextResponse.json(
      { success: true, message: 'Thank you. Your message has been received and our team will reply during shop hours.' },
      { status: 201 },
    );
  } catch (error) {
    console.error('Contact message failed.', error);
    return NextResponse.json({ success: false, message: 'Your message could not be sent. Please try again.' }, { status: 503 });
  }
}
