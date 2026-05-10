/**
 * Rate Limiting — تحديد عدد الطلبات لمنع هجمات القوة الغاشمة.
 *
 * يستخدم تخزين في الذاكرة (Map) مع تنظيف تلقائي.
 * مناسب للاستخدام مع Next.js Edge/Node.js runtime.
 *
 * الاستخدام:
 *   const rateLimiter = new RateLimiter({ windowMs: 15 * 60 * 1000, max: 5 });
 *   const result = rateLimiter.check(ip);
 *   if (!result.success) return errorResponse(...);
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimiterOptions {
  /** نافذة الوقت بالمللي ثانية (default: 15 دقيقة) */
  windowMs: number;
  /** أقصى عدد طلبات في النافذة (default: 5) */
  max: number;
  /** رسالة الخطأ عند تجاوز الحد */
  message?: string;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
}

export class RateLimiter {
  private hits: Map<string, RateLimitEntry> = new Map();
  private windowMs: number;
  private max: number;
  private message: string;
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor(options: RateLimiterOptions) {
    this.windowMs = options.windowMs || 15 * 60 * 1000; // 15 دقيقة
    this.max = options.max || 5;
    this.message = options.message || 'محاولات كثيرة جداً. حاول بعد قليل.';

    // تنظيف المدخلات المنتهية كل دقيقة
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.hits.entries()) {
        if (now > entry.resetTime) {
          this.hits.delete(key);
        }
      }
    }, 60 * 1000);

    // منع تسرب الذاكرة في بيئة serverless
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * فحص هل الطلب مسموح أم لا
   * @param key معرف فريد (عادة IP أو IP+مسار)
   * @returns نتيجة الفحص
   */
  check(key: string): RateLimitResult {
    const now = Date.now();

    const entry = this.hits.get(key);

    // لا يوجد سجلات سابقة أو انتهت النافذة
    if (!entry || now > entry.resetTime) {
      const resetTime = now + this.windowMs;
      this.hits.set(key, { count: 1, resetTime });
      return {
        success: true,
        remaining: this.max - 1,
        resetTime,
      };
    }

    // ضمن النافذة الزمنية
    entry.count++;

    if (entry.count > this.max) {
      return {
        success: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    return {
      success: true,
      remaining: this.max - entry.count,
      resetTime: entry.resetTime,
    };
  }

  /**
   * الحصول على رسالة الخطأ مع الوقت المتبقي
   */
  getErrorMessage(key: string): string {
    const entry = this.hits.get(key);
    if (!entry) return this.message;

    const remainingMs = entry.resetTime - Date.now();
    if (remainingMs <= 0) return this.message;

    const remainingMinutes = Math.ceil(remainingMs / 60000);
    return `محاولات كثيرة جداً. حاول بعد ${remainingMinutes} دقيقة.`;
  }

  /**
   * إعادة تعيين عداد لـ key معين
   */
  reset(key: string): void {
    this.hits.delete(key);
  }
}

/**
 * Rate limiter خاص بتسجيل الدخول:
 * - 5 محاولات كل 15 دقيقة لكل IP
 */
export const loginRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 5,
  message: 'محاولات تسجيل دخول كثيرة جداً. حاول بعد 15 دقيقة.',
});

/**
 * Rate limiter عام لجميع API routes:
 * - 100 طلب كل دقيقة لكل IP
 */
export const apiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // دقيقة واحدة
  max: 100,
  message: 'طلبات كثيرة جداً. حاول بعد قليل.',
});

/**
 * استخراج عنوان IP من الطلب
 */
export function getClientIp(request: Request): string {
  // Vercel يضع IP في x-forwarded-for أو x-real-ip
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  // fallback
  return 'unknown';
}
