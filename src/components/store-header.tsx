'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, Moon, Search, ShoppingBag, Sun, UserRound } from 'lucide-react';
import { products } from '@/lib/products';
import { readCart, readWishlist } from '@/lib/client-store';

export function StoreHeader() {
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const syncCounts = () => {
      setCartCount(readCart().reduce((total, line) => total + line.quantity, 0));
      setWishlistCount(readWishlist().length);
    };
    syncCounts();
    const storedTheme = localStorage.getItem('karma-theme');
    const prefersDark = storedTheme === 'dark';
    document.documentElement.dataset.theme = prefersDark ? 'dark' : 'light';
    setDarkMode(prefersDark);
    window.addEventListener('storage', syncCounts);
    window.addEventListener('karma-store-change', syncCounts);
    return () => {
      window.removeEventListener('storage', syncCounts);
      window.removeEventListener('karma-store-change', syncCounts);
    };
  }, []);

  const suggestions = query.trim()
    ? products.filter((product) => product.name.toLowerCase().includes(query.toLowerCase())).slice(0, 4)
    : [];

  function toggleTheme() {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.dataset.theme = next ? 'dark' : 'light';
    localStorage.setItem('karma-theme', next ? 'dark' : 'light');
  }

  return (
    <header className="site-header">
      <div className="header-main page-wrap">
        <Link className="brand" href="/" aria-label="Karma home"><span className="brand-mark">K</span><span>KARMA<small>LOKDRUEL TSHONGLEY</small></span></Link>
        <form className="search search-wrap" action="/products" role="search" onSubmit={() => setFocused(false)}>
          <Search size={18} aria-hidden="true" />
          <input type="search" name="q" value={query} onChange={(event) => setQuery(event.target.value)} onFocus={() => setFocused(true)} onBlur={() => window.setTimeout(() => setFocused(false), 140)} placeholder="Search the collection" aria-label="Search products" autoComplete="off" />
          <button type="submit">Search</button>
          {focused && suggestions.length > 0 && <div className="search-suggestions" role="listbox">{suggestions.map((product) => <Link key={product.id} href={`/product/${product.slug}`} role="option"><span>{product.name}</span><small>{product.category}</small></Link>)}</div>}
        </form>
        <nav className="header-actions" aria-label="Account and shopping">
          <details className="account-menu"><summary><UserRound size={19} /><span>Account</span></summary><div className="account-dropdown"><strong>Your account</strong><Link href="/account">Sign in / Register</Link><Link href="/account?view=orders">My orders</Link><Link href="/track-order">Track an order</Link></div></details>
          <Link href="/wishlist"><span className="action-icon"><Heart size={19} />{wishlistCount > 0 && <b>{wishlistCount}</b>}</span><span>Wishlist</span></Link>
          <Link href="/cart"><span className="action-icon"><ShoppingBag size={19} />{cartCount > 0 && <b>{cartCount}</b>}</span><span>Bag</span></Link>
          <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}>{darkMode ? <Sun size={18} /> : <Moon size={18} />}</button>
        </nav>
      </div>
      <div className="header-subnav"><nav className="page-wrap subnav-inner" aria-label="Shop navigation"><Link href="/products">Shop all</Link><Link href="/category/clothing">Clothing</Link><Link href="/category/footwear">Footwear</Link><Link href="/category/electronics">Electronics</Link><Link href="/products?discounted=true">Offers</Link><Link href="/about">Our story</Link></nav></div>
    </header>
  );
}