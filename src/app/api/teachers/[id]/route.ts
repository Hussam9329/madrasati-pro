import { checkDb, successResponse, errorResponse } from '@/services/api-response';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const dbError = checkDb();
  if (dbError) return dbError;

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

  try {
    const { id } = await params;
    const body = await request.json();

    const existingTeacher = await db.teacher.findUnique({ where: { id } });
    if (!existingTeacher) {
      return errorResponse('المعلم غير موجود', 404);
    }

    const { subjectIds, classIds, ...data } = body;

    // Update teacher basic info
    const teacher = await db.teacher.update({
      where: { id },
      data,
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

  try {
    const { id } = await params;

    const existingTeacher = await db.teacher.findUnique({ where: { id } });
    if (!existingTeacher) {
      return errorResponse('المعلم غير موجود', 404);
    }

    // Delete related records
    await db.teacherSubject.deleteMany({ where: { teacherId: id } });
    await db.teacherClass.deleteMany({ where: { teacherId: id } });
    await db.scheduleSlot.deleteMany({ where: { teacherId: id } });

    await db.teacher.delete({ where: { id } });

    return successResponse(null, 'تم حذف المعلم بنجاح');
  } catch (error) {
    console.error('Delete teacher error:', error);
    return errorResponse('حدث خطأ في حذف المعلم', 500);
  }
}
