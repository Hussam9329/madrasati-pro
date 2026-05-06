import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete related teacher assignments first
    await db.teacherClass.deleteMany({ where: { classId: id } });

    // Delete related subject-class links
    await db.subjectClass.deleteMany({ where: { classId: id } });

    // Delete related schedule slots
    await db.scheduleSlot.deleteMany({ where: { classId: id } });

    // Delete sections (which will cascade to students, attendance, grades)
    const sections = await db.section.findMany({ where: { classId: id } });
    const sectionIds = sections.map(s => s.id);

    if (sectionIds.length > 0) {
      // Delete attendance records for students in these sections
      const students = await db.student.findMany({
        where: { sectionId: { in: sectionIds } },
        select: { id: true },
      });
      const studentIds = students.map(s => s.id);

      if (studentIds.length > 0) {
        await db.gradeModification.deleteMany({
          where: { grade: { studentId: { in: studentIds } } },
        });
        await db.grade.deleteMany({ where: { studentId: { in: studentIds } } });
        await db.attendanceRecord.deleteMany({ where: { studentId: { in: studentIds } } });
        await db.studentNote.deleteMany({ where: { studentId: { in: studentIds } } });
        await db.student.deleteMany({ where: { id: { in: studentIds } } });
      }

      await db.section.deleteMany({ where: { id: { in: sectionIds } } });
    }

    // Finally delete the class
    await db.class.delete({ where: { id } });

    return NextResponse.json({ message: 'تم حذف الصف بنجاح' });
  } catch (error) {
    console.error('Delete class error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في حذف الصف' },
      { status: 500 }
    );
  }
}
