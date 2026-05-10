import { checkDb, successResponse, errorResponse } from '@/services/api-response';
import { db } from '@/lib/db';

// GET /api/schedule - Get schedule slots
export async function GET(request: Request) {
  const dbError = checkDb();
  if (dbError) return dbError;

  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');
    const teacherId = searchParams.get('teacherId');
    const classId = searchParams.get('classId');
    const day = searchParams.get('day');

    const where: Record<string, unknown> = {};
    if (schoolId) where.schoolId = schoolId;
    if (teacherId) where.teacherId = teacherId;
    if (classId) where.classId = classId;
    if (day) where.day = day;

    const slots = await db.scheduleSlot.findMany({
      where,
      include: {
        subject: { select: { id: true, name: true, code: true, type: true } },
        teacher: { select: { id: true, fullName: true, phone: true } },
        class: { select: { id: true, name: true, level: true, stage: true, branch: true } },
      },
      orderBy: [{ day: 'asc' }, { period: 'asc' }],
    });

    return successResponse(slots);
  } catch (error) {
    console.error('Get schedule error:', error);
    return errorResponse('حدث خطأ في جلب جدول الحصص', 500);
  }
}

// POST /api/schedule - Create a schedule slot with conflict detection
export async function POST(request: Request) {
  const dbError = checkDb();
  if (dbError) return dbError;

  try {
    const body = await request.json();
    const { day, period, subjectId, teacherId, classId, sectionId, schoolId, room } = body;

    if (!day || !period || !subjectId || !teacherId || !classId || !schoolId) {
      return errorResponse('جميع الحقول مطلوبة (اليوم، الحصة، المادة، الأستاذ، الصف، المدرسة)', 400);
    }

    // Check for teacher conflict - same teacher can't be in two places at same time
    const teacherConflict = await db.scheduleSlot.findFirst({
      where: {
        day,
        period,
        teacherId,
        schoolId,
      },
      include: {
        subject: { select: { name: true } },
        class: { select: { name: true } },
      },
    });

    if (teacherConflict) {
      return errorResponse(
        `تضارب: الأستاذ مشغول في ${day} الحصة ${period} بمادة "${teacherConflict.subject.name}" في صف "${teacherConflict.class.name}"`,
        409
      );
    }

    // Check for class conflict - same class can't have two subjects at same time
    const classConflict = await db.scheduleSlot.findFirst({
      where: {
        day,
        period,
        classId,
        sectionId: sectionId || null,
        schoolId,
      },
      include: {
        subject: { select: { name: true } },
        teacher: { select: { fullName: true } },
      },
    });

    if (classConflict) {
      return errorResponse(
        `تضارب: الصف لديه حصة "${classConflict.subject.name}" مع الأستاذ "${classConflict.teacher.fullName}" في ${day} الحصة ${period}`,
        409
      );
    }

    const slot = await db.scheduleSlot.create({
      data: {
        day,
        period,
        subjectId,
        teacherId,
        classId,
        sectionId,
        schoolId,
        room,
      },
      include: {
        subject: { select: { id: true, name: true, code: true, type: true } },
        teacher: { select: { id: true, fullName: true, phone: true } },
        class: { select: { id: true, name: true, level: true, stage: true, branch: true } },
      },
    });

    return successResponse(slot, undefined, 201);
  } catch (error) {
    console.error('Create schedule slot error:', error);
    return errorResponse('حدث خطأ في إنشاء حصة الجدول', 500);
  }
}

// DELETE /api/schedule - Delete a schedule slot
export async function DELETE(request: Request) {
  const dbError = checkDb();
  if (dbError) return dbError;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('معرف الحصة مطلوب', 400);
    }

    await db.scheduleSlot.delete({ where: { id } });

    return successResponse(null, 'تم حذف الحصة بنجاح');
  } catch (error) {
    console.error('Delete schedule slot error:', error);
    return errorResponse('حدث خطأ في حذف الحصة', 500);
  }
}

// PUT /api/schedule - Update a schedule slot
export async function PUT(request: Request) {
  const dbError = checkDb();
  if (dbError) return dbError;

  try {
    const body = await request.json();
    const { id, day, period, subjectId, teacherId, classId, sectionId, room } = body;

    if (!id) {
      return errorResponse('معرف الحصة مطلوب', 400);
    }

    // Check for teacher conflict (excluding current slot)
    if (teacherId && day && period) {
      const teacherConflict = await db.scheduleSlot.findFirst({
        where: {
          day,
          period,
          teacherId,
          id: { not: id },
        },
      });

      if (teacherConflict) {
        return errorResponse('تضارب: الأستاذ مشغول في هذا الوقت', 409);
      }

      // Check for class conflict (excluding current slot)
      const classConflict = await db.scheduleSlot.findFirst({
        where: {
          day,
          period,
          classId: classId || undefined,
          sectionId: sectionId || null,
          id: { not: id },
        },
      });

      if (classConflict) {
        return errorResponse('تضارب: الصف لديه حصة أخرى في هذا الوقت', 409);
      }
    }

    const slot = await db.scheduleSlot.update({
      where: { id },
      data: {
        ...(day && { day }),
        ...(period && { period }),
        ...(subjectId && { subjectId }),
        ...(teacherId && { teacherId }),
        ...(classId && { classId }),
        ...(sectionId !== undefined && { sectionId }),
        ...(room !== undefined && { room }),
      },
      include: {
        subject: { select: { id: true, name: true, code: true, type: true } },
        teacher: { select: { id: true, fullName: true, phone: true } },
        class: { select: { id: true, name: true, level: true, stage: true, branch: true } },
      },
    });

    return successResponse(slot);
  } catch (error) {
    console.error('Update schedule slot error:', error);
    return errorResponse('حدث خطأ في تحديث حصة الجدول', 500);
  }
}
