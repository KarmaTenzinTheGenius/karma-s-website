import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession, getCustomerSession } from '@/lib/auth-server';

const ORDER_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED'],
  SHIPPED: ['OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED', 'REFUNDED'],
  DELIVERED: ['REFUNDED'],
};

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const adminSession = await getAdminSession();
  const customerSession = await getCustomerSession();

  if (!adminSession && !customerSession) {
    return NextResponse.json({ success: false, message: 'Please sign in to continue.' }, { status: 401 });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber: id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ success: false, message: 'We could not find an order with that reference.' }, { status: 404 });
    }
    if (!adminSession && customerSession?.userId !== order.userId) {
      return NextResponse.json({ success: false, message: 'This order is not available to your account.' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.orderNumber,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        subtotal: Number(order.subtotal),
        discount: Number(order.discount),
        shipping: Number(order.shipping),
        total: Number(order.total),
        timestamp: order.createdAt.toISOString(),
        items: order.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
        })),
      },
    });
  } catch (error) {
    console.error('Order lookup failed.', error);
    return NextResponse.json({ success: false, message: 'Order lookup is temporarily unavailable.' }, { status: 503 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminSession())) return NextResponse.json({ success: false, message: 'Admin access is required.' }, { status: 403 });
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const nextStatus = body?.status;
  if (typeof nextStatus !== 'string' || !['PENDING', 'CONFIRMED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED'].includes(nextStatus)) {
    return NextResponse.json({ success: false, message: 'Choose a valid order status.' }, { status: 400 });
  }
  try {
    const updated = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { orderNumber: id }, include: { items: true } });
      if (!order) return null;
      if (!ORDER_TRANSITIONS[order.status]?.includes(nextStatus)) throw new Error('INVALID_ORDER_TRANSITION');
      const statusUpdate = await tx.order.updateMany({
        where: { id: order.id, status: order.status },
        data: { status: nextStatus as typeof order.status, ...(nextStatus === 'REFUNDED' ? { paymentStatus: 'REFUNDED' } : {}) },
      });
      if (!statusUpdate.count) throw new Error('ORDER_STATUS_CHANGED');
      if (nextStatus === 'CANCELLED' || nextStatus === 'REFUNDED') {
        const alreadyRestored = await tx.stockMovement.findFirst({
          where: { orderId: order.id, reason: 'order_stock_restored' },
          select: { id: true },
        });
        if (!alreadyRestored) {
          for (const item of order.items) {
            if (item.variantId) {
              const variant = await tx.productVariant.updateMany({
                where: { id: item.variantId },
                data: { stock: { increment: item.quantity } },
              });
              if (variant.count && item.productId) {
                await tx.product.updateMany({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
                await tx.stockMovement.create({ data: { productId: item.productId, variantId: item.variantId, change: item.quantity, reason: 'order_stock_restored', orderId: order.id } });
              }
            } else if (item.productId) {
              await tx.product.updateMany({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
              await tx.stockMovement.create({ data: { productId: item.productId, change: item.quantity, reason: 'order_stock_restored', orderId: order.id } });
            }
          }
        }
      }
      return { orderId: order.orderNumber, status: nextStatus };
    });
    if (!updated) return NextResponse.json({ success: false, message: 'Order not found.' }, { status: 404 });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_ORDER_TRANSITION') {
      return NextResponse.json({ success: false, message: 'That order status change is not allowed.' }, { status: 409 });
    }
    if (error instanceof Error && error.message === 'ORDER_STATUS_CHANGED') {
      return NextResponse.json({ success: false, message: 'The order was updated by another request. Reload and try again.' }, { status: 409 });
    }
    console.error('Order status update failed.', error);
    return NextResponse.json({ success: false, message: 'Order status could not be updated.' }, { status: 503 });
  }
}
