import type { MetadataRoute } from 'next';
import { categories, products } from '@/lib/products';

const siteUrl = 'https://karma-s-website.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = ['', '/products', '/about', '/contact', '/shipping-policy', '/return-policy', '/refund-cancellation', '/privacy-policy', '/terms', '/faq', '/track-order'];
  return [
    ...staticPaths.map((path) => ({ url: `${siteUrl}${path}`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: path ? 0.7 : 1 })),
    ...categories.map((category) => ({ url: `${siteUrl}/category/${category}`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.6 })),
    ...products.map((product) => ({ url: `${siteUrl}/product/${product.slug}`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.7 })),
  ];
}