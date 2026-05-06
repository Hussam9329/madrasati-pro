import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/schedule - Get schedule slots
export async function GET(request: Request) {
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

    return NextResponse.json(slots);
  } catch (error) {
    console.error('Get schedule error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب جدول الحصص' },
      { status: 500 }
    );
  }
}

// POST /api/schedule - Create a schedule slot with conflict detection
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { day, period, subjectId, teacherId, classId, sectionId, schoolId, room } = body;

    if (!day || !period || !subjectId || !teacherId || !classId || !schoolId) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة (اليوم، الحصة، المادة، الأستاذ، الصف، المدرسة)' },
        { status: 400 }
      );
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
      return NextResponse.json(
        {
          error: `تضارب: الأستاذ مشغول في ${day} الحصة ${period} بمادة "${teacherConflict.subject.name}" في صف "${teacherConflict.class.name}"`,
          conflictType: 'teacher',
          conflict: teacherConflict,
        },
        { status: 409 }
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
      return NextResponse.json(
        {
          error: `تضارب: الصف لديه حصة "${classConflict.subject.name}" مع الأستاذ "${classConflict.teacher.fullName}" في ${day} الحصة ${period}`,
          conflictType: 'class',
          conflict: classConflict,
        },
        { status: 409 }
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

    return NextResponse.json(slot, { status: 201 });
  } catch (error) {
    console.error('Create schedule slot error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء حصة الجدول' },
      { status: 500 }
    );
  }
}

// DELETE /api/schedule - Delete a schedule slot
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'معرف الحصة مطلوب' },
        { status: 400 }
      );
    }

    await db.scheduleSlot.delete({ where: { id } });

    return NextResponse.json({ message: 'تم حذف الحصة بنجاح' });
  } catch (error) {
    console.error('Delete schedule slot error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في حذف الحصة' },
      { status: 500 }
    );
  }
}

// PUT /api/schedule - Update a schedule slot
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, day, period, subjectId, teacherId, classId, sectionId, room } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'معرف الحصة مطلوب' },
        { status: 400 }
      );
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
        return NextResponse.json(
          { error: 'تضارب: الأستاذ مشغول في هذا الوقت', conflictType: 'teacher' },
          { status: 409 }
        );
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
        return NextResponse.json(
          { error: 'تضارب: الصف لديه حصة أخرى في هذا الوقت', conflictType: 'class' },
          { status: 409 }
        );
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

    return NextResponse.json(slot);
  } catch (error) {
    console.error('Update schedule slot error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث حصة الجدول' },
      { status: 500 }
    );
  }
}
