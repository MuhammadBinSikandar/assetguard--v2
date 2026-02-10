import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAccessTokenEdge } from './lib/auth-edge';
import { middlewareLogger } from './lib/debug-logger-edge';

// Define protected routes and their required roles
const PROTECTED_ROUTES: Record<string, { roles?: string[]; requireEmailVerified?: boolean }> = {
  '/admin': { roles: ['admin'], requireEmailVerified: true },
  '/dashboard': { roles: ['user', 'admin'], requireEmailVerified: false },
  '/register/property': { roles: ['user', 'seller'], requireEmailVerified: true },
};

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/register',
  '/auth/register',
  '/auth/verify-otp',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/explorer',
  '/listings',
  '/properties',
];

// API routes that should be excluded from middleware
const EXCLUDED_API_ROUTES = [
  '/api/auth/register',
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/auth/verify-email',
  '/api/auth/verify-otp',
  '/api/auth/resend-otp',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/get-pending-email',
];

/**
 * Check if a route matches a pattern
 */
function matchesRoute(pathname: string, route: string): boolean {
  if (route === pathname) return true;
  if (route.endsWith('*')) {
    const baseRoute = route.slice(0, -1);
    return pathname.startsWith(baseRoute);
  }
  return false;
}

/**
 * Check if user has required role
 */
function hasRequiredRole(userRoles: string[], requiredRoles: string[]): boolean {
  return requiredRoles.some((role) => userRoles.includes(role));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files, Next.js internals, and excluded API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    EXCLUDED_API_ROUTES.some((route) => matchesRoute(pathname, route))
  ) {
    return NextResponse.next();
  }

  // Get access token from cookie
  const accessToken = request.cookies.get('access_token')?.value;
  
  // Log middleware start
  middlewareLogger.start(pathname, !!accessToken);

  // Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some((route) => matchesRoute(pathname, route));

  // Verify access token
  let user = null;
  if (accessToken) {
    user = await verifyAccessTokenEdge(accessToken);
    middlewareLogger.tokenVerification(!!user, user, pathname);
  } else {
    middlewareLogger.tokenVerification(false, null, pathname);
  }

  // Find matching protected route
  let matchedRoute: { roles?: string[]; requireEmailVerified?: boolean } | null = null;
  for (const [route, config] of Object.entries(PROTECTED_ROUTES)) {
    if (matchesRoute(pathname, route)) {
      matchedRoute = config;
      break;
    }
  }

  // Log route analysis
  middlewareLogger.routeMatch(pathname, !!matchedRoute, isPublicRoute, matchedRoute);

  // If route is protected and user is not authenticated
  if (matchedRoute && !user) {
    // Redirect to login with callback
    middlewareLogger.redirect(pathname, '/login', 'User not authenticated');
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If route is protected and requires specific roles
  if (matchedRoute && user) {
    // Check email verification requirement (admins bypass this check)
    const isAdmin = user.roles.includes('admin');
    
    middlewareLogger.emailVerificationCheck(
      pathname,
      user.emailVerified || false,
      matchedRoute.requireEmailVerified || false,
      isAdmin
    );
    
    if (matchedRoute.requireEmailVerified && !user.emailVerified && !isAdmin) {
      middlewareLogger.redirect(pathname, '/verify-email', 'Email not verified');
      const verifyUrl = new URL('/verify-email', request.url);
      verifyUrl.searchParams.set('message', 'Please verify your email to access this page');
      return NextResponse.redirect(verifyUrl);
    }

    // Check role requirements
    if (matchedRoute.roles) {
      const hasAccess = hasRequiredRole(user.roles, matchedRoute.roles);
      middlewareLogger.roleCheck(pathname, user.roles, matchedRoute.roles, hasAccess);
      
      if (!hasAccess) {
        // User doesn't have required role
        middlewareLogger.redirect(pathname, '/dashboard', 'Insufficient permissions');
        const unauthorizedUrl = new URL('/dashboard', request.url);
        unauthorizedUrl.searchParams.set('error', 'unauthorized');
        return NextResponse.redirect(unauthorizedUrl);
      }
    }
  }

  // For API routes (except excluded ones), require authentication
  if (pathname.startsWith('/api/') && !isPublicRoute) {
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
        },
        { status: 401 }
      );
    }
  }

  // Add user info to request headers for server components
  if (user) {
    middlewareLogger.allowed(pathname, user);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user.userId);
    requestHeaders.set('x-user-email', user.email);
    requestHeaders.set('x-user-roles', JSON.stringify(user.roles));

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

// Configure which routes should run the middleware
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
