import { checkDb, successResponse, errorResponse, validationErrorResponse, requirePermission, requireAnyPermission } from '@/services/api-response';
import { db } from '@/lib/db';
import { studentUpdateSchema } from '@/lib/validations';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const dbError = checkDb();
  if (dbError) return dbError;

  // View student profile requires at least students_view or self_view
  const authError = requireAnyPermission(request, ['students', 'students_view', 'self_view', 'child_view', 'attendance', 'grades', 'grades_own']);
  if (authError) return authError;

  try {
    const { id } = await params;

    const student = await db.student.findUnique({
      where: { id },
      include: {
        class: true,
        section: true,
        grades: {
          include: {
            subject: true,
            examType: true,
          },
        },
        attendance: {
          orderBy: { date: 'desc' },
          take: 30,
        },
      },
    });

    if (!student) {
      return errorResponse('الطالب غير موجود', 404);
    }

    return successResponse(student);
  } catch (error) {
    console.error('Get student error:', error);
    return errorResponse('حدث خطأ في جلب بيانات الطالب', 500);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const dbError = checkDb();
  if (dbError) return dbError;

  // Edit student requires students permission
  const authError = requirePermission(request, 'students');
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json();

    // Validate input with Zod
    const result = studentUpdateSchema.safeParse(body);
    if (!result.success) {
      return validationErrorResponse(result.error);
    }

    const data = result.data;

    const existingStudent = await db.student.findUnique({ where: { id } });
    if (!existingStudent) {
      return errorResponse('الطالب غير موجود', 404);
    }

    // Only update fields that were provided (partial update)
    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      'fullName', 'gender', 'dateOfBirth', 'nationalId', 'phone',
      'address', 'photo', 'status', 'classId', 'sectionId',
      'guardianName', 'guardianPhone', 'guardianRelation', 'cardStatus',
    ] as const;

    for (const field of allowedFields) {
      if ((data as Record<string, unknown>)[field] !== undefined) {
        updateData[field] = (data as Record<string, unknown>)[field];
      }
    }

    const student = await db.student.update({
      where: { id },
      data: updateData,
      include: {
        class: true,
        section: true,
      },
    });

    return successResponse(student);
  } catch (error) {
    console.error('Update student error:', error);
    return errorResponse('حدث خطأ في تحديث بيانات الطالب', 500);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const dbError = checkDb();
  if (dbError) return dbError;

  // Delete student requires admin-level access
  const authError = requirePermission(request, 'all');
  if (authError) return authError;

  try {
    const { id } = await params;

    const existingStudent = await db.student.findUnique({ where: { id } });
    if (!existingStudent) {
      return errorResponse('الطالب غير موجود', 404);
    }

    if (existingStudent.deletedAt) {
      return errorResponse('هذا الطالب محذوف مسبقاً', 409);
    }

    // Soft delete — تعليم السجل كمحذوف بدلاً من حذفه فعلياً
    // يمكن استرجاع البيانات لاحقاً إذا حُذفت بالخطأ
    await db.student.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return successResponse(null, 'تم حذف الطالب بنجاح. يمكن استرجاعه لاحقاً.');
  } catch (error) {
    console.error('Delete student error:', error);
    return errorResponse('حدث خطأ في حذف الطالب', 500);
  }
}
