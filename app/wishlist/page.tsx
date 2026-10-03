import type { Metadata } from 'next';
import { WishlistView } from '@/components/wishlist-view';

export const metadata: Metadata = { title: 'Wishlist', robots: { index: false } };

export default function WishlistPage() {
  return <section className="page-wrap cart-page"><WishlistView /></section>;
}