import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

const ALLOWED_KEYS = new Set(['store_name', 'store_description', 'support_email', 'low_stock_threshold']);

export async function GET() {
  if (!(await getAdminSession())) return NextResponse.json({ success: false, message: 'Admin access is required.' }, { status: 403 });
  try {
    const rows = await prisma.storeSetting.findMany({ orderBy: { key: 'asc' } });
    return NextResponse.json({ success: true, data: Object.fromEntries(rows.map(({ key, value }) => [key, value])) });
  } catch (error) {
    console.error('Store settings lookup failed.', error);
    return NextResponse.json({ success: false, message: 'Store settings could not be loaded.' }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  if (!(await getAdminSession())) return NextResponse.json({ success: false, message: 'Admin access is required.' }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ success: false, message: 'Provide store settings.' }, { status: 400 });
  const entries = Object.entries(body as Record<string, unknown>);
  if (!entries.length || entries.some(([key, value]) => !ALLOWED_KEYS.has(key) || typeof value !== 'string' || value.trim().length > 500)) {
    return NextResponse.json({ success: false, message: 'One or more store settings are invalid.' }, { status: 400 });
  }
  const settings = body as Record<string, string>;
  if ('support_email' in settings && settings.support_email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.support_email.trim())) {
    return NextResponse.json({ success: false, message: 'Enter a valid support email address.' }, { status: 400 });
  }
  if ('low_stock_threshold' in settings && (!/^\d+$/.test(settings.low_stock_threshold.trim()) || Number(settings.low_stock_threshold) > 100000)) {
    return NextResponse.json({ success: false, message: 'Low-stock threshold must be a whole number.' }, { status: 400 });
  }
  try {
    await prisma.$transaction(entries.map(([key, value]) => prisma.storeSetting.upsert({
      where: { key },
      create: { key, value: (value as string).trim() },
      update: { value: (value as string).trim() },
    })));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Store settings update failed.', error);
    return NextResponse.json({ success: false, message: 'Store settings could not be saved.' }, { status: 503 });
  }
}
