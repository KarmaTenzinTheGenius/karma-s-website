import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const MAX_IMAGE_SIZE = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export async function POST(request: Request) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ success: false, message: 'Admin access is required.' }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ success: false, message: 'Upload a supported image file.' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, message: 'Choose an image to upload.' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type) || file.size < 1 || file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json({ success: false, message: 'Use a JPG, PNG, WebP, or GIF image up to 4 MB.' }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!matchesFileSignature(file.type, bytes)) {
    return NextResponse.json({ success: false, message: 'The file contents do not match its image type.' }, { status: 400 });
  }

  try {
    const image = await prisma.productImageAsset.create({
      data: { contentType: file.type, data: bytes },
      select: { id: true },
    });
    return NextResponse.json({ success: true, data: { url: `/api/product-images/${image.id}` } }, { status: 201 });
  } catch (error) {
    console.error('Product image database upload failed.', error);
    return NextResponse.json({ success: false, message: 'The image could not be saved. Check the database connection and try again.' }, { status: 503 });
  }
}

function matchesFileSignature(type: string, bytes: Uint8Array) {
  if (type === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === 'image/png') return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e;
  if (type === 'image/gif') return bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46;
  return type === 'image/webp' && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
}
