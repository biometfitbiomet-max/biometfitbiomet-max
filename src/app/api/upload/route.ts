import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const folder = searchParams.get('folder') || 'ingredients';
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filePath = `${folder}/${id}.${ext}`;
    const contentType = file.type || 'image/jpeg';

    const storage = getStorage();
    const bucket = storage.bucket();
    const fileRef = bucket.file(filePath);

    await fileRef.save(buffer, {
      metadata: { contentType },
      public: true,
    });

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    return NextResponse.json({ url: publicUrl, path: filePath });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
