import { NextResponse } from 'next/server';
import { discountedPrice, products } from '@/lib/products';

export function GET() {
  return NextResponse.json({ success: true, data: [], storage: 'client' });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!Array.isArray(body?.items)) return NextResponse.json({ success: false, message: 'Provide a cart items array.' }, { status: 400 });
  const items = [];
  for (const item of body.items) {
    const product = products.find((entry) => entry.id === Number(item.id));
    const quantity = Number(item.quantity);
    if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > product.stock) {
      return NextResponse.json({ success: false, message: 'A product or quantity is unavailable.' }, { status: 400 });
    }
    items.push({ id: product.id, name: product.name, image: product.image, quantity, unitPrice: discountedPrice(product), lineTotal: Number((discountedPrice(product) * quantity).toFixed(2)) });
  }
  return NextResponse.json({ success: true, data: items, subtotal: Number(items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2)), storage: 'client' });
}