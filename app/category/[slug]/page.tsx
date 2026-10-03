import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductBrowser } from '@/components/product-browser';
import { categories, products } from '@/lib/products';

export function generateStaticParams() {
  return categories.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const name = slug.replace(/-/g, ' ');
  return { title: `${name} collection`, description: `Shop ${name} at Karma Lokdruel Tshongley.` };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = slug.toLowerCase();
  const visible = products.filter((product) => product.category === category);
  if (!visible.length) notFound();
  return <section className="page-wrap catalog-page"><ProductBrowser products={visible} category={category} /></section>;
}