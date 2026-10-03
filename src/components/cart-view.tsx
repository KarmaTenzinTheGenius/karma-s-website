'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { readCart, writeCart, type CartLine } from '@/lib/client-store';

export function CartView() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');
  const subtotal = cart.reduce((sum, item) => sum + item.price * (1 - item.discount / 100) * item.quantity, 0);
  const shipping = subtotal >= 75 || subtotal === 0 ? 0 : 4.99;

  useEffect(() => setCart(readCart()), []);

  function updateQuantity(id: number, quantity: number) {
    const updated = quantity < 1 ? cart.filter((item) => item.id !== id) : cart.map((item) => item.id === id ? { ...item, quantity: Math.min(99, quantity) } : item);
    setCart(updated);
    writeCart(updated);
  }

  async function applyCoupon(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch('/api/coupons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: coupon, subtotal }) });
    const result = await response.json();
    setCouponMessage(result.message);
    setDiscount(result.success ? result.discount : 0);
    if (result.success) {
      localStorage.setItem('karma-coupon', coupon.trim().toUpperCase());
      toast.success(result.message);
    } else localStorage.removeItem('karma-coupon');
  }

  if (!cart.length) return <div className="empty-state cart-empty"><span className="eyebrow">Your bag</span><h1>A little room for something good.</h1><p>Your bag is waiting for its first find.</p><Link className="button button-dark" href="/products">Explore the collection</Link></div>;

  return <div className="cart-layout"><section className="cart-lines"><div className="section-heading"><div><span className="eyebrow">Ready when you are</span><h1>Your bag</h1></div><span>{cart.reduce((sum, item) => sum + item.quantity, 0)} items</span></div>{cart.map((item) => <article className="cart-line" key={item.id}><Image src={item.image} alt={item.name} width={140} height={120} /><div className="cart-line-info"><h2>{item.name}</h2><small>{item.discount ? `${item.discount}% offer applied` : 'Everyday find'}</small><strong>${(item.price * (1 - item.discount / 100)).toFixed(2)}</strong><div className="quantity-stepper"><button type="button" aria-label="Decrease quantity" onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus size={14} /></button><span>{item.quantity}</span><button type="button" aria-label="Increase quantity" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus size={14} /></button></div></div><button className="remove-item" type="button" aria-label={`Remove ${item.name}`} onClick={() => updateQuantity(item.id, 0)}><Trash2 size={17} /></button></article>)}</section><aside className="order-summary"><h2>Order summary</h2><div><span>Subtotal</span><strong>${subtotal.toFixed(2)}</strong></div>{discount > 0 && <div><span>Coupon discount</span><strong>−${discount.toFixed(2)}</strong></div>}<div><span>Shipping</span><strong>{shipping ? `$${shipping.toFixed(2)}` : 'Complimentary'}</strong></div><form className="coupon-form" onSubmit={applyCoupon}><label htmlFor="coupon-code">Offer code</label><div><input id="coupon-code" value={coupon} onChange={(event) => setCoupon(event.target.value)} placeholder="Enter code" /><button type="submit">Apply</button></div>{couponMessage && <small aria-live="polite">{couponMessage}</small>}</form><div className="summary-total"><span>Total</span><strong>${Math.max(0, subtotal - discount + shipping).toFixed(2)}</strong></div><Link className="button button-dark checkout-link" href="/checkout">Continue to checkout</Link><p className="summary-note">Taxes included where applicable. Secure checkout.</p></aside></div>;
}