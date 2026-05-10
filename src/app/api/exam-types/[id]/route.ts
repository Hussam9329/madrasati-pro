import { NextRequest } from 'next/server';
import { checkDb, successResponse, errorResponse } from '@/services/api-response';
import { db } from '@/lib/db';

// GET /api/exam-types/[id] — Get single exam type
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const dbError = checkDb();
  if (dbError) return dbError;

  try {
    const { id } = await params
    const examType = await db.examType.findUnique({
      where: { id },
      include: {
        subject: {
          select: { id: true, name: true, code: true, maxScore: true, passScore: true }
        },
        grades: {
          include: {
            student: { select: { id: true, fullName: true, studentNumber: true } }
          }
        }
      }
    })

    if (!examType) {
      return errorResponse('نوع الامتحان غير موجود', 404)
    }

    return successResponse(examType)
  } catch (error) {
    console.error('Error fetching exam type:', error)
    return errorResponse('فشل في جلب بيانات نوع الامتحان', 500)
  }
}

// PUT /api/exam-types/[id] — Update exam type
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const dbError = checkDb();
  if (dbError) return dbError;

  try {
    const { id } = await params
    const body = await request.json()
    const { name, maxScore } = body

    // Check exists
    const existing = await db.examType.findUnique({
      where: { id },
      include: {
        subject: { select: { maxScore: true } },
        _count: { select: { grades: true } }
      }
    })

    if (!existing) {
      return errorResponse('نوع الامتحان غير موجود', 404)
    }

    // Check if grades exist and are approved
    if (existing._count.grades > 0) {
      const approvedGrades = await db.grade.count({
        where: { examTypeId: id, approved: true }
      })
      if (approvedGrades > 0) {
        return errorResponse('لا يمكن تعديل نوع امتحان معتمد. يرجى إلغاء الاعتماد أولاً.', 400)
      }
    }

    // Validate maxScore
    const newMaxScore = maxScore ? parseInt(maxScore) : existing.maxScore
    if (newMaxScore <= 0) {
      return errorResponse('الدرجة الكاملة يجب أن تكون أكبر من صفر', 400)
    }
    if (newMaxScore > existing.subject.maxScore) {
      return errorResponse(
        `الدرجة الكاملة للامتحان لا يمكن أن تتجاوز الدرجة الكاملة للمادة (${existing.subject.maxScore})`,
        400
      )
    }

    const examType = await db.examType.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(maxScore && { maxScore: newMaxScore }),
      },
      include: {
        subject: {
          select: { id: true, name: true, code: true }
        }
      }
    })

    return successResponse(examType)
  } catch (error) {
    console.error('Error updating exam type:', error)
    return errorResponse('فشل في تحديث نوع الامتحان', 500)
  }
}

// DELETE /api/exam-types/[id] — Delete exam type
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const dbError = checkDb();
  if (dbError) return dbError;

  try {
    const { id } = await params

    // Check exists
    const existing = await db.examType.findUnique({
      where: { id },
      include: {
        _count: { select: { grades: true } }
      }
    })

    if (!existing) {
      return errorResponse('نوع الامتحان غير موجود', 404)
    }

    // Check for approved grades
    if (existing._count.grades > 0) {
      const approvedGrades = await db.grade.count({
        where: { examTypeId: id, approved: true }
      })
      if (approvedGrades > 0) {
        return errorResponse('لا يمكن حذف نوع امتحان يحتوي على درجات معتمدة', 400)
      }
    }

    // Delete associated grades first
    await db.grade.deleteMany({
      where: { examTypeId: id }
    })

    // Delete exam type
    await db.examType.delete({
      where: { id }
    })

    return successResponse(null, 'تم حذف نوع الامتحان بنجاح')
  } catch (error) {
    console.error('Error deleting exam type:', error)
    return errorResponse('فشل في حذف نوع الامتحان', 500)
  }
}
