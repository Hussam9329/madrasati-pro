import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { apiRateLimiter, getClientIp } from '@/lib/rate-limit';

/**
 * Middleware لحماية مسارات API والتحقق من المصادقة والصلاحيات.
 *
 * المسارات العامة (لا تتطلب مصادقة):
 *   - GET /api              (health check)
 *   - POST /api/auth/login  (login)
 *
 * جميع مسارات /api/* الأخرى تتطلب Bearer token صالح.
 *
 * ميزات إضافية:
 *   - Rate limiting لمنع إساءة الاستخدام
 *   - التحقق من صحة JWT قبل الوصول لأي مسار محمي
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /api routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Rate limiting على جميع مسارات API
  const clientIp = getClientIp(request);
  const rateLimitResult = apiRateLimiter.check(clientIp);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { success: false, error: 'طلبات كثيرة جداً. حاول بعد قليل.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
        },
      }
    );
  }

  // Public routes — no auth required
  const publicRoutes = [
    '/api/auth/login',  // Login endpoint
    '/api',             // Health check
  ];

  if (publicRoutes.some((route) => pathname === route)) {
    return NextResponse.next();
  }

  // Extract Bearer token from Authorization header
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, error: 'انتهت صلاحية الجلسة. سجّل الدخول مرة أخرى.' },
      { status: 401 }
    );
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return NextResponse.json(
      { success: false, error: 'انتهت صلاحية الجلسة. سجّل الدخول مرة أخرى.' },
      { status: 401 }
    );
  }

  // Verify token
  const user = verifyToken(token);
  if (!user) {
    return NextResponse.json(
      { success: false, error: 'انتهت صلاحية الجلسة. سجّل الدخول مرة أخرى.' },
      { status: 401 }
    );
  }

  // Add user info to request headers for downstream handlers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', user.id);
  requestHeaders.set('x-user-role', user.role);
  requestHeaders.set('x-user-name', encodeURIComponent(user.name));
  requestHeaders.set('x-user-username', user.username);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all API routes except:
     * - _next (internal Next.js)
     * - static files
     */
    '/api/:path*',
  ],
};
