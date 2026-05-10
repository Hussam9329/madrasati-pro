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
 * Centralized fetch wrapper with error handling and auth headers
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorMessage || errorData.error || `خطأ في الخادم (${response.status})`;
      if (showToast) toast.error(message);
      return { data: null, error: message, ok: false };
    }

    const data = await response.json() as T;
    return { data, error: null, ok: true };
  } catch (err) {
    const message = errorMessage || 'خطأ في الاتصال بالخادم';
    if (showToast) toast.error(message);
    return { data: null, error: message, ok: false };
  }
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
