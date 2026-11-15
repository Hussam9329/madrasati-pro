
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ElementType, ReactNode } from "react";
import { ArrowRight, Award, Banknote, CalendarDays, FileText, GraduationCap, UserRound } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getTelegramDesktopUrl, getWhatsappUrl } from "@/lib/contact-links";
import { PageHeader } from "@/components/layout/page-header";
import { StudentReportActions } from "@/components/students/student-report-actions";
import { getStudentDetails } from "@/services/student-service";
import {
  buildAttendanceWhatsappSummary,
  buildGradeWhatsappSummary,
  buildStudentRecommendation,
  formatDateInputValue,
  getInclusiveEndDate,
  getStudentReport,
  getStudentReportDateRange,
  normalizeStudentReportPeriod,
} from "@/services/student-report-service";
import { formatMoney } from "@/types/payment";
import { getStudentClassDisplay, getStudentStatusLabel } from "@/types/student";
import { formatAttendanceTime } from "@/types/attendance";

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

  const {
    grades: reportGrades,
    attendance: reportAttendance,
    payments,
    gradeStats,
    attendanceStats,
    financialStats,
  } = await getStudentReport(student, reportDateRange);

  const classDisplay = getStudentClassDisplay({
    className: student.className,
    classLevel: student.classLevel,
    sectionName: student.sectionName,
  });

  const averageLabel = gradeStats.average == null ? "لا توجد درجات" : `${gradeStats.average}%`;
  const attendanceSummary = `${attendanceStats.presentCount} حضور / ${attendanceStats.absentCount} غياب / ${attendanceStats.lateCount} تأخير`;
  const attendanceDetailSummary = buildAttendanceWhatsappSummary(reportAttendance);
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
          studentId={student.id}
          studentName={student.fullName}
          isActiveStudent={student.status === "active"}
          guardianPhone={student.guardianPhone || student.phone}
          guardianTelegram={student.guardianTelegram}
          classDisplay={classDisplay}
          averageLabel={averageLabel}
          gradeSummary={gradeSummary}
          attendanceSummary={attendanceSummary}
          attendanceDetailSummary={attendanceDetailSummary}
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
            <InfoRow label="هاتف الطالب" value={<WhatsappPhoneLink phone={student.phone} />} />
            <InfoRow label="هاتف ولي الأمر" value={<WhatsappPhoneLink phone={student.guardianPhone} />} />
            <InfoRow
              label="تليكرام ولي الأمر"
              value={
                <TelegramDesktopLink username={student.guardianTelegram} />
              }
            />
            <InfoRow label="الصف والشعبة" value={classDisplay} />
            <InfoRow label="تاريخ التسجيل" value={new Date(student.enrollmentDate).toLocaleDateString("ar-IQ-u-nu-latn")} />
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
                <td>{new Date(grade.date).toLocaleDateString("ar-IQ-u-nu-latn")}</td>
              </tr>
            ))}
          </ReportTable>
          </div>

          <div data-report-section="attendance">
          <ReportTable title={`الحضور خلال ${reportDateRange.label}`} empty="لا توجد سجلات حضور خلال الفترة المحددة" headers={["التاريخ", "الحالة", "دخول", "انصراف"]}>
            {reportAttendance.slice(0, 30).map((record) => (
              <tr key={record.id}>
                <td>{new Date(record.date).toLocaleDateString("ar-IQ-u-nu-latn")}</td>
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
                    <td className="p-3">{new Date(payment.createdAt).toLocaleDateString("ar-IQ-u-nu-latn")}</td>
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

function WhatsappPhoneLink({ phone }: { phone?: string | null }) {
  const whatsappUrl = getWhatsappUrl(phone);

  if (!phone || !whatsappUrl) {
    return <span className="font-extrabold text-[var(--app-text)]" dir="ltr">غير مضاف</span>;
  }

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noreferrer"
      className="font-extrabold text-[var(--app-primary)] underline-offset-4 hover:underline"
      dir="ltr"
      title="فتح محادثة واتساب"
    >
      {phone}
    </a>
  );
}

function TelegramDesktopLink({ username }: { username?: string | null }) {
  const telegramUrl = getTelegramDesktopUrl(username);

  if (!telegramUrl) {
    return <span className="font-extrabold text-[var(--app-text)]">غير مضاف</span>;
  }

  return (
    <a
      href={telegramUrl}
      className="font-extrabold text-[var(--app-primary)] underline-offset-4 hover:underline"
      dir="ltr"
      title="فتح المحادثة في Telegram Desktop"
    >
      {username}
    </a>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return <p><span className="font-bold text-[var(--app-text-muted)]">{label}: </span>{typeof value === "string" ? <span className="font-extrabold text-[var(--app-text)]">{value}</span> : value}</p>;
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
