import { NextRequest, NextResponse } from 'next/server';
import { checkCredentials, createSessionToken, COOKIE_NAME } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!checkCredentials(email ?? '', password ?? '')) {
      return NextResponse.json({ error: 'Credențiale invalide' }, { status: 401 });
    }

    const token = await createSessionToken();
    const res = NextResponse.json({ success: true });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });
    return res;
  } catch {
    return NextResponse.json({ error: 'Request invalid' }, { status: 400 });
  }
}
