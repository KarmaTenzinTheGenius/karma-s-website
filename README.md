# Karma Lokdruel Tshongley

Next.js App Router storefront deployed on Vercel. The original 15 products, prices and discounts are retained in `src/lib/products.ts`; product images are served from `public/image`.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Visitors are directed to the account page to sign in or create an account before browsing the store. Customer accounts require a configured PostgreSQL database (`DATABASE_URL`).

Set `SESSION_SECRET` to a random secret of at least 32 characters and `ADMIN_PASSWORD` to a unique password of at least 12 characters in `.env`. The password-protected admin dashboard is available at `/admin`. Do not expose these secrets in browser-facing `NEXT_PUBLIC_` variables.

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
- Customer accounts use the Prisma `User` table with scrypt-hashed passwords and signed, HTTP-only sessions. Configure `DATABASE_URL` and apply the included initial migration with `npm run db:migrate` before enabling registration.
- The admin dashboard uses the server-only `ADMIN_PASSWORD` setting and a signed, HTTP-only session. Demo orders remain in-memory and are not durable.
- The contact form stores a temporary preview message. Configure an email provider and the real customer-care address/WhatsApp business number before launch.
- The initial migration creates the Prisma schema, but only customer accounts currently use the database. Seed the preserved product data and move orders, coupons, reviews, inventory, newsletter and contact records to persistent storage.
- Prices remain in the existing catalog's USD display format. Confirm the business currency, GST treatment, legal policies, shipping rates, return eligibility and GSTIN before launch in India.
- Email templates are prepared in `src/lib/email-templates.ts`, but no delivery provider or abandoned-cart scheduler is connected.

The active storefront and API routes are in the Next.js `app/` directory. Product data lives in `src/lib/products.ts` and active image assets live in `public/image`.
