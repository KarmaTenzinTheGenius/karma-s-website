import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { SiteFrame } from '@/components/site-frame';
import { Analytics } from '@/components/analytics';
import './globals.css';
import './auth.css';

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
        <SiteFrame>{children}</SiteFrame>
        <Toaster position="bottom-right" richColors />
        <Analytics />
      </body>
    </html>
  );
}