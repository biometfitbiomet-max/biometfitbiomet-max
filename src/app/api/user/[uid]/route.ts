import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    const auth = getAuth();
    const userRecord = await auth.getUser(uid);

    return NextResponse.json({
      uid: userRecord.uid,
      email: userRecord.email || '',
      displayName: userRecord.displayName || null,
      photoURL: userRecord.photoURL || null,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
}
