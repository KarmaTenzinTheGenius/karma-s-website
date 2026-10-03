'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { products, discountedPrice } from '@/lib/products';
import { ProductActions } from '@/components/product-actions';
import { readWishlist } from '@/lib/client-store';

export function WishlistView() {
  const [ids, setIds] = useState<number[]>([]);
  useEffect(() => {
    const sync = () => setIds(readWishlist());
    sync();
    window.addEventListener('karma-store-change', sync);
    return () => window.removeEventListener('karma-store-change', sync);
  }, []);
  const saved = products.filter((product) => ids.includes(product.id));
  if (!saved.length) return <div className="empty-state cart-empty"><Heart size={26} /><h1>Your wishlist is taking shape.</h1><p>Save the finds you want to come back to.</p><Link className="button button-dark" href="/products">Browse the collection</Link></div>;
  return <section className="wishlist-page"><div className="section-heading"><div><span className="eyebrow">Saved for later</span><h1>Your wishlist</h1></div><span>{saved.length} items</span></div><div className="product-grid">{saved.map((product) => <article className="product-tile" key={product.id}><Link className="product-image-link" href={`/product/${product.slug}`}><Image src={product.image} alt={product.name} width={400} height={300} /></Link><div className="product-tile-info"><Link href={`/product/${product.slug}`}><h3>{product.name}</h3></Link><strong>${discountedPrice(product).toFixed(2)}</strong><ProductActions product={product} /></div></article>)}</div></section>;
}