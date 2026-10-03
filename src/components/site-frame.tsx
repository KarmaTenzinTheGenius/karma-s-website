'use client';

import { usePathname } from 'next/navigation';
import { Footer, Header } from '@/components/storefront-shell';

export function SiteFrame({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const isStandalonePage = pathname === '/account' || pathname === '/admin';

  return (
    <>
      {!isStandalonePage && <Header />}
      <main className={isStandalonePage ? 'standalone-main' : undefined}>{children}</main>
      {!isStandalonePage && <Footer />}
    </>
  );
}
