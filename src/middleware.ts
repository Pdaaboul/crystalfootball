import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if needed
  await supabase.auth.getUser();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/admin', '/super', '/account'];
  const adminRoutes = ['/admin', '/super'];
  const superadminRoutes = ['/super'];
  const authRoutes = ['/login', '/register', '/reset', '/verify'];

  const pathname = request.nextUrl.pathname;

  // Allow access to verification page for both authenticated and unauthenticated users
  if (pathname.startsWith('/verify')) {
    return supabaseResponse;
  }

  // Check if route requires authentication
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!user) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Check if user's email is confirmed for protected routes
    if (user && !user.email_confirmed_at) {
      const redirectUrl = new URL('/verify', request.url);
      redirectUrl.searchParams.set('email', user.email || '');
      return NextResponse.redirect(redirectUrl);
    }

    // Get user profile for role-based access
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    // Check admin routes
    if (adminRoutes.some(route => pathname.startsWith(route))) {
      if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    // Check superadmin routes
    if (superadminRoutes.some(route => pathname.startsWith(route))) {
      if (!profile || profile.role !== 'superadmin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  // Redirect authenticated users with confirmed emails away from auth pages
  if (user && user.email_confirmed_at && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 