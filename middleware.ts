import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Set cookie on request for current request
          request.cookies.set({
            name,
            value,
            ...options,
          });
          // Set cookie on response for subsequent requests
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          // Remove cookie on request
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          // Remove cookie on response
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Refresh session if expired - required for Server Components
  // This will automatically refresh the session if it's expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes
  const protectedRoutes = ['/dashboard', '/parent', '/teacher', '/admin'];
  const authRoutes = ['/login', '/signup'];
  const verifyRoute = '/verify';
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );
  const isVerifyRoute = request.nextUrl.pathname.startsWith(verifyRoute);

  // Redirect to login if accessing protected route without auth
  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check email verification for authenticated users
  if (user) {
    // Get user's email verification status from database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { emailVerified: true },
    });

    // If user is not verified
    if (!dbUser?.emailVerified) {
      // Allow access to verify page
      if (isVerifyRoute) {
        return response;
      }

      // Redirect to verify if trying to access protected routes or auth routes
      if (isProtectedRoute || isAuthRoute) {
        // Get email from Supabase user
        const email = user.email || '';
        return NextResponse.redirect(
          new URL(`/verify?userId=${user.id}&email=${encodeURIComponent(email)}`, request.url)
        );
      }
    } else {
      // User is verified, redirect away from auth routes to parent dashboard
      if (isAuthRoute) {
        return NextResponse.redirect(new URL('/parent', request.url));
      }

      // Redirect away from verify route to parent dashboard if already verified
      if (isVerifyRoute) {
        return NextResponse.redirect(new URL('/parent', request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     * - auth/callback (OAuth callback)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|api|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
