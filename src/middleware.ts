import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { apiRateLimiter, getClientIp } from '@/lib/rate-limit';

/**
 * Middleware لحماية مسارات API.
 *
 * النظام مفتوح للجميع بدون تسجيل دخول.
 * إذا لم يكن هناك token صالح، يُحقن مستخدم مدير افتراضي تلقائياً.
 *
 * ميزات إضافية:
 *   - Rate limiting لمنع إساءة الاستخدام
 *   - التحقق من صحة JWT إذا وُجد، وإلا يُستخدم حساب المدير الافتراضي
 */

// Default admin user injected when no auth token is present
const DEFAULT_ADMIN = {
  id: 'default-admin',
  username: 'admin',
  name: 'مدير النظام',
  role: 'مدير',
};

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

  // Try to extract and verify Bearer token
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  const user = token ? verifyToken(token) : null;

  // If no valid token, inject default admin user (open access)
  const effectiveUser = user || DEFAULT_ADMIN;

  // Add user info to request headers for downstream handlers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', effectiveUser.id);
  requestHeaders.set('x-user-role', effectiveUser.role);
  requestHeaders.set('x-user-name', encodeURIComponent(effectiveUser.name));
  requestHeaders.set('x-user-username', effectiveUser.username);

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
