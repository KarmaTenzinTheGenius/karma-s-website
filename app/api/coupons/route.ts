import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const code = typeof body?.code === 'string' ? body.code.trim().toUpperCase() : '';
  const subtotal = Number(body?.subtotal);
  if (!code || !Number.isFinite(subtotal) || subtotal < 0) {
    return NextResponse.json({ success: false, message: 'Enter a coupon and a valid subtotal.' }, { status: 400 });
  }

  try {
    const coupon = await prisma.coupon.findUnique({ where: { code } });
    const now = new Date();
    const usable =
      coupon &&
      coupon.isActive &&
      (!coupon.startsAt || coupon.startsAt <= now) &&
      (!coupon.expiresAt || coupon.expiresAt >= now) &&
      (coupon.maxUses === null || coupon.usedCount < coupon.maxUses);

    if (!usable) {
      return NextResponse.json({ success: false, valid: false, discount: 0, message: 'That coupon code is not valid.' }, { status: 400 });
    }

    const minimum = Number(coupon.minimumAmount);
    if (subtotal < minimum) {
      return NextResponse.json(
        { success: false, valid: false, discount: 0, message: `This code applies to orders over Nu. ${minimum.toFixed(2)}.` },
        { status: 400 },
      );
    }

    const amountOff = coupon.amountOff ? Number(coupon.amountOff) : 0;
    const percentOff = coupon.percentOff ? Math.round((subtotal * coupon.percentOff) / 100) : 0;
    const discount = Math.min(subtotal, Math.max(amountOff, percentOff));

    return NextResponse.json({
      success: true,
      valid: true,
      discount,
      code: coupon.code,
      message: `Nu. ${discount.toFixed(2)} discount applied.`,
    });
  } catch (error) {
    console.error('Coupon lookup failed.', error);
    return NextResponse.json({ success: false, message: 'Coupon lookup is temporarily unavailable.' }, { status: 503 });
  }
}
