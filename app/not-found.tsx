import Link from 'next/link';

export default function NotFound() {
  return <section className="page-wrap not-found"><span className="eyebrow">404 · Page not found</span><h1>This page took<br /><em>a different turn.</em></h1><p>The link may be out of date, or the page may have moved.</p><Link className="button button-dark" href="/">Return to the shop</Link></section>;
}