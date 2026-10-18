import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { productSlug } from '@/lib/admin-products';

export async function GET(request: Request) {
  const manage = new URL(request.url).searchParams.get('manage') === 'true';
  if (manage && !(await getAdminSession())) return NextResponse.json({ success: false, message: 'Admin access is required.' }, { status: 403 });
  try {
    const rows = await prisma.category.findMany({
      where: manage ? {} : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, slug: true, isActive: true },
    });
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('Category lookup failed.', error);
    return NextResponse.json({ success: false, message: 'Categories are temporarily unavailable.' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!(await getAdminSession())) return NextResponse.json({ success: false, message: 'Admin access is required.' }, { status: 403 });
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 80) : '';
  const slug = productSlug(name);
  if (!name || slug === 'product') return NextResponse.json({ success: false, message: 'Enter a valid category name.' }, { status: 400 });
  try {
    const category = await prisma.category.create({ data: { name, slug } });
    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ success: false, message: 'A category with that name already exists.' }, { status: 409 });
    }
    console.error('Category creation failed.', error);
    return NextResponse.json({ success: false, message: 'Category could not be created.' }, { status: 503 });
  }
}
