'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { readCart, type CartLine } from '@/lib/client-store';

type Address = { name: string; email: string; phone: string; address: string; city: string; state: string; pincode: string };

export function CheckoutFlow() {
  const router = useRouter();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [step, setStep] = useState(1);
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [busy, setBusy] = useState(false);
  const [address, setAddress] = useState<Address>({ name: '', email: '', phone: '', address: '', city: '', state: '', pincode: '' });
  const subtotal = cart.reduce((total, line) => total + line.price * (1 - line.discount / 100) * line.quantity, 0);
  const coupon = typeof window === 'undefined' ? '' : window.localStorage.getItem('karma-coupon') || '';
  const couponDiscount = coupon.toUpperCase() === 'FLAT10' && subtotal >= 50 ? Math.min(10, subtotal) : 0;
  const shipping = shippingMethod === 'express' ? 12.99 : subtotal >= 75 ? 0 : 4.99;
  const codFee = paymentMethod === 'cod' ? 3 : 0;

  useEffect(() => setCart(readCart()), []);

  function saveAddress(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function placeOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cart.length) return;
    setBusy(true);
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cart, coupon, customer: address, shippingMethod, paymentMethod }),
    }).catch(() => null);
    const result = response ? await response.json().catch(() => null) : null;
    if (!response?.ok || !result?.success) {
      setBusy(false);
      toast.error(result?.message || 'Could not place this demo order. Please try again.');
      return;
    }
    localStorage.removeItem('karma-cart');
    localStorage.removeItem('karma-coupon');
    window.dispatchEvent(new Event('karma-store-change'));
    router.push(`/order-success/${result.data.orderId}`);
  }

  if (!cart.length) return <div className="empty-state cart-empty"><h1>Your bag is empty</h1><p>Add something to your bag before checkout.</p><Link className="button button-dark" href="/products">Browse products</Link></div>;

  return <div className="checkout-layout"><section className="checkout-main"><div className="checkout-steps" aria-label="Checkout progress">{['Address', 'Delivery', 'Payment'].map((label, index) => <button key={label} type="button" className={step === index + 1 ? 'active' : step > index + 1 ? 'complete' : ''} onClick={() => step > index + 1 && setStep(index + 1)}><span>{step > index + 1 ? '✓' : index + 1}</span>{label}</button>)}</div>
    {step === 1 && <form className="checkout-form" onSubmit={saveAddress}><span className="eyebrow">Step 1 of 3</span><h1>Where should we send it?</h1><div className="form-grid"><label>Full name<input required autoComplete="name" value={address.name} onChange={(event) => setAddress({ ...address, name: event.target.value })} /></label><label>Email<input required type="email" autoComplete="email" value={address.email} onChange={(event) => setAddress({ ...address, email: event.target.value })} /></label><label>Phone<input required type="tel" inputMode="numeric" pattern="[0-9]{10}" autoComplete="tel" value={address.phone} onChange={(event) => setAddress({ ...address, phone: event.target.value.replace(/\D/g, '').slice(0, 10) })} /></label><label>PIN code<input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="postal-code" value={address.pincode} onChange={(event) => setAddress({ ...address, pincode: event.target.value.replace(/\D/g, '') })} /></label><label className="form-span">Street address<input required autoComplete="street-address" value={address.address} onChange={(event) => setAddress({ ...address, address: event.target.value })} /></label><label>City<input required autoComplete="address-level2" value={address.city} onChange={(event) => setAddress({ ...address, city: event.target.value })} /></label><label>State<input required autoComplete="address-level1" value={address.state} onChange={(event) => setAddress({ ...address, state: event.target.value })} /></label></div><button className="button button-dark" type="submit">Choose delivery</button></form>}
    {step === 2 && <section className="checkout-form"><span className="eyebrow">Step 2 of 3</span><h1>Choose delivery</h1><label className="choice-row"><input type="radio" name="shipping" checked={shippingMethod === 'standard'} onChange={() => setShippingMethod('standard')} /><span><strong>Standard delivery</strong><small>{subtotal >= 75 ? 'Complimentary · 3–6 business days' : '$4.99 · 3–6 business days'}</small></span></label><label className="choice-row"><input type="radio" name="shipping" checked={shippingMethod === 'express'} onChange={() => setShippingMethod('express')} /><span><strong>Express delivery</strong><small>$12.99 · 1–3 business days</small></span></label><div className="checkout-buttons"><button className="button button-outline" type="button" onClick={() => setStep(1)}>Back</button><button className="button button-dark" type="button" onClick={() => setStep(3)}>Choose payment</button></div></section>}
    {step === 3 && <form className="checkout-form" onSubmit={placeOrder}><span className="eyebrow">Step 3 of 3</span><h1>How would you like to pay?</h1><div className="payment-options">{[['upi', 'UPI', 'Google Pay, PhonePe, Paytm'], ['card', 'Credit or debit card', 'Visa, Mastercard and RuPay'], ['netbanking', 'NetBanking', 'All major Indian banks'], ['wallet', 'Wallet', 'Supported digital wallets'], ['cod', 'Cash on delivery', 'Pay when your order arrives · $3 fee']].map(([value, title, caption]) => <label className="choice-row" key={value}><input type="radio" name="payment" value={value} checked={paymentMethod === value} onChange={() => setPaymentMethod(value)} /><span><strong>{title}</strong><small>{caption}</small></span></label>)}</div><p className="demo-payment-note">Demo checkout only. UPI, cards and online payment options do not charge money until a Razorpay or Cashfree account is configured.</p><div className="checkout-buttons"><button className="button button-outline" type="button" onClick={() => setStep(2)}>Back</button><button className="button button-dark" type="submit" disabled={busy}>{busy ? 'Placing order…' : paymentMethod === 'cod' ? 'Place COD order' : 'Place demo order'}</button></div></form>}
    </section><aside className="order-summary checkout-summary"><h2>Your order</h2>{cart.map((line) => <div className="checkout-line" key={line.id}><Image src={line.image} alt="" width={54} height={54} /><span>{line.name} <small>× {line.quantity}</small></span><strong>${(line.price * (1 - line.discount / 100) * line.quantity).toFixed(2)}</strong></div>)}<div><span>Subtotal</span><strong>${subtotal.toFixed(2)}</strong></div>{couponDiscount > 0 && <div><span>FLAT10</span><strong>−${couponDiscount.toFixed(2)}</strong></div>}<div><span>Shipping</span><strong>${shipping.toFixed(2)}</strong></div>{codFee > 0 && <div><span>COD charge</span><strong>${codFee.toFixed(2)}</strong></div>}<div className="summary-total"><span>Total</span><strong>${(subtotal - couponDiscount + shipping + codFee).toFixed(2)}</strong></div><p className="summary-note">Prices include applicable taxes.</p></aside></div>;
}