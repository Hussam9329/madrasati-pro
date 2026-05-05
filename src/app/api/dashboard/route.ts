import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Total counts
    const [
      totalStudents,
      totalTeachers,
      totalSubjects,
      totalClasses,
    ] = await Promise.all([
      db.student.count(),
      db.teacher.count(),
      db.subject.count(),
      db.class.count(),
    ]);

    // Today's attendance statistics
    const today = new Date().toISOString().split('T')[0];

    const todayAttendance = await db.attendanceRecord.findMany({
      where: { date: today },
      select: { status: true },
    });

    const attendanceStats = {
      present: todayAttendance.filter((r) => r.status === 'حاضر').length,
      absent: todayAttendance.filter((r) => r.status === 'غائب').length,
      late: todayAttendance.filter((r) => r.status === 'متأخر').length,
      earlyExit: todayAttendance.filter((r) => r.status === 'خروج مبكر').length,
      excused: todayAttendance.filter((r) => r.status === 'مستأذن').length,
      sickLeave: todayAttendance.filter((r) => r.status === 'إجازة مرضية').length,
      officialLeave: todayAttendance.filter((r) => r.status === 'إجازة رسمية').length,
      partialAttendance: todayAttendance.filter((r) => r.status === 'حضور ناقص').length,
      total: todayAttendance.length,
    };

    // Recent attendance records (last 10)
    const recentAttendance = await db.attendanceRecord.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            studentNumber: true,
            class: { select: { name: true } },
            section: { select: { name: true } },
          },
        },
      },
    });

    // Grade completion status
    const subjectsWithClasses = await db.subject.findMany({
      include: {
        classes: {
          include: {
            class: {
              include: {
                students: {
                  select: { id: true },
                },
              },
            },
          },
        },
        examTypes: {
          include: {
            grades: {
              select: { id: true, score: true, status: true },
            },
          },
        },
      },
    });

    const gradeCompletion = subjectsWithClasses.map((subject) => {
      const totalStudentsInClasses = subject.classes.reduce(
        (sum, sc) => sum + sc.class.students.length,
        0
      );
      const totalGrades = subject.examTypes.reduce(
        (sum, et) => sum + et.grades.length,
        0
      );
      const completedGrades = subject.examTypes.reduce(
        (sum, et) => sum + et.grades.filter((g) => g.status === 'مكتملة').length,
        0
      );
      const expectedGrades = totalStudentsInClasses * subject.examTypes.length;

      return {
        subjectId: subject.id,
        subjectName: subject.name,
        totalStudents: totalStudentsInClasses,
        examTypesCount: subject.examTypes.length,
        expectedGrades,
        totalGrades,
        completedGrades,
        missingGrades: Math.max(0, expectedGrades - totalGrades),
        completionPercentage: expectedGrades > 0 ? Math.round((totalGrades / expectedGrades) * 100) : 0,
      };
    });

    // Active notices
    const notices = await db.notice.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    // Student status breakdown
    const studentsByStatus = await db.student.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    // Attendance by class today
    const classesWithAttendance = await db.class.findMany({
      include: {
        students: {
          include: {
            attendance: {
              where: { date: today },
              select: { status: true },
            },
          },
        },
      },
    });

    const classAttendanceStats = classesWithAttendance.map((cls) => {
      const totalStudents = cls.students.length;
      const attendanceRecords = cls.students.flatMap((s) => s.attendance);
      const present = attendanceRecords.filter(
        (r) => r.status === 'حاضر' || r.status === 'متأخر'
      ).length;

      return {
        classId: cls.id,
        className: cls.name,
        totalStudents,
        present,
        absent: totalStudents - present,
        attendancePercentage:
          totalStudents > 0 ? Math.round((present / totalStudents) * 100) : 0,
      };
    });

    return NextResponse.json({
      totals: {
        students: totalStudents,
        teachers: totalTeachers,
        subjects: totalSubjects,
        classes: totalClasses,
      },
      todayAttendance: attendanceStats,
      recentAttendance,
      gradeCompletion,
      notices,
      studentsByStatus: studentsByStatus.map((s) => ({
        status: s.status,
        count: s._count.status,
      })),
      classAttendanceStats,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب بيانات لوحة التحكم' },
      { status: 500 }
    );
  }
}
