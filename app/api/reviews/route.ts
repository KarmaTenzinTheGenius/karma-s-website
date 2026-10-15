import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCustomerSession } from '@/lib/auth-server';

export async function GET(request: Request) {
  const productId = Number(new URL(request.url).searchParams.get('productId'));
  if (!Number.isInteger(productId)) {
    return NextResponse.json({ success: false, message: 'Provide a valid product.' }, { status: 400 });
  }

  try {
    const reviews = await prisma.review.findMany({
      where: { productId, isVisible: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, name: true, rating: true, comment: true, createdAt: true },
    });
    return NextResponse.json({ success: true, data: reviews });
  } catch (error) {
    console.error('Review lookup failed.', error);
    return NextResponse.json({ success: false, message: 'Reviews are temporarily unavailable.' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const productId = Number(body?.productId);
  const rating = Number(body?.rating);
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const comment = typeof body?.comment === 'string' ? body.comment.trim() : '';

  if (
    !Number.isInteger(productId) ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5 ||
    !name ||
    name.length > 80 ||
    comment.length < 8 ||
    comment.length > 2000
  ) {
    return NextResponse.json(
      { success: false, message: 'Provide a valid product, name, 1–5 star rating and review of at least 8 characters.' },
      { status: 400 },
    );
  }

  try {
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) {
      return NextResponse.json({ success: false, message: 'That product no longer exists.' }, { status: 404 });
    }

    const session = await getCustomerSession();
    const review = await prisma.review.create({
      data: {
        productId,
        userId: session?.userId ?? null,
        name: name.slice(0, 80),
        rating,
        comment: comment.slice(0, 2000),
        isVisible: false,
      },
      select: { id: true, name: true, rating: true, comment: true, createdAt: true },
    });

    return NextResponse.json(
      { success: true, data: review, message: 'Thank you. Your review has been submitted and will appear once approved.' },
      { status: 201 },
    );
  } catch (error) {
    console.error('Review submission failed.', error);
    return NextResponse.json({ success: false, message: 'Your review could not be saved. Please try again.' }, { status: 503 });
  }
}
