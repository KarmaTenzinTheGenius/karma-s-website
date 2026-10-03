import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { Footer, Header } from '@/components/storefront-shell';
import { Analytics } from '@/components/analytics';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://karma-s-website.vercel.app'),
  title: {
    default: 'Karma Lokdruel Tshongley | Everyday finds, thoughtfully chosen',
    template: '%s | Karma Lokdruel Tshongley',
  },
  description: 'Shop clothing, footwear, electronics and everyday accessories at Karma Lokdruel Tshongley. Discover current offers and convenient delivery across India.',
  openGraph: {
    type: 'website',
    siteName: 'Karma Lokdruel Tshongley',
    title: 'Karma Lokdruel Tshongley',
    description: 'Everyday finds, thoughtfully chosen.',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" data-scroll-behavior="smooth">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
        <Toaster position="bottom-right" richColors />
        <Analytics />
      </body>
    </html>
  );
}