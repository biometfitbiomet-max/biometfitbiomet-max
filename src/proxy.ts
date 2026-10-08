import { NextResponse, type NextRequest } from 'next/server';
import { verifySessionToken, COOKIE_NAME } from '@/lib/admin-auth';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Login/logout endpoints rămân publice
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  const isApi = pathname.startsWith('/api/');
  const isDashboard = pathname.startsWith('/dashboard');

  if (!isApi && !isDashboard) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const valid = await verifySessionToken(token);

  if (valid) {
    return NextResponse.next();
  }

  if (isApi) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.search = '';
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};
