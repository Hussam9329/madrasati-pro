/**
 * Tests for Zod validation schemas
 */
import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  studentCreateSchema,
  teacherCreateSchema,
  userCreateSchema,
  attendanceScanSchema,
  paymentCreateSchema,
  gradeCreateSchema,
  feePlanCreateSchema,
  schoolUpdateSchema,
} from '@/lib/validations';

describe('loginSchema', () => {
  it('should validate correct login data', () => {
    const result = loginSchema.safeParse({ username: 'admin', password: 'pass123' });
    expect(result.success).toBe(true);
  });

  it('should reject missing password', () => {
    const result = loginSchema.safeParse({ username: 'admin' });
    expect(result.success).toBe(false);
  });

  it('should reject empty username', () => {
    const result = loginSchema.safeParse({ username: '', password: 'pass' });
    expect(result.success).toBe(false);
  });

  it('should trim whitespace from username', () => {
    const result = loginSchema.safeParse({ username: '  admin  ', password: 'pass' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.username).toBe('admin');
    }
  });
});

describe('studentCreateSchema', () => {
  const validStudent = {
    fullName: 'أحمد محمد',
    classId: 'cls-1',
    sectionId: 'sec-1',
    schoolId: 'sch-1',
  };

  it('should validate correct student data', () => {
    const result = studentCreateSchema.safeParse(validStudent);
    expect(result.success).toBe(true);
  });

  it('should reject missing fullName', () => {
    const result = studentCreateSchema.safeParse({ ...validStudent, fullName: '' });
    expect(result.success).toBe(false);
  });

  it('should reject missing classId', () => {
    const { classId, ...rest } = validStudent;
    const result = studentCreateSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('should reject too-long nationalId', () => {
    const result = studentCreateSchema.safeParse({
      ...validStudent,
      nationalId: 'x'.repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it('should default gender to ذكر', () => {
    const result = studentCreateSchema.safeParse(validStudent);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.gender).toBe('ذكر');
    }
  });
});

describe('userCreateSchema', () => {
  it('should validate correct user data', () => {
    const result = userCreateSchema.safeParse({
      username: 'admin',
      name: 'مدير النظام',
    });
    expect(result.success).toBe(true);
  });

  it('should reject short username', () => {
    const result = userCreateSchema.safeParse({ username: 'ab', name: 'Test' });
    expect(result.success).toBe(false);
  });

  it('should reject Arabic username', () => {
    const result = userCreateSchema.safeParse({ username: 'مدير', name: 'Test' });
    expect(result.success).toBe(false);
  });

  it('should reject special chars in username', () => {
    const result = userCreateSchema.safeParse({ username: 'admin@123', name: 'Test' });
    expect(result.success).toBe(false);
  });

  it('should accept underscore in username', () => {
    const result = userCreateSchema.safeParse({ username: 'admin_user', name: 'Test' });
    expect(result.success).toBe(true);
  });
});

describe('attendanceScanSchema', () => {
  it('should validate checkIn type', () => {
    const result = attendanceScanSchema.safeParse({ qrCode: 'QR123', type: 'checkIn' });
    expect(result.success).toBe(true);
  });

  it('should validate checkOut type', () => {
    const result = attendanceScanSchema.safeParse({ qrCode: 'QR123', type: 'checkOut' });
    expect(result.success).toBe(true);
  });

  it('should reject invalid type', () => {
    const result = attendanceScanSchema.safeParse({ qrCode: 'QR123', type: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('should reject missing qrCode', () => {
    const result = attendanceScanSchema.safeParse({ type: 'checkIn' });
    expect(result.success).toBe(false);
  });
});

describe('paymentCreateSchema', () => {
  it('should validate correct payment data', () => {
    const result = paymentCreateSchema.safeParse({
      installmentId: 'inst-1',
      amount: 50000,
      paymentDate: '2026-01-15',
    });
    expect(result.success).toBe(true);
  });

  it('should reject zero amount', () => {
    const result = paymentCreateSchema.safeParse({
      installmentId: 'inst-1',
      amount: 0,
      paymentDate: '2026-01-15',
    });
    expect(result.success).toBe(false);
  });

  it('should reject negative amount', () => {
    const result = paymentCreateSchema.safeParse({
      installmentId: 'inst-1',
      amount: -100,
      paymentDate: '2026-01-15',
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing installmentId', () => {
    const result = paymentCreateSchema.safeParse({
      amount: 50000,
      paymentDate: '2026-01-15',
    });
    expect(result.success).toBe(false);
  });
});

describe('gradeCreateSchema', () => {
  it('should validate correct grade data', () => {
    const result = gradeCreateSchema.safeParse({
      studentId: 'stu-1',
      subjectId: 'sub-1',
      examTypeId: 'exam-1',
      schoolId: 'sch-1',
      score: 85,
    });
    expect(result.success).toBe(true);
  });

  it('should reject negative score', () => {
    const result = gradeCreateSchema.safeParse({
      studentId: 'stu-1',
      subjectId: 'sub-1',
      examTypeId: 'exam-1',
      schoolId: 'sch-1',
      score: -5,
    });
    expect(result.success).toBe(false);
  });
});

describe('feePlanCreateSchema', () => {
  it('should validate correct fee plan data', () => {
    const result = feePlanCreateSchema.safeParse({
      name: 'خطة الرسوم',
      amount: 500000,
      classId: 'cls-1',
    });
    expect(result.success).toBe(true);
  });

  it('should reject zero amount', () => {
    const result = feePlanCreateSchema.safeParse({
      name: 'خطة الرسوم',
      amount: 0,
      classId: 'cls-1',
    });
    expect(result.success).toBe(false);
  });
});

describe('schoolUpdateSchema', () => {
  it('should validate correct school data', () => {
    const result = schoolUpdateSchema.safeParse({
      phone: '07701234567',
      startTime: '08:00',
      endTime: '13:30',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid time format', () => {
    const result = schoolUpdateSchema.safeParse({
      startTime: '8:00',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid email', () => {
    const result = schoolUpdateSchema.safeParse({
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });
});

describe('teacherCreateSchema', () => {
  it('should validate correct teacher data', () => {
    const result = teacherCreateSchema.safeParse({
      fullName: 'أحمد المعلم',
      schoolId: 'sch-1',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = teacherCreateSchema.safeParse({
      fullName: 'أحمد المعلم',
      schoolId: 'sch-1',
      email: 'not-valid',
    });
    expect(result.success).toBe(false);
  });
});
