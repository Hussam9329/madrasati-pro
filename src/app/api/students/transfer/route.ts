import { checkDb, successResponse, errorResponse, validationErrorResponse, requirePermission } from '@/services/api-response';
import { db } from '@/lib/db';
import { studentTransferSchema } from '@/lib/validations';

export async function PUT(request: Request) {
  const dbError = checkDb();
  if (dbError) return dbError;

  // Transfer student requires students permission (admin-level operation)
  const authError = requirePermission(request, 'students');
  if (authError) return authError;

  try {
    const body = await request.json();

    // Validate input with Zod
    const result = studentTransferSchema.safeParse(body);
    if (!result.success) {
      return validationErrorResponse(result.error);
    }

    const { studentId, newClassId, newSectionId, reason } = result.data;

    // Find the student
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: {
        class: true,
        section: true,
      },
    });

    if (!student) {
      return errorResponse('الطالب غير موجود', 404);
    }

    // Verify new class and section exist
    const newClass = await db.class.findUnique({
      where: { id: newClassId },
    });

    if (!newClass) {
      return errorResponse('الصف الجديد غير موجود', 404);
    }

    const newSection = await db.section.findUnique({
      where: { id: newSectionId },
    });

    if (!newSection) {
      return errorResponse('الشعبة الجديدة غير موجودة', 404);
    }

    // Update student's class and section
    const updatedStudent = await db.student.update({
      where: { id: studentId },
      data: {
        classId: newClassId,
        sectionId: newSectionId,
      },
      include: {
        class: true,
        section: true,
      },
    });

    return successResponse({
      student: updatedStudent,
      transfer: {
        from: {
          class: student.class.name,
          section: student.section.name,
        },
        to: {
          class: newClass.name,
          section: newSection.name,
        },
        reason: reason || '',
        date: new Date().toISOString(),
      },
    }, 'تم نقل الطالب بنجاح');
  } catch (error) {
    console.error('Transfer student error:', error);
    return errorResponse('حدث خطأ في نقل الطالب', 500);
  }
}
