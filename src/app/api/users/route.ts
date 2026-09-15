import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const maxResults = Math.min(Number(searchParams.get('pageSize') || 1000), 1000);
    const pageToken = searchParams.get('pageToken') || undefined;

    const auth = getAuth();
    const result = await auth.listUsers(maxResults, pageToken);

    const users = result.users.map((user) => ({
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
      emailVerified: user.emailVerified,
      disabled: user.disabled,
      createdAt: user.metadata.creationTime || null,
      lastSignIn: user.metadata.lastSignInTime || null,
    }));

    return NextResponse.json({
      users,
      pageToken: result.pageToken || null,
      total: users.length,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
