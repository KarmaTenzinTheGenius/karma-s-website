import type { Metadata } from 'next';
import { CheckoutFlow } from '@/components/checkout-flow';

export const metadata: Metadata = { title: 'Checkout', robots: { index: false } };

export default function CheckoutPage() {
  return <section className="page-wrap checkout-page"><CheckoutFlow /></section>;
}