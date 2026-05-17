/* ─────────────────────────────────────────────
 *  Report Service  (file 51)
 * ───────────────────────────────────────────── */

import { Prisma } from "@/lib/prisma-types";
import { db } from "@/lib/db";
import {
  type AttendanceReportRow,
  type ChartPoint,
  type ClassReportRow,
  type DashboardCharts,
  type DashboardSummary,
  type GradeReportRow,
  type PaymentReportRow,
  type ReportDateRange,
  type ReportFilter,
  type TeacherReportRow,
  calculateRate,
  getReportDateRange,
  getReportRating,
  parseReportDate,
} from "@/types/report";
import { getPaymentStatusLabel } from "@/types/payment";

// ── Dashboard Summary ────────────────────────

export async function getDashboardSummary(
  filter?: ReportFilter,
): Promise<DashboardSummary> {
  const dateRange = getDateRangeFromFilter(filter);

  const [
    studentsTotal,
    studentsActive,
    studentsInactive,
    studentsGraduated,
    studentsTransferred,
    teachersTotal,
    teachersActive,
    teachersInactive,
    classesTotal,
    sectionsCount,
    subjectsTotal,
    attendanceRecords,
    grades,
    payments,
  ] = await Promise.all([
    db.student.count(),
    db.student.count({ where: { status: "active" } }),
    db.student.count({ where: { status: "inactive" } }),
    db.student.count({ where: { status: "graduated" } }),
    db.student.count({ where: { status: "transferred" } }),
    db.teacher.count(),
    db.teacher.count({ where: { isActive: true } }),
    db.teacher.count({ where: { isActive: false } }),
    db.schoolClass.count(),
    db.section.count(),
    db.subject.count(),
    getAttendanceRecords(dateRange, filter),
    getGradeRecords(dateRange, filter),
    getPaymentRecords(dateRange, filter),
  ]);

  // Attendance calculations
  const present = attendanceRecords.filter(
    (r) => r.status === "present",
  ).length;
  const absent = attendanceRecords.filter((r) => r.status === "absent").length;
  const late = attendanceRecords.filter((r) => r.status === "late").length;
  const excused = attendanceRecords.filter(
    (r) => r.status === "excused",
  ).length;
  const totalAttendanceRecords = attendanceRecords.length;
  const attendanceRate = calculateRate(
    present + late + excused,
    totalAttendanceRecords,
  );

  // Grade calculations
  const totalGradeRecords = grades.length;
  const totalScore = grades.reduce((sum, g) => sum + g.score, 0);
  const totalMaxScore = grades.reduce((sum, g) => sum + g.maxScore, 0);
  const averagePercentage =
    totalMaxScore > 0
      ? Math.round((totalScore / totalMaxScore) * 100 * 10) / 10
      : 0;
  const averageScore =
    totalGradeRecords > 0
      ? Math.round((totalScore / totalGradeRecords) * 10) / 10
      : 0;
  const passingGrades = grades.filter((g) => (g.score / g.maxScore) * 100 >= 50);
  const excellentGrades = grades.filter(
    (g) => (g.score / g.maxScore) * 100 >= 90,
  );
  const failingGrades = grades.filter((g) => (g.score / g.maxScore) * 100 < 50);
  const passingRate = calculateRate(passingGrades.length, totalGradeRecords);

  // Payment calculations
  const totalFees = payments.reduce(
    (sum, p) => sum + (p.finalAmount ?? p.originalAmount ?? p.amount),
    0,
  );
  const totalPaid = payments
    .filter((p) => p.status === "paid" || p.status === "partial")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalRemaining = payments
    .filter((p) => p.status === "pending" || p.status === "partial")
    .reduce((sum, p) => {
      const due = p.finalAmount ?? p.originalAmount ?? p.amount;
      return sum + Math.max(0, due - p.amount);
    }, 0);
  const paidCount = payments.filter((p) => p.status === "paid").length;
  const partialCount = payments.filter((p) => p.status === "partial").length;
  const unpaidCount = payments.filter((p) => p.status === "pending").length;
  const collectionRate = calculateRate(totalPaid, totalFees);

  return {
    students: {
      total: studentsTotal,
      active: studentsActive,
      inactive: studentsInactive,
      graduated: studentsGraduated,
      transferred: studentsTransferred,
    },
    teachers: {
      total: teachersTotal,
      active: teachersActive,
      inactive: teachersInactive,
    },
    classes: {
      total: classesTotal,
      active: classesTotal,
      inactive: 0,
      sections: sectionsCount,
    },
    subjects: {
      total: subjectsTotal,
      active: subjectsTotal,
      inactive: 0,
    },
    attendance: {
      totalRecords: totalAttendanceRecords,
      present,
      absent,
      late,
      excused,
      attendanceRate,
    },
    grades: {
      totalRecords: totalGradeRecords,
      averageScore,
      averagePercentage,
      passingRate,
      excellentCount: excellentGrades.length,
      passingCount: passingGrades.length,
      failingCount: failingGrades.length,
    },
    payments: {
      totalFees,
      totalPaid,
      totalRemaining,
      paidCount,
      partialCount,
      unpaidCount,
      collectionRate,
    },
  };
}

// ── Dashboard Charts ─────────────────────────

export async function getDashboardCharts(
  filter?: ReportFilter,
): Promise<DashboardCharts> {
  const dateRange = getDateRangeFromFilter(filter);

  const [attendanceRecords, grades, payments, classesWithStudents] =
    await Promise.all([
      getAttendanceRecords(dateRange, filter),
      getGradeRecords(dateRange, filter),
      getPaymentRecords(dateRange, filter),
      getClassesWithStudents(),
    ]);

  // Attendance distribution
  const present = attendanceRecords.filter(
    (r) => r.status === "present",
  ).length;
  const absent = attendanceRecords.filter((r) => r.status === "absent").length;
  const late = attendanceRecords.filter((r) => r.status === "late").length;
  const excused = attendanceRecords.filter(
    (r) => r.status === "excused",
  ).length;

  const attendanceDistribution: ChartPoint[] = [
    { label: "حاضر", value: present, color: "#22c55e" },
    { label: "غائب", value: absent, color: "#ef4444" },
    { label: "متأخر", value: late, color: "#f59e0b" },
    { label: "مجاز", value: excused, color: "#3b82f6" },
  ];

  // Grade distribution
  const excellent = grades.filter(
    (g) => (g.score / g.maxScore) * 100 >= 90,
  ).length;
  const veryGood = grades.filter((g) => {
    const pct = (g.score / g.maxScore) * 100;
    return pct >= 80 && pct < 90;
  }).length;
  const good = grades.filter((g) => {
    const pct = (g.score / g.maxScore) * 100;
    return pct >= 70 && pct < 80;
  }).length;
  const average = grades.filter((g) => {
    const pct = (g.score / g.maxScore) * 100;
    return pct >= 60 && pct < 70;
  }).length;
  const acceptable = grades.filter((g) => {
    const pct = (g.score / g.maxScore) * 100;
    return pct >= 50 && pct < 60;
  }).length;
  const failing = grades.filter(
    (g) => (g.score / g.maxScore) * 100 < 50,
  ).length;

  const gradeDistribution: ChartPoint[] = [
    { label: "ممتاز", value: excellent, color: "#22c55e" },
    { label: "جيد جدًا", value: veryGood, color: "#3b82f6" },
    { label: "جيد", value: good, color: "#06b6d4" },
    { label: "متوسط", value: average, color: "#f59e0b" },
    { label: "مقبول", value: acceptable, color: "#f97316" },
    { label: "راسب", value: failing, color: "#ef4444" },
  ];

  // Payment status distribution
  const paidFees = payments.filter((p) => p.status === "paid").length;
  const partialFees = payments.filter((p) => p.status === "partial").length;
  const unpaidFees = payments.filter((p) => p.status === "pending").length;

  const paymentStatusDistribution: ChartPoint[] = [
    { label: "مدفوع", value: paidFees, color: "#22c55e" },
    { label: "مدفوع جزئيًا", value: partialFees, color: "#f59e0b" },
    { label: "غير مدفوع", value: unpaidFees, color: "#ef4444" },
  ];

  // Students per class
  const studentsPerClass: ChartPoint[] = classesWithStudents.map((c) => ({
    label: c.name,
    value: c.studentsCount,
  }));

  // Monthly attendance (last 6 months)
  const monthlyAttendance = await getMonthlyAttendance();

  return {
    attendanceDistribution,
    gradeDistribution,
    paymentStatusDistribution,
    studentsPerClass,
    monthlyAttendance,
  };
}

// ── Attendance Report ────────────────────────

export async function getAttendanceReport(
  filter?: ReportFilter,
): Promise<AttendanceReportRow[]> {
  const dateRange = getDateRangeFromFilter(filter);

  const whereClause: Record<string, unknown> = {};

  // AttendanceRecord has a `date` field directly — no `session` relation
  if (dateRange) {
    whereClause.date = {
      gte: dateRange.from,
      lt: dateRange.to,
    };
  }

  if (filter?.studentId) {
    whereClause.studentId = filter.studentId;
  }

  if (filter?.sectionId) {
    whereClause.student = {
      sectionId: filter.sectionId,
    };
  }

  if (filter?.classId) {
    whereClause.student = {
      ...(whereClause.student as Record<string, unknown>),
      section: {
        classId: filter.classId,
      },
    };
  }

  if (filter?.status) {
    whereClause.status = filter.status;
  }

  const records = await db.attendanceRecord.findMany({
    where: whereClause as Prisma.AttendanceRecordWhereInput,
    include: {
      student: {
        include: {
          section: {
            include: {
              class: true,
            },
          },
        },
      },
      schedule: {
        include: {
          subject: true,
          teacher: true,
          section: {
            include: {
              class: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Group by student
  const studentMap = new Map<
    string,
    {
      studentId: string;
      studentName: string;
      studentCode: string | null;
      className: string | null;
      sectionName: string | null;
      subjectName: string | null;
      teacherName: string | null;
      date: Date | null;
      checkInAt: Date | null;
      checkOutAt: Date | null;
      source: string | null;
      duration: string | null;
      totalSessions: number;
      present: number;
      absent: number;
      late: number;
      excused: number;
    }
  >();

  for (const record of records) {
    const studentId = record.studentId;

    if (!studentMap.has(studentId)) {
      // Calculate duration if both check-in and check-out exist
      let duration: string | null = null;
      if (record.checkInAt && record.checkOutAt) {
        const diffMs = new Date(record.checkOutAt).getTime() - new Date(record.checkInAt).getTime();
        const diffMins = Math.round(diffMs / 60000);
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        duration = hours > 0 ? `${hours} ساعة ${mins} دقيقة` : `${mins} دقيقة`;
      }

      studentMap.set(studentId, {
        studentId,
        studentName: record.student.fullName,
        studentCode: record.student.studentCode,
        className: record.student.section?.class?.name ?? null,
        sectionName: record.student.section?.name ?? null,
        subjectName: record.schedule?.subject?.name ?? null,
        teacherName: record.schedule?.teacher?.fullName ?? null,
        date: record.date,
        checkInAt: record.checkInAt ?? null,
        checkOutAt: record.checkOutAt ?? null,
        source: record.source ?? null,
        duration,
        totalSessions: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
      });
    }

    const entry = studentMap.get(studentId)!;
    entry.totalSessions += 1;

    if (record.status === "present") {
      entry.present += 1;
    } else if (record.status === "absent") {
      entry.absent += 1;
    } else if (record.status === "late") {
      entry.late += 1;
    } else if (record.status === "excused") {
      entry.excused += 1;
    }
  }

  return Array.from(studentMap.values()).map((entry) => {
    const attendanceRate = calculateRate(
      entry.present + entry.late + entry.excused,
      entry.totalSessions,
    );

    return {
      ...entry,
      subjectName: entry.subjectName,
      teacherName: entry.teacherName,
      date: entry.date,
      checkInAt: entry.checkInAt,
      checkOutAt: entry.checkOutAt,
      source: entry.source,
      duration: entry.duration,
      attendanceRate,
      attendanceRating: getReportRating(attendanceRate),
    };
  });
}

// ── Grades Report ────────────────────────────

export async function getGradesReport(
  filter?: ReportFilter,
): Promise<GradeReportRow[]> {
  const dateRange = getDateRangeFromFilter(filter);

  const whereClause: Record<string, unknown> = {};

  if (dateRange) {
    whereClause.createdAt = {
      gte: dateRange.from,
      lt: dateRange.to,
    };
  }

  if (filter?.studentId) {
    whereClause.studentId = filter.studentId;
  }

  if (filter?.subjectId) {
    whereClause.subjectId = filter.subjectId;
  }

  if (filter?.classId || filter?.sectionId) {
    const studentWhere: Record<string, unknown> = {};
    if (filter.sectionId) {
      studentWhere.sectionId = filter.sectionId;
    }
    if (filter.classId) {
      studentWhere.section = {
        classId: filter.classId,
      };
    }
    whereClause.student = studentWhere;
  }

  if (filter?.term) {
    whereClause.term = filter.term;
  }

  const grades = await db.grade.findMany({
    where: whereClause as Prisma.GradeWhereInput,
    include: {
      student: {
        include: {
          section: {
            include: {
              class: true,
            },
          },
        },
      },
      subject: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return grades.map((grade) => {
    const percentage =
      grade.maxScore > 0
        ? Math.round((grade.score / grade.maxScore) * 100 * 10) / 10
        : 0;

    return {
      studentId: grade.studentId,
      studentName: grade.student.fullName,
      studentCode: grade.student.studentCode,
      className: grade.student.section?.class?.name ?? null,
      sectionName: grade.student.section?.name ?? null,
      subjectName: grade.subject.name,
      examName: grade.title,
      score: grade.score,
      maxScore: grade.maxScore,
      percentage,
      rating: getReportRating(percentage),
      term: grade.term ?? "",
    };
  });
}

// ── Payments Report ──────────────────────────

export async function getPaymentsReport(
  filter?: ReportFilter,
): Promise<PaymentReportRow[]> {
  const dateRange = getDateRangeFromFilter(filter);

  const whereClause: Record<string, unknown> = {};

  if (dateRange) {
    whereClause.createdAt = {
      gte: dateRange.from,
      lt: dateRange.to,
    };
  }

  if (filter?.studentId) {
    whereClause.studentId = filter.studentId;
  }

  if (filter?.classId || filter?.sectionId) {
    const studentWhere: Record<string, unknown> = {};
    if (filter.sectionId) {
      studentWhere.sectionId = filter.sectionId;
    }
    if (filter.classId) {
      studentWhere.section = {
        classId: filter.classId,
      };
    }
    whereClause.student = studentWhere;
  }

  if (filter?.status) {
    whereClause.status = filter.status;
  }

  const payments = await db.payment.findMany({
    where: whereClause as Prisma.PaymentWhereInput,
    include: {
      student: {
        include: {
          section: {
            include: {
              class: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return payments.map((payment) => {
    const due = payment.finalAmount ?? payment.originalAmount ?? payment.amount;
    return {
      studentId: payment.studentId,
      studentName: payment.student.fullName,
      studentCode: payment.student.studentCode,
      className: payment.student.section?.class?.name ?? null,
      sectionName: payment.student.section?.name ?? null,
      feeTitle: payment.feeTitle,
      amount: payment.amount,
      paidAmount: payment.amount,
      originalAmount: payment.originalAmount,
      discountAmount: payment.discountAmount,
      discountPercent: payment.discountPercent,
      discountReason: payment.discountReason,
      finalAmount: payment.finalAmount,
      remainingAmount: Math.max(0, due - payment.amount),
      status: payment.status,
      statusLabel: getPaymentStatusLabel(payment.status),
      dueDate: payment.dueDate,
    };
  });
}

// ── Classes Report ───────────────────────────

export async function getClassesReport(): Promise<ClassReportRow[]> {
  const classes = await db.schoolClass.findMany({
    orderBy: {
      name: "asc",
    },
    include: {
      sections: {
        include: {
          _count: {
            select: {
              students: true,
            },
          },
        },
      },
      _count: {
        select: {
          classSubjects: true,
        },
      },
    },
  });

  return classes.map((schoolClass) => {
    const studentsCount = schoolClass.sections.reduce(
      (total, section) => total + section._count.students,
      0,
    );

    return {
      classId: schoolClass.id,
      className: schoolClass.name,
      level: schoolClass.level,
      sectionsCount: schoolClass.sections.length,
      studentsCount,
      subjectsCount: schoolClass._count.classSubjects,
      isActive: schoolClass.isActive,
    };
  });
}

// ── Teachers Report ──────────────────────────

export async function getTeachersReport(): Promise<TeacherReportRow[]> {
  const teachers = await db.teacher.findMany({
    orderBy: {
      fullName: "asc",
    },
    include: {
      teacherSubjects: {
        include: {
          subject: true,
        },
      },
      schedules: true,
    },
  });

  return teachers.map((teacher) => ({
    teacherId: teacher.id,
    teacherName: teacher.fullName,
    specialty: teacher.specialty,
    subjectsCount: teacher.teacherSubjects.length,
    subjectsNames:
      teacher.teacherSubjects.length > 0
        ? teacher.teacherSubjects
            .map((ts) => ts.subject.name)
            .join("، ")
        : "لا توجد مواد مرتبطة",
    schedulesCount: teacher.schedules.length,
    gradesCount: 0,
    isActive: teacher.isActive,
  }));
}

// ── Internal Helpers ─────────────────────────

function getDateRangeFromFilter(
  filter?: ReportFilter,
): ReportDateRange | undefined {
  if (!filter) {
    return undefined;
  }

  // If custom period with explicit dates
  if (filter.period === "custom" && filter.fromDate && filter.toDate) {
    const from = parseReportDate(filter.fromDate);
    const to = parseReportDate(filter.toDate);

    if (from && to) {
      return {
        from,
        to,
        label: `من ${from.toLocaleDateString("ar-IQ")} إلى ${to.toLocaleDateString("ar-IQ")}`,
      };
    }
  }

  if (filter.period && filter.period !== "custom") {
    return getReportDateRange(filter.period);
  }

  return undefined;
}

async function getAttendanceRecords(
  dateRange: ReportDateRange | undefined,
  filter?: ReportFilter,
) {
  const whereClause: Record<string, unknown> = {};

  // AttendanceRecord has a `date` field directly — no `session` relation
  if (dateRange) {
    whereClause.date = {
      gte: dateRange.from,
      lt: dateRange.to,
    };
  }

  if (filter?.studentId) {
    whereClause.studentId = filter.studentId;
  }

  if (filter?.sectionId) {
    whereClause.student = {
      sectionId: filter.sectionId,
    };
  }

  if (filter?.classId) {
    whereClause.student = {
      ...(whereClause.student as Record<string, unknown>),
      section: {
        classId: filter.classId,
      },
    };
  }

  if (filter?.status) {
    whereClause.status = filter.status;
  }

  return db.attendanceRecord.findMany({
    where: whereClause as Prisma.AttendanceRecordWhereInput,
    select: {
      status: true,
    },
  });
}

async function getGradeRecords(
  dateRange: ReportDateRange | undefined,
  filter?: ReportFilter,
) {
  const whereClause: Record<string, unknown> = {};

  if (dateRange) {
    whereClause.createdAt = {
      gte: dateRange.from,
      lt: dateRange.to,
    };
  }

  if (filter?.studentId) {
    whereClause.studentId = filter.studentId;
  }

  if (filter?.subjectId) {
    whereClause.subjectId = filter.subjectId;
  }

  if (filter?.classId || filter?.sectionId) {
    const studentWhere: Record<string, unknown> = {};
    if (filter?.sectionId) {
      studentWhere.sectionId = filter.sectionId;
    }
    if (filter?.classId) {
      studentWhere.section = {
        classId: filter.classId,
      };
    }
    whereClause.student = studentWhere;
  }

  if (filter?.term) {
    whereClause.term = filter.term;
  }

  return db.grade.findMany({
    where: whereClause as Prisma.GradeWhereInput,
    select: {
      score: true,
      maxScore: true,
    },
  });
}

async function getPaymentRecords(
  dateRange: ReportDateRange | undefined,
  filter?: ReportFilter,
) {
  const whereClause: Record<string, unknown> = {};

  if (dateRange) {
    whereClause.createdAt = {
      gte: dateRange.from,
      lt: dateRange.to,
    };
  }

  if (filter?.studentId) {
    whereClause.studentId = filter.studentId;
  }

  if (filter?.classId || filter?.sectionId) {
    const studentWhere: Record<string, unknown> = {};
    if (filter?.sectionId) {
      studentWhere.sectionId = filter.sectionId;
    }
    if (filter?.classId) {
      studentWhere.section = {
        classId: filter.classId,
      };
    }
    whereClause.student = studentWhere;
  }

  if (filter?.status) {
    whereClause.status = filter.status;
  }

  return db.payment.findMany({
    where: whereClause as Prisma.PaymentWhereInput,
    select: {
      amount: true,
      finalAmount: true,
      originalAmount: true,
      discountAmount: true,
      discountPercent: true,
      discountReason: true,
      status: true,
    },
  });
}

async function getClassesWithStudents(): Promise<
  {
    name: string;
    studentsCount: number;
  }[]
> {
  const classes = await db.schoolClass.findMany({
    orderBy: {
      name: "asc",
    },
    include: {
      sections: {
        include: {
          _count: {
            select: {
              students: true,
            },
          },
        },
      },
    },
  });

  return classes.map((schoolClass) => ({
    name: schoolClass.name,
    studentsCount: schoolClass.sections.reduce(
      (total, section) => total + section._count.students,
      0,
    ),
  }));
}

async function getMonthlyAttendance(): Promise<ChartPoint[]> {
  const months: ChartPoint[] = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(
      now.getFullYear(),
      now.getMonth() - i + 1,
      1,
    );

    // AttendanceRecord has a `date` field directly — no `session` relation
    const count = await db.attendanceRecord.count({
      where: {
        date: {
          gte: monthDate,
          lt: nextMonth,
        },
        status: {
          in: ["present", "late", "excused"],
        },
      },
    });

    months.push({
      label: new Intl.DateTimeFormat("ar-IQ", {
        month: "short",
      }).format(monthDate),
      value: count,
    });
  }

  return months;
}
