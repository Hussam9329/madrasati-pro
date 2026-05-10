import { NextRequest } from 'next/server';
import { checkDb, successResponse, errorResponse } from '@/services/api-response';
import { db } from '@/lib/db';

// GET /api/exam-types — List all exam types (optionally filter by subjectId)
export async function GET(request: NextRequest) {
  const dbError = checkDb();
  if (dbError) return dbError;

  try {
    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId')

    const where = subjectId ? { subjectId } : {}

    const examTypes = await db.examType.findMany({
      where,
      include: {
        subject: {
          select: { id: true, name: true, code: true, maxScore: true, passScore: true }
        },
        _count: {
          select: { grades: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return successResponse(examTypes)
  } catch (error) {
    console.error('Error fetching exam types:', error)
    return errorResponse('فشل في جلب أنواع الامتحانات', 500)
  }
}

// POST /api/exam-types — Create a new exam type
export async function POST(request: NextRequest) {
  const dbError = checkDb();
  if (dbError) return dbError;

  try {
    const body = await request.json()
    const { name, maxScore, subjectId } = body

    // Validation
    if (!name || !name.trim()) {
      return errorResponse('اسم نوع الامتحان مطلوب', 400)
    }
    if (!maxScore || maxScore <= 0) {
      return errorResponse('الدرجة الكاملة يجب أن تكون أكبر من صفر', 400)
    }
    if (!subjectId) {
      return errorResponse('يرجى اختيار المادة', 400)
    }

    // Check subject exists
    const subject = await db.subject.findUnique({
      where: { id: subjectId },
      select: { id: true, name: true, maxScore: true }
    })

    if (!subject) {
      return errorResponse('المادة غير موجودة', 404)
    }

    // Validate maxScore doesn't exceed subject maxScore
    if (maxScore > subject.maxScore) {
      return errorResponse(
        `الدرجة الكاملة للامتحان (${maxScore}) لا يمكن أن تتجاوز الدرجة الكاملة للمادة (${subject.maxScore})`,
        400
      )
    }

    const examType = await db.examType.create({
      data: {
        name: name.trim(),
        maxScore: parseInt(maxScore),
        subjectId,
      },
      include: {
        subject: {
          select: { id: true, name: true, code: true }
        }
      }
    })

    return successResponse(examType, undefined, 201)
  } catch (error) {
    console.error('Error creating exam type:', error)
    return errorResponse('فشل في إنشاء نوع الامتحان', 500)
  }
}
