import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth/');
  const isPublicRoute = isAuthPage;

  // Si no hay token y la ruta requiere autenticación
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Si hay token y estamos en una página de auth, redirigir a gallery
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/gallery', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};