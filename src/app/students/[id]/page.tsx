
import { notFound } from "next/navigation";
import { ArrowRight, Banknote, CalendarCheck, GraduationCap, UserRound } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { safeQuery } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { StudentReportActions } from "@/components/students/student-report-actions";
import { getStudentDetails } from "@/services/student-service";
import { getGradesByStudentId } from "@/services/grade-service";
import { getAttendanceByStudentId } from "@/services/attendance-service";
import { getPaymentsByStudentId, getStudentPaymentSummary } from "@/services/payment-service";
import { formatMoney } from "@/types/payment";
import { getStudentClassDisplay, getStudentStatusLabel } from "@/types/student";

export const dynamic = "force-dynamic";


export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const student = await getStudentDetails(id);
  if (!student) notFound();

  const [grades, attendance, payments, paymentSummary] = await Promise.all([
    safeQuery(() => getGradesByStudentId(id), []),
    safeQuery(() => getAttendanceByStudentId(id), []),
    safeQuery(() => getPaymentsByStudentId(id), []),
    safeQuery(() => getStudentPaymentSummary(id), { totalPaid: 0, totalPending: 0, totalRefunded: 0, paymentsCount: 0 }),
  ]);

  const classDisplay = getStudentClassDisplay({
    className: student.className,
    classLevel: student.classLevel,
    sectionName: student.sectionName,
  });

  const average = grades.length > 0
    ? Math.round(grades.reduce((sum, grade) => sum + (Number(grade.score) / Math.max(1, Number(grade.maxScore))) * 100, 0) / grades.length)
    : null;

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 print:max-w-none print:gap-4">
        <div className="print:hidden">
          <a href="/students" className="inline-flex items-center gap-2 text-sm font-extrabold text-[var(--app-text-muted)] hover:text-[var(--app-primary)]">
            <ArrowRight size={16} />
            العودة إلى الطلاب
          </a>
        </div>

        <PageHeader
          title={`ملف الطالب: ${student.fullName}`}
          description="تقرير موحد يجمع البيانات الدراسية والمالية والحضور مع إمكانية الطباعة أو الحفظ PDF."
          icon="students"
          badge="ملف الطالب"
        />

        <StudentReportActions studentName={student.fullName} guardianPhone={student.guardianPhone || student.phone} />

        <section className="grid gap-4 md:grid-cols-4 print:grid-cols-4">
          <SummaryCard title="الصف" value={classDisplay} icon={GraduationCap} />
          <SummaryCard title="الحالة" value={getStudentStatusLabel(student.status)} icon={UserRound} />
          <SummaryCard title="المعدل" value={average == null ? "لا توجد درجات" : `${average}%`} icon={GraduationCap} />
          <SummaryCard title="المدفوع" value={formatMoney(paymentSummary.totalPaid)} icon={Banknote} />
        </section>

        <section className="app-card p-6">
          <h3 className="mb-4 text-xl font-extrabold text-[var(--app-text)]">البيانات الأساسية</h3>
          <div className="grid gap-3 text-sm leading-7 md:grid-cols-2">
            <InfoRow label="اسم الطالب" value={student.fullName} />
            <InfoRow label="رمز الطالب" value={student.studentCode || "غير مضاف"} />
            <InfoRow label="هاتف الطالب" value={student.phone || "غير مضاف"} />
            <InfoRow label="هاتف ولي الأمر" value={student.guardianPhone || "غير مضاف"} />
            <InfoRow label="الصف والشعبة" value={classDisplay} />
            <InfoRow label="تاريخ التسجيل" value={new Date(student.enrollmentDate).toLocaleDateString("ar-IQ")} />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <ReportTable title="الدرجات" empty="لا توجد درجات مسجلة" headers={["المادة", "الامتحان", "الدرجة", "التاريخ"]}>
            {grades.slice(0, 30).map((grade) => (
              <tr key={grade.id}>
                <td>{grade.subjectName}</td>
                <td>{grade.title}</td>
                <td>{grade.score} / {grade.maxScore}</td>
                <td>{new Date(grade.date).toLocaleDateString("ar-IQ")}</td>
              </tr>
            ))}
          </ReportTable>

          <ReportTable title="الحضور" empty="لا توجد سجلات حضور" headers={["التاريخ", "الحالة", "دخول", "انصراف"]}>
            {attendance.slice(0, 30).map((record) => (
              <tr key={record.id}>
                <td>{new Date(record.date).toLocaleDateString("ar-IQ")}</td>
                <td>{record.statusLabel}</td>
                <td>{record.checkInAt ? new Date(record.checkInAt).toLocaleTimeString("ar-IQ") : "-"}</td>
                <td>{record.checkOutAt ? new Date(record.checkOutAt).toLocaleTimeString("ar-IQ") : "-"}</td>
              </tr>
            ))}
          </ReportTable>
        </section>

        <section className="app-card overflow-hidden">
          <div className="border-b border-[var(--app-border-soft)] p-6">
            <h3 className="text-xl font-extrabold text-[var(--app-text)]">التقرير المالي</h3>
            <p className="mt-1 text-sm text-[var(--app-text-muted)]">المدفوع: {formatMoney(paymentSummary.totalPaid)} — المتبقي/المعلق: {formatMoney(paymentSummary.totalPending)}</p>
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
      </div>
    </AppShell>
  );
}

function SummaryCard({ title, value, icon: Icon }: { title: string; value: string; icon: React.ElementType }) {
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

function ReportTable({ title, empty, headers, children }: { title: string; empty: string; headers: string[]; children: React.ReactNode }) {
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
