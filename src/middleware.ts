import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple middleware - currently allowing all requests
export default function middleware(request: NextRequest) {
  // Allow all requests for now
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};


