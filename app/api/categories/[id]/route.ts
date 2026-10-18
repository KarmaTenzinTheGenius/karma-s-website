import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminSession())) return NextResponse.json({ success: false, message: 'Admin access is required.' }, { status: 403 });
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (typeof body?.isActive !== 'boolean') return NextResponse.json({ success: false, message: 'Provide a valid category status.' }, { status: 400 });
  try {
    const result = await prisma.category.updateMany({ where: { id }, data: { isActive: body.isActive } });
    return result.count
      ? NextResponse.json({ success: true })
      : NextResponse.json({ success: false, message: 'Category not found.' }, { status: 404 });
  } catch (error) {
    console.error('Category update failed.', error);
    return NextResponse.json({ success: false, message: 'Category could not be updated.' }, { status: 503 });
  }
}
