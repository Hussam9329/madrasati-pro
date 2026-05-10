/**
 * Zod validation schemas for all API inputs.
 * These schemas validate and sanitize user input before it reaches the database.
 *
 * Usage in API routes:
 *   const result = studentCreateSchema.safeParse(body);
 *   if (!result.success) return validationErrorResponse(result.error);
 *   const data = result.data;
 */
import { z } from 'zod';

// ==================== Helper ====================

/** Arabic-friendly string that trims whitespace */
const arabicString = (minMsg: string, min = 2, max = 200) =>
  z.string().trim().min(min, minMsg).max(max);

/** CUID-like ID validation */
const cuid = z.string().min(1, 'المعرّف مطلوب');

/** Date string validation (YYYY-MM-DD) */
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'صيغة التاريخ غير صحيحة (YYYY-MM-DD)').optional();

/** Time string validation (HH:MM) */
const timeString = z.string().regex(/^\d{2}:\d{2}$/, 'صيغة الوقت غير صحيحة (HH:MM)').optional();

// ==================== Auth ====================

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'اسم المستخدم مطلوب').max(100),
  password: z.string().min(1, 'كلمة المرور مطلوبة').max(200),
});

// ==================== Students ====================

export const studentCreateSchema = z.object({
  fullName: arabicString('الاسم مطلوب (حرفان على الأقل)', 2, 200),
  gender: z.enum(['ذكر', 'أنثى']).optional().default('ذكر'),
  dateOfBirth: dateString,
  nationalId: z.string().trim().max(50, 'الرقم الوطني طويل جداً').optional(),
  phone: z.string().trim().max(30, 'رقم الهاتف طويل جداً').optional(),
  address: z.string().trim().max(300, 'العنوان طويل جداً').optional(),
  photo: z.string().trim().max(500).optional(),
  status: z.enum(['مستمر', 'منقول', 'متسرب', 'متخرج', 'مؤجل']).optional().default('مستمر'),
  classId: cuid,
  sectionId: cuid,
  schoolId: cuid,
  guardianName: z.string().trim().max(200).optional(),
  guardianPhone: z.string().trim().max(30).optional(),
  guardianRelation: z.string().trim().max(50).optional(),
});

export const studentUpdateSchema = studentCreateSchema.partial().required({});

export const studentTransferSchema = z.object({
  studentId: cuid,
  newClassId: cuid,
  newSectionId: cuid,
  reason: z.string().trim().max(500).optional(),
});

// ==================== Teachers ====================

export const teacherCreateSchema = z.object({
  fullName: arabicString('اسم المعلم مطلوب', 2, 200),
  phone: z.string().trim().max(30).optional(),
  email: z.string().trim().email('البريد الإلكتروني غير صحيح').optional().or(z.literal('')),
  notes: z.string().trim().max(1000).optional(),
  status: z.enum(['نشط', 'غير نشط']).optional().default('نشط'),
  photo: z.string().trim().max(500).optional(),
  schoolId: cuid,
  subjectIds: z.array(z.string().min(1)).optional(),
  classIds: z.array(z.string().min(1)).optional(),
});

export const teacherUpdateSchema = teacherCreateSchema.partial();

// ==================== Classes ====================

export const classCreateSchema = z.object({
  name: arabicString('اسم الصف مطلوب', 2, 100),
  level: z.string().trim().min(1, 'المستوى مطلوب').max(50),
  stage: z.string().trim().min(1, 'المرحلة مطلوبة').max(50),
  branch: z.string().trim().max(50).optional(),
  schoolId: cuid,
  sections: z.array(z.object({ name: z.string().trim().min(1, 'اسم الشعبة مطلوب').max(20) })).optional(),
});

// ==================== Subjects ====================

export const subjectCreateSchema = z.object({
  name: arabicString('اسم المادة مطلوب', 2, 200),
  code: z.string().trim().min(1, 'رمز المادة مطلوب').max(20),
  type: z.enum(['أساسية', 'اختيارية', 'نشاط']).optional().default('أساسية'),
  maxScore: z.number().int().min(1, 'الدرجة الكاملة يجب أن تكون أكبر من صفر').max(1000).optional().default(100),
  passScore: z.number().int().min(0).max(1000).optional().default(50),
  schoolId: cuid,
  teacherIds: z.array(z.string().min(1)).optional(),
  classIds: z.array(z.string().min(1)).optional(),
});

export const subjectUpdateSchema = subjectCreateSchema.partial();

// ==================== Attendance ====================

export const attendanceCreateSchema = z.object({
  studentId: cuid,
  schoolId: cuid,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'التاريخ مطلوب (YYYY-MM-DD)'),
  checkIn: timeString,
  checkOut: timeString,
  status: z.enum(['حاضر', 'غائب', 'متأخر', 'خروج مبكر', 'مستأذن', 'إجازة مرضية', 'إجازة رسمية', 'حضور ناقص']),
  lateMinutes: z.number().int().min(0).optional().nullable(),
  earlyExitReason: z.string().trim().max(300).optional(),
  earlyExitApproved: z.boolean().optional(),
  modifiedBy: z.string().trim().max(200).optional(),
});

export const attendanceScanSchema = z.object({
  qrCode: z.string().trim().min(1, 'رمز QR مطلوب').max(200),
  type: z.enum(['checkIn', 'checkOut'], { message: 'نوع المسح يجب أن يكون checkIn أو checkOut' }),
});

export const attendanceBulkSchema = z.object({
  records: z.array(attendanceCreateSchema).min(1, 'يجب توفير قائمة سجلات الحضور').max(500, 'الحد الأقصى 500 سجل في المرة الواحدة'),
});

// ==================== Grades ====================

export const gradeCreateSchema = z.object({
  studentId: cuid,
  subjectId: cuid,
  examTypeId: cuid,
  schoolId: cuid,
  score: z.number().min(0, 'الدرجة لا يمكن أن تكون سالبة').max(1000).optional().nullable(),
  status: z.enum(['مكتملة', 'ناقصة']).optional(),
});

export const gradeApproveSchema = z.object({
  gradeIds: z.array(z.string().min(1)).min(1, 'قائمة معرفات الدرجات مطلوبة').max(500),
  approvedBy: z.string().trim().max(200).optional(),
});

// ==================== Schedule ====================

export const scheduleCreateSchema = z.object({
  day: z.string().trim().min(1, 'اليوم مطلوب').max(30),
  period: z.number().int().min(1, 'الحصة مطلوبة').max(20),
  subjectId: cuid,
  teacherId: cuid,
  classId: cuid,
  sectionId: z.string().optional(),
  schoolId: cuid,
  room: z.string().trim().max(100).optional(),
});

export const scheduleUpdateSchema = z.object({
  id: z.string().min(1, 'معرف الحصة مطلوب'),
  day: z.string().trim().min(1).max(30).optional(),
  period: z.number().int().min(1).max(20).optional(),
  subjectId: z.string().min(1).optional(),
  teacherId: z.string().min(1).optional(),
  classId: z.string().min(1).optional(),
  sectionId: z.string().optional(),
  room: z.string().trim().max(100).optional(),
});

// ==================== Payments ====================

export const paymentCreateSchema = z.object({
  installmentId: cuid,
  studentId: z.string().optional(),
  amount: z.number().positive('مبلغ الدفعة يجب أن يكون أكبر من صفر').max(10000000),
  paymentDate: z.string().trim().min(1, 'تاريخ الدفع مطلوب'),
  paymentMethod: z.enum(['نقدي', 'حوالة', 'شيك', 'بطاقة', 'أخرى']).optional().default('نقدي'),
  receiptNumber: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(500).optional(),
  recordedBy: z.string().trim().max(200).optional(),
});

// ==================== Fee Plans ====================

export const feePlanCreateSchema = z.object({
  name: arabicString('اسم خطة الرسوم مطلوب', 2, 200),
  amount: z.number().positive('المبلغ يجب أن يكون أكبر من صفر').max(10000000),
  classId: cuid,
  schoolId: z.string().optional(),
  dueDate: dateString,
  description: z.string().trim().max(500).optional(),
  sortOrder: z.number().int().min(0).optional().default(0),
});

// ==================== Installments ====================

export const installmentCreateSchema = z.object({
  studentId: cuid,
  feePlanId: cuid,
  discountType: z.enum(['none', 'percentage', 'fixed', 'free']).optional().default('none'),
  discountValue: z.number().min(0).optional().default(0),
  discountNotes: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const installmentUpdateSchema = z.object({
  id: cuid,
  discountType: z.enum(['none', 'percentage', 'fixed', 'free']).optional(),
  discountValue: z.number().min(0).optional(),
  discountNotes: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(500).optional(),
});

// ==================== Users ====================

export const userCreateSchema = z.object({
  username: z.string().trim().min(3, 'اسم المستخدم قصير جداً (3 حروف على الأقل)').max(50, 'اسم المستخدم طويل جداً')
    .regex(/^[a-zA-Z0-9_]+$/, 'اسم المستخدم يجب أن يحتوي على حروف إنجليزية وأرقام فقط'),
  name: arabicString('الاسم مطلوب', 2, 200),
  role: z.enum(['مدير', 'معاون', 'موظف تسجيل', 'موظف بوابة', 'مدرس', 'ولي أمر', 'طالب', 'مسؤول نظام']).optional().default('موظف تسجيل'),
  active: z.boolean().optional().default(true),
});

export const userUpdateSchema = z.object({
  username: z.string().trim().min(3).max(50)
    .regex(/^[a-zA-Z0-9_]+$/, 'اسم المستخدم يجب أن يحتوي على حروف إنجليزية وأرقام فقط').optional(),
  name: arabicString('الاسم مطلوب', 2, 200).optional(),
  role: z.enum(['مدير', 'معاون', 'موظف تسجيل', 'موظف بوابة', 'مدرس', 'ولي أمر', 'طالب', 'مسؤول نظام']).optional(),
  active: z.boolean().optional(),
});

// ==================== School ====================

export const schoolUpdateSchema = z.object({
  logo: z.string().trim().max(500).optional(),
  phone: z.string().trim().max(30).optional(),
  email: z.string().trim().email('البريد الإلكتروني غير صحيح').optional().or(z.literal('')),
  principalName: z.string().trim().max(200).optional(),
  academicYear: z.string().trim().max(20).optional(),
  schoolType: z.string().trim().max(100).optional(),
  shiftType: z.string().trim().max(50).optional(),
  startTime: timeString,
  endTime: timeString,
  lateThreshold: z.number().int().min(0).max(120).optional(),
  weekendDays: z.string().trim().max(20).optional(),
});

// ==================== Exam Types ====================

export const examTypeCreateSchema = z.object({
  name: arabicString('اسم نوع الامتحان مطلوب', 2, 200),
  maxScore: z.number().positive('الدرجة الكاملة يجب أن تكون أكبر من صفر').max(10000),
  subjectId: cuid,
});

export const examTypeUpdateSchema = z.object({
  name: arabicString('اسم نوع الامتحان مطلوب', 2, 200).optional(),
  maxScore: z.number().positive('الدرجة الكاملة يجب أن تكون أكبر من صفر').max(10000).optional(),
});

// ==================== Teacher Classes ====================

export const teacherClassAssignSchema = z.object({
  teacherId: cuid,
  classId: cuid,
  sectionId: z.string().optional(),
});
