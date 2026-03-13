import { getToken } from 'next-auth/jwt';
import { NextResponse, type NextRequest } from 'next/server';

function isPublicAsset(pathname: string) {
  return (
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/icon') ||
    pathname.startsWith('/apple-icon') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.webp') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.json')
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicAsset(pathname)) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (token && pathname === '/login') {
    return NextResponse.redirect(new URL('/app', request.url));
  }

  if (!token && pathname.startsWith('/app')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*', '/login', '/onboarding', '/manifest.json'],
};
