import { Prisma, type ProductStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type ProductInput = {
  name: string;
  description: string;
  sku: string;
  category: string;
  subcategory: string | null;
  price: number;
  mrp: number | null;
  discount: number;
  image: string;
  images: string[];
  variants: { size: string | null; colorName: string | null; colorHex: string | null; sku: string | null; stock: number }[];
  stock: number;
  brand: string | null;
  material: string | null;
  gender: string | null;
  tags: string[];
  featured: boolean;
  status: ProductStatus;
};

type ParseResult = { data: ProductInput } | { error: string };

const MAX_TEXT = 4000;

export function parseProductInput(value: unknown): ParseResult {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { error: 'Provide a product object.' };
  const body = value as Record<string, unknown>;
  const name = text(body.name, 120);
  const description = text(body.description, MAX_TEXT);
  const sku = text(body.sku, 80).toUpperCase();
  const categoryText = text(body.category, 80);
  const category = productSlug(categoryText);
  const image = validImageUrl(body.image);
  const price = Number(body.price);
  const mrp = body.mrp === '' || body.mrp === null || body.mrp === undefined ? null : Number(body.mrp);

  if (!name) return { error: 'Product name is required (maximum 120 characters).' };
  if (!description) return { error: 'Product description is required.' };
  if (!/^[A-Z0-9][A-Z0-9._-]{1,79}$/.test(sku)) return { error: 'SKU must be 2–80 letters, numbers, dots, underscores, or hyphens.' };
  if (!categoryText || (category === 'product' && categoryText.toLowerCase() !== 'product')) return { error: 'Enter a valid product category.' };
  if (!image) return { error: 'Choose a valid primary product image.' };
  if (!Number.isFinite(price) || price <= 0 || price > 10000000) return { error: 'Selling price must be a positive amount.' };
  if (mrp !== null && (!Number.isFinite(mrp) || mrp < price || mrp > 10000000)) return { error: 'Original price must be greater than or equal to the selling price.' };

  const rawImages = Array.isArray(body.images) ? body.images : [image];
  const imageUrls = rawImages.map(validImageUrl);
  if (rawImages.length > 8 || imageUrls.some((url) => !url)) return { error: 'Choose up to 8 valid product images.' };
  const images = [...new Set(imageUrls.filter((url): url is string => url !== null))];
  if (!images.includes(image)) {
    if (images.length === 8) return { error: 'A product can have up to 8 images.' };
    images.unshift(image);
  }

  const rawVariants = Array.isArray(body.variants) ? body.variants : [];
  if (rawVariants.length > 100) return { error: 'A product can have up to 100 variants.' };
  const variants: ProductInput['variants'] = [];
  const combinationKeys = new Set<string>();
  for (const item of rawVariants) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return { error: 'Each variant must be an object.' };
    const row = item as Record<string, unknown>;
    const size = nullableText(row.size, 32);
    const colorName = nullableText(row.colorName, 48);
    const colorHex = nullableText(row.colorHex, 7);
    const variantSku = nullableText(row.sku, 80)?.toUpperCase() ?? null;
    const stock = Number(row.stock);
    if (!Number.isInteger(stock) || stock < 0 || stock > 1000000) return { error: 'Variant stock must be a whole number from 0 to 1,000,000.' };
    if (colorHex && !/^#[0-9A-F]{6}$/i.test(colorHex)) return { error: 'Color swatches must use a six-digit hex color.' };
    if (variantSku && !/^[A-Z0-9][A-Z0-9._-]{1,79}$/.test(variantSku)) return { error: 'Variant SKU format is invalid.' };
    if (!size && !colorName) return { error: 'Each variant must have a size, color, or both.' };
    const key = `${(size ?? '').toLowerCase()}|${(colorName ?? '').toLowerCase()}`;
    if (combinationKeys.has(key)) return { error: 'Variant size and color combinations must be unique.' };
    combinationKeys.add(key);
    variants.push({ size, colorName, colorHex, sku: variantSku, stock });
  }

  const stock = variants.length
    ? variants.reduce((sum, variant) => sum + variant.stock, 0)
    : Number(body.stock);
  if (!Number.isInteger(stock) || stock < 0 || stock > 1000000) return { error: 'Stock must be a whole number from 0 to 1,000,000.' };

  const status = body.status;
  if (status !== 'ACTIVE' && status !== 'DRAFT' && status !== 'ARCHIVED') return { error: 'Choose active, draft, or archived status.' };

  const discount = mrp === null || mrp === price ? 0 : Number(((1 - price / mrp) * 100).toFixed(4));
  return {
    data: {
      name,
      description,
      sku,
      category,
      subcategory: nullableText(body.subcategory, 80),
      price: mrp ?? price,
      mrp,
      discount,
      image,
      images,
      variants,
      stock,
      brand: nullableText(body.brand, 80),
      material: nullableText(body.material, 120),
      gender: nullableText(body.gender, 40),
      tags: Array.isArray(body.tags)
        ? [...new Set(body.tags.filter((tag): tag is string => typeof tag === 'string').map((tag) => tag.trim().slice(0, 32)).filter(Boolean))].slice(0, 20)
        : [],
      featured: body.featured === true,
      status,
    },
  };
}

export function productSlug(name: string) {
  return name.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100) || 'product';
}

export function validImageUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 2048) return null;
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname.endsWith('.public.blob.vercel-storage.com') ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function persistProduct(input: ProductInput, productId?: number) {
  const slugBase = productSlug(input.name);
  const existingSlugs = await prisma.product.findMany({
    where: { slug: { startsWith: slugBase }, ...(productId ? { id: { not: productId } } : {}) },
    select: { slug: true },
  });
  const usedSlugs = new Set(existingSlugs.map((product) => product.slug));
  let slug = slugBase;
  for (let suffix = 2; usedSlugs.has(slug); suffix += 1) slug = `${slugBase}-${suffix}`;

  const variantSkus = input.variants.flatMap((variant) => variant.sku ? [variant.sku] : []);
  if (new Set([input.sku, ...variantSkus]).size !== variantSkus.length + 1) {
    throw new ProductConflictError('Product and variant SKUs must be unique.');
  }
  const duplicateSku = await prisma.product.findFirst({
    where: {
      OR: [{ sku: input.sku }, ...variantSkus.map((sku) => ({ sku }))],
      ...(productId ? { id: { not: productId } } : {}),
    },
    select: { sku: true },
  });
  if (duplicateSku) throw new ProductConflictError('That SKU is already in use.');
  const skuCandidates = [input.sku, ...variantSkus];
  const existingVariant = skuCandidates.length
    ? await prisma.productVariant.findFirst({
        where: { sku: { in: skuCandidates }, ...(productId ? { productId: { not: productId } } : {}) },
        select: { sku: true },
      })
    : null;
  if (existingVariant) throw new ProductConflictError('That variant SKU is already in use.');

  const status = input.status;
  const productData = {
    slug,
    sku: input.sku,
    name: input.name,
    description: input.description,
    category: input.category,
    subcategory: input.subcategory,
    brand: input.brand,
    material: input.material,
    gender: input.gender,
    tags: input.tags,
    image: input.image,
    price: new Prisma.Decimal(input.price),
    mrp: input.mrp === null ? null : new Prisma.Decimal(input.mrp),
    discount: input.discount,
    stock: input.stock,
    isActive: status === 'ACTIVE',
    status,
    featured: input.featured,
  };

  return prisma.$transaction(async (tx) => {
    const before = productId
      ? await tx.product.findUnique({ where: { id: productId }, include: { variants: true } })
      : null;
    if (productId && !before) throw new ProductNotFoundError();
    const category = await tx.category.upsert({
      where: { slug: productSlug(input.category) },
      create: { slug: productSlug(input.category), name: input.category },
      update: { name: input.category, isActive: true },
    });
    const saved = before
      ? await tx.product.update({ where: { id: productId }, data: { ...productData, categoryId: category.id } })
      : await tx.product.create({ data: { ...productData, categoryId: category.id } });
    await tx.productImage.deleteMany({ where: { productId: saved.id } });
    await tx.productImage.createMany({
      data: input.images.map((url, sortOrder) => ({ productId: saved.id, url, sortOrder, isPrimary: url === input.image })),
    });

    const existingVariants = before?.variants ?? [];
    const existingByCombination = new Map(existingVariants.map((variant) => [
      `${(variant.size ?? '').toLowerCase()}|${(variant.colorName ?? '').toLowerCase()}`,
      variant,
    ]));
    const requestedCombinations = new Set(input.variants.map((variant) => `${(variant.size ?? '').toLowerCase()}|${(variant.colorName ?? '').toLowerCase()}`));
    for (const [index, variant] of existingVariants.entries()) {
      await tx.productVariant.update({
        where: { id: variant.id },
        data: { size: `__tmp_${index}_${variant.id}`, colorName: null, colorHex: null, sku: null },
      });
    }
    const removedIds = existingVariants
      .filter((variant) => !requestedCombinations.has(`${(variant.size ?? '').toLowerCase()}|${(variant.colorName ?? '').toLowerCase()}`))
      .map((variant) => variant.id);
    if (removedIds.length) await tx.productVariant.deleteMany({ where: { id: { in: removedIds } } });

    const movements: { productId: number; variantId?: string; change: number; reason: string }[] = [];
    for (const variant of input.variants) {
      const combination = `${(variant.size ?? '').toLowerCase()}|${(variant.colorName ?? '').toLowerCase()}`;
      const existing = existingByCombination.get(combination);
      const savedVariant = existing
        ? await tx.productVariant.update({ where: { id: existing.id }, data: variant })
        : await tx.productVariant.create({ data: { ...variant, productId: saved.id } });
      const oldStock = existing?.stock ?? 0;
      const change = variant.stock - oldStock;
      if (change) movements.push({
        productId: saved.id,
        variantId: savedVariant.id,
        change,
        reason: productId ? 'admin_variant_adjustment' : 'initial_stock',
      });
    }
    if (!input.variants.length && input.stock !== (before?.stock ?? 0)) {
      movements.push({ productId: saved.id, change: input.stock - (before?.stock ?? 0), reason: productId ? 'admin_stock_adjustment' : 'initial_stock' });
    }
    if (movements.length) await tx.stockMovement.createMany({ data: movements });
    return saved;
  }).catch((error: unknown) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ProductConflictError('A product with this SKU or name already exists.');
    }
    throw error;
  });
}

export class ProductConflictError extends Error {}
export class ProductNotFoundError extends Error {}

function text(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function nullableText(value: unknown, maxLength: number) {
  const result = text(value, maxLength);
  return result || null;
}
