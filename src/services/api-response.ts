// ==================== API Response Helpers ====================
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { isDbAvailable, dbUnavailableResponse } from '@/lib/db';

/**
 * Standardized API response format
 */
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

interface ApiErrorResponse {
  success: false;
  error: string;
  details?: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Return a success response with data
 */
export function successResponse<T>(data: T, message?: string, status = 200) {
  return NextResponse.json(
    { success: true, data, ...(message && { message }) } satisfies ApiSuccessResponse<T>,
    { status }
  );
}

/**
 * Return an error response
 * يُخفي الأخطاء التقنية (مثل stack traces) عن المستخدم
 * ويعرض رسائل عربية مفهومة بدلاً من ذلك
 */
export function errorResponse(error: string, status = 500, details?: string) {
  // تحويل الأخطاء التقنية لرسائل عربية مفهومة
  const userMessage = getServerUserMessage(error, status);
  return NextResponse.json(
    { success: false, error: userMessage, ...(details && { details }) } satisfies ApiErrorResponse,
    { status }
  );
}

/**
 * يحوّل رسائل الخطأ التقنية إلى رسائل عربية مفهومة
 * لا تُظهر أخطاء مثل "undefined" أو "500 Internal Server Error" للمستخدم
 */
function getServerUserMessage(error: string, status: number): string {
  // أخطاء حسب كود الحالة
  const statusMessages: Record<number, string> = {
    400: 'البيانات المُدخلة غير صحيحة. تحقق من الحقول المطلوبة.',
    401: 'انتهت صلاحية الجلسة. سجّل الدخول مرة أخرى.',
    403: 'ليس لديك صلاحية للقيام بهذا الإجراء.',
    404: 'البيانات المطلوبة غير موجودة.',
    409: 'البيانات موجودة مسبقاً.',
    422: 'البيانات المُدخلة غير صالحة. تحقق من الحقول.',
    500: 'حدث خطأ في الخادم. حاول مرة أخرى لاحقاً.',
    503: 'الخدمة غير متاحة مؤقتاً. حاول بعد قليل.',
  };

  // إذا كان كود الحالة معروف، استخدم رسالته
  if (statusMessages[status]) return statusMessages[status];

  // إذا كانت رسالة الخطأ عربية أصلاً، أعد استخدامها
  if (/[\u0600-\u06FF]/.test(error)) return error;

  // أخطاء تقنية شائعة
  const technicalMap: Record<string, string> = {
    'Failed to fetch': 'تعذر الاتصال بالخادم.',
    'PrismaClientInitializationError': 'تعذر الاتصال بقاعدة البيانات.',
    'P2002': 'البيانات موجودة مسبقاً.',
    'P2025': 'البيانات المطلوبة غير موجودة.',
    'P2003': 'بيانات مرتبطة غير موجودة.',
    'undefined': 'تعذر تنفيذ العملية. حاول مرة أخرى.',
    'null': 'تعذر تنفيذ العملية. حاول مرة أخرى.',
  };

  for (const [key, value] of Object.entries(technicalMap)) {
    if (error.includes(key)) return value;
  }

  // إذا كانت الرسالة تقنية، لا تُظهرها للمستخدم
  if (isTechnicalServerMessage(error)) {
    return 'تعذر تنفيذ العملية. حاول مرة أخرى.';
  }

  return error;
}

function isTechnicalServerMessage(msg: string): boolean {
  const patterns = [
    /Error:/i,
    /at\s+\w+/,
    /\.\//,
    /node_modules/i,
    /stack/i,
    /trace/i,
    /TypeError/i,
    /ReferenceError/i,
    /Cannot read propert/i,
    /is not a function/i,
  ];
  return patterns.some((p) => p.test(msg));
}

/**
 * Check database availability and return error if unavailable
 * Returns null if DB is available (caller should proceed)
 */
export function checkDb() {
  if (!isDbAvailable()) {
    const resp = dbUnavailableResponse();
    return errorResponse(resp.error, 503);
  }
  return null;
}

/**
 * Validate required fields in request body
 * @deprecated Use Zod schemas from @/lib/validations instead
 */
export function validateRequired(body: Record<string, unknown>, fields: string[]): string | null {
  for (const field of fields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      return `الحقل "${field}" مطلوب`;
    }
  }
  return null;
}

/**
 * Convert a ZodError into a user-friendly validation error response.
 * Returns a 422 response with the first validation error message.
 */
export function validationErrorResponse(error: ZodError): NextResponse {
  const issues = error.issues;
  const firstError = issues[0];
  const message = firstError?.message || 'البيانات المُدخلة غير صالحة';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const details = issues.map((issue: any) => ({
    field: Array.isArray(issue.path) ? issue.path.join('.') : '',
    message: String(issue.message || ''),
  }));
  return NextResponse.json(
    {
      success: false,
      error: message,
      details,
    },
    { status: 422 }
  );
}

/**
 * Return a 403 forbidden response for unauthorized access.
 */
export function forbiddenResponse(message = 'ليس لديك صلاحية للقيام بهذا الإجراء.') {
  return errorResponse(message, 403);
}
