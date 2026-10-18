import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  if (!(await getAdminSession())) return NextResponse.json({ success: false, message: 'Admin access is required.' }, { status: 403 });
  try {
    const users = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: { id: true, name: true, email: true, phone: true, createdAt: true, _count: { select: { orders: true } } },
    });
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error('Customer listing failed.', error);
    return NextResponse.json({ success: false, message: 'Customers could not be loaded.' }, { status: 503 });
  }
}
