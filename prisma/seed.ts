import { PrismaClient } from '@prisma/client';
import { seedProducts } from '../src/lib/products';

const prisma = new PrismaClient();

async function main() {
  for (const product of seedProducts) {
    const categorySlug = product.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const category = await prisma.category.upsert({
      where: { slug: categorySlug },
      update: {},
      create: { name: product.category, slug: categorySlug },
    });
    await prisma.product.upsert({
      where: { id: product.id },
      update: {},
      create: {
        id: product.id,
        slug: product.slug,
        sku: product.sku,
        name: product.name,
        description: product.description,
        category: product.category,
        image: product.image,
        price: product.price,
        discount: product.discount,
        stock: product.stock,
        isActive: true,
        status: 'ACTIVE',
        categoryId: category.id,
        images: { create: { url: product.image, isPrimary: true, sortOrder: 0 } },
      },
    });
  }

  await prisma.coupon.upsert({
    where: { code: 'FLAT10' },
    update: { amountOff: 100, minimumAmount: 500, isActive: true },
    create: {
      code: 'FLAT10',
      amountOff: 100,
      minimumAmount: 500,
      isActive: true,
    },
  });

  const count = await prisma.product.count();
  console.log(`Seeded ${count} products and the FLAT10 coupon.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
