import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, PackageCheck, RotateCcw, ShieldCheck } from 'lucide-react';
import { products, categories, discountedPrice } from '@/lib/products';
import { ProductActions } from '@/components/product-actions';

export default function HomePage() {
  const offers = products.filter((product) => product.discount > 0).sort((a, b) => b.discount - a.discount).slice(0, 4);
  const newArrivals = [...products].slice(-4).reverse();

  return (
    <>
      <section className="hero page-wrap">
        <div className="hero-copy">
          <span className="eyebrow">A little something for every day</span>
          <h1>Good things,<br /><em>found here.</em></h1>
          <p>Explore a growing collection of useful, feel-good finds for home, work and everywhere in between.</p>
          <div className="hero-actions"><Link className="button button-dark" href="/products">Shop the collection <ArrowRight size={17} /></Link><span>Fresh picks. Honest offers.</span></div>
          <div className="hero-note"><span className="hero-note-dot" /> Select styles up to 30% off</div>
        </div>
        <div className="hero-art" aria-label="Featured collection">
          <div className="hero-art-top"><span>THE EVERYDAY EDIT</span><span>NO. 01 / 25</span></div>
          <Image src="/image/backpack.webp" alt="Everyday backpack from the Karma collection" width={520} height={440} priority className="hero-image" />
          <div className="hero-art-caption"><span>Made for your next<br />everyday adventure.</span><Link href="/product/backpack" aria-label="Shop backpack"><ArrowRight size={21} /></Link></div>
        </div>
      </section>

      <section className="benefit-strip" aria-label="Shopping benefits"><div className="page-wrap benefit-grid"><Benefit icon={<PackageCheck />} title="Free shipping" text="On orders over $75" /><Benefit icon={<BadgeCheck />} title="COD available" text="Pay when it arrives" /><Benefit icon={<RotateCcw />} title="Easy returns" text="7-day return window" /><Benefit icon={<ShieldCheck />} title="Secure checkout" text="Your details stay safe" /></div></section>

      <section className="page-wrap section-block"><div className="section-heading"><div><span className="eyebrow">Browse your way</span><h2>Shop by category</h2></div><Link className="text-link" href="/products">Explore all <ArrowRight size={16} /></Link></div><div className="category-grid">{categories.map((category, index) => <Link className={`category-tile category-tile-${index % 4}`} href={`/category/${category}`} key={category}><span className="category-index">0{index + 1}</span><span>{category}</span><ArrowRight size={17} /></Link>)}</div></section>

      <section className="offers-band"><div className="page-wrap section-block"><div className="section-heading"><div><span className="eyebrow">A good time to find it</span><h2>Hot discounts</h2></div><Link className="text-link" href="/products?discounted=true">See every offer <ArrowRight size={16} /></Link></div><div className="product-grid">{offers.map((product) => <ProductTile key={product.id} product={product} />)}</div></div></section>

      <section className="page-wrap section-block"><div className="section-heading"><div><span className="eyebrow">Just landed</span><h2>New to the shop</h2></div><Link className="text-link" href="/products?sort=newest">Discover more <ArrowRight size={16} /></Link></div><div className="product-grid">{newArrivals.map((product) => <ProductTile key={product.id} product={product} />)}</div></section>

      <section className="story-band"><div className="page-wrap story-inner"><span className="eyebrow">A note from Karma</span><p>“The best things are the ones that find their way into your everyday.”</p><Link className="text-link" href="/about">Get to know us <ArrowRight size={16} /></Link></div></section>
    </>
  );
}

function Benefit({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="benefit-item"><span className="benefit-icon">{icon}</span><span><strong>{title}</strong><small>{text}</small></span></div>;
}

function ProductTile({ product }: { product: (typeof products)[number] }) {
  return <article className="product-tile"><Link className="product-image-link" href={`/product/${product.slug}`}><Image src={product.image} alt={product.name} width={480} height={360} sizes="(max-width: 640px) 50vw, (max-width: 1000px) 33vw, 25vw" /><span className="product-category">{product.category}</span>{product.discount > 0 && <span className="discount-tag">{product.discount}% off</span>}</Link><div className="product-tile-info"><Link href={`/product/${product.slug}`}><h3>{product.name}</h3></Link><p><strong>${discountedPrice(product).toFixed(2)}</strong>{product.discount > 0 && <del>${product.price.toFixed(2)}</del>}</p><ProductActions product={product} /></div></article>;
}