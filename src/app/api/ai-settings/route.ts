import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    const doc = await db.collection('config').doc('groq_settings').get();

    if (!doc.exists) {
      return NextResponse.json({
        apiKeys: [],
        visionModel: 'qwen/qwen3.6-27b',
        textModel: 'llama-3.3-70b-versatile',
      });
    }

    const data = doc.data();
    return NextResponse.json({
      apiKeys: data?.apiKeys || [],
      visionModel: data?.visionModel || 'qwen/qwen3.6-27b',
      textModel: data?.textModel || 'llama-3.3-70b-versatile',
    });
  } catch (error) {
    console.error('Error fetching AI settings:', error);
    return NextResponse.json({ error: 'Failed to fetch AI settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const db = getDb();

    const updateData = {
      apiKeys: body.apiKeys || [],
      visionModel: body.visionModel || 'qwen/qwen3.6-27b',
      textModel: body.textModel || 'llama-3.3-70b-versatile',
      updatedAt: new Date(),
    };

    await db.collection('config').doc('groq_settings').set(updateData, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating AI settings:', error);
    return NextResponse.json({ error: 'Failed to update AI settings' }, { status: 500 });
  }
}
