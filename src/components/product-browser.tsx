'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { LayoutGrid, List } from 'lucide-react';
import { ProductActions } from '@/components/product-actions';
import { categories, discountedPrice, type Product } from '@/lib/products';

export function ProductBrowser({ products, query = '', category = '', discountedOnly = false }: { products: Product[]; query?: string; category?: string; discountedOnly?: boolean }) {
  const [maximum, setMaximum] = useState(2000);
  const [minimumDiscount, setMinimumDiscount] = useState(0);
  const [sort, setSort] = useState('popular');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState(category);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [page, setPage] = useState(1);

  let visible = products.filter((product) => discountedPrice(product) <= maximum && product.discount >= minimumDiscount && (!selectedCategory || product.category === selectedCategory) && (!inStockOnly || product.stock > 0));
  if (sort === 'price-asc') visible = [...visible].sort((a, b) => discountedPrice(a) - discountedPrice(b));
  if (sort === 'price-desc') visible = [...visible].sort((a, b) => discountedPrice(b) - discountedPrice(a));
  if (sort === 'newest') visible = [...visible].sort((a, b) => b.id - a.id);
  const pageCount = Math.max(1, Math.ceil(visible.length / 12));
  const pageProducts = visible.slice((page - 1) * 12, page * 12);

  return <div className="catalog-layout">
    <aside className="catalog-filters"><h2>Refine</h2><label htmlFor="price-filter">Price up to <strong>${maximum}</strong></label><input id="price-filter" type="range" min="25" max="2000" step="25" value={maximum} onChange={(event) => { setMaximum(Number(event.target.value)); setPage(1); }} /><label htmlFor="category-filter">Category</label><select id="category-filter" value={selectedCategory} onChange={(event) => { setSelectedCategory(event.target.value); setPage(1); }}><option value="">All categories</option>{categories.map((item) => <option value={item} key={item}>{item}</option>)}</select><label htmlFor="discount-filter">Discount</label><select id="discount-filter" value={minimumDiscount} onChange={(event) => { setMinimumDiscount(Number(event.target.value)); setPage(1); }}><option value="0">Any discount</option><option value="10">10% or more</option><option value="20">20% or more</option></select><label className="availability-filter"><input type="checkbox" checked={inStockOnly} onChange={(event) => { setInStockOnly(event.target.checked); setPage(1); }} /> In stock only</label><p className="filter-note">Ratings appear after verified customer reviews.</p></aside>
    <section className="catalog-results"><div className="catalog-toolbar"><div><span className="eyebrow">{category || 'The collection'}</span><h1>{query ? `Results for “${query}”` : category ? `Shop ${category}` : discountedOnly ? 'Current offers' : 'Shop all products'}</h1><small>{visible.length} pieces to explore</small></div><div className="catalog-controls"><label className="sr-only" htmlFor="sort-products">Sort products</label><select id="sort-products" value={sort} onChange={(event) => setSort(event.target.value)}><option value="popular">Popularity</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="newest">Newest</option></select><button className={layout === 'grid' ? 'layout-toggle active' : 'layout-toggle'} type="button" onClick={() => setLayout('grid')} aria-label="Grid view"><LayoutGrid size={17} /></button><button className={layout === 'list' ? 'layout-toggle active' : 'layout-toggle'} type="button" onClick={() => setLayout('list')} aria-label="List view"><List size={17} /></button></div></div>
      {pageProducts.length ? <><div className={`catalog-grid ${layout === 'list' ? 'list-view' : ''}`}>{pageProducts.map((product) => <article className="product-tile" key={product.id}><Link className="product-image-link" href={`/product/${product.slug}`}><Image src={product.image} alt={product.name} width={480} height={360} sizes="(max-width: 640px) 50vw, 25vw" /><span className="product-category">{product.category}</span>{product.discount > 0 && <span className="discount-tag">{product.discount}% off</span>}</Link><div className="product-tile-info"><Link href={`/product/${product.slug}`}><h3>{product.name}</h3></Link><p><strong>${discountedPrice(product).toFixed(2)}</strong>{product.discount > 0 && <del>${product.price.toFixed(2)}</del>}</p><ProductActions product={product} /></div></article>)}</div>{pageCount > 1 && <nav className="pagination" aria-label="Product pages"><button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {pageCount}</span><button type="button" disabled={page === pageCount} onClick={() => setPage(page + 1)}>Next</button></nav>}</> : <div className="empty-state"><h2>No matching finds</h2><p>Try a broader search or reset your filters.</p><Link className="text-link" href="/products">View all products</Link></div>}
    </section>
  </div>;
}