import { NextRequest } from 'next/server';
import { checkDb, successResponse, errorResponse, validationErrorResponse, forbiddenResponse } from '@/services/api-response';
import { db } from '@/lib/db';
import { examTypeCreateSchema } from '@/lib/validations';
import { hasPermission } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const dbError = checkDb();
  if (dbError) return dbError;

  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');

    const where = subjectId ? { subjectId } : {};

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
    });

    return successResponse(examTypes);
  } catch (error) {
    console.error('Error fetching exam types:', error);
    return errorResponse('فشل في جلب أنواع الامتحانات', 500);
  }
}

export async function POST(request: NextRequest) {
  const dbError = checkDb();
  if (dbError) return dbError;

  try {
    const userRole = request.headers.get('x-user-role');
    if (!userRole || !hasPermission(userRole, 'grades')) {
      return forbiddenResponse('ليس لديك صلاحية لإنشاء أنواع الامتحانات');
    }

    const body = await request.json();

    // Validate input with Zod
    const result = examTypeCreateSchema.safeParse(body);
    if (!result.success) {
      return validationErrorResponse(result.error);
    }

    const data = result.data;

    // Check subject exists
    const subject = await db.subject.findUnique({
      where: { id: data.subjectId },
      select: { id: true, name: true, maxScore: true }
    });

    if (!subject) {
      return errorResponse('المادة غير موجودة', 404);
    }

    // Validate maxScore doesn't exceed subject maxScore
    if (data.maxScore > subject.maxScore) {
      return errorResponse(
        `الدرجة الكاملة للامتحان (${data.maxScore}) لا يمكن أن تتجاوز الدرجة الكاملة للمادة (${subject.maxScore})`,
        400
      );
    }

    const examType = await db.examType.create({
      data: {
        name: data.name,
        maxScore: parseInt(String(data.maxScore)),
        subjectId: data.subjectId,
      },
      include: {
        subject: {
          select: { id: true, name: true, code: true }
        }
      }
    });

    return successResponse(examType, undefined, 201);
  } catch (error) {
    console.error('Error creating exam type:', error);
    return errorResponse('فشل في إنشاء نوع الامتحان', 500);
  }
}
