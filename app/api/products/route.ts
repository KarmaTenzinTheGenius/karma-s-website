import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { discountedPrice } from '@/lib/products';
import { getAdminSession } from '@/lib/auth-server';
import { parseProductInput, persistProduct, ProductConflictError } from '@/lib/admin-products';
import { toCatalogProduct } from '@/lib/catalog';

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = (params.get('q') || params.get('search') || '').trim();
  const category = (params.get('category') || '').trim();
  const minPrice = Number(params.get('minPrice') ?? 0);
  const maxPrice = Number(params.get('maxPrice') ?? Number.MAX_SAFE_INTEGER);
  const discountedOnly = params.get('discounted') === 'true';
  const manage = params.get('manage') === 'true';
  const rawIds = params.get('ids');
  const ids = rawIds ? rawIds.split(',').map(Number) : [];
  if (query.length > 160 || !Number.isFinite(minPrice) || !Number.isFinite(maxPrice) || minPrice < 0 || maxPrice < minPrice) {
    return NextResponse.json({ success: false, message: 'Search filters are invalid.' }, { status: 400 });
  }
  if (rawIds && (!ids.length || ids.length > 100 || ids.some((id) => !Number.isInteger(id) || id < 1))) {
    return NextResponse.json({ success: false, message: 'Product ID filters are invalid.' }, { status: 400 });
  }
  const session = manage ? await getAdminSession() : null;
  if (manage && !session) return NextResponse.json({ success: false, message: 'Admin access is required.' }, { status: 403 });
  const page = Math.max(1, Number(params.get('page') || 1));
  const pageSize = Math.min(100, Math.max(1, Number(params.get('pageSize') || 100)));
  const sort = params.get('sort');
  const orderBy = sort === 'price'
    ? { price: params.get('direction') === 'desc' ? 'desc' as const : 'asc' as const }
    : sort === 'name'
      ? { name: params.get('direction') === 'desc' ? 'desc' as const : 'asc' as const }
      : sort === 'stock'
        ? { stock: params.get('direction') === 'desc' ? 'desc' as const : 'asc' as const }
        : { createdAt: params.get('direction') === 'asc' ? 'asc' as const : 'desc' as const };

  try {
    const rows = await prisma.product.findMany({
      where: {
        ...(manage ? {} : { isActive: true, status: 'ACTIVE' as const }),
        ...(ids.length ? { id: { in: ids } } : {}),
        ...(category ? { category } : {}),
        ...(discountedOnly ? { discount: { gt: 0 } } : {}),
        ...(params.get('availability') === 'out-of-stock' ? { stock: 0 } : {}),
        ...(params.get('availability') === 'in-stock' ? { stock: { gt: 0 } } : {}),
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                ...(manage ? [{ sku: { contains: query, mode: 'insensitive' as const } }] : []),
                { category: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { where: { isActive: true }, orderBy: [{ size: 'asc' }, { colorName: 'asc' }] },
      },
      orderBy,
      ...(manage ? {} : { skip: (page - 1) * pageSize, take: pageSize }),
    });

    const data = rows
      .map(toCatalogProduct)
      .filter((product) => discountedPrice(product) >= minPrice && discountedPrice(product) <= maxPrice);

    return NextResponse.json({ success: true, count: data.length, data });
  } catch (error) {
    console.error('Product lookup failed.', error);
    return NextResponse.json({ success: false, message: 'Products are temporarily unavailable.' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!(await getAdminSession())) return NextResponse.json({ success: false, message: 'Admin access is required.' }, { status: 403 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Provide valid product data.' }, { status: 400 });
  }
  const result = parseProductInput(body);
  if ('error' in result) return NextResponse.json({ success: false, message: result.error }, { status: 400 });
  try {
    const product = await persistProduct(result.data);
    return NextResponse.json({ success: true, data: { id: product.id } }, { status: 201 });
  } catch (error) {
    if (error instanceof ProductConflictError) return NextResponse.json({ success: false, message: error.message }, { status: 409 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return NextResponse.json({ success: false, message: 'That SKU is already in use.' }, { status: 409 });
    console.error('Product creation failed.', error);
    return NextResponse.json({ success: false, message: 'Product could not be created.' }, { status: 503 });
  }
}
