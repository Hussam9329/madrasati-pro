import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'madrasati-pro-secret-key-2026';

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: string;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}

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

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  'مدير': ['all'],
  'معاون': ['students', 'teachers', 'attendance', 'grades', 'reports'],
  'موظف تسجيل': ['students', 'attendance'],
  'موظف بوابة': ['attendance_scan'],
  'مدرس': ['grades_own', 'students_view', 'attendance_view'],
  'ولي أمر': ['child_view'],
  'طالب': ['self_view'],
  'مسؤول نظام': ['all'],
};
