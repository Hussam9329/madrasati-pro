import { checkDb, successResponse, errorResponse, requirePermission, requireAnyPermission } from '@/services/api-response';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  const dbError = checkDb();
  if (dbError) return dbError;

  // View teachers requires at least teachers or students_view permission
  const authError = requireAnyPermission(request, ['teachers', 'students_view', 'grades', 'schedule']);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const schoolId = searchParams.get('schoolId');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (schoolId) where.schoolId = schoolId;
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
        { notes: { contains: search } },
      ];
    }

    const teachers = await db.teacher.findMany({
      where,
      include: {
        subjects: {
          include: {
            subject: true,
          },
        },
        school: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(teachers);
  } catch (error) {
    console.error('Get teachers error:', error);
    return errorResponse('حدث خطأ في جلب بيانات المعلمين', 500);
  }
}

export async function POST(request: Request) {
  const dbError = checkDb();
  if (dbError) return dbError;

  // Create teacher requires teachers permission
  const authError = requirePermission(request, 'teachers');
  if (authError) return authError;

  try {
    const body = await request.json();
    const {
      fullName,
      phone,
      email,
      notes,
      status,
      photo,
      schoolId,
      subjectIds,
      classIds,
    } = body;

    if (!fullName || !schoolId) {
      return errorResponse('اسم المعلم والمدرسة مطلوبان', 400);
    }

    const teacher = await db.teacher.create({
      data: {
        fullName,
        phone,
        email,
        notes,
        status: status || 'نشط',
        photo,
        schoolId,
        subjects: subjectIds
          ? {
              create: (subjectIds as string[]).map((subjectId: string) => ({
                subjectId,
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
        subjects: {
          include: {
            subject: true,
          },
        },
        classes: true,
      },
    });

    return successResponse(teacher, undefined, 201);
  } catch (error) {
    console.error('Create teacher error:', error);
    return errorResponse('حدث خطأ في إنشاء المعلم', 500);
  }
}
