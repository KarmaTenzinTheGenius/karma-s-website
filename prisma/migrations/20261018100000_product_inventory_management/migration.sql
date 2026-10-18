-- Create product lifecycle values before migrating existing publication flags.
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- Add a generated ID default while preserving all existing product IDs.
CREATE SEQUENCE IF NOT EXISTS "Product_id_seq";
ALTER TABLE "Product" ALTER COLUMN "id" SET DEFAULT nextval('"Product_id_seq"');
ALTER SEQUENCE "Product_id_seq" OWNED BY "Product"."id";
SELECT setval('"Product_id_seq"', COALESCE(MAX("id"), 1), MAX("id") IS NOT NULL) FROM "Product";

ALTER TABLE "Address"
  ALTER COLUMN "name" SET DEFAULT '',
  ALTER COLUMN "phone" SET DEFAULT '',
  ALTER COLUMN "line1" SET DEFAULT '',
  ALTER COLUMN "city" SET DEFAULT '',
  ALTER COLUMN "state" SET DEFAULT '',
  ALTER COLUMN "postalCode" SET DEFAULT '';

CREATE TABLE "Category" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "parentId" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Product"
  ADD COLUMN "categoryId" TEXT,
  ADD COLUMN "subcategory" TEXT,
  ADD COLUMN "brand" TEXT,
  ADD COLUMN "material" TEXT,
  ADD COLUMN "gender" TEXT,
  ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "mrp" DECIMAL(10,2),
  ADD COLUMN "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ALTER COLUMN "discount" TYPE DOUBLE PRECISION USING "discount"::DOUBLE PRECISION;

UPDATE "Product"
SET "status" = CASE WHEN "isActive" THEN 'ACTIVE'::"ProductStatus" ELSE 'DRAFT'::"ProductStatus" END;

INSERT INTO "Category" ("id", "name", "slug", "updatedAt")
SELECT md5(MIN("category") || clock_timestamp()::text), MIN("category"),
       trim(both '-' from regexp_replace(lower(MIN("category")), '[^a-z0-9]+', '-', 'g')),
       CURRENT_TIMESTAMP
FROM "Product"
GROUP BY trim(both '-' from regexp_replace(lower("category"), '[^a-z0-9]+', '-', 'g'));

UPDATE "Product" AS product
SET "categoryId" = category."id"
FROM "Category" AS category
WHERE category."slug" = trim(both '-' from regexp_replace(lower(product."category"), '[^a-z0-9]+', '-', 'g'));

CREATE TABLE "ProductImage" (
  "id" TEXT NOT NULL,
  "productId" INTEGER NOT NULL,
  "url" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductVariant" (
  "id" TEXT NOT NULL,
  "productId" INTEGER NOT NULL,
  "size" TEXT,
  "colorName" TEXT,
  "colorHex" TEXT,
  "sku" TEXT,
  "stock" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProductVariant_stock_check" CHECK ("stock" >= 0),
  CONSTRAINT "ProductVariant_size_color_check" CHECK ("size" IS NOT NULL OR "colorName" IS NOT NULL)
);

CREATE TABLE "StockMovement" (
  "id" TEXT NOT NULL,
  "productId" INTEGER,
  "variantId" TEXT,
  "change" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "orderId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StoreSetting" (
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StoreSetting_pkey" PRIMARY KEY ("key")
);

ALTER TABLE "CartItem" ADD COLUMN "variantId" TEXT;
ALTER TABLE "OrderItem"
  ADD COLUMN "variantId" TEXT,
  ADD COLUMN "size" TEXT,
  ADD COLUMN "colorName" TEXT;

CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");
CREATE INDEX "Category_isActive_sortOrder_idx" ON "Category"("isActive", "sortOrder");
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
CREATE INDEX "Product_status_isActive_idx" ON "Product"("status", "isActive");
CREATE INDEX "Product_featured_status_idx" ON "Product"("featured", "status");
CREATE INDEX "ProductImage_productId_sortOrder_idx" ON "ProductImage"("productId", "sortOrder");
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");
CREATE INDEX "ProductVariant_productId_isActive_idx" ON "ProductVariant"("productId", "isActive");
CREATE UNIQUE INDEX "ProductVariant_productId_size_colorName_key" ON "ProductVariant"("productId", "size", "colorName");
CREATE INDEX "StockMovement_productId_createdAt_idx" ON "StockMovement"("productId", "createdAt");
CREATE INDEX "StockMovement_variantId_createdAt_idx" ON "StockMovement"("variantId", "createdAt");

ALTER TABLE "Product"
  ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "Product_price_check" CHECK ("price" > 0),
  ADD CONSTRAINT "Product_stock_check" CHECK ("stock" >= 0),
  ADD CONSTRAINT "Product_discount_check" CHECK ("discount" BETWEEN 0 AND 100);

ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockMovement"
  ADD CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "StockMovement_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
