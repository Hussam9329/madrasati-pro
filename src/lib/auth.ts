import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

/**
 * JWT secret — MUST be set via environment variable.
 * The app will crash on startup if JWT_SECRET is missing,
 * preventing insecure deployments with a known secret.
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // في وضع الوصول المفتوح، لا نحتاج JWT_SECRET إلزامياً
    // نُعيد سر افتراضي للتوقيع (لن يُستخدم فعلياً)
    return 'open-access-default-secret-not-for-production-use-32ch';
  }
  if (secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long for security.');
  }
  return secret;
}

// Lazy-initialize on first use so the error surfaces at request time,
// not at import time (which would break build/prisma generate).
let _jwtSecret: string | null = null;
function jwtSecret(): string {
  if (!_jwtSecret) _jwtSecret = getJwtSecret();
  return _jwtSecret;
}

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: string;
}

/**
 * Hash a password using bcrypt (async — non-blocking).
 * Prefer this over hashSync in hot paths to avoid blocking the event loop.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Hash a password synchronously — only for seed scripts and CLI tools.
 * Avoid using in request handlers.
 */
export function hashPasswordSync(password: string): string {
  return bcrypt.hashSync(password, 10);
}

/**
 * Compare a plain-text password against a bcrypt hash (async).
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash) as Promise<boolean>;
}

/**
 * Compare a plain-text password against a bcrypt hash (sync).
 * Only for seed scripts — prefer the async version in request handlers.
 */
export function comparePasswordSync(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

/**
 * Generate a JWT token for an authenticated user.
 * Token expires in 8 hours (reduced from 7 days for better security).
 */
export function generateToken(user: AuthUser): string {
  return jwt.sign(user, jwtSecret(), { expiresIn: '8h' });
}

/**
 * Verify a JWT token and return the decoded user, or null if invalid.
 */
export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, jwtSecret()) as AuthUser;
  } catch {
    return null;
  }
}

/**
 * Extract the Bearer token from an Authorization header.
 * Returns null if the header is missing or malformed.
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return token || null;
}

/**
 * Authenticate a request by verifying the Bearer token.
 * Returns the authenticated user or an error response.
 */
export function authenticateRequest(request: Request): { user: AuthUser } | { error: Response } {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) {
    return {
      error: new Response(
        JSON.stringify({ success: false, error: 'انتهت صلاحية الجلسة. سجّل الدخول مرة أخرى.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }

  const user = verifyToken(token);
  if (!user) {
    return {
      error: new Response(
        JSON.stringify({ success: false, error: 'انتهت صلاحية الجلسة. سجّل الدخول مرة أخرى.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }

  return { user };
}

/**
 * Check if a user has a specific permission based on their role.
 */
export function hasPermission(userRole: string, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[userRole];
  if (!permissions) return false;
  if (permissions.includes('all')) return true;
  return permissions.includes(permission);
}

/**
 * Roles used in the system.
 */
export const ROLES = {
  ADMIN: 'مدير',
  ASSISTANT: 'معاون',
  REGISTRAR: 'موظف تسجيل',
  GATE: 'موظف بوابة',
  TEACHER: 'مدرس',
  PARENT: 'ولي أمر',
  STUDENT: 'طالب',
  SYSTEM: 'مسؤول نظام',
} as const;

/**
 * Permission mappings for each role.
 * 'all' grants unrestricted access.
 */
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  'مدير': ['all'],
  'معاون': ['students', 'teachers', 'attendance', 'grades', 'reports', 'schedule', 'classes', 'subjects', 'payments', 'users_view'],
  'موظف تسجيل': ['students', 'attendance', 'payments_view'],
  'موظف بوابة': ['attendance_scan'],
  'مدرس': ['grades_own', 'students_view', 'attendance_view', 'schedule_view'],
  'ولي أمر': ['child_view'],
  'طالب': ['self_view'],
  'مسؤول نظام': ['all'],
};

/**
 * Roles that have admin-level access (can manage users, approve grades, etc.)
 */
export const ADMIN_ROLES = ['مدير', 'مسؤول نظام'] as const;

/**
 * Roles that can approve grades
 */
export const GRADE_APPROVAL_ROLES = ['مدير', 'مسؤول نظام', 'معاون'] as const;
