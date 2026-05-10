import { NextRequest } from 'next/server';
import { checkDb, successResponse, errorResponse, validationErrorResponse, forbiddenResponse, requireAnyPermission } from '@/services/api-response';
import { db } from '@/lib/db';
import { installmentCreateSchema, installmentUpdateSchema } from '@/lib/validations';
import { hasPermission } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const dbError = checkDb();
  if (dbError) return dbError;

  // عرض الأقساط يتطلب صلاحية مناسبة
  const authError = requireAnyPermission(request, ['students', 'payments_view']);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const classId = searchParams.get('classId');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (studentId) where.studentId = studentId;
    if (classId) where.classId = classId;
    if (status) where.status = status;

    const installments = await db.installment.findMany({
      where,
      include: {
        student: { select: { id: true, fullName: true, studentNumber: true } },
        feePlan: { select: { id: true, name: true, amount: true } },
        class: { select: { id: true, name: true } },
        payments: { orderBy: { createdAt: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return successResponse(installments);
  } catch (error) {
    console.error('Error fetching installments:', error);
    return errorResponse('فشل في جلب الأقساط', 500);
  }
}

export async function POST(request: NextRequest) {
  const dbError = checkDb();
  if (dbError) return dbError;

  try {
    const userRole = request.headers.get('x-user-role');
    if (!userRole || !hasPermission(userRole, 'students')) {
      return forbiddenResponse('ليس لديك صلاحية لإنشاء أقساط');
    }

    const body = await request.json();

    // Validate input with Zod
    const result = installmentCreateSchema.safeParse(body);
    if (!result.success) {
      return validationErrorResponse(result.error);
    }

    const data = result.data;

    // Get student
    const student = await db.student.findUnique({
      where: { id: data.studentId },
      include: { class: true }
    });
    if (!student) {
      return errorResponse('الطالب غير موجود', 404);
    }

    // Get fee plan
    const feePlan = await db.feePlan.findUnique({ where: { id: data.feePlanId } });
    if (!feePlan) {
      return errorResponse('خطة الرسوم غير موجودة', 404);
    }

    // Check if installment already exists
    const existing = await db.installment.findUnique({
      where: { studentId_feePlanId: { studentId: data.studentId, feePlanId: data.feePlanId } }
    });
    if (existing) {
      return errorResponse('هذا القسط مسجل بالفعل لهذا الطالب', 400);
    }

    // Calculate amount with discount
    let totalAmount = feePlan.amount;
    const dType = data.discountType;
    const dValue = data.discountValue;

    if (dType === 'percentage' && dValue > 0) {
      totalAmount = Math.round(feePlan.amount * (1 - dValue / 100));
    } else if (dType === 'fixed' && dValue > 0) {
      totalAmount = Math.max(0, feePlan.amount - dValue);
    } else if (dType === 'free') {
      totalAmount = 0;
    }

    const installment = await db.installment.create({
      data: {
        studentId: data.studentId,
        feePlanId: data.feePlanId,
        classId: student.classId,
        schoolId: student.schoolId,
        totalAmount,
        paidAmount: 0,
        remainingAmount: totalAmount,
        discountType: dType,
        discountValue: dValue,
        discountNotes: data.discountNotes || null,
        status: 'غير مدفوع',
        dueDate: feePlan.dueDate,
        notes: data.notes || null,
      },
      include: {
        student: { select: { id: true, fullName: true, studentNumber: true } },
        feePlan: { select: { id: true, name: true, amount: true } },
        class: { select: { id: true, name: true } },
      }
    });

    return successResponse(installment, undefined, 201);
  } catch (error) {
    console.error('Error creating installment:', error);
    return errorResponse('فشل في إنشاء القسط', 500);
  }
}

export async function PUT(request: NextRequest) {
  const dbError = checkDb();
  if (dbError) return dbError;

  try {
    const userRole = request.headers.get('x-user-role');
    if (!userRole || !hasPermission(userRole, 'all')) {
      return forbiddenResponse('تعديل الأقساط يتطلب صلاحيات مدير');
    }

    const body = await request.json();

    // Validate input with Zod
    const result = installmentUpdateSchema.safeParse(body);
    if (!result.success) {
      return validationErrorResponse(result.error);
    }

    const data = result.data;

    const existing = await db.installment.findUnique({
      where: { id: data.id },
      include: { feePlan: true, payments: true }
    });

    if (!existing) {
      return errorResponse('القسط غير موجود', 404);
    }

    // Recalculate with new discount
    const dType = data.discountType || existing.discountType;
    const dValue = data.discountValue ?? existing.discountValue;
    let totalAmount = existing.feePlan.amount;

    if (dType === 'percentage' && dValue > 0) {
      totalAmount = Math.round(existing.feePlan.amount * (1 - dValue / 100));
    } else if (dType === 'fixed' && dValue > 0) {
      totalAmount = Math.max(0, existing.feePlan.amount - dValue);
    } else if (dType === 'free') {
      totalAmount = 0;
    }

    const paidAmount = Math.min(existing.paidAmount, totalAmount);
    const remainingAmount = Math.max(0, totalAmount - paidAmount);
    const status = paidAmount === 0 ? 'غير مدفوع' : paidAmount >= totalAmount ? 'مدفوع بالكامل' : 'مدفوع جزئياً';

    const installment = await db.installment.update({
      where: { id: data.id },
      data: {
        totalAmount,
        paidAmount,
        remainingAmount,
        discountType: dType,
        discountValue: dValue,
        discountNotes: data.discountNotes !== undefined ? data.discountNotes : existing.discountNotes,
        notes: data.notes !== undefined ? data.notes : existing.notes,
        status,
      },
      include: {
        student: { select: { id: true, fullName: true, studentNumber: true } },
        feePlan: { select: { id: true, name: true, amount: true } },
        class: { select: { id: true, name: true } },
      }
    });

    return successResponse(installment);
  } catch (error) {
    console.error('Error updating installment:', error);
    return errorResponse('فشل في تحديث القسط', 500);
  }
}
