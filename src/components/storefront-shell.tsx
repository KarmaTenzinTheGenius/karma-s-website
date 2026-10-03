import Link from 'next/link';
import { Facebook, Instagram } from 'lucide-react';
import { StoreHeader } from '@/components/store-header';
import { NewsletterSignup } from '@/components/newsletter-signup';

export function Header() {
  return <StoreHeader />;
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="page-wrap footer-brand-row"><div><Link className="brand" href="/"><span className="brand-mark">K</span><span>KARMA<small>LOKDRUEL TSHONGLEY</small></span></Link><p>Thoughtful finds for everyday life.</p><span className="made-in-india">Made with care in India</span></div><nav className="social-links" aria-label="Social links"><a href="https://www.instagram.com/" aria-label="Instagram" target="_blank" rel="noreferrer"><Instagram size={17} /></a><a href="https://www.facebook.com/" aria-label="Facebook" target="_blank" rel="noreferrer"><Facebook size={17} /></a></nav></div>
      <div className="page-wrap footer-grid">
        <div><h2>Shop by category</h2><Link href="/products">All products</Link>{categoriesForFooter()}</div>
        <div><h2>Customer care</h2><Link href="/contact">Contact us</Link><Link href="/faq">FAQs</Link><Link href="/shipping-policy">Shipping</Link><Link href="/return-policy">Returns</Link><Link href="/track-order">Track an order</Link></div>
        <div><h2>Legal</h2><Link href="/privacy-policy">Privacy policy</Link><Link href="/terms">Terms &amp; conditions</Link><Link href="/refund-cancellation">Refund &amp; cancellation</Link><Link href="/shipping-policy">Shipping policy</Link></div>
        <div><h2>Stay in the loop</h2><p>New arrivals and considered offers, occasionally.</p><NewsletterSignup /><div className="payment-copy"><span>UPI</span><span>VISA</span><span>RuPay</span><span>COD</span></div></div>
      </div>
      <div className="page-wrap footer-bottom"><span>© {new Date().getFullYear()} Karma Lokdruel Tshongley</span><span>Secure checkout · Preview store</span></div>
    </footer>
  );
}

function categoriesForFooter() {
  return <><Link href="/category/clothing">Clothing</Link><Link href="/category/footwear">Footwear</Link><Link href="/category/electronics">Electronics</Link><Link href="/category/accessories">Accessories</Link></>;
}