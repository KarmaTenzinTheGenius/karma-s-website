'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, Copy, MapPin, Minus, Plus, Share2, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { ProductActions } from '@/components/product-actions';
import { discountedPrice, type Product } from '@/lib/products';

export function ProductDetail({ product, related }: { product: Product; related: Product[] }) {
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('Description');
  const [pincode, setPincode] = useState('');
  const [deliveryMessage, setDeliveryMessage] = useState('');
  const [zoomed, setZoomed] = useState(false);
  const [reviews, setReviews] = useState<{ id: string; name: string; rating: number; comment: string }[]>([]);
  const [reviewMessage, setReviewMessage] = useState('');

  useEffect(() => {
    fetch(`/api/reviews?productId=${product.id}`).then((response) => response.json()).then((result) => setReviews(result.data || [])).catch(() => setReviews([]));
  }, [product.id]);

  async function shareProduct() {
    if (navigator.share) await navigator.share({ title: product.name, url: window.location.href });
    else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Product link copied');
    }
  }

  function checkDelivery(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDeliveryMessage(/^\d{6}$/.test(pincode) ? 'Delivery estimate: 3–6 business days' : 'Enter a valid 6-digit Indian PIN code');
  }

  async function submitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const response = await fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: product.id, name: form.get('name'), rating: Number(form.get('rating')), comment: form.get('comment') }) });
    const result = await response.json();
    if (!response.ok) {
      setReviewMessage(result.message || 'Could not submit the review.');
      return;
    }
    setReviews((current) => [result.data, ...current]);
    setReviewMessage('Thank you. Your review was added to this preview.');
    formElement.reset();
    toast.success('Review submitted');
  }

  return <>
    <div className="product-detail-layout">
      <div className="detail-gallery"><button className={`detail-main-image ${zoomed ? 'zoomed' : ''}`} onClick={() => setZoomed(!zoomed)} aria-label={zoomed ? 'Zoom out product image' : 'Zoom product image'}><Image src={product.image} alt={product.name} width={800} height={700} priority sizes="(max-width: 760px) 100vw, 55vw" /></button><div className="detail-thumbnails"><button className="selected" aria-label={`${product.name} main image`}><Image src={product.image} alt="" width={90} height={90} /></button></div><p className="image-help">Select image to {zoomed ? 'zoom out' : 'zoom in'}</p></div>
      <section className="detail-copy"><div className="breadcrumb"><Link href="/">Home</Link><span>/</span><Link href={`/category/${product.category}`}>{product.category}</Link></div><span className="eyebrow">{product.category}</span><h1>{product.name}</h1><p className="detail-rating"><span aria-label={`${reviews.length} customer reviews`}>{reviews.length ? '★★★★★' : '☆☆☆☆☆'}</span> {reviews.length ? `${(reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)} · ${reviews.length} reviews` : 'No reviews yet'}</p><div className="detail-price"><strong>${discountedPrice(product).toFixed(2)}</strong>{product.discount > 0 && <><del>${product.price.toFixed(2)}</del><span>{product.discount}% off</span></>}<small>Inclusive of applicable taxes</small></div><p className="stock-status"><Check size={16} /> In stock · {product.stock} available</p><p className="sku-line">SKU {product.sku}</p><form className="delivery-check" onSubmit={checkDelivery}><label htmlFor="delivery-pincode"><MapPin size={16} /> Check delivery</label><div><input id="delivery-pincode" inputMode="numeric" maxLength={6} value={pincode} onChange={(event) => setPincode(event.target.value.replace(/\D/g, ''))} placeholder="6-digit PIN code" /><button type="submit">Check</button></div>{deliveryMessage && <small aria-live="polite">{deliveryMessage}</small>}</form><div className="quantity-control"><span>Quantity</span><div><button type="button" aria-label="Decrease quantity" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={15} /></button><span>{quantity}</span><button type="button" aria-label="Increase quantity" onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}><Plus size={15} /></button></div></div><div className="detail-actions"><ProductActions product={product} quantity={quantity} showBuyNow /><button className="share-button" type="button" onClick={shareProduct}><Share2 size={17} /> Share</button></div><div className="delivery-note"><Truck size={18} /><span><strong>Complimentary delivery over $75</strong><small>Estimated dispatch within 1–2 working days</small></span></div></section>
    </div>
    <section className="detail-tabs"><div className="tab-list" role="tablist">{['Description', 'Specifications', 'Reviews', 'Q&A', 'Shipping info'].map((tab) => <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>{tab}</button>)}</div><div className="tab-panel" role="tabpanel"><h2>{activeTab}</h2>{activeTab === 'Description' ? <p>{product.description}</p> : activeTab === 'Specifications' ? <dl><dt>Category</dt><dd>{product.category}</dd><dt>SKU</dt><dd>{product.sku}</dd><dt>Availability</dt><dd>{product.stock} in stock</dd></dl> : activeTab === 'Shipping info' ? <p>Orders are prepared within 1–2 business days. Delivery usually takes 3–6 business days after dispatch. Returns are accepted within 7 days for eligible items.</p> : activeTab === 'Reviews' ? <div className="review-panel">{reviews.map((review) => <article className="review-entry" key={review.id}><strong>{review.name}</strong><span>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span><p>{review.comment}</p></article>)}<form className="review-form" onSubmit={submitReview}><h3>Write a review</h3><label>Your name<input name="name" required maxLength={80} /></label><label>Rating<select name="rating" defaultValue="5"><option value="5">5 stars</option><option value="4">4 stars</option><option value="3">3 stars</option><option value="2">2 stars</option><option value="1">1 star</option></select></label><label>Your review<textarea name="comment" required minLength={8} maxLength={2000} rows={4} /></label><button className="button button-dark" type="submit">Submit review</button>{reviewMessage && <p className="form-feedback" aria-live="polite">{reviewMessage}</p>}</form></div> : <p>Questions about this product? Visit our <Link href="/contact">contact page</Link> and our team will be glad to help.</p>}</div></section>
    <section className="related-section"><div className="section-heading"><div><span className="eyebrow">You may also like</span><h2>Related finds</h2></div><Link className="text-link" href="/products">Shop all <Copy size={15} /></Link></div><div className="product-grid">{related.map((item) => <article className="product-tile" key={item.id}><Link className="product-image-link" href={`/product/${item.slug}`}><Image src={item.image} alt={item.name} width={400} height={300} /><span className="product-category">{item.category}</span></Link><div className="product-tile-info"><Link href={`/product/${item.slug}`}><h3>{item.name}</h3></Link><strong>${discountedPrice(item).toFixed(2)}</strong></div></article>)}</div></section>
  </>;
}