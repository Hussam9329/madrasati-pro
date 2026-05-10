/**
 * Tests for authentication utilities
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock jsonwebtoken and bcryptjs before importing auth
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(() => 'mock-jwt-token'),
    verify: vi.fn(),
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(async () => '$2a$10$hashedpassword'),
    compare: vi.fn(async () => true),
    hashSync: vi.fn(() => '$2a$10$hashedpassword'),
    compareSync: vi.fn(() => true),
  },
}));

// Set JWT_SECRET before importing auth module
process.env.JWT_SECRET = 'test-secret-key-that-is-at-least-32-chars-long-for-security';

import { generateToken, verifyToken, hashPassword, comparePassword, extractBearerToken, hasPermission, ADMIN_ROLES, GRADE_APPROVAL_ROLES } from '@/lib/auth';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

describe('auth utilities', () => {
  const mockUser = {
    id: 'user-1',
    username: 'admin',
    name: 'مدير النظام',
    role: 'مدير',
  };

  describe('generateToken', () => {
    it('should generate a JWT token', () => {
      const token = generateToken(mockUser);
      expect(token).toBe('mock-jwt-token');
      expect(jwt.sign).toHaveBeenCalledWith(
        mockUser,
        expect.any(String),
        { expiresIn: '8h' }
      );
    });
  });

  describe('verifyToken', () => {
    it('should return user when token is valid', () => {
      vi.mocked(jwt.verify).mockReturnValue(mockUser as any);
      const result = verifyToken('valid-token');
      expect(result).toEqual(mockUser);
    });

    it('should return null when token is invalid', () => {
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error('Invalid token');
      });
      const result = verifyToken('invalid-token');
      expect(result).toBeNull();
    });
  });

  describe('hashPassword', () => {
    it('should hash a password using bcrypt', async () => {
      const hash = await hashPassword('mypassword');
      expect(bcrypt.hash).toHaveBeenCalledWith('mypassword', 10);
      expect(hash).toBe('$2a$10$hashedpassword');
    });
  });

  describe('comparePassword', () => {
    it('should compare password against hash', async () => {
      const result = await comparePassword('mypassword', '$2a$10$hash');
      expect(bcrypt.compare).toHaveBeenCalledWith('mypassword', '$2a$10$hash');
      expect(result).toBe(true);
    });
  });

  describe('extractBearerToken', () => {
    it('should extract token from Bearer header', () => {
      expect(extractBearerToken('Bearer my-token')).toBe('my-token');
    });

    it('should return null for missing header', () => {
      expect(extractBearerToken(null)).toBeNull();
    });

    it('should return null for non-Bearer header', () => {
      expect(extractBearerToken('Basic abc123')).toBeNull();
    });

    it('should return null for empty Bearer', () => {
      expect(extractBearerToken('Bearer ')).toBeNull();
    });
  });

  describe('hasPermission', () => {
    it('should grant all permissions to admin', () => {
      expect(hasPermission('مدير', 'students')).toBe(true);
      expect(hasPermission('مدير', 'anything')).toBe(true);
    });

    it('should grant specific permissions to assistant', () => {
      expect(hasPermission('معاون', 'students')).toBe(true);
      expect(hasPermission('معاون', 'teachers')).toBe(true);
      expect(hasPermission('معاون', 'all')).toBe(false);
    });

    it('should deny unknown roles', () => {
      expect(hasPermission('unknown', 'students')).toBe(false);
    });

    it('should handle gate staff permissions', () => {
      expect(hasPermission('موظف بوابة', 'attendance_scan')).toBe(true);
      expect(hasPermission('موظف بوابة', 'students')).toBe(false);
    });
  });

  describe('ADMIN_ROLES', () => {
    it('should contain admin and system roles', () => {
      expect(ADMIN_ROLES).toContain('مدير');
      expect(ADMIN_ROLES).toContain('مسؤول نظام');
    });
  });

  describe('GRADE_APPROVAL_ROLES', () => {
    it('should contain admin, system, and assistant roles', () => {
      expect(GRADE_APPROVAL_ROLES).toContain('مدير');
      expect(GRADE_APPROVAL_ROLES).toContain('مسؤول نظام');
      expect(GRADE_APPROVAL_ROLES).toContain('معاون');
    });
  });
});
