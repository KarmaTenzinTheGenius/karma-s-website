'use client';

import { ArrowLeft } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { Footer, Header } from '@/components/storefront-shell';
import { ChatWidget } from '@/components/chat-widget';

export function SiteFrame({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const isStandalonePage = pathname === '/account' || pathname === '/admin';
  const showBackButton = pathname !== '/';

  return (
    <>
      {!isStandalonePage && <Header />}
      <main className={isStandalonePage ? 'standalone-main' : undefined}>
        {showBackButton && <BackButton />}
        {isStandalonePage ? <div className="standalone-content">{children}</div> : children}
      </main>
      {!isStandalonePage && <Footer />}
      {!isStandalonePage && <ChatWidget />}
    </>
  );
}

function BackButton() {
  const router = useRouter();

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push('/');
  }

  return (
    <div className="back-navigation page-wrap">
      <button className="back-button" type="button" onClick={goBack}>
        <ArrowLeft size={17} aria-hidden="true" />
        <span>Back</span>
      </button>
    </div>
  );
}
