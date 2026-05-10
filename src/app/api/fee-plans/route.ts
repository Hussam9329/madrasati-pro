import { NextRequest } from 'next/server';
import { checkDb, successResponse, errorResponse } from '@/services/api-response';
import { db } from '@/lib/db';

// GET /api/fee-plans — List fee plans (optionally filter by classId)
export async function GET(request: NextRequest) {
  const dbError = checkDb();
  if (dbError) return dbError;

  try {
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')

    const where = classId ? { classId } : {}

    const feePlans = await db.feePlan.findMany({
      where,
      include: {
        class: { select: { id: true, name: true, level: true, stage: true } },
        _count: { select: { installments: true } }
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
    })

    return successResponse(feePlans)
  } catch (error) {
    console.error('Error fetching fee plans:', error)
    return errorResponse('فشل في جلب خطط الرسوم', 500)
  }
}

// POST /api/fee-plans — Create a fee plan
export async function POST(request: NextRequest) {
  const dbError = checkDb();
  if (dbError) return dbError;

  try {
    const body = await request.json()
    const { name, amount, classId, schoolId, dueDate, description, sortOrder } = body

    if (!name || !name.trim()) {
      return errorResponse('اسم خطة الرسوم مطلوب', 400)
    }
    if (!amount || amount <= 0) {
      return errorResponse('المبلغ يجب أن يكون أكبر من صفر', 400)
    }
    if (!classId) {
      return errorResponse('يرجى اختيار الصف', 400)
    }

    // Verify class exists
    const classExists = await db.class.findUnique({ where: { id: classId } })
    if (!classExists) {
      return errorResponse('الصف غير موجود', 404)
    }

    const schoolIdFinal = schoolId || classExists.schoolId

    const feePlan = await db.feePlan.create({
      data: {
        name: name.trim(),
        amount: parseInt(amount),
        classId,
        schoolId: schoolIdFinal,
        dueDate: dueDate || null,
        description: description || null,
        sortOrder: sortOrder || 0,
      },
      include: {
        class: { select: { id: true, name: true } }
      }
    })

    return successResponse(feePlan, undefined, 201)
  } catch (error) {
    console.error('Error creating fee plan:', error)
    return errorResponse('فشل في إنشاء خطة الرسوم', 500)
  }
}
