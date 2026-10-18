import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth-server';

const MAX_IMAGE_SIZE = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export async function POST(request: Request) {
  if (!(await getAdminSession())) return NextResponse.json({ success: false, message: 'Admin access is required.' }, { status: 403 });
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({
      success: false,
      message: 'Custom image uploads are not configured. You can still save the product with the default image; set BLOB_READ_WRITE_TOKEN to enable uploads.',
    }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ success: false, message: 'Upload a supported image file.' }, { status: 400 });
  }
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ success: false, message: 'Choose an image to upload.' }, { status: 400 });
  if (!ALLOWED_TYPES.has(file.type) || file.size < 1 || file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json({ success: false, message: 'Use a JPG, PNG, WebP, or GIF image up to 4 MB.' }, { status: 400 });
  }

  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!matchesFileSignature(file.type, header)) {
    return NextResponse.json({ success: false, message: 'The file contents do not match its image type.' }, { status: 400 });
  }

  try {
    const extension = file.type.split('/')[1].replace('jpeg', 'jpg');
    const blob = await put(`products/${crypto.randomUUID()}.${extension}`, file, {
      access: 'public',
      addRandomSuffix: false,
      contentType: file.type,
    });
    return NextResponse.json({ success: true, data: { url: blob.url } }, { status: 201 });
  } catch (error) {
    console.error('Product image upload failed.', error);
    return NextResponse.json({ success: false, message: 'The image could not be uploaded. Check Blob storage configuration.' }, { status: 503 });
  }
}

function matchesFileSignature(type: string, bytes: Uint8Array) {
  if (type === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === 'image/png') return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (type === 'image/gif') return bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46;
  return type === 'image/webp' && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
}
