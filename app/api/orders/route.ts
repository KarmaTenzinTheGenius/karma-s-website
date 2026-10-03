import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { discountedPrice, products } from '@/lib/products';
import { demoOrders, validateCoupon, type DemoOrder } from '@/lib/demo-orders';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ success: false, message: 'Your bag is empty.' }, { status: 400 });
  }
  const items: DemoOrder['items'] = [];
  for (const item of body.items) {
    const product = products.find((entry) => entry.id === Number(item.id));
    const quantity = Number(item.quantity);
    if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > product.stock) {
      return NextResponse.json({ success: false, message: 'One or more items are unavailable in the requested quantity.' }, { status: 400 });
    }
    items.push({ id: product.id, name: product.name, quantity, unitPrice: discountedPrice(product) });
  }
  const subtotal = Number(items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0).toFixed(2));
  const couponResult = typeof body.coupon === 'string' && body.coupon ? validateCoupon(body.coupon, subtotal) : { valid: true, discount: 0, message: '' };
  if (!couponResult.valid) return NextResponse.json({ success: false, message: couponResult.message }, { status: 400 });
  const shipping = body.shippingMethod === 'express' ? 12.99 : subtotal >= 75 ? 0 : 4.99;
  const codFee = body.paymentMethod === 'cod' ? 3 : 0;
  const orderId = `KLT-${randomUUID().slice(0, 8).toUpperCase()}`;
  const order: DemoOrder = {
    orderId,
    items,
    subtotal,
    discount: couponResult.discount,
    shipping,
    codFee,
    total: Number((subtotal - couponResult.discount + shipping + codFee).toFixed(2)),
    customer: body.customer && typeof body.customer === 'object' ? body.customer : {},
    paymentMethod: typeof body.paymentMethod === 'string' ? body.paymentMethod : 'cod',
    status: body.paymentMethod === 'cod' ? 'confirmed' : 'pending-payment',
    timestamp: new Date().toISOString(),
  };
  demoOrders.set(orderId, order);
  return NextResponse.json({ success: true, data: order, demo: true }, { status: 201 });
}

export function GET() {
  return NextResponse.json({ success: true, data: [...demoOrders.values()], demo: true });
}