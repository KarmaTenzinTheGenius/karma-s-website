import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductDetail } from '@/components/product-detail';
import { discountedPrice, products } from '@/lib/products';

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = products.find((item) => item.slug === slug);
  return product ? { title: product.name, description: product.description, openGraph: { title: product.name, description: product.description, images: [product.image] } } : { title: 'Product not found' };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = products.find((item) => item.slug === slug);
  if (!product) notFound();
  const related = products.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 4);
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: [`https://karma-s-website.vercel.app${product.image}`],
    description: product.description,
    sku: product.sku,
    offers: { '@type': 'Offer', priceCurrency: 'USD', price: discountedPrice(product), availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', url: `https://karma-s-website.vercel.app/product/${product.slug}` },
  };
  const breadcrumbSchema = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://karma-s-website.vercel.app' }, { '@type': 'ListItem', position: 2, name: product.category, item: `https://karma-s-website.vercel.app/category/${product.category}` }, { '@type': 'ListItem', position: 3, name: product.name }] };
  return <section className="page-wrap detail-page"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} /><ProductDetail product={product} related={related} /></section>;
}