import { type NextRequest } from 'next/server';
import { updateSession } from './lib/supabase/middleware';

/**
 * Proxy: Session Management & Protected Routes
 *
 * Responsibilities:
 * - Refreshing Supabase session tokens from cookies
 * - Redirecting unauthenticated users to /login (except public routes)
 *
 * Public routes (no auth required):
 * - / (home)
 * - /login
 * - /auth/* (OAuth callbacks)
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (avoid interfering with streaming and API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!api/|_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
