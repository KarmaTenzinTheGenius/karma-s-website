# Karma Lokdruel Tshongley

Next.js App Router storefront deployed on Vercel. The original 15 products, prices and discounts are retained in `src/lib/products.ts`; product images are served from `public/image`.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Create a local `.env` from `.env.example` only for services you have configured.

## Verification

```bash
npm run build
npm audit
```

Prisma schema checks and generation:

```bash
npx prisma validate
npm run db:generate
```

Set a real `DATABASE_URL` before running migrations with `npm run db:migrate`. The schema is a launch foundation; the current demo API handlers still use temporary in-memory state and are not connected to Prisma.

## Vercel

Import the repository with the project root as the Vercel root. Vercel should detect Next.js automatically; no Express rewrite is used. Set environment variables in the Vercel project settings, then deploy. `NEXT_PUBLIC_GA_ID` and `NEXT_PUBLIC_META_PIXEL_ID` are optional analytics placeholders.

## Preview limitations before accepting real orders

- Order, review, newsletter and contact records are held in process memory and can disappear on restart or between serverless invocations.
- Checkout is a demonstration only. UPI, cards, wallets, NetBanking and COD do not collect payment or dispatch products. Add and verify Razorpay/Cashfree server-side payment orders and webhook signatures before enabling payment.
- Account and admin screens are previews. No customer authentication or protected admin session is configured; admin controls are deliberately not exposed.
- The contact form stores a temporary preview message. Configure an email provider and the real customer-care address/WhatsApp business number before launch.
- The Prisma schema is not yet used by API handlers. Add migrations, seed the preserved product data, and move orders, coupons, reviews, inventory, newsletter and contact records to persistent storage.
- Prices remain in the existing catalog's USD display format. Confirm the business currency, GST treatment, legal policies, shipping rates, return eligibility and GSTIN before launch in India.
- Email templates are prepared in `src/lib/email-templates.ts`, but no delivery provider or abandoned-cart scheduler is connected.

The active storefront and API routes are in the Next.js `app/` directory. Product data lives in `src/lib/products.ts` and active image assets live in `public/image`.
