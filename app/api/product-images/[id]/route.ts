import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-z0-9]{20,32}$/i.test(id)) {
    return NextResponse.json({ success: false, message: 'Image not found.' }, { status: 404 });
  }

  try {
    const image = await prisma.productImageAsset.findUnique({
      where: { id },
      select: { contentType: true, data: true },
    });
    if (!image) return new Response('Image not found.', { status: 404 });

    return new Response(new Uint8Array(image.data), {
      headers: {
        'Content-Type': image.contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Product image lookup failed.', error);
    return new Response('Image is temporarily unavailable.', { status: 503 });
  }
}
