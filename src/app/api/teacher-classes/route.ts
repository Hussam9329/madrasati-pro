import { checkDb, successResponse, errorResponse, requirePermission, requireAnyPermission } from '@/services/api-response';
import { db } from '@/lib/db';

// GET - Fetch teacher-class assignments
export async function GET(request: Request) {
  const dbError = checkDb();
  if (dbError) return dbError;

  // View assignments requires appropriate permission
  const authError = requireAnyPermission(request, ['teachers', 'students', 'schedule', 'grades']);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const teacherId = searchParams.get('teacherId');

    const where: Record<string, unknown> = {};
    if (classId) where.classId = classId;
    if (teacherId) where.teacherId = teacherId;

    const assignments = await db.teacherClass.findMany({
      where,
      include: {
        teacher: { select: { id: true, fullName: true, notes: true, phone: true } },
      },
      orderBy: { id: 'desc' },
    });

    return successResponse(assignments);
  } catch (error) {
    console.error('Get teacher-class assignments error:', error);
    return errorResponse('حدث خطأ في جلب بيانات التعيينات', 500);
  }
}

// POST - Assign teacher to class/section
export async function POST(request: Request) {
  const dbError = checkDb();
  if (dbError) return dbError;

  // Assign teacher requires teachers permission
  const authError = requirePermission(request, 'teachers');
  if (authError) return authError;

  try {
    const body = await request.json();
    const { teacherId, classId, sectionId } = body;

    if (!teacherId || !classId) {
      return errorResponse('معرف الأستاذ والصف مطلوبان', 400);
    }

    // Check if already assigned
    const existing = await db.teacherClass.findFirst({
      where: { teacherId, classId }
    });

    if (existing) {
      // Update with sectionId if provided
      if (sectionId) {
        const updated = await db.teacherClass.update({
          where: { id: existing.id },
          data: { sectionId }
        });
        return successResponse(updated);
      }
      return errorResponse('الأستاذ معين بالفعل على هذا الصف', 409);
    }

    const assignment = await db.teacherClass.create({
      data: { teacherId, classId, sectionId },
      include: {
        teacher: { select: { id: true, fullName: true } },
      }
    });

    return successResponse(assignment, undefined, 201);
  } catch (error) {
    console.error('Assign teacher error:', error);
    return errorResponse('حدث خطأ في تعيين الأستاذ', 500);
  }
}

// DELETE - Remove teacher from class
export async function DELETE(request: Request) {
  const dbError = checkDb();
  if (dbError) return dbError;

  // Remove assignment requires teachers permission
  const authError = requirePermission(request, 'teachers');
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('المعرف مطلوب', 400);
    }

    await db.teacherClass.delete({ where: { id } });
    return successResponse(null, 'تم إلغاء تعيين الأستاذ بنجاح');
  } catch (error) {
    console.error('Remove teacher assignment error:', error);
    return errorResponse('حدث خطأ في إلغاء التعيين', 500);
  }
}
