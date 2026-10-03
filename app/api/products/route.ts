import { NextResponse } from 'next/server';
import { discountedPrice, products } from '@/lib/products';

export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = (params.get('q') || params.get('search') || '').trim().toLowerCase();
  const category = (params.get('category') || '').toLowerCase();
  const minPrice = Number(params.get('minPrice') || 0);
  const maxPrice = Number(params.get('maxPrice') || Number.MAX_SAFE_INTEGER);
  const discountedOnly = params.get('discounted') === 'true';
  const result = products.filter((product) => {
    const matchesQuery = !query || `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(query);
    return matchesQuery && (!category || product.category === category) && discountedPrice(product) >= minPrice && discountedPrice(product) <= maxPrice && (!discountedOnly || product.discount > 0);
  });
  return NextResponse.json({ success: true, count: result.length, data: result });
}