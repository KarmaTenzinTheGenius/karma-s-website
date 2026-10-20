# Karma Lokdruel Tshongley

This repository is a Next.js App Router storefront for Vercel, not a Vite/Express application. It uses Prisma with PostgreSQL for persistent product, category, variant, stock, order, customer, store-setting, and product image data.

## Local setup

Requirements: Node.js supported by the installed Next.js version and a PostgreSQL database.

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

Never prefix these values with `NEXT_PUBLIC_`. The admin dashboard is at `/admin`. Product images are stored in PostgreSQL and served through a public image route, so no separate Blob token is required. Uploads accept JPG, PNG, WebP, AVIF, and BMP up to 20 MB before processing; static images are resized to a maximum 1600-pixel edge and compressed below 4 MB, while animated GIFs are preserved up to 4 MB. Products can have up to 8 images. An administrator can select a primary image and set product publication status, product details, and individual size/colour stock.

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

1. Create/configure the PostgreSQL database.
2. Add `DATABASE_URL`, `SESSION_SECRET`, and `ADMIN_PASSWORD` as server-side Vercel project environment variables for the required deployment environments.
3. From a trusted PowerShell session configured with the production database URL, run `npm run db:migrate`; run `npm run db:seed` once if the sample products should be imported.
4. Deploy the project using Vercel's Next.js detection. The build script generates Prisma Client and builds the Next.js app; it does not modify the database.
5. Open `/admin` on the deployed site and verify admin sign-in and a small image upload before enabling product operations.

## Production limitations

- This implementation has not been connected to or tested against the live site, a production database, or a Vercel project from this workspace. Deployment requires valid provider accounts and environment variables.
- Checkout is still a demonstration flow: mBoB, cards, wallets, and COD do not collect or reconcile payments. Verify payment and refund state manually or add a payment provider with signed webhooks before accepting real orders.
- Reviews, newsletter subscriptions, and contact messages still use their existing non-product storage paths and are not made durable by the product-management migration.
- Admin settings currently persist the store name/description, support email, and low-stock threshold. Payment credentials, tax rules, legal policies, delivery rates, and email delivery remain separate setup work.
- Confirm the business currency, tax treatment, shipping rates, return eligibility, and local legal requirements before launch.

The main storefront and APIs are under `app/`; shared UI and server utilities are under `src/`. The original sample product data remains in `src/lib/products.ts` as a seed source, and its static images remain in `public/image`.

## Learning the admin area

The admin page is a useful place to start because it shows how a page, an interactive component, and API routes work together:

1. `app/admin/page.tsx` is the `/admin` route. It checks the admin session on the server and shows either the login form or the dashboard.
2. `src/components/admin-dashboard.tsx` is the interactive dashboard. Its tabs, form fields, and filters use React state in the browser.
3. When you save something, the dashboard sends a request to a route under `app/api/`. For example, products use `app/api/products/route.ts` to create or list products.
4. The API route checks permissions and validates the request before using the helpers in `src/lib/` and Prisma to read or update the database.
5. The dashboard reloads the affected data and displays a success or error message.

### Admin dashboard sections

- **Overview**: totals and recent orders.
- **Products**: search, filter, add, edit, and remove products.
- **Inventory**: product and size/colour variant stock.
- **Categories**: create categories and publish or hide them.
- **Orders**: review orders and update their status.
- **Customers**: view registered customers and their order counts.
- **Store settings**: update contact details and the low-stock warning level.

### Where to look next

- `app/` contains pages and API endpoints. In this Next.js App Router project, folders form URL paths; `page.tsx` renders a page and `route.ts` handles API requests.
- `src/components/` contains reusable interface pieces. A file beginning with `'use client'` can manage browser interactions such as clicks and form input.
- `src/lib/` contains shared helpers for authentication, products, currency, and database access.
- `prisma/schema.prisma` describes the database tables and their relationships. The migration files apply schema changes, and `prisma/seed.ts` adds sample products.
- `public/` contains static files such as the sample product images.

To follow one change end-to-end, start at the dashboard handler, find the API route it calls, then follow the route into its `src/lib/` helper and Prisma query. For example, trace `saveProduct` in `src/components/admin-dashboard.tsx` to the product routes in `app/api/products/`.
