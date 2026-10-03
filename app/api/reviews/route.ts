import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { products } from '@/lib/products';
import { demoReviews } from '@/lib/demo-orders';

export function GET(request: Request) {
  const productId = Number(new URL(request.url).searchParams.get('productId'));
  return NextResponse.json({ success: true, data: demoReviews.filter((review) => review.productId === productId), demo: true });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const productId = Number(body?.productId);
  const rating = Number(body?.rating);
  if (!products.some((product) => product.id === productId) || !Number.isInteger(rating) || rating < 1 || rating > 5 || typeof body?.name !== 'string' || !body.name.trim() || typeof body?.comment !== 'string' || body.comment.trim().length < 8) {
    return NextResponse.json({ success: false, message: 'Provide a valid product, name, 1–5 star rating and review of at least 8 characters.' }, { status: 400 });
  }
  const review = { id: randomUUID(), productId, name: body.name.trim().slice(0, 80), rating, comment: body.comment.trim().slice(0, 2000), createdAt: new Date().toISOString() };
  demoReviews.push(review);
  return NextResponse.json({ success: true, data: review, demo: true }, { status: 201 });
}