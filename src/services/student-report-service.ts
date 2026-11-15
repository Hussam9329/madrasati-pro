import { safeQuery } from "@/lib/db";
import { getGradesByStudentId } from "@/services/grade-service";
import {
  getAttendanceByStudentId,
  getStudentComputedAbsences,
} from "@/services/attendance-service";
import { getPaymentsByStudentId, getStudentPaymentSummary } from "@/services/payment-service";
import { formatMoney } from "@/types/payment";
import { formatAttendanceShortDate, formatAttendanceTime } from "@/types/attendance";
import {
  formatReportDate,
  getReportDateRange,
  parseReportDate,
  type ReportDateRange,
  type ReportPeriod,
} from "@/types/report";

/**
 * Student report data shared by the admin student profile
 * (/students/[id]) and the public guardian page (/p/[token]).
 *
 * Nothing here checks the admin session: callers are responsible for access
 * control (requireAdmin on the profile, the secret guardian token on /p).
 */

export const STUDENT_REPORT_PERIODS: ReportPeriod[] = [
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "semester",
  "annual",
  "custom",
];

export const DEFAULT_STUDENT_REPORT_PERIOD: ReportPeriod = "weekly";

export function normalizeStudentReportPeriod(value?: string): ReportPeriod {
  return STUDENT_REPORT_PERIODS.includes(value as ReportPeriod)
    ? (value as ReportPeriod)
    : DEFAULT_STUDENT_REPORT_PERIOD;
}

export function getStudentReportDateRange(
  period: ReportPeriod,
  fromDate?: string,
  toDate?: string,
): ReportDateRange {
  if (period === "custom") {
    const parsedFrom = parseReportDate(fromDate);
    const parsedTo = parseReportDate(toDate);

    if (parsedFrom && parsedTo) {
      const from = new Date(
        parsedFrom.getFullYear(),
        parsedFrom.getMonth(),
        parsedFrom.getDate(),
        0,
        0,
        0,
        0,
      );
      const to = new Date(
        parsedTo.getFullYear(),
        parsedTo.getMonth(),
        parsedTo.getDate() + 1,
        0,
        0,
        0,
        0,
      );

      return {
        from,
        to,
        label: `من ${formatReportDate(from)} إلى ${formatReportDate(parsedTo)}`,
      };
    }

    return {
      ...getReportDateRange("weekly"),
      label: `${getReportDateRange("weekly").label} — حدد تاريخ البداية والنهاية للفترة المخصصة`,
    };
  }

  return getReportDateRange(period);
}

export function getInclusiveEndDate(range: ReportDateRange) {
  const date = new Date(range.to);
  date.setDate(date.getDate() - 1);
  return date;
}

export function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Loads and filters everything the student report needs for one date range:
 * grades and attendance (explicit records + computed absences) inside the
 * range, all payments, and the computed grade/attendance/financial stats.
 */
export async function getStudentReport(
  student: { id: string; enrollmentDate: Date | string | null },
  range: ReportDateRange,
) {
  const studentId = student.id;
  const [grades, attendance, payments, paymentSummary, computedAbsences] = await Promise.all([
    safeQuery(() => getGradesByStudentId(studentId), []),
    safeQuery(() => getAttendanceByStudentId(studentId), []),
    safeQuery(() => getPaymentsByStudentId(studentId), []),
    safeQuery(() => getStudentPaymentSummary(studentId), { totalPaid: 0, totalPending: 0, totalRefunded: 0, paymentsCount: 0 }),
    // School days in the report range where the student has no attendance
    // record — counted as absent, same as the attendance page.
    safeQuery(() => getStudentComputedAbsences(studentId, range, student.enrollmentDate), []),
  ]);

  const reportGrades = filterItemsByReportRange(grades, (grade) => grade.date, range);
  const reportAttendance = mergeReportAttendance(
    filterItemsByReportRange(attendance, (record) => record.date, range),
    filterItemsByReportRange(computedAbsences, (record) => record.date, range),
  );

  return {
    grades: reportGrades,
    attendance: reportAttendance,
    payments,
    gradeStats: calculateGradeStats(reportGrades),
    attendanceStats: calculateAttendanceStats(reportAttendance),
    financialStats: calculateFinancialStats(payments, paymentSummary.totalPaid, paymentSummary.totalPending),
  };
}

function filterItemsByReportRange<T>(
  items: T[],
  getDate: (item: T) => Date | string | null | undefined,
  range: ReportDateRange,
): T[] {
  return items.filter((item) => {
    const value = getDate(item);
    if (!value) return false;

    const itemDate = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(itemDate.getTime())) return false;

    return itemDate >= range.from && itemDate < range.to;
  });
}

export function calculateGradeStats(grades: { score: number; maxScore: number }[]) {
  if (grades.length === 0) {
    return { average: null as number | null, successCount: 0, failedCount: 0 };
  }

  const percentages = grades.map((grade) => (Number(grade.score) / Math.max(1, Number(grade.maxScore))) * 100);
  const average = Math.round(percentages.reduce((sum, value) => sum + value, 0) / percentages.length);
  const successCount = percentages.filter((value) => value >= 50).length;

  return { average, successCount, failedCount: grades.length - successCount };
}

type GradeSummaryItem = {
  subjectName?: string | null;
  title?: string | null;
  score: number;
  maxScore: number;
  percentage?: number | null;
};

/** Groups grades by subject name, keeping the incoming order inside each subject. */
export function groupGradesBySubject<T extends GradeSummaryItem>(grades: T[]) {
  const gradesBySubject = new Map<string, T[]>();

  for (const grade of grades) {
    const subjectName = grade.subjectName?.trim() || "مادة غير محددة";
    const current = gradesBySubject.get(subjectName) ?? [];
    current.push(grade);
    gradesBySubject.set(subjectName, current);
  }

  return Array.from(gradesBySubject.entries()).map(([subjectName, subjectGrades]) => ({
    subjectName,
    grades: subjectGrades,
    average: calculateGradeStats(subjectGrades).average,
  }));
}

export function buildGradeWhatsappSummary(grades: GradeSummaryItem[]) {
  if (grades.length === 0) {
    return "لا توجد درجات مسجلة.";
  }

  return groupGradesBySubject(grades)
    .map(({ subjectName, grades: subjectGrades, average: subjectAverage }) => {
      const entries = subjectGrades
        .map((grade) => {
          const title = grade.title?.trim() || "درجة";
          const percentage = Number.isFinite(Number(grade.percentage))
            ? ` (${Math.round(Number(grade.percentage))}%)`
            : "";

          return `${title}: ${formatGradeValue(grade.score)}/${formatGradeValue(grade.maxScore)}${percentage}`;
        })
        .join("، ");
      const averagePart = subjectGrades.length > 1 && subjectAverage != null ? ` — معدل المادة ${subjectAverage}%` : "";

      return `• ${subjectName}: ${entries}${averagePart}`;
    })
    .join("\n");
}

export function formatGradeValue(value: number) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "-";
  return Number.isInteger(numericValue) ? String(numericValue) : numericValue.toFixed(1);
}

type AttendanceSummaryItem = {
  date: Date;
  status: string;
  statusLabel: string;
  checkInAt: Date | null;
  checkOutAt: Date | null;
  isComputedAbsence?: boolean;
};

/**
 * Builds the per-day attendance lines (status + check-in/check-out times)
 * used inside the WhatsApp summary sent to the guardian.
 * Times come straight from the attendance record so the parent sees the
 * student's daily entry and exit times without needing the PDF file.
 */
export function buildAttendanceWhatsappSummary(attendance: AttendanceSummaryItem[]) {
  if (attendance.length === 0) {
    return "لا توجد سجلات حضور مسجلة خلال الفترة.";
  }

  // Oldest → newest so the guardian reads the days chronologically.
  const sorted = [...attendance].sort(
    (first, second) => first.date.getTime() - second.date.getTime(),
  );

  return sorted
    .slice(0, 30)
    .map((record) => {
      const dateLabel = formatAttendanceShortDate(record.date);
      const statusLabel = record.statusLabel || "غير محدد";
      const checkInLabel = record.checkInAt ? `دخول ${formatAttendanceTime(record.checkInAt, { withSeconds: false })}` : "بدون تسجيل دخول";
      const checkOutLabel = record.checkOutAt ? `انصراف ${formatAttendanceTime(record.checkOutAt, { withSeconds: false })}` : "بدون تسجيل انصراف";

      return `• ${dateLabel} — ${statusLabel} — ${checkInLabel} — ${checkOutLabel}`;
    })
    .join("\n");
}

type ReportAttendanceItem = AttendanceSummaryItem & { id: string };

/**
 * Merge explicit attendance records with computed absences for the report.
 * A computed absence is dropped if the student already has a record that day
 * (defensive — the service already skips those days), and the merged list is
 * sorted newest-first to match the existing table order.
 */
function mergeReportAttendance<T extends ReportAttendanceItem>(explicit: T[], computed: T[]) {
  const explicitDays = new Set(explicit.map((record) => getReportDayKey(record.date)));
  const extras = computed.filter((record) => !explicitDays.has(getReportDayKey(record.date)));

  return [...explicit, ...extras].sort(
    (first, second) => second.date.getTime() - first.date.getTime(),
  );
}

function getReportDayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function calculateAttendanceStats(attendance: { status: string }[]) {
  return attendance.reduce(
    (stats, record) => {
      if (record.status === "present") stats.presentCount += 1;
      else if (record.status === "absent") stats.absentCount += 1;
      else if (record.status === "late") stats.lateCount += 1;
      else stats.otherCount += 1;
      return stats;
    },
    { presentCount: 0, absentCount: 0, lateCount: 0, otherCount: 0 },
  );
}

function calculateFinancialStats(
  payments: { amount: number; remainingAmount: number; isUniformPaid: boolean }[],
  summaryPaid: number,
  summaryPending: number,
) {
  // Use the summary's totalPending (computed correctly by
  // getStudentPaymentSummary as sum of (fee - totalPaidForFee) across
  // all the student's fees). DO NOT sum per-payment remainingAmount —
  // that double-counts installments for the same fee and produces a
  // number larger than the actual fee.
  return {
    totalPaid: summaryPaid,
    totalRemaining: summaryPending,
    uniformPaid: payments.some((payment) => payment.isUniformPaid),
  };
}

export function buildStudentRecommendation(average: number | null, absentCount: number, remainingAmount: number) {
  const recommendations: string[] = [];

  if (average == null) {
    recommendations.push("لا توجد درجات كافية لإصدار حكم دراسي نهائي، يفضّل استكمال إدخال نتائج الامتحانات.");
  } else if (average >= 85) {
    recommendations.push("الأداء الدراسي ممتاز ويُنصح بالاستمرار بنفس مستوى المتابعة.");
  } else if (average >= 60) {
    recommendations.push("الأداء الدراسي مقبول مع حاجة إلى متابعة المواد ذات الدرجات الأقل.");
  } else {
    recommendations.push("الأداء الدراسي يحتاج متابعة قريبة وخطة تقوية واضحة.");
  }

  if (absentCount > 0) {
    recommendations.push(`يوجد ${absentCount} سجل غياب، لذلك يُنصح بمتابعة انتظام الحضور.`);
  }

  if (remainingAmount > 0) {
    recommendations.push(`يوجد مبلغ مالي متبقٍ قدره ${formatMoney(remainingAmount)} ويُفضّل تسويته حسب نظام المدرسة.`);
  }

  if (recommendations.length === 0) {
    return "لا توجد ملاحظات سلبية ظاهرة في البيانات الحالية.";
  }

  return recommendations.join(" ");
}
