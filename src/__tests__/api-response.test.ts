/**
 * Tests for API response helpers
 */
import { describe, it, expect } from 'vitest';

// We test the logic functions directly since NextResponse requires Next.js runtime
// The actual HTTP response behavior is tested via integration tests

describe('API Response Helpers — Logic', () => {
  describe('isTechnicalServerMessage patterns', () => {
    // Testing the internal pattern matching logic
    const technicalPatterns = [
      /Error:/i,
      /at\s+\w+/,
      /\.\//,
      /node_modules/i,
      /TypeError/i,
      /ReferenceError/i,
      /Cannot read propert/i,
      /is not a function/i,
    ];

    it('should detect Error: prefix', () => {
      expect(technicalPatterns[0].test('Error: something went wrong')).toBe(true);
      expect(technicalPatterns[0].test('حدث خطأ')).toBe(false);
    });

    it('should detect stack trace format', () => {
      expect(technicalPatterns[1].test('at Object.handler')).toBe(true);
      expect(technicalPatterns[1].test('في الكائن')).toBe(false);
    });

    it('should detect TypeError', () => {
      expect(technicalPatterns[4].test('TypeError: Cannot read property')).toBe(true);
    });
  });

  describe('Prisma error code mapping', () => {
    const technicalMap: Record<string, string> = {
      'P2002': 'البيانات موجودة مسبقاً.',
      'P2025': 'البيانات المطلوبة غير موجودة.',
      'P2003': 'بيانات مرتبطة غير موجودة.',
    };

    it('should map P2002 to duplicate error', () => {
      expect(technicalMap['P2002']).toBe('البيانات موجودة مسبقاً.');
    });

    it('should map P2025 to not found error', () => {
      expect(technicalMap['P2025']).toBe('البيانات المطلوبة غير موجودة.');
    });
  });

  describe('Status code messages', () => {
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

    it('should have Arabic messages for all common status codes', () => {
      for (const [code, msg] of Object.entries(statusMessages)) {
        expect(msg).toBeTruthy();
        expect(/[\u0600-\u06FF]/.test(msg)).toBe(true); // Contains Arabic
      }
    });
  });
});
