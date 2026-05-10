import { checkDb, successResponse, errorResponse } from '@/services/api-response';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  const dbError = checkDb();
  if (dbError) return dbError;

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const schoolId = searchParams.get('schoolId');

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (schoolId) where.schoolId = schoolId;

    const subjects = await db.subject.findMany({
      where,
      include: {
        teachers: {
          include: {
            teacher: {
              select: { id: true, fullName: true, phone: true },
            },
          },
        },
        classes: {
          include: {
            class: true,
          },
        },
        examTypes: true,
        school: {
          select: { id: true, name: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return successResponse(subjects);
  } catch (error) {
    console.error('Get subjects error:', error);
    return errorResponse('حدث خطأ في جلب بيانات المواد', 500);
  }
}

export async function POST(request: Request) {
  const dbError = checkDb();
  if (dbError) return dbError;

  try {
    const body = await request.json();
    const {
      name,
      code,
      type,
      maxScore,
      passScore,
      schoolId,
      teacherIds,
      classIds,
    } = body;

    if (!name || !code || !schoolId) {
      return errorResponse('اسم المادة ورمزها والمدرسة مطلوبون', 400);
    }

    // Check for unique code
    const existingSubject = await db.subject.findUnique({ where: { code } });
    if (existingSubject) {
      return errorResponse('رمز المادة مستخدم بالفعل', 409);
    }

    const subject = await db.subject.create({
      data: {
        name,
        code,
        type: type || 'أساسية',
        maxScore: maxScore || 100,
        passScore: passScore || 50,
        schoolId,
        teachers: teacherIds
          ? {
              create: (teacherIds as string[]).map((teacherId: string) => ({
                teacherId,
              })),
            }
          : undefined,
        classes: classIds
          ? {
              create: (classIds as string[]).map((classId: string) => ({
                classId,
              })),
            }
          : undefined,
      },
      include: {
        teachers: {
          include: {
            teacher: {
              select: { id: true, fullName: true },
            },
          },
        },
        classes: {
          include: {
            class: true,
          },
        },
      },
    });

    return successResponse(subject, undefined, 201);
  } catch (error) {
    console.error('Create subject error:', error);
    return errorResponse('حدث خطأ في إنشاء المادة', 500);
  }
}
