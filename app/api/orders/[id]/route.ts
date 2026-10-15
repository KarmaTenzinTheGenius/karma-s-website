import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession, getCustomerSession } from '@/lib/auth-server';

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
