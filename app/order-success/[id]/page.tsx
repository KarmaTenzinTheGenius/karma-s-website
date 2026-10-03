import type { Metadata } from 'next';
import Link from 'next/link';
import { Check } from 'lucide-react';

export const metadata: Metadata = { title: 'Order received', robots: { index: false } };

export default async function OrderSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <section className="page-wrap success-page"><span className="success-icon"><Check size={28} /></span><span className="eyebrow">Thank you for shopping with Karma</span><h1>Your order is in.</h1><p>Order reference <strong>{id}</strong></p><p>Payment and fulfilment are in demo mode. No payment has been collected.</p><ol className="order-timeline"><li className="done">Order received</li><li>Shipped</li><li>Out for delivery</li><li>Delivered</li></ol><div className="success-actions"><Link className="button button-dark" href={`/track-order?order=${id}`}>Track this order</Link><Link className="text-link" href="/products">Continue shopping</Link></div></section>;
}