'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '@/lib/products';
import { addProductToCart, readWishlist, writeWishlist } from '@/lib/client-store';

export function ProductActions({ product, quantity = 1, showBuyNow = false }: { product: Product; quantity?: number; showBuyNow?: boolean }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  useEffect(() => setSaved(readWishlist().includes(product.id)), [product.id]);

  function addToBag() {
    addProductToCart({ id: product.id, name: product.name, price: product.price, image: product.image, discount: product.discount }, quantity);
    toast.success(`${product.name} added to your bag`);
  }

  function toggleWishlist() {
    const wishlist = readWishlist();
    const next = wishlist.includes(product.id) ? wishlist.filter((id) => id !== product.id) : [...wishlist, product.id];
    writeWishlist(next);
    setSaved(next.includes(product.id));
    toast.success(next.includes(product.id) ? 'Saved to your wishlist' : 'Removed from your wishlist');
  }

  function buyNow() {
    addToBag();
    router.push('/checkout');
  }

  return <div className="product-actions"><button className="button button-dark" type="button" onClick={addToBag} disabled={product.stock < 1}><ShoppingBag size={17} /> Add to bag</button><button className={`icon-button ${saved ? 'is-saved' : ''}`} type="button" onClick={toggleWishlist} aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}><Heart size={19} fill={saved ? 'currentColor' : 'none'} /></button>{showBuyNow && <button className="button button-outline" type="button" onClick={buyNow} disabled={product.stock < 1}>Buy now</button>}</div>;
}