import type { Metadata } from 'next';
import Link from 'next/link';
import { Check } from 'lucide-react';

export const metadata: Metadata = { title: 'Order received', robots: { index: false } };

export default async function OrderSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <section className="page-wrap success-page">
      <span className="success-icon"><Check size={28} /></span>
      <span className="eyebrow">Thank you for shopping with Karma</span>
      <h1>Your order is in.</h1>
      <p>Order reference <strong>{id}</strong></p>
      <div className="payment-instructions">
        <h2>How to pay</h2>
        <p>Choose one of the two options below, quoting your order reference.</p>
        <dl>
          <dt>mBoB transfer</dt>
          <dd>Send the order total to our mBoB account and use <strong>{id}</strong> as the reference. We dispatch as soon as the transfer is received.</dd>
          <dt>Cash on delivery</dt>
          <dd>Pay the rider in Ngultrum when your parcel arrives. A small cash-handling fee is already included in your total.</dd>
        </dl>
        <p className="summary-note">All amounts are in Bhutanese Ngultrum (Nu.). Delivery is by Bhutan Post or our local courier.</p>
      </div>
      <ol className="order-timeline"><li className="done">Order received</li><li>Confirmed</li><li>Shipped</li><li>Out for delivery</li><li>Delivered</li></ol>
      <div className="success-actions">
        <Link className="button button-dark" href={`/track-order?order=${id}`}>Track this order</Link>
        <Link className="text-link" href="/products">Continue shopping</Link>
      </div>
      <p className="summary-note">Need help? <Link className="text-link" href="/contact">Contact customer care</Link> and quote your order reference.</p>
    </section>
  );
}
