import { NextResponse } from 'next/server';
import { demoOrders } from '@/lib/demo-orders';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = demoOrders.get(id);
  if (!order) return NextResponse.json({ success: false, message: 'Order not found. Demo orders are temporary.' }, { status: 404 });
  return NextResponse.json({ success: true, data: order, demo: true });
}