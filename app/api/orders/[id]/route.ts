import { NextResponse } from 'next/server';
import { demoOrders } from '@/lib/demo-orders';
import { getAdminSession, getCustomerSession } from '@/lib/auth-server';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const adminSession = await getAdminSession();
  const customerSession = await getCustomerSession();
  if (!adminSession && !customerSession) {
    return NextResponse.json({ success: false, message: 'Please sign in to continue.' }, { status: 401 });
  }
  const order = demoOrders.get(id);
  if (!order) return NextResponse.json({ success: false, message: 'Order not found. Demo orders are temporary.' }, { status: 404 });
  if (!adminSession && customerSession?.userId !== order.userId) {
    return NextResponse.json({ success: false, message: 'This order is not available to your account.' }, { status: 403 });
  }
  return NextResponse.json({ success: true, data: order, demo: true });
}