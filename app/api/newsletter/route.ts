import { NextResponse } from 'next/server';
import { demoSubscribers } from '@/lib/demo-contact';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ success: false, message: 'Enter a valid email address.' }, { status: 400 });
  demoSubscribers.add(email);
  return NextResponse.json({ success: true, message: 'You are on the preview list. Connect an email provider to send newsletters.' }, { status: 201 });
}