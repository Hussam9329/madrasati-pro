import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { studentId, newClassId, newSectionId, reason } = body;

    if (!studentId || !newClassId || !newSectionId) {
      return NextResponse.json(
        { error: 'معرف الطالب والصف الجديد والشعبة الجديدة مطلوبون' },
        { status: 400 }
      );
    }

    // Find the student
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: {
        class: true,
        section: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'الطالب غير موجود' },
        { status: 404 }
      );
    }

    // Verify new class and section exist
    const newClass = await db.class.findUnique({
      where: { id: newClassId },
    });

    if (!newClass) {
      return NextResponse.json(
        { error: 'الصف الجديد غير موجود' },
        { status: 404 }
      );
    }

    const newSection = await db.section.findUnique({
      where: { id: newSectionId },
    });

    if (!newSection) {
      return NextResponse.json(
        { error: 'الشعبة الجديدة غير موجودة' },
        { status: 404 }
      );
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

    // Log activity
    try {
      const schoolId = student.schoolId;
      await db.activityLog.create({
        data: {
          action: 'نقل طالب',
          details: `تم نقل الطالب ${student.fullName} من ${student.class.name} / ${student.section.name} إلى ${newClass.name} / ${newSection.name}${reason ? ` - السبب: ${reason}` : ''}`,
          schoolId,
        },
      });
    } catch {
      // Silent fail for activity log
    }

    return NextResponse.json({
      message: 'تم نقل الطالب بنجاح',
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
    });
  } catch (error) {
    console.error('Transfer student error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في نقل الطالب' },
      { status: 500 }
    );
  }
}
