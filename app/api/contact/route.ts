import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { demoMessages } from '@/lib/demo-contact';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (typeof body?.name !== 'string' || !body.name.trim() || typeof body?.email !== 'string' || !/^\S+@\S+\.\S+$/.test(body.email) || typeof body?.message !== 'string' || body.message.trim().length < 10) {
    return NextResponse.json({ success: false, message: 'Enter your name, a valid email and a message of at least 10 characters.' }, { status: 400 });
  }
  demoMessages.push({ id: randomUUID(), name: body.name.trim().slice(0, 80), email: body.email.trim().slice(0, 254), orderId: String(body.orderId || '').slice(0, 40), message: body.message.trim().slice(0, 2000), createdAt: new Date().toISOString() });
  return NextResponse.json({ success: true, message: 'Thanks. Your message was received in this preview; connect an email service for delivery to the store team.' }, { status: 201 });
}