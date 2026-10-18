import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { Product } from '@/lib/products';

const productInclude = {
  images: { orderBy: { sortOrder: 'asc' as const } },
  variants: { where: { isActive: true }, orderBy: [{ size: 'asc' as const }, { colorName: 'asc' as const }] },
};

type CatalogRow = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

export function toCatalogProduct(row: CatalogRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    sku: row.sku,
    name: row.name,
    description: row.description,
    category: row.category,
    image: row.images.find((image) => image.isPrimary)?.url ?? row.image,
    price: Number(row.price),
    mrp: row.mrp === null ? null : Number(row.mrp),
    discount: row.discount,
    stock: row.stock,
    subcategory: row.subcategory,
    brand: row.brand,
    material: row.material,
    gender: row.gender,
    tags: row.tags,
    featured: row.featured,
    status: row.status,
    images: row.images,
    variants: row.variants.map((variant) => ({
      id: variant.id,
      size: variant.size,
      colorName: variant.colorName,
      colorHex: variant.colorHex,
      sku: variant.sku,
      stock: variant.stock,
    })),
  };
}

export async function getStoreProducts() {
  const rows = await prisma.product.findMany({
    where: { isActive: true, status: 'ACTIVE' },
    include: productInclude,
    orderBy: { id: 'asc' },
  });
  return rows.map(toCatalogProduct);
}

export async function getStoreProductBySlug(slug: string) {
  const row = await prisma.product.findFirst({
    where: { slug, isActive: true, status: 'ACTIVE' },
    include: productInclude,
  });
  return row ? toCatalogProduct(row) : null;
}

export async function getStoreCategories() {
  const rows = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: { slug: true },
  });
  if (rows.length) return rows.map(({ slug }) => slug);
  const products = await prisma.product.findMany({
    where: { isActive: true, status: 'ACTIVE' },
    distinct: ['category'],
    select: { category: true },
    orderBy: { category: 'asc' },
  });
  return products.map(({ category }) => category);
}
