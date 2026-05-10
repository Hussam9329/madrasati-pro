import { NextRequest } from 'next/server';
import { checkDb, successResponse, errorResponse } from '@/services/api-response';
import { db } from '@/lib/db';

// GET /api/installments — List installments (filter by studentId, classId)
export async function GET(request: NextRequest) {
  const dbError = checkDb();
  if (dbError) return dbError;

  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const classId = searchParams.get('classId')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (studentId) where.studentId = studentId
    if (classId) where.classId = classId
    if (status) where.status = status

    const installments = await db.installment.findMany({
      where,
      include: {
        student: { select: { id: true, fullName: true, studentNumber: true } },
        feePlan: { select: { id: true, name: true, amount: true } },
        class: { select: { id: true, name: true } },
        payments: { orderBy: { createdAt: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return successResponse(installments)
  } catch (error) {
    console.error('Error fetching installments:', error)
    return errorResponse('فشل في جلب الأقساط', 500)
  }
}

// POST /api/installments — Create installments for a student (from fee plans)
export async function POST(request: NextRequest) {
  const dbError = checkDb();
  if (dbError) return dbError;

  try {
    const body = await request.json()
    const { studentId, feePlanId, discountType, discountValue, discountNotes, notes } = body

    if (!studentId) {
      return errorResponse('يرجى اختيار الطالب', 400)
    }
    if (!feePlanId) {
      return errorResponse('يرجى اختيار خطة الرسوم', 400)
    }

    // Get student
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: { class: true }
    })
    if (!student) {
      return errorResponse('الطالب غير موجود', 404)
    }

    // Get fee plan
    const feePlan = await db.feePlan.findUnique({ where: { id: feePlanId } })
    if (!feePlan) {
      return errorResponse('خطة الرسوم غير موجودة', 404)
    }

    // Check if installment already exists for this student + feePlan
    const existing = await db.installment.findUnique({
      where: { studentId_feePlanId: { studentId, feePlanId } }
    })
    if (existing) {
      return errorResponse('هذا القسط مسجل بالفعل لهذا الطالب', 400)
    }

    // Calculate amount with discount
    let totalAmount = feePlan.amount
    const dType = discountType || 'none'
    const dValue = discountValue || 0

    if (dType === 'percentage' && dValue > 0) {
      totalAmount = Math.round(feePlan.amount * (1 - dValue / 100))
    } else if (dType === 'fixed' && dValue > 0) {
      totalAmount = Math.max(0, feePlan.amount - dValue)
    } else if (dType === 'free') {
      totalAmount = 0
    }

    const installment = await db.installment.create({
      data: {
        studentId,
        feePlanId,
        classId: student.classId,
        schoolId: student.schoolId,
        totalAmount,
        paidAmount: 0,
        remainingAmount: totalAmount,
        discountType: dType,
        discountValue: dValue,
        discountNotes: discountNotes || null,
        status: 'غير مدفوع',
        dueDate: feePlan.dueDate,
        notes: notes || null,
      },
      include: {
        student: { select: { id: true, fullName: true, studentNumber: true } },
        feePlan: { select: { id: true, name: true, amount: true } },
        class: { select: { id: true, name: true } },
      }
    })

    return successResponse(installment, undefined, 201)
  } catch (error) {
    console.error('Error creating installment:', error)
    return errorResponse('فشل في إنشاء القسط', 500)
  }
}

// PUT /api/installments — Update installment (discount, notes)
export async function PUT(request: NextRequest) {
  const dbError = checkDb();
  if (dbError) return dbError;

  try {
    const body = await request.json()
    const { id, discountType, discountValue, discountNotes, notes } = body

    if (!id) {
      return errorResponse('معرف القسط مطلوب', 400)
    }

    const existing = await db.installment.findUnique({
      where: { id },
      include: { feePlan: true, payments: true }
    })

    if (!existing) {
      return errorResponse('القسط غير موجود', 404)
    }

    // Recalculate with new discount
    const dType = discountType || existing.discountType
    const dValue = discountValue ?? existing.discountValue
    let totalAmount = existing.feePlan.amount

    if (dType === 'percentage' && dValue > 0) {
      totalAmount = Math.round(existing.feePlan.amount * (1 - dValue / 100))
    } else if (dType === 'fixed' && dValue > 0) {
      totalAmount = Math.max(0, existing.feePlan.amount - dValue)
    } else if (dType === 'free') {
      totalAmount = 0
    }

    // Ensure paid amount doesn't exceed new total
    const paidAmount = Math.min(existing.paidAmount, totalAmount)
    const remainingAmount = Math.max(0, totalAmount - paidAmount)
    const status = paidAmount === 0 ? 'غير مدفوع' : paidAmount >= totalAmount ? 'مدفوع بالكامل' : 'مدفوع جزئياً'

    const installment = await db.installment.update({
      where: { id },
      data: {
        totalAmount,
        paidAmount,
        remainingAmount,
        discountType: dType,
        discountValue: dValue,
        discountNotes: discountNotes !== undefined ? discountNotes : existing.discountNotes,
        notes: notes !== undefined ? notes : existing.notes,
        status,
      },
      include: {
        student: { select: { id: true, fullName: true, studentNumber: true } },
        feePlan: { select: { id: true, name: true, amount: true } },
        class: { select: { id: true, name: true } },
      }
    })

    return successResponse(installment)
  } catch (error) {
    console.error('Error updating installment:', error)
    return errorResponse('فشل في تحديث القسط', 500)
  }
}
