import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductBrowser } from '@/components/product-browser';
import { getStoreCategories, getStoreProducts } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const name = slug.replace(/-/g, ' ');
  return { title: `${name} collection`, description: `Shop ${name} at Karma Lokdruel Tshongley.` };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = slug.toLowerCase();
  const [products, categories] = await Promise.all([getStoreProducts(), getStoreCategories()]);
  const visible = products.filter((product) => product.category === category);
  if (!categories.includes(category)) notFound();
  return <section className="page-wrap catalog-page"><ProductBrowser products={visible} categories={categories} category={category} /></section>;
}