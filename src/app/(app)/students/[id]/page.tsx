
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ElementType, ReactNode } from "react";
import { ArrowRight, Award, Banknote, CalendarDays, FileText, GraduationCap, UserRound } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { safeQuery } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { StudentReportActions } from "@/components/students/student-report-actions";
import { getStudentDetails } from "@/services/student-service";
import { getGradesByStudentId } from "@/services/grade-service";
import { getAttendanceByStudentId } from "@/services/attendance-service";
import { getPaymentsByStudentId, getStudentPaymentSummary } from "@/services/payment-service";
import { formatMoney } from "@/types/payment";
import { getStudentClassDisplay, getStudentStatusLabel } from "@/types/student";
import { formatAttendanceTime } from "@/types/attendance";
import {
  formatReportDate,
  getReportDateRange,
  parseReportDate,
  type ReportDateRange,
  type ReportPeriod,
} from "@/types/report";

export const dynamic = "force-dynamic";


type StudentProfilePageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    period?: string;
    fromDate?: string;
    toDate?: string;
  }>;
};

export default async function StudentProfilePage({ params, searchParams }: StudentProfilePageProps) {
  await requireAdmin();
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const reportPeriod = normalizeStudentReportPeriod(resolvedSearchParams?.period);
  const reportDateRange = getStudentReportDateRange(
    reportPeriod,
    resolvedSearchParams?.fromDate,
    resolvedSearchParams?.toDate,
  );

  const student = await getStudentDetails(id);
  if (!student) notFound();

  const [grades, attendance, payments, paymentSummary] = await Promise.all([
    safeQuery(() => getGradesByStudentId(id), []),
    safeQuery(() => getAttendanceByStudentId(id), []),
    safeQuery(() => getPaymentsByStudentId(id), []),
    safeQuery(() => getStudentPaymentSummary(id), { totalPaid: 0, totalPending: 0, totalRefunded: 0, paymentsCount: 0 }),
  ]);

  const reportGrades = filterItemsByReportRange(grades, (grade) => grade.date, reportDateRange);
  const reportAttendance = filterItemsByReportRange(attendance, (record) => record.date, reportDateRange);

  const classDisplay = getStudentClassDisplay({
    className: student.className,
    classLevel: student.classLevel,
    sectionName: student.sectionName,
  });

  const gradeStats = calculateGradeStats(reportGrades);
  const attendanceStats = calculateAttendanceStats(reportAttendance);
  const financialStats = calculateFinancialStats(payments, paymentSummary.totalPaid);
  const averageLabel = gradeStats.average == null ? "لا توجد درجات" : `${gradeStats.average}%`;
  const attendanceSummary = `${attendanceStats.presentCount} حضور / ${attendanceStats.absentCount} غياب / ${attendanceStats.lateCount} تأخير`;
  const financialSummary = `مدفوع ${formatMoney(financialStats.totalPaid)} — متبقّي ${formatMoney(financialStats.totalRemaining)} — الزي ${financialStats.uniformPaid ? "مدفوع" : "غير مدفوع"}`;
  const gradeSummary = buildGradeWhatsappSummary(reportGrades);
  const reportFromDate = formatDateInputValue(reportDateRange.from);
  const reportToDate = formatDateInputValue(getInclusiveEndDate(reportDateRange));

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 print:max-w-none print:gap-4">
        <div className="print:hidden">
          <Link href="/students" className="inline-flex items-center gap-2 text-sm font-extrabold text-[var(--app-text-muted)] hover:text-[var(--app-primary)]">
            <ArrowRight size={16} />
            العودة إلى الطلاب
          </Link>
        </div>

        <PageHeader
          title={`ملف الطالب: ${student.fullName}`}
          description="تقرير موحد يجمع البيانات الدراسية والمالية والحضور مع إمكانية الطباعة أو الحفظ PDF."
          icon="students"
          badge="ملف الطالب"
        />

        <StudentReportActions
          studentName={student.fullName}
          guardianPhone={student.guardianPhone || student.phone}
          guardianTelegram={student.guardianTelegram}
          classDisplay={classDisplay}
          averageLabel={averageLabel}
          gradeSummary={gradeSummary}
          attendanceSummary={attendanceSummary}
          financialSummary={financialSummary}
          reportPeriod={reportPeriod}
          reportFromDate={reportFromDate}
          reportToDate={reportToDate}
          reportRangeLabel={reportDateRange.label}
        />

        <section data-report-section="summary" className="grid gap-4 md:grid-cols-5 print:grid-cols-5">
          <SummaryCard title="فترة التقرير" value={reportDateRange.label} icon={CalendarDays} />
          <SummaryCard title="الصف" value={classDisplay} icon={GraduationCap} />
          <SummaryCard title="الحالة" value={getStudentStatusLabel(student.status)} icon={UserRound} />
          <SummaryCard title="المعدل" value={averageLabel} icon={Award} />
          <SummaryCard title="المتبقي" value={formatMoney(financialStats.totalRemaining)} icon={Banknote} />
        </section>

        <section data-report-section="basic" className="app-card p-6">
          <h3 className="mb-4 text-xl font-extrabold text-[var(--app-text)]">البيانات الأساسية</h3>
          <div className="grid gap-3 text-sm leading-7 md:grid-cols-2">
            <InfoRow label="اسم الطالب" value={student.fullName} />
            <InfoRow label="رمز الطالب" value={student.studentCode || "غير مضاف"} />
            <InfoRow label="هاتف الطالب" value={student.phone || "غير مضاف"} />
            <InfoRow label="هاتف ولي الأمر" value={student.guardianPhone || "غير مضاف"} />
            <InfoRow label="تليكرام ولي الأمر" value={student.guardianTelegram || "غير مضاف"} />
            <InfoRow label="الصف والشعبة" value={classDisplay} />
            <InfoRow label="تاريخ التسجيل" value={new Date(student.enrollmentDate).toLocaleDateString("ar-IQ")} />
            <InfoRow label="فترة التقرير" value={reportDateRange.label} />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div data-report-section="academic">
          <ReportTable title={`الدرجات خلال ${reportDateRange.label}`} empty="لا توجد درجات مسجلة خلال الفترة المحددة" headers={["المادة", "الامتحان", "الدرجة", "النسبة", "التاريخ"]}>
            {reportGrades.slice(0, 30).map((grade) => (
              <tr key={grade.id}>
                <td>{grade.subjectName}</td>
                <td>{grade.title}</td>
                <td>{grade.score} / {grade.maxScore}</td>
                <td>{grade.percentage}%</td>
                <td>{new Date(grade.date).toLocaleDateString("ar-IQ")}</td>
              </tr>
            ))}
          </ReportTable>
          </div>

          <div data-report-section="attendance">
          <ReportTable title={`الحضور خلال ${reportDateRange.label}`} empty="لا توجد سجلات حضور خلال الفترة المحددة" headers={["التاريخ", "الحالة", "دخول", "انصراف"]}>
            {reportAttendance.slice(0, 30).map((record) => (
              <tr key={record.id}>
                <td>{new Date(record.date).toLocaleDateString("ar-IQ")}</td>
                <td>{record.statusLabel}</td>
                <td>{record.checkInAt ? formatAttendanceTime(record.checkInAt) : "-"}</td>
                <td>{record.checkOutAt ? formatAttendanceTime(record.checkOutAt) : "-"}</td>
              </tr>
            ))}
          </ReportTable>
          </div>
        </section>

        <section data-report-section="financial" className="app-card overflow-hidden">
          <div className="border-b border-[var(--app-border-soft)] p-6">
            <h3 className="text-xl font-extrabold text-[var(--app-text)]">التقرير المالي</h3>
            <p className="mt-1 text-sm text-[var(--app-text-muted)]">المدفوع: {formatMoney(financialStats.totalPaid)} — المتبقي: {formatMoney(financialStats.totalRemaining)} — الزي: {financialStats.uniformPaid ? "مدفوع" : "غير مدفوع"}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-50 text-[var(--app-text-muted)]">
                <tr>
                  <th className="p-3 text-right">الرسم</th>
                  <th className="p-3 text-right">النوع</th>
                  <th className="p-3 text-right">المدفوع</th>
                  <th className="p-3 text-right">المتبقي</th>
                  <th className="p-3 text-right">الزي</th>
                  <th className="p-3 text-right">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--app-border-soft)]">
                {payments.length === 0 ? (
                  <tr><td colSpan={6} className="p-6 text-center text-[var(--app-text-muted)]">لا توجد دفعات مسجلة</td></tr>
                ) : payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="p-3 font-bold">{payment.feeTitle}</td>
                    <td className="p-3">{payment.feeTypeLabel}</td>
                    <td className="p-3">{payment.formattedAmount}</td>
                    <td className="p-3">{payment.formattedRemainingAmount}</td>
                    <td className="p-3">{payment.isUniformPaid ? "صح" : "غلط"}</td>
                    <td className="p-3">{new Date(payment.createdAt).toLocaleDateString("ar-IQ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section data-report-section="notes" className="app-card p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-[var(--app-text)]">ملاحظات وتوصيات التقرير</h3>
              <p className="mt-2 text-sm leading-7 text-[var(--app-text-muted)]">
                {buildStudentRecommendation(gradeStats.average, attendanceStats.absentCount, financialStats.totalRemaining)}
              </p>
            </div>
          </div>
        </section>
      </div>
  );
}

const STUDENT_REPORT_PERIODS: ReportPeriod[] = [
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "semester",
  "annual",
  "custom",
];

function normalizeStudentReportPeriod(value?: string): ReportPeriod {
  return STUDENT_REPORT_PERIODS.includes(value as ReportPeriod)
    ? (value as ReportPeriod)
    : "weekly";
}

function getStudentReportDateRange(
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

function getInclusiveEndDate(range: ReportDateRange) {
  const date = new Date(range.to);
  date.setDate(date.getDate() - 1);
  return date;
}

function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function SummaryCard({ title, value, icon: Icon }: { title: string; value: string; icon: ElementType }) {
  return (
    <div className="app-card p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
          <Icon size={20} />
        </div>
        <div>
          <p className="text-xs font-bold text-[var(--app-text-muted)]">{title}</p>
          <p className="mt-1 text-base font-extrabold text-[var(--app-text)]">{value}</p>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <p><span className="font-bold text-[var(--app-text-muted)]">{label}: </span><span className="font-extrabold text-[var(--app-text)]">{value}</span></p>;
}

function ReportTable({ title, empty, headers, children }: { title: string; empty: string; headers: string[]; children: ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <div className="app-card overflow-hidden">
      <div className="border-b border-[var(--app-border-soft)] p-5">
        <h3 className="text-lg font-extrabold text-[var(--app-text)]">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="bg-slate-50 text-[var(--app-text-muted)]"><tr>{headers.map((header) => <th key={header} className="p-3 text-right">{header}</th>)}</tr></thead>
          <tbody className="divide-y divide-[var(--app-border-soft)]">
            {hasChildren ? children : <tr><td colSpan={headers.length} className="p-6 text-center text-[var(--app-text-muted)]">{empty}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function calculateGradeStats(grades: { score: number; maxScore: number }[]) {
  if (grades.length === 0) {
    return { average: null as number | null, successCount: 0, failedCount: 0 };
  }

  const percentages = grades.map((grade) => (Number(grade.score) / Math.max(1, Number(grade.maxScore))) * 100);
  const average = Math.round(percentages.reduce((sum, value) => sum + value, 0) / percentages.length);
  const successCount = percentages.filter((value) => value >= 50).length;

  return { average, successCount, failedCount: grades.length - successCount };
}

type WhatsappGradeSummaryItem = {
  subjectName?: string | null;
  title?: string | null;
  score: number;
  maxScore: number;
  percentage?: number | null;
};

function buildGradeWhatsappSummary(grades: WhatsappGradeSummaryItem[]) {
  if (grades.length === 0) {
    return "لا توجد درجات مسجلة.";
  }

  const gradesBySubject = new Map<string, WhatsappGradeSummaryItem[]>();

  for (const grade of grades) {
    const subjectName = grade.subjectName?.trim() || "مادة غير محددة";
    const current = gradesBySubject.get(subjectName) ?? [];
    current.push(grade);
    gradesBySubject.set(subjectName, current);
  }

  return Array.from(gradesBySubject.entries())
    .map(([subjectName, subjectGrades]) => {
      const entries = subjectGrades
        .map((grade) => {
          const title = grade.title?.trim() || "درجة";
          const percentage = Number.isFinite(Number(grade.percentage))
            ? ` (${Math.round(Number(grade.percentage))}%)`
            : "";

          return `${title}: ${formatGradeValue(grade.score)}/${formatGradeValue(grade.maxScore)}${percentage}`;
        })
        .join("، ");
      const subjectAverage = calculateGradeStats(subjectGrades).average;
      const averagePart = subjectGrades.length > 1 && subjectAverage != null ? ` — معدل المادة ${subjectAverage}%` : "";

      return `• ${subjectName}: ${entries}${averagePart}`;
    })
    .join("\n");
}

function formatGradeValue(value: number) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "-";
  return Number.isInteger(numericValue) ? String(numericValue) : numericValue.toFixed(1);
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

function calculateFinancialStats(payments: { amount: number; remainingAmount: number; isUniformPaid: boolean }[], summaryPaid: number) {
  return {
    totalPaid: summaryPaid,
    totalRemaining: payments.reduce((sum, payment) => sum + Number(payment.remainingAmount || 0), 0),
    uniformPaid: payments.some((payment) => payment.isUniformPaid),
  };
}

function buildStudentRecommendation(average: number | null, absentCount: number, remainingAmount: number) {
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
