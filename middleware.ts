import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function isOriginAllowed(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  // Allow requests with no Origin (same-origin navigations, server-to-server)
  if (!origin) return true;
  const host = request.headers.get('host');
  if (!host) return false;
  try {
    const originHost = new URL(origin).host;
    return originHost === host;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // CSRF: validate Origin on state-changing API requests
  if (pathname.startsWith('/api/') && request.method !== 'GET') {
    if (!isOriginAllowed(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // Admin routes: skip login page
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};
