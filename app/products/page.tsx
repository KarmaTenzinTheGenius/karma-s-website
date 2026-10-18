import type { Metadata } from 'next';
import { ProductBrowser } from '@/components/product-browser';
import { getStoreCategories, getStoreProducts } from '@/lib/catalog';

export const metadata: Metadata = { title: 'Shop all products', description: 'Browse clothing, footwear, electronics and accessories at Karma Lokdruel Tshongley.' };
export const dynamic = 'force-dynamic';

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; discounted?: string }> }) {
  const params = await searchParams;
  const query = params.q?.trim() || '';
  const category = params.category?.toLowerCase() || '';
  const discountedOnly = params.discounted === 'true';
  const [products, categories] = await Promise.all([getStoreProducts(), getStoreCategories()]);
  const visible = products.filter((product) => {
    const matchesQuery = !query || `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = !category || product.category === category;
    const matchesDiscount = !discountedOnly || product.discount > 0;
    return matchesQuery && matchesCategory && matchesDiscount;
  });

  return <section className="page-wrap catalog-page"><ProductBrowser products={visible} categories={categories} query={query} category={category} discountedOnly={discountedOnly} /></section>;
}