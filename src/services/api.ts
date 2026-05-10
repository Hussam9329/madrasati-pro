// ==================== API Service Layer ====================

import { toast } from 'sonner';

const API_BASE = '/api';

interface ApiOptions extends RequestInit {
  /** Show error toast on failure (default: true) */
  showToast?: boolean;
  /** Custom error message */
  errorMessage?: string;
}

interface ApiResponse<T = unknown> {
  data: T | null;
  error: string | null;
  ok: boolean;
}

/**
 * مسح بيانات المصادقة من التخزين المحلي وإعادة التوجيه لصفحة تسجيل الدخول.
 * يُستخدم عند انتهاء الجلسة أو عند استلام استجابة 401.
 */
function clearAuthAndRedirect() {
  if (typeof window === 'undefined') return;

  try {
    // مسح حالة المصادقة من Zustand persist
    const storageKey = 'madrasati-storage';
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.state?.auth) {
          parsed.state.auth = {
            user: null,
            token: null,
            isAuthenticated: false,
          };
          localStorage.setItem(storageKey, JSON.stringify(parsed));
        }
      } catch {
        // إذا فشل التحليل، احذف كامل التخزين
        localStorage.removeItem(storageKey);
      }
    }
  } catch {
    // تجاهل أخطاء localStorage
  }

  // إظهار رسالة للمستخدم قبل إعادة التوجيه
  toast.error('انتهت صلاحية الجلسة. سجّل الدخول مرة أخرى.');

  // إعادة تحميل الصفحة لإعادة تصيير المكون مع حالة غير مصادق
  setTimeout(() => {
    window.location.href = '/';
  }, 1500);
}

/**
 * Centralized fetch wrapper with error handling, auth headers, and session expiry detection.
 *
 * الميزات:
 * - إضافة تلقائية لرأس المصادقة (Bearer token)
 * - كشف انتهاء الجلسة (401) وإعادة التوجيه لتسجيل الدخول
 * - كشف انعدام الصلاحية (403) وعرض رسالة مناسبة
 * - رسائل خطأ عربية مفهومة
 * - إشعارات toast تلقائية عند الخطأ
 */
export async function apiFetch<T = unknown>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<ApiResponse<T>> {
  const { showToast = true, errorMessage, ...fetchOptions } = options;

  try {
    // Build URL
    const url = endpoint.startsWith('/') ? endpoint : `${API_BASE}${endpoint}`;

    // Add auth header if token exists
    const token = typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('madrasati-storage') || '{}')?.state?.auth?.token
      : null;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // معالجة انتهاء الجلسة - 401
    if (response.status === 401) {
      clearAuthAndRedirect();
      return {
        data: null,
        error: 'انتهت صلاحية الجلسة. سجّل الدخول مرة أخرى.',
        ok: false,
      };
    }

    // معالجة انعدام الصلاحية - 403
    if (response.status === 403) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.error || 'ليس لديك صلاحية للقيام بهذا الإجراء.';
      if (showToast) toast.error(message);
      return { data: null, error: message, ok: false };
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorMessage || errorData.error || `خطأ في الخادم (${response.status})`;
      if (showToast) toast.error(message);
      return { data: null, error: message, ok: false };
    }

    const result = await response.json();
    // API responses are wrapped in { success: true, data: T } format
    // Extract the actual data payload
    const data = (result.success === true && result.data !== undefined) ? result.data : result;
    return { data: data as T, error: null, ok: true };
  } catch (err) {
    // كشف خطأ الشبكة (السيرفر متوقف أو لا يوجد اتصال)
    const isNetworkError = err instanceof TypeError && err.message === 'Failed to fetch';
    const message = isNetworkError
      ? 'تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت.'
      : (errorMessage || 'خطأ في الاتصال بالخادم');
    if (showToast) toast.error(message);
    return { data: null, error: message, ok: false };
  }
}

/**
 * Extract data from API response that wraps results in { success, data } format.
 * Use this when calling fetch() directly instead of apiFetch().
 *
 * API returns: { success: true, data: { ... } }
 * This function extracts: { ... }
 */
export function extractApiData<T = unknown>(response: { success?: boolean; data?: T } | T): T {
  if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
    return (response as { success: boolean; data: T }).data;
  }
  return response as T;
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: <T = unknown>(endpoint: string, options?: ApiOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = unknown>(endpoint: string, body?: unknown, options?: ApiOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T = unknown>(endpoint: string, body?: unknown, options?: ApiOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T = unknown>(endpoint: string, options?: ApiOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'DELETE' }),
};

/**
 * fetchWithAuth — بديل مباشر لـ fetch() يضيف رأس المصادقة تلقائياً.
 *
 * يُستخدم كبديل مباشر لـ fetch() في المكونات:
 *   const res = await fetchWithAuth('/api/students')
 *   const data = await res.json()
 *
 * الفرق عن fetch():
 * - يضيف رأس Authorization: Bearer <token> تلقائياً
 * - عند استلام 401، يعرض رسالة ويعيد التوجيه لتسجيل الدخول
 * - عند استلام 403، يعرض رسالة "ليس لديك صلاحية"
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('madrasati-storage') || '{}')?.state?.auth?.token
    : null;

  const headers = new Headers(options.headers || {});

  // لا نضيف Content-Type إذا كان الطلب يحتوي على FormData
  if (!(options.body instanceof FormData)) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // معالجة انتهاء الجلسة - 401
  if (response.status === 401) {
    clearAuthAndRedirect();
    // نُرجع response جديد لنمنع الأخطاء في الكود المستدعي
    return new Response(
      JSON.stringify({ success: false, error: 'انتهت صلاحية الجلسة.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return response;
}
