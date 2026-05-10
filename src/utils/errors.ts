/**
 * أدوات تحويل أخطاء تقنية إلى رسائل عربية مفهومة للمستخدم
 *
 * لا تظهر أخطاء تقنية مثل "undefined" أو "500 Internal Server Error" للمستخدم.
 * بدلاً من ذلك يتم تحويلها لرسائل واضحة ومفيدة.
 */

/** خريطة الرسائل الافتراضية حسب نوع الخطأ */
const ERROR_MESSAGES: Record<string, string> = {
  // أخطاء الشبكة
  'Failed to fetch': 'تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت.',
  'NetworkError': 'خطأ في الشبكة. حاول مرة أخرى لاحقاً.',
  'Network request failed': 'لا يوجد اتصال بالإنترنت.',

  // أخطاء الخادم
  '500': 'حدث خطأ في الخادم. حاول مرة أخرى لاحقاً.',
  '502': 'الخادم غير متاح مؤقتاً. حاول بعد قليل.',
  '503': 'الخادم مشغول حالياً. حاول مرة أخرى.',
  '404': 'البيانات المطلوبة غير موجودة.',
  '403': 'ليس لديك صلاحية للقيام بهذا الإجراء.',
  '401': 'انتهت صلاحية الجلسة. سجّل الدخول مرة أخرى.',
  '409': 'البيانات التي تحاول حفظها موجودة مسبقاً.',

  // أخطاء عامة
  'undefined': 'تعذر تحميل البيانات. حاول مرة أخرى.',
  'null': 'تعذر تحميل البيانات. حاول مرة أخرى.',
  'Unknown error': 'حدث خطأ غير متوقع. حاول مرة أخرى.',
};

/**
 * يحوّل رسالة خطأ تقنية إلى رسالة عربية مفهومة للمستخدم
 *
 * @param error - الخطأ الأصلي (string, Error, unknown)
 * @param fallback - رسالة افتراضية إذا لم يتم التعرف على الخطأ
 * @returns رسالة عربية واضحة
 *
 * @example
 * ```ts
 * // بدلاً من إظهار الخطأ التقني مباشرة:
 * toast.error('خطأ', { description: error.message }) // ❌ قد يُظهر "undefined"
 *
 * // استخدم:
 * toast.error('خطأ', { description: getUserMessage(error) }) // ✅ يُظهر رسالة مفهومة
 * ```
 */
export function getUserMessage(
  error: unknown,
  fallback: string = 'تعذر تحميل البيانات. حاول مرة أخرى.'
): string {
  if (!error) return fallback;

  // إذا كان string
  if (typeof error === 'string') {
    return ERROR_MESSAGES[error] ?? error;
  }

  // إذا كان Error object
  if (error instanceof Error) {
    const msg = error.message || '';

    // ابحث عن تطابق في خريطة الأخطاء
    for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
      if (msg.includes(key)) return value;
    }

    // إذا كانت الرسالة تقنية (تحتوي على كود أو path أو undefined)
    if (isTechnicalMessage(msg)) {
      return fallback;
    }

    return msg || fallback;
  }

  // إذا كان Response
  if (typeof error === 'object' && 'status' in error) {
    const status = String((error as { status: number }).status);
    return ERROR_MESSAGES[status] ?? fallback;
  }

  return fallback;
}

/**
 * يتحقق هل الرسالة تقنية لا يجب أن يراها المستخدم
 */
function isTechnicalMessage(msg: string): boolean {
  const technicalPatterns = [
    /undefined/i,
    /null/i,
    /internal server error/i,
    /ECONNREFUSED/i,
    /ENOTFOUND/i,
    /ETIMEDOUT/i,
    /fetch failed/i,
    /JSON\.parse/i,
    /TypeError/i,
    /ReferenceError/i,
    /SyntaxError/i,
    /Cannot read propert/i,
    /is not a function/i,
    /is not defined/i,
    /stack/i,
    /\.\//,
    /node_modules/i,
    /webpack/i,
  ];

  return technicalPatterns.some((pattern) => pattern.test(msg));
}

/**
 * رسائل نجاح عربية موحّدة
 */
export const SUCCESS_MESSAGES = {
  saved: 'تم حفظ التغييرات بنجاح.',
  added: 'تمت الإضافة بنجاح.',
  updated: 'تم التحديث بنجاح.',
  deleted: 'تم الحذف بنجاح.',
  exported: 'تم التصدير بنجاح.',
  imported: 'تم الاستيراد بنجاح.',
  login: 'تم تسجيل الدخول بنجاح.',
  logout: 'تم تسجيل الخروج بنجاح.',
} as const;

/**
 * رسائل حالة فارغة عربية موحّدة
 */
export const EMPTY_MESSAGES = {
  students: 'لم يتم تسجيل أي طالب بعد.',
  teachers: 'لم يتم تسجيل أي مدرس بعد.',
  subjects: 'لم يتم تسجيل أي مادة بعد.',
  classes: 'لم يتم تسجيل أي صف بعد.',
  attendance: 'لا توجد سجلات حضور بعد.',
  grades: 'لا توجد درجات مسجلة بعد.',
  payments: 'لا توجد دفعات مالية بعد.',
  schedule: 'لم يتم إعداد جدول الحصص بعد.',
  search: 'لا توجد نتائج مطابقة للبحث.',
  reports: 'لا توجد تقارير متاحة بعد.',
  data: 'لا توجد بيانات لعرضها.',
} as const;
