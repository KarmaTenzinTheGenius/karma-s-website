import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sellingPrice } from '@/lib/products';

export function GET() {
  return NextResponse.json({ success: true, data: [], storage: 'browser-cart' });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!Array.isArray(body?.items)) return NextResponse.json({ success: false, message: 'Provide a cart items array.' }, { status: 400 });
  try {
    const productIds = body.items.map((item: { id?: unknown }) => Number(item.id)).filter((id: number) => Number.isInteger(id));
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true, status: 'ACTIVE' },
      include: { variants: { where: { isActive: true } }, images: { orderBy: { sortOrder: 'asc' } } },
    });
    const items: { id: number; name: string; image: string; quantity: number; variantId: string | null; unitPrice: number; lineTotal: number }[] = [];
    for (const item of body.items) {
      const product = products.find((entry) => entry.id === Number(item.id));
      const quantity = Number(item.quantity);
      const variant = typeof item.variantId === 'string' ? product?.variants.find((entry) => entry.id === item.variantId) : null;
      const stock = variant?.stock ?? product?.stock ?? 0;
      if (!product || ((product.variants.length > 0 || item.variantId !== undefined && item.variantId !== null) && !variant) || !Number.isInteger(quantity) || quantity < 1 || quantity > stock) {
        return NextResponse.json({ success: false, message: 'A product or quantity is unavailable.' }, { status: 400 });
      }
      const image = product.images[0]?.url ?? product.image;
      const unitPrice = sellingPrice(Number(product.price), product.discount);
      items.push({ id: product.id, name: product.name, image, quantity, variantId: variant?.id ?? null, unitPrice, lineTotal: Number((unitPrice * quantity).toFixed(2)) });
    }
    return NextResponse.json({ success: true, data: items, subtotal: Number(items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2)), storage: 'browser-cart' });
  } catch (error) {
    console.error('Cart product validation failed.', error);
    return NextResponse.json({ success: false, message: 'Cart products are temporarily unavailable.' }, { status: 503 });
  }
}