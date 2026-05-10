// ==================== API Response Helpers ====================
import { NextResponse } from 'next/server';
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
 */
export function errorResponse(error: string, status = 500, details?: string) {
  return NextResponse.json(
    { success: false, error, ...(details && { details }) } satisfies ApiErrorResponse,
    { status }
  );
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
 */
export function validateRequired(body: Record<string, unknown>, fields: string[]): string | null {
  for (const field of fields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      return `الحقل "${field}" مطلوب`;
    }
  }
  return null;
}
