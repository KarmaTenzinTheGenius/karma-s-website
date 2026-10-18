'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, Copy, MapPin, Minus, Plus, Share2, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { ProductActions } from '@/components/product-actions';
import { discountedPrice, type Product } from '@/lib/products';
import {
  formatMoney,
  FREE_SHIPPING_THRESHOLD,
} from '@/lib/currency';
import { POSTAL_CODE_PATTERN, POSTAL_CODE_HINT } from '@/lib/bhutan';

export function ProductDetail({ product, related }: { product: Product; related: Product[] }) {
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(product.image);
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants?.[0]?.id ?? '');
  const [activeTab, setActiveTab] = useState('Description');
  const [pincode, setPincode] = useState('');
  const [deliveryMessage, setDeliveryMessage] = useState('');
  const [zoomed, setZoomed] = useState(false);
  const [reviews, setReviews] = useState<{ id: string; name: string; rating: number; comment: string }[]>([]);
  const [reviewMessage, setReviewMessage] = useState('');
  const selectedVariant = product.variants?.find((variant) => variant.id === selectedVariantId);
  const availableStock = product.variants?.length ? selectedVariant?.stock ?? 0 : product.stock;

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
    setDeliveryMessage(POSTAL_CODE_PATTERN.test(pincode) ? 'Delivery estimate: 3–6 business days' : `Enter a valid ${POSTAL_CODE_HINT}`);
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
    setReviewMessage('Thank you. Your review has been submitted and will appear once approved.');
    formElement.reset();
    toast.success('Review submitted');
  }

  return <>
    <div className="product-detail-layout">
      <div className="detail-gallery"><button className={`detail-main-image ${zoomed ? 'zoomed' : ''}`} onClick={() => setZoomed(!zoomed)} aria-label={zoomed ? 'Zoom out product image' : 'Zoom product image'}><Image src={activeImage} alt={product.name} width={800} height={700} priority sizes="(max-width: 760px) 100vw, 55vw" /></button><div className="detail-thumbnails">{(product.images?.length ? product.images : [{ id: 'main', url: product.image, sortOrder: 0, isPrimary: true }]).map((image) => <button className={activeImage === image.url ? 'selected' : ''} key={image.id} type="button" aria-label={`View ${product.name} image`} onClick={() => setActiveImage(image.url)}><Image src={image.url} alt="" width={90} height={90} /></button>)}</div><p className="image-help">Select image to {zoomed ? 'zoom out' : 'zoom in'}</p></div>
      <section className="detail-copy"><div className="breadcrumb"><Link href="/">Home</Link><span>/</span><Link href={`/category/${product.category}`}>{product.category}</Link></div><span className="eyebrow">{product.category}</span><h1>{product.name}</h1><p className="detail-rating"><span aria-label={`${reviews.length} customer reviews`}>{reviews.length ? '★★★★★' : '☆☆☆☆☆'}</span> {reviews.length ? `${(reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)} · ${reviews.length} reviews` : 'No reviews yet'}</p><div className="detail-price"><strong>{formatMoney(discountedPrice(product))}</strong>{product.discount > 0 && <>      <del>{formatMoney(product.mrp ?? product.price)}</del><span>{product.discount}% off</span></>}<small>Inclusive of applicable taxes</small></div><p className={`stock-status ${availableStock < 1 ? 'out-of-stock' : ''}`}>{availableStock > 0 ? <><Check size={16} /> In stock · {availableStock} available</> : 'Out of stock'}</p><p className="sku-line">SKU {product.sku}</p>{product.variants?.length ? <label className="variant-select-label" htmlFor="product-variant">Size and colour<select id="product-variant" value={selectedVariantId} onChange={(event) => { setSelectedVariantId(event.target.value); setQuantity(1); }}><option value="">Choose an option</option>{product.variants.map((variant) => <option key={variant.id} value={variant.id} disabled={variant.stock < 1}>{[variant.size, variant.colorName].filter(Boolean).join(' / ')} · {variant.stock ? `${variant.stock} available` : 'Out of stock'}</option>)}</select></label> : null}<form className="delivery-check" onSubmit={checkDelivery}><label htmlFor="delivery-pincode"><MapPin size={16} /> Check delivery</label><div><input id="delivery-pincode" inputMode="numeric" maxLength={5} value={pincode} onChange={(event) => setPincode(event.target.value.replace(/\D/g, ''))} placeholder="5-digit postal code" /><button type="submit">Check</button></div>{deliveryMessage && <small aria-live="polite">{deliveryMessage}</small>}</form><div className="quantity-control"><span>Quantity</span><div><button type="button" aria-label="Decrease quantity" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={15} /></button><span>{quantity}</span><button type="button" aria-label="Increase quantity" disabled={availableStock < 1} onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}><Plus size={15} /></button></div></div><div className="detail-actions"><ProductActions product={product} quantity={quantity} showBuyNow variant={selectedVariant} /><button className="share-button" type="button" onClick={shareProduct}><Share2 size={17} /> Share</button></div><div className="delivery-note"><Truck size={18} /><span><strong>Complimentary delivery over {formatMoney(FREE_SHIPPING_THRESHOLD)}</strong><small>Estimated dispatch within 1–2 working days</small></span></div></section>
    </div>
    <section className="detail-tabs"><div className="tab-list" role="tablist">{['Description', 'Specifications', 'Reviews', 'Q&A', 'Shipping info'].map((tab) => <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>{tab}</button>)}</div><div className="tab-panel" role="tabpanel"><h2>{activeTab}</h2>{activeTab === 'Description' ? <p>{product.description}</p> : activeTab === 'Specifications' ? <dl><dt>Category</dt><dd>{product.category}</dd><dt>SKU</dt><dd>{product.sku}</dd><dt>Availability</dt><dd>{product.stock} in stock</dd></dl> : activeTab === 'Shipping info' ? <p>Orders are prepared within 1–2 business days. Delivery usually takes 3–6 business days after dispatch. Returns are accepted within 7 days for eligible items.</p> : activeTab === 'Reviews' ? <div className="review-panel">{reviews.map((review) => <article className="review-entry" key={review.id}><strong>{review.name}</strong><span>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span><p>{review.comment}</p></article>)}<form className="review-form" onSubmit={submitReview}><h3>Write a review</h3><label>Your name<input name="name" required maxLength={80} /></label><label>Rating<select name="rating" defaultValue="5"><option value="5">5 stars</option><option value="4">4 stars</option><option value="3">3 stars</option><option value="2">2 stars</option><option value="1">1 star</option></select></label><label>Your review<textarea name="comment" required minLength={8} maxLength={2000} rows={4} /></label><button className="button button-dark" type="submit">Submit review</button>{reviewMessage && <p className="form-feedback" aria-live="polite">{reviewMessage}</p>}</form></div> : <p>Questions about this product? Visit our <Link href="/contact">contact page</Link> and our team will be glad to help.</p>}</div></section>
    <section className="related-section"><div className="section-heading"><div><span className="eyebrow">You may also like</span><h2>Related finds</h2></div><Link className="text-link" href="/products">Shop all <Copy size={15} /></Link></div><div className="product-grid">{related.map((item) => <article className="product-tile" key={item.id}><Link className="product-image-link" href={`/product/${item.slug}`}><Image src={item.image} alt={item.name} width={400} height={300} /><span className="product-category">{item.category}</span></Link><div className="product-tile-info"><Link href={`/product/${item.slug}`}><h3>{item.name}</h3></Link><strong>{formatMoney(discountedPrice(item))}</strong></div></article>)}</div></section>
  </>;
}