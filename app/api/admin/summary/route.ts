import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  if (!(await getAdminSession())) return NextResponse.json({ success: false, message: 'Admin access is required.' }, { status: 403 });
  try {
    const thresholdSetting = await prisma.storeSetting.findUnique({ where: { key: 'low_stock_threshold' }, select: { value: true } });
    const threshold = Math.max(0, Number(thresholdSetting?.value ?? 5) || 0);
    const [products, variants, lowStockVariants, outOfStockVariants, orders, customers] = await Promise.all([
      prisma.product.count(),
      prisma.productVariant.count({ where: { isActive: true } }),
      prisma.productVariant.count({ where: { isActive: true, stock: { gt: 0, lte: threshold } } }),
      prisma.productVariant.count({ where: { isActive: true, stock: 0 } }),
      prisma.order.count(),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
    ]);
    const lowStockProducts = await prisma.product.count({ where: { variants: { none: { isActive: true } }, stock: { gt: 0, lte: threshold } } });
    const outOfStockProducts = await prisma.product.count({ where: { variants: { none: { isActive: true } }, stock: 0 } });
    return NextResponse.json({
      success: true,
      data: { products, variants, lowStock: lowStockVariants + lowStockProducts, outOfStock: outOfStockVariants + outOfStockProducts, orders, customers },
    });
  } catch (error) {
    console.error('Admin summary failed to load.', error);
    return NextResponse.json({ success: false, message: 'Dashboard statistics are temporarily unavailable.' }, { status: 503 });
  }
}
