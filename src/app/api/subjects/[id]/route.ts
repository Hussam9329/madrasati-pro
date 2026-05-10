import { checkDb, successResponse, errorResponse, validationErrorResponse, requirePermission, requireAnyPermission } from '@/services/api-response';
import { db } from '@/lib/db';
import { subjectUpdateSchema } from '@/lib/validations';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const dbError = checkDb();
  if (dbError) return dbError;

  const authError = requireAnyPermission(request, ['students', 'teachers', 'subjects', 'grades', 'schedule', 'reports']);
  if (authError) return authError;

  try {
    const { id } = await params;

    const subject = await db.subject.findUnique({
      where: { id },
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
        grades: {
          include: {
            student: {
              select: { id: true, fullName: true, studentNumber: true },
            },
          },
        },
        school: {
          select: { id: true, name: true },
        },
      },
    });

    if (!subject) {
      return errorResponse('المادة غير موجودة', 404);
    }

    return successResponse(subject);
  } catch (error) {
    console.error('Get subject error:', error);
    return errorResponse('حدث خطأ في جلب بيانات المادة', 500);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const dbError = checkDb();
  if (dbError) return dbError;

  // Edit subject requires subjects permission
  const authError = requirePermission(request, 'subjects');
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json();

    // Validate input with Zod
    const result = subjectUpdateSchema.safeParse(body);
    if (!result.success) {
      return validationErrorResponse(result.error);
    }

    const data = result.data;

    const existingSubject = await db.subject.findUnique({ where: { id } });
    if (!existingSubject) {
      return errorResponse('المادة غير موجودة', 404);
    }

    // Extract relation fields and basic fields
    const { teacherIds, classIds, ...basicData } = data;

    // Only update basic fields that were provided
    const updateData: Record<string, unknown> = {};
    const allowedFields = ['name', 'code', 'type', 'maxScore', 'passScore'] as const;
    for (const field of allowedFields) {
      if ((basicData as Record<string, unknown>)[field] !== undefined) {
        updateData[field] = (basicData as Record<string, unknown>)[field];
      }
    }

    // Update basic info
    if (Object.keys(updateData).length > 0) {
      await db.subject.update({
        where: { id },
        data: updateData,
      });
    }

    // Update teachers if provided
    if (teacherIds) {
      await db.teacherSubject.deleteMany({ where: { subjectId: id } });
      if ((teacherIds as string[]).length > 0) {
        await db.teacherSubject.createMany({
          data: (teacherIds as string[]).map((teacherId: string) => ({
            teacherId,
            subjectId: id,
          })),
        });
      }
    }

    // Update classes if provided
    if (classIds) {
      await db.subjectClass.deleteMany({ where: { subjectId: id } });
      if ((classIds as string[]).length > 0) {
        await db.subjectClass.createMany({
          data: (classIds as string[]).map((classId: string) => ({
            subjectId: id,
            classId,
          })),
        });
      }
    }

    const updatedSubject = await db.subject.findUnique({
      where: { id },
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

    return successResponse(updatedSubject);
  } catch (error) {
    console.error('Update subject error:', error);
    return errorResponse('حدث خطأ في تحديث بيانات المادة', 500);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const dbError = checkDb();
  if (dbError) return dbError;

  // Delete subject requires admin-level access (cascades to grades)
  const authError = requirePermission(request, 'all');
  if (authError) return authError;

  try {
    const { id } = await params;

    const existingSubject = await db.subject.findUnique({ where: { id } });
    if (!existingSubject) {
      return errorResponse('المادة غير موجودة', 404);
    }

    // Delete related records
    await db.teacherSubject.deleteMany({ where: { subjectId: id } });
    await db.subjectClass.deleteMany({ where: { subjectId: id } });
    await db.examType.deleteMany({ where: { subjectId: id } });
    await db.grade.deleteMany({ where: { subjectId: id } });

    await db.subject.delete({ where: { id } });

    return successResponse(null, 'تم حذف المادة بنجاح');
  } catch (error) {
    console.error('Delete subject error:', error);
    return errorResponse('حدث خطأ في حذف المادة', 500);
  }
}
