import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getAdminSession } from '@/lib/auth-server';
import { parseProductInput, persistProduct, ProductConflictError, ProductNotFoundError } from '@/lib/admin-products';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminSession())) return NextResponse.json({ success: false, message: 'Admin access is required.' }, { status: 403 });
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id < 1) return NextResponse.json({ success: false, message: 'Invalid product ID.' }, { status: 400 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Provide valid product data.' }, { status: 400 });
  }
  const result = parseProductInput(body);
  if ('error' in result) return NextResponse.json({ success: false, message: result.error }, { status: 400 });

  try {
    const product = await persistProduct(result.data, id);
    return NextResponse.json({ success: true, data: { id: product.id } });
  } catch (error) {
    if (error instanceof ProductNotFoundError) return NextResponse.json({ success: false, message: 'Product not found.' }, { status: 404 });
    if (error instanceof ProductConflictError) return NextResponse.json({ success: false, message: error.message }, { status: 409 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return NextResponse.json({ success: false, message: 'That SKU is already in use.' }, { status: 409 });
    console.error('Product update failed.', error);
    return NextResponse.json({ success: false, message: 'Product could not be updated.' }, { status: 503 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminSession())) return NextResponse.json({ success: false, message: 'Admin access is required.' }, { status: 403 });
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id < 1) return NextResponse.json({ success: false, message: 'Invalid product ID.' }, { status: 400 });
  try {
    const result = await prisma.product.deleteMany({ where: { id } });
    return result.count
      ? NextResponse.json({ success: true })
      : NextResponse.json({ success: false, message: 'Product not found.' }, { status: 404 });
  } catch (error) {
    console.error('Product deletion failed.', error);
    return NextResponse.json({ success: false, message: 'Product could not be deleted.' }, { status: 503 });
  }
}
