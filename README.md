# Karma Lokdruel Tshongley

This repository is a Next.js App Router storefront for Vercel, not a Vite/Express application. It uses Prisma with PostgreSQL for persistent product, category, variant, stock, order, customer, and store-setting data. Product images uploaded in the admin area are stored in Vercel Blob.

## Local setup

Requirements: Node.js supported by the installed Next.js version and a PostgreSQL database. A Vercel Blob store is optional for creating products, but required for uploading custom product images.

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm install
npx prisma validate
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:3000`. Enter the following server-only settings in `.env` before running migrations or signing in:

- `DATABASE_URL`: PostgreSQL connection URL.
- `SESSION_SECRET`: random secret with at least 32 characters.
- `ADMIN_PASSWORD`: unique admin password with at least 12 characters.
- `BLOB_READ_WRITE_TOKEN` (optional for local development): token for the Vercel Blob store used for durable custom product image uploads. Locally, without this token, images are saved in the ignored `public/product-uploads` folder. On Vercel, configure Blob because serverless filesystem uploads are not persistent.

Never prefix these values with `NEXT_PUBLIC_`. The admin dashboard is at `/admin`. Image uploads accept JPG, PNG, WebP, AVIF, and BMP up to 20 MB before processing; static images are resized to a maximum 1600-pixel edge and compressed below 4 MB, while animated GIFs are preserved up to 4 MB. Products can have up to 8 images. An administrator can select a primary image and set product publication status, product details, and individual size/colour stock.

`prisma/migrations/20261018100000_product_inventory_management/migration.sql` adds the product lifecycle, categories, image records, variants, stock movements, settings, and database constraints. It preserves existing product rows and creates category records for their existing category values. `npm run db:seed` adds the original sample catalogue only when its product IDs do not exist; it does not overwrite existing products or admin edits.

## Admin and inventory behavior

- Product writes, category writes, image uploads, settings, customer lists, and order status changes require the signed admin session and server-side authorization.
- Public product pages, category pages, search suggestions, and wishlist data read active products from PostgreSQL at request time. Draft, archived, and unpublished products are excluded.
- Product stock is stored on the product for simple items and as individual variant rows for size/colour products. The product stock total is maintained alongside variant stock.
- Checkout re-reads prices and publication status from PostgreSQL. Stock decrements are guarded by database updates inside the order transaction, so simultaneous orders cannot oversell the same product or variant.
- Cancelling/refunding an eligible order restores stock once and records stock movements. Status changes follow a limited forward transition map.
- Existing browser cart and wishlist contents remain browser-local, but those values are treated as untrusted snapshots: checkout validates product, variant, price, and stock against the database.

## Validation

```powershell
npx prisma validate
npm run db:generate
npm run build
```

Apply migrations to the same database URL used by the running application. Migrations are not run automatically by each Vercel build.

## Vercel deployment

1. Create/configure the PostgreSQL database; create a Vercel Blob store if custom product image uploads are needed.
2. Add `DATABASE_URL`, `SESSION_SECRET`, and `ADMIN_PASSWORD` as server-side Vercel project environment variables for the required deployment environments. Add `BLOB_READ_WRITE_TOKEN` to enable custom image uploads.
3. From a trusted PowerShell session configured with the production database URL, run `npm run db:migrate`; run `npm run db:seed` once if the sample products should be imported.
4. Deploy the project using Vercel's Next.js detection. The build script generates Prisma Client and builds the Next.js app; it does not modify the database.
5. Open `/admin` on the deployed site and verify admin sign-in and a small image upload before enabling product operations.

Blob URLs are allowed by the Next.js image configuration only for Vercel's public Blob hostname. Storage limits, retention, and pricing depend on the selected Vercel plan and can change; confirm current limits in the provider dashboard.

## Production limitations

- This implementation has not been connected to or tested against the live site, a production database, or a Vercel project from this workspace. Deployment requires valid provider accounts and environment variables.
- Checkout is still a demonstration flow: mBoB, cards, wallets, and COD do not collect or reconcile payments. Verify payment and refund state manually or add a payment provider with signed webhooks before accepting real orders.
- Reviews, newsletter subscriptions, and contact messages still use their existing non-product storage paths and are not made durable by the product-management migration.
- Admin settings currently persist the store name/description, support email, and low-stock threshold. Payment credentials, tax rules, legal policies, delivery rates, and email delivery remain separate setup work.
- Confirm the business currency, tax treatment, shipping rates, return eligibility, and local legal requirements before launch.

The main storefront and APIs are under `app/`; shared UI and server utilities are under `src/`. The original sample product data remains in `src/lib/products.ts` as a seed source, and its static images remain in `public/image`.
