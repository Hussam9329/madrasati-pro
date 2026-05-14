import { db } from "@/lib/db";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfTomorrow() {
  const d = startOfToday();
  d.setDate(d.getDate() + 1);
  return d;
}

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export async function getDashboardStats() {
  const todayStart = startOfToday();
  const tomorrowStart = startOfTomorrow();
  const monthStart = startOfMonth();

  const [
    studentsTotal,
    teachersTotal,
    classesTotal,
    sectionsTotal,
    todayAttendanceTotal,
    todayAttendancePresent,
    gradesThisMonth,
    paidAggregate,
    schoolCount,
    subjectsTotal,
    studentsWithoutSection,
    teachersWithoutSubjects,
    overduePayments,
  ] = await Promise.all([
    db.student.count(),
    db.teacher.count(),
    db.schoolClass.count(),
    db.section.count(),
    db.attendanceRecord.count({
      where: { date: { gte: todayStart, lt: tomorrowStart } },
    }),
    db.attendanceRecord.count({
      where: {
        date: { gte: todayStart, lt: tomorrowStart },
        status: { in: ["present", "late", "excused"] },
      },
    }),
    db.grade.count({
      where: { createdAt: { gte: monthStart } },
    }),
    db.payment.aggregate({
      where: { status: { in: ["paid", "partial"] } },
      _sum: { amount: true },
    }),
    db.school.count(),
    db.subject.count(),
    db.student.count({ where: { sectionId: null } }),
    db.teacher.count({ where: { teacherSubjects: { none: {} } } }),
    db.payment.count({
      where: {
        status: { in: ["pending", "partial"] },
        dueDate: { lt: todayStart },
      },
    }),
  ]);

  const setupChecks = [
    schoolCount > 0,
    subjectsTotal > 0,
    classesTotal > 0,
    sectionsTotal > 0,
    teachersTotal > 0,
    studentsTotal > 0,
  ];

  return {
    studentsTotal,
    teachersTotal,
    classesTotal,
    sectionsTotal,
    todayAttendanceRate:
      todayAttendanceTotal > 0
        ? Math.round((todayAttendancePresent / todayAttendanceTotal) * 100)
        : 0,
    gradesThisMonth,
    totalPaid: paidAggregate._sum.amount ?? 0,
    alertsCount: studentsWithoutSection + teachersWithoutSubjects + overduePayments,
    readinessRate: Math.round(
      (setupChecks.filter(Boolean).length / setupChecks.length) * 100,
    ),
  };
}
