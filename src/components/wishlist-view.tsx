'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '@/lib/products';
import { discountedPrice } from '@/lib/products';
import { ProductActions } from '@/components/product-actions';
import { readWishlist } from '@/lib/client-store';
import { formatMoney } from '@/lib/currency';

export function WishlistView() {
  const [ids, setIds] = useState<number[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const sync = () => {
      const savedIds = readWishlist();
      setIds(savedIds);
      setLoading(Boolean(savedIds.length));
      if (!savedIds.length) {
        setProducts([]);
        setLoading(false);
        return;
      }
      fetch(`/api/products?ids=${savedIds.join(',')}`)
        .then((response) => {
          if (!response.ok) throw new Error('Wishlist products could not be loaded.');
          return response.json();
        })
        .then((result: { data?: Product[] }) => setProducts(result.data ?? []))
        .catch((error: unknown) => {
          setProducts([]);
          toast.error(error instanceof Error ? error.message : 'Wishlist products could not be loaded.');
        })
        .finally(() => setLoading(false));
    };
    sync();
    window.addEventListener('karma-store-change', sync);
    return () => window.removeEventListener('karma-store-change', sync);
  }, []);
  const saved = products.filter((product) => ids.includes(product.id));
  if (loading) return <p className="admin-empty">Loading wishlist…</p>;
  if (!saved.length) return <div className="empty-state cart-empty"><Heart size={26} /><h1>Your wishlist is taking shape.</h1><p>Save the finds you want to come back to.</p><Link className="button button-dark" href="/products">Browse the collection</Link></div>;
  return <section className="wishlist-page"><div className="section-heading"><div><span className="eyebrow">Saved for later</span><h1>Your wishlist</h1></div><span>{saved.length} items</span></div><div className="product-grid">{saved.map((product) => <article className="product-tile" key={product.id}><Link className="product-image-link" href={`/product/${product.slug}`}><Image src={product.image} alt={product.name} width={400} height={300} /></Link><div className="product-tile-info"><Link href={`/product/${product.slug}`}><h3>{product.name}</h3></Link><strong>{formatMoney(discountedPrice(product))}</strong><ProductActions product={product} /></div></article>)}</div></section>;
}