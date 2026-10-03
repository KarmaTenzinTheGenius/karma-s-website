import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: '*', allow: '/', disallow: ['/account', '/admin', '/cart', '/checkout', '/wishlist', '/api/'] }], sitemap: 'https://karma-s-website.vercel.app/sitemap.xml' };
}