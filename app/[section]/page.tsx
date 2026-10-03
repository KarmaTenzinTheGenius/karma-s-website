import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AccountPanel } from '@/components/account-panel';
import { ContactForm } from '@/components/contact-form';
import { TrackOrderForm } from '@/components/track-order-form';

const pages: Record<string, { title: string; eyebrow: string; description: string }> = {
  about: { title: 'Good things belong in everyday life.', eyebrow: 'Our story', description: 'Karma Lokdruel Tshongley is a small, growing shop bringing together useful finds across clothing, footwear, electronics and accessories. We believe shopping should feel clear, considered and easy to come back to.' },
  contact: { title: 'We’re here to help.', eyebrow: 'Contact', description: 'Questions about a product, an order or a return? Send the team a note and include your order reference if you have one.' },
  'shipping-policy': { title: 'Shipping, without the guesswork.', eyebrow: 'Shipping policy', description: 'Orders are prepared within 1–2 business days. Standard delivery typically takes 3–6 business days after dispatch. Delivery estimates may vary by destination and carrier.' },
  'return-policy': { title: 'A straightforward return window.', eyebrow: 'Returns', description: 'Eligible items can be requested for return within 7 days of delivery, in unused condition with original packaging. Contact customer care with your order ID before sending an item back.' },
  'refund-cancellation': { title: 'Refunds and cancellations.', eyebrow: 'Customer care', description: 'Cancellation requests can be made before an order is dispatched. Approved refunds are returned to the original payment method; timing depends on the payment provider. Cash-on-delivery refunds require customer care to arrange the next step.' },
  'privacy-policy': { title: 'Your information matters.', eyebrow: 'Privacy policy', description: 'This preview storefront does not provide real account or payment processing. Contact and order data submitted to demo APIs is held only in temporary application memory and may disappear when the server restarts.' },
  terms: { title: 'Terms of service.', eyebrow: 'Legal', description: 'This storefront is a demonstration experience. Product availability, delivery estimates and payment options are illustrative and do not represent a completed commercial transaction.' },
  faq: { title: 'A few helpful answers.', eyebrow: 'Frequently asked questions', description: 'Find quick answers about delivery, payments, returns and order tracking.' },
  'track-order': { title: 'Where is your order?', eyebrow: 'Order tracking', description: 'Enter the order reference from your confirmation page. Demo orders are held temporarily and may not remain available after a server restart.' },
  account: { title: 'Your Karma account.', eyebrow: 'Account', description: 'Sign in, create an account or choose a password recovery option.' },
  admin: { title: 'Store administration.', eyebrow: 'Restricted area', description: 'Admin tools are not enabled on this preview. A protected admin panel requires server-side authentication and a persistent database before it can safely manage customer or order data.' },
};

export function generateStaticParams() {
  return Object.keys(pages).map((section) => ({ section }));
}

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }): Promise<Metadata> {
  const { section } = await params;
  const page = pages[section];
  return page ? { title: page.eyebrow, description: page.description } : { title: 'Page not found' };
}

export default async function InformationPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const page = pages[section];
  if (!page) notFound();
  const isFaq = section === 'faq';

  return <section className={`page-wrap information-page ${section === 'contact' ? 'contact-page' : ''}`}><span className="eyebrow">{page.eyebrow}</span><h1>{page.title}</h1><p className="information-lead">{page.description}</p>
    {section === 'contact' && <div className="contact-layout"><ContactForm /><div className="contact-aside"><h2>Talk to us</h2><p>For quick questions, open WhatsApp and choose a conversation. A business phone number can be connected before launch.</p><a className="button button-outline" href="https://wa.me/?text=Hello%20Karma%20Lokdruel%20Tshongley%2C%20I%20have%20a%20question." target="_blank" rel="noreferrer">Open WhatsApp</a><h2>Find us</h2><iframe title="Google Maps search for Karma Lokdruel Tshongley" loading="lazy" referrerPolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=Karma%20Lokdruel%20Tshongley%20India&output=embed" /></div></div>}
    {isFaq && <div className="faq-list">{[['How long does shipping take?', 'Orders are prepared within 1–2 business days. Standard delivery usually takes another 3–6 business days.'], ['Can I pay by cash on delivery?', 'Cash on delivery is shown as a demo option. Availability must be confirmed with the delivery partner before launch.'], ['How do I request a return?', 'Contact customer care within 7 days of delivery with your order reference. The item should be unused and in its original packaging.'], ['How do I track an order?', 'Use the order reference on the tracking page. Preview order records are temporary and are not saved to a persistent database.'], ['Are online payments active?', 'No. UPI, card, wallet and NetBanking options are interface previews; no payment is collected.']].map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>}
    {section === 'track-order' && <TrackOrderForm />}
    {section === 'account' && <AccountPanel />}
    {section === 'admin' && <div className="admin-notice"><p>For customer safety, this preview does not expose admin controls. Before launch, configure an authenticated admin identity, role-based access and persistent storage.</p><Link className="text-link" href="/">Return to the store</Link></div>}
    {['shipping-policy', 'return-policy', 'refund-cancellation', 'privacy-policy', 'terms'].includes(section) && <div className="policy-details"><h2>How this preview works</h2><p>Prices and discounts shown are preserved from the existing catalog. Checkout creates a temporary demo order only; it does not charge a payment method, reserve stock or dispatch goods.</p><p>Before taking live orders, publish final policies that match your fulfilment operations, configure your legal business details, and connect persistent order, payment and customer-data services.</p><Link className="text-link" href="/contact">Contact customer care</Link></div>}
  </section>;
}