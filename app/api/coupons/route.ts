import { NextResponse } from 'next/server';
import { validateCoupon } from '@/lib/demo-orders';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.code !== 'string' || !Number.isFinite(Number(body.subtotal)) || Number(body.subtotal) < 0) {
    return NextResponse.json({ success: false, message: 'Enter a coupon and a valid subtotal.' }, { status: 400 });
  }
  const result = validateCoupon(body.code, Number(body.subtotal));
  return NextResponse.json({ success: result.valid, ...result }, { status: result.valid ? 200 : 400 });
}