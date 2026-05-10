import { db, isDbAvailable } from '@/lib/db';
import { successResponse, errorResponse, checkDb, requireAnyPermission } from '@/services/api-response';

export async function GET(request: Request) {
  // Check database availability first
  const dbError = checkDb();
  if (dbError) return dbError;

  // Dashboard view requires at least students or attendance permission
  const authError = requireAnyPermission(request, ['students', 'attendance', 'grades', 'reports']);
  if (authError) return authError;

  try {
    // Run independent queries in parallel for better performance
    const [
      totalStudents,
      totalTeachers,
      totalSubjects,
      totalClasses,
      activeStudents,
      school,
    ] = await Promise.all([
      db.student.count(),
      db.teacher.count(),
      db.subject.count(),
      db.class.count(),
      db.student.count({ where: { status: 'مستمر' } }),
      db.school.findFirst(),
    ]);

    // Today's date
    const today = new Date().toISOString().split('T')[0];

    // Today attendance + recent records in parallel
    const [todayAttendance, recentAttendance, studentsByStatus] = await Promise.all([
      db.attendanceRecord.findMany({
        where: { date: today },
        select: { status: true },
      }),
      db.attendanceRecord.findMany({
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
      }),
      db.student.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ]);

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

    // Grade completion + class attendance + weekly trend + class performance in parallel
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    const [subjectsWithClasses, classesWithAttendance, weekRecords, allClasses] =
      await Promise.all([
        db.subject.findMany({
          include: {
            classes: {
              include: {
                class: {
                  include: {
                    students: { select: { id: true } },
                  },
                },
              },
            },
            examTypes: {
              include: {
                grades: { select: { id: true, score: true, status: true } },
              },
            },
          },
        }),
        db.class.findMany({
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
        }),
        db.attendanceRecord.findMany({
          where: { date: { gte: weekAgoStr } },
          select: { date: true, status: true },
        }),
        db.class.findMany({
          include: {
            students: {
              where: { status: 'مستمر' },
              include: {
                grades: { select: { score: true } },
              },
            },
          },
        }),
      ]);

    // Grade completion calculation
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
        completionPercentage:
          expectedGrades > 0 ? Math.round((totalGrades / expectedGrades) * 100) : 0,
      };
    });

    // Class attendance stats
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

    // Weekly attendance trend
    const dayNames: Record<string, string> = {
      Sun: 'الأحد', Mon: 'الإثنين', Tue: 'الثلاثاء',
      Wed: 'الأربعاء', Thu: 'الخميس', Fri: 'الجمعة', Sat: 'السبت',
    };

    const weeklyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayShort = d.toLocaleDateString('en', { weekday: 'short' });
      const dayAr = dayNames[dayShort] || dayShort;

      const dayRecords = weekRecords.filter((r) => r.date === dateStr);
      const presentCount = dayRecords.filter((r) => r.status === 'حاضر').length;
      const lateCount = dayRecords.filter((r) => r.status === 'متأخر').length;
      const absentCount = dayRecords.filter((r) => r.status === 'غائب').length;

      const attendancePercentage =
        activeStudents > 0
          ? Math.round(((presentCount + lateCount) / activeStudents) * 100)
          : 0;

      weeklyTrend.push({
        date: dateStr,
        day: dayAr,
        attendance: attendancePercentage,
        late: lateCount,
        absent: absentCount,
      });
    }

    // Class performance
    const classPerformance = allClasses
      .map((cls) => {
        const allGrades = cls.students.flatMap((s) => s.grades);
        const totalScore = allGrades.reduce((sum, g) => sum + (g.score || 0), 0);
        const avgGrade =
          allGrades.length > 0 ? Math.round(totalScore / allGrades.length) : 0;

        return {
          classId: cls.id,
          className: cls.name,
          avgGrade,
          studentCount: cls.students.length,
          gradeCount: allGrades.length,
        };
      })
      .filter((cls) => cls.gradeCount > 0);

    return successResponse({
      school: school
        ? { name: school.name, academicYear: school.academicYear }
        : null,
      totals: {
        students: totalStudents,
        teachers: totalTeachers,
        subjects: totalSubjects,
        classes: totalClasses,
      },
      todayAttendance: attendanceStats,
      recentAttendance,
      gradeCompletion,
      studentsByStatus: studentsByStatus.map((s) => ({
        status: s.status,
        count: s._count.status,
      })),
      classAttendanceStats,
      weeklyAttendanceTrend: weeklyTrend,
      classPerformance,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    const message =
      error instanceof Error ? error.message : 'حدث خطأ في جلب بيانات لوحة التحكم';
    return errorResponse(message, 500);
  }
}
