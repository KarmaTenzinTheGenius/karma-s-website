import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AccountPanel } from '@/components/account-panel';
import { ContactForm } from '@/components/contact-form';
import { TrackOrderForm } from '@/components/track-order-form';

const pages: Record<string, { title: string; eyebrow: string; description: string }> = {
  about: { title: 'Good things belong in everyday life.', eyebrow: 'Our story', description: 'Karma Lokdruel Tshongley is a small, growing shop bringing together useful finds across clothing, footwear, electronics and accessories. We believe shopping should feel clear, considered and easy to come back to.' },
  contact: { title: 'We’re here to help.', eyebrow: 'Contact', description: 'Questions about a product, an order or a return? Send the team a note and include your order reference if you have one.' },
  'shipping-policy': { title: 'Shipping, without the guesswork.', eyebrow: 'Shipping policy', description: 'Orders are prepared within 1–2 business days and delivered by Bhutan Post or our local courier. Standard delivery typically takes 3–6 business days after dispatch; express delivery takes 1–3. Delivery estimates may vary by dzongkhag.' },
  'return-policy': { title: 'A straightforward return window.', eyebrow: 'Returns', description: 'Eligible items can be requested for return within 7 days of delivery, in unused condition with original packaging. Contact customer care with your order ID before sending an item back.' },
  'refund-cancellation': { title: 'Refunds and cancellations.', eyebrow: 'Customer care', description: 'Cancellation requests can be made before an order is dispatched. Approved refunds are returned to the original payment method; timing depends on the payment provider. Cash-on-delivery refunds require customer care to arrange the next step.' },
  'privacy-policy': { title: 'Your information matters.', eyebrow: 'Privacy policy', description: 'Customer account passwords are stored as one-way scrypt hashes, and sign-in sessions use HTTP-only cookies. Order, contact and newsletter records are stored in our PostgreSQL database and are used only to fulfil your order and answer your message.' },
  terms: { title: 'Terms of service.', eyebrow: 'Legal', description: 'Prices are shown in Bhutanese Ngultrum (Nu.) and include applicable Bhutanese taxes. Product availability, delivery estimates and payment options are subject to change.' },
  faq: { title: 'A few helpful answers.', eyebrow: 'Frequently asked questions', description: 'Find quick answers about delivery, payments, returns and order tracking.' },
  'track-order': { title: 'Where is your order?', eyebrow: 'Order tracking', description: 'Enter the order reference from your confirmation page to see its current status.' },
  account: { title: 'Your Karma account.', eyebrow: 'Account', description: 'Sign in or create an account to continue to the store.' },
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

  return <section className={`page-wrap information-page ${section === 'contact' ? 'contact-page' : ''} ${section === 'account' ? 'account-page' : ''}`}>{section === 'account' && <Link className="brand account-brand" href="/"><span className="brand-mark">K</span><span>KARMA<small>LOKDRUEL TSHONGLEY</small></span></Link>}{section !== 'account' && <span className="eyebrow">{page.eyebrow}</span>}<h1>{page.title}</h1><p className="information-lead">{page.description}</p>
    {section === 'contact' && <div className="contact-layout"><ContactForm /><div className="contact-aside"><h2>Talk to us</h2><p>For quick questions, send us a message and we will reply during shop hours (9am–6pm Bhutan time).</p><h2>Find us</h2><iframe title="Map of Karma Lokdruel Tshongley in Thimphu, Bhutan" loading="lazy" referrerPolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=Thimphu%2C%20Bhutan&amp;output=embed" /></div></div>}
    {isFaq && <div className="faq-list">{[['How long does shipping take?', 'Orders are prepared within 1–2 business days. Standard delivery by Bhutan Post usually takes another 3–6 business days.'], ['How can I pay?', 'You can pay by mBoB transfer or cash on delivery. Place your order, then transfer to the mBoB account shown on your confirmation page. We dispatch once the transfer is received.'], ['Is cash on delivery available?', 'Yes, within Thimphu and most dzongkhags. A small cash-handling fee applies.'], ['How do I request a return?', 'Contact customer care within 7 days of delivery with your order reference. The item should be unused and in its original packaging.'], ['How do I track an order?', 'Use the order reference from your confirmation page on the tracking page.']].map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>}
    {section === 'track-order' && <TrackOrderForm />}
    {section === 'account' && <AccountPanel />}
    {['shipping-policy', 'return-policy', 'refund-cancellation', 'privacy-policy', 'terms'].includes(section) && <div className="policy-details"><h2>Our commitments</h2><p>All prices are in Bhutanese Ngultrum (Nu.) and include applicable Bhutanese taxes. Orders are fulfilled by Bhutan Post or our local courier.</p><p>Refunds are returned by bank transfer to the account you paid from, or in cash for cash-on-delivery orders. Contact customer care to arrange either.</p><Link className="text-link" href="/contact">Contact customer care</Link></div>}
  </section>;
}