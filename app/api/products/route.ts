import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { discountedPrice } from '@/lib/products';

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = (params.get('q') || params.get('search') || '').trim();
  const category = (params.get('category') || '').trim();
  const minPrice = Number(params.get('minPrice') || 0);
  const maxPrice = Number(params.get('maxPrice') || Number.MAX_SAFE_INTEGER);
  const discountedOnly = params.get('discounted') === 'true';

  try {
    const rows = await prisma.product.findMany({
      where: {
        isActive: true,
        ...(category ? { category } : {}),
        ...(discountedOnly ? { discount: { gt: 0 } } : {}),
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { category: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { id: 'asc' },
    });

    const data = rows
      .map((row) => ({
        id: row.id,
        slug: row.slug,
        sku: row.sku,
        name: row.name,
        description: row.description,
        category: row.category,
        image: row.image,
        price: Number(row.price),
        discount: row.discount,
        stock: row.stock,
      }))
      .filter((product) => discountedPrice(product) >= minPrice && discountedPrice(product) <= maxPrice);

    return NextResponse.json({ success: true, count: data.length, data });
  } catch (error) {
    console.error('Product lookup failed.', error);
    return NextResponse.json({ success: false, message: 'Products are temporarily unavailable.' }, { status: 503 });
  }
}
