import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ["ka", "en"] as const;
const defaultLocale = "ka";

function isValidLocale(locale: string): boolean {
  return locales.includes(locale as typeof locales[number]);
}

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/:locale/dashboard(.*)',
  '/:locale/instructors/:id/book',
  '/api/protected(.*)',
]);

// Paths that should NOT get a locale prefix
const isExcludedPath = (pathname: string) => {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/sign-up') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/llms.txt' ||
    pathname.match(/\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)$/)
  );
};


/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse, request: NextRequest) {
  const clerkSources = [
    "https://*.clerk.accounts.dev",
    "https://clerk.accounts.dev",
    "https://clerk.instruktori.ge",
    "https://clerk.instruqtori.ge",
    "https://*.clerk.dev",
    "https://clerk.dev",
  ].join(" ");

  // Content Security Policy - Prevents XSS attacks
  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-eval' 'unsafe-inline' ${clerkSources} https://www.youtube.com https://www.youtube-nocookie.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "worker-src 'self' blob:",
    `connect-src 'self' http://localhost:* https://*.onrender.com ${clerkSources} https://www.youtube.com https://www.youtube-nocookie.com`,
    `frame-src 'self' ${clerkSources} https://www.google.com https://maps.google.com https://www.youtube.com https://www.youtube-nocookie.com`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests"
  ];
  response.headers.set('Content-Security-Policy', cspDirectives.join('; '));

  // HTTP Strict Transport Security
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  // X-Frame-Options - Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // X-Content-Type-Options - Prevent MIME sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Referrer-Policy - Control referrer information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions-Policy - Control browser features
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), payment=()'
  );

  // X-XSS-Protection - Legacy XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Remove server header
  response.headers.delete('X-Powered-By');

  // CORS Headers
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://instruktori.ge',
    'https://www.instruktori.ge',
    'https://instruqtori.ge',
    'https://www.instruqtori.ge',
    process.env.NEXT_PUBLIC_APP_URL || '',
  ].filter(Boolean);

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    );
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-CSRF-Token'
    );
  }

  // Rate limit headers
  response.headers.set('X-RateLimit-Limit', '100');
  response.headers.set('X-RateLimit-Remaining', '99');
  response.headers.set('X-RateLimit-Reset', new Date(Date.now() + 60000).toISOString());

  return response;
}

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;

  // Handle OPTIONS preflight requests
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 });
    return addSecurityHeaders(response, request);
  }

  // Locale redirect — must happen before auth checks
  if (!isExcludedPath(pathname)) {
    const segments = pathname.split('/');
    const maybeLocale = segments[1];

    if (!maybeLocale || !isValidLocale(maybeLocale)) {
      // No valid locale in URL → redirect to default locale
      const url = request.nextUrl.clone();
      url.pathname = `/${defaultLocale}${pathname === '/' ? '' : pathname}`;
      return NextResponse.redirect(url);
    }
  }

  // Protect routes that require authentication
  const { userId, redirectToSignIn } = await auth();
  if (isProtectedRoute(request) && !userId) {
    return redirectToSignIn();
  }

  // Continue with the request and add security headers
  const response = NextResponse.next();
  return addSecurityHeaders(response, request);
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
