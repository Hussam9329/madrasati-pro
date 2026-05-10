import { checkDb, successResponse, errorResponse, validationErrorResponse, requirePermission, requireAnyPermission } from '@/services/api-response';
import { db } from '@/lib/db';
import { teacherUpdateSchema } from '@/lib/validations';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const dbError = checkDb();
  if (dbError) return dbError;

  const authError = requireAnyPermission(request, ['teachers', 'students_view', 'grades', 'schedule']);
  if (authError) return authError;

  try {
    const { id } = await params;

    const teacher = await db.teacher.findUnique({
      where: { id },
      include: {
        subjects: {
          include: {
            subject: true,
          },
        },
        classes: true,
        school: {
          select: { id: true, name: true },
        },
      },
    });

    if (!teacher) {
      return errorResponse('المعلم غير موجود', 404);
    }

    return successResponse(teacher);
  } catch (error) {
    console.error('Get teacher error:', error);
    return errorResponse('حدث خطأ في جلب بيانات المعلم', 500);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const dbError = checkDb();
  if (dbError) return dbError;

  // Edit teacher requires teachers permission
  const authError = requirePermission(request, 'teachers');
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json();

    // Validate input with Zod
    const result = teacherUpdateSchema.safeParse(body);
    if (!result.success) {
      return validationErrorResponse(result.error);
    }

    const data = result.data;

    const existingTeacher = await db.teacher.findUnique({ where: { id } });
    if (!existingTeacher) {
      return errorResponse('المعلم غير موجود', 404);
    }

    // Extract relation fields and basic fields
    const { subjectIds, classIds, ...basicData } = data;

    // Only update basic fields that were provided
    const updateData: Record<string, unknown> = {};
    const allowedFields = ['fullName', 'phone', 'email', 'notes', 'status', 'photo'] as const;
    for (const field of allowedFields) {
      if ((basicData as Record<string, unknown>)[field] !== undefined) {
        updateData[field] = (basicData as Record<string, unknown>)[field];
      }
    }

    // Update teacher basic info
    const teacher = await db.teacher.update({
      where: { id },
      data: updateData,
      include: {
        subjects: {
          include: {
            subject: true,
          },
        },
        classes: true,
      },
    });

    // Update subjects if provided
    if (subjectIds) {
      await db.teacherSubject.deleteMany({ where: { teacherId: id } });
      if ((subjectIds as string[]).length > 0) {
        await db.teacherSubject.createMany({
          data: (subjectIds as string[]).map((subjectId: string) => ({
            teacherId: id,
            subjectId,
          })),
        });
      }
    }

    // Update classes if provided
    if (classIds) {
      await db.teacherClass.deleteMany({ where: { teacherId: id } });
      if ((classIds as string[]).length > 0) {
        await db.teacherClass.createMany({
          data: (classIds as string[]).map((classId: string) => ({
            teacherId: id,
            classId,
          })),
        });
      }
    }

    // Re-fetch with updated relations
    const updatedTeacher = await db.teacher.findUnique({
      where: { id },
      include: {
        subjects: {
          include: {
            subject: true,
          },
        },
        classes: true,
      },
    });

    return successResponse(updatedTeacher);
  } catch (error) {
    console.error('Update teacher error:', error);
    return errorResponse('حدث خطأ في تحديث بيانات المعلم', 500);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const dbError = checkDb();
  if (dbError) return dbError;

  // Delete teacher requires admin-level access
  const authError = requirePermission(request, 'all');
  if (authError) return authError;

  try {
    const { id } = await params;

    const existingTeacher = await db.teacher.findUnique({ where: { id } });
    if (!existingTeacher) {
      return errorResponse('المعلم غير موجود', 404);
    }

    if (existingTeacher.deletedAt) {
      return errorResponse('هذا المعلم محذوف مسبقاً', 409);
    }

    // Soft delete — تعليم السجل كمحذوف بدلاً من حذفه فعلياً
    await db.teacher.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return successResponse(null, 'تم حذف المعلم بنجاح. يمكن استرجاعه لاحقاً.');
  } catch (error) {
    console.error('Delete teacher error:', error);
    return errorResponse('حدث خطأ في حذف المعلم', 500);
  }
}
