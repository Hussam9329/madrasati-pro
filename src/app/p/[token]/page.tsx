import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ElementType, ReactNode } from "react";
import { Award, Banknote, CalendarCheck, GraduationCap, LogIn, LogOut } from "lucide-react";
import { findStudentByGuardianToken } from "@/services/guardian-link-service";
import {
  DEFAULT_STUDENT_REPORT_PERIOD,
  formatGradeValue,
  getStudentReport,
  getStudentReportDateRange,
  groupGradesBySubject,
} from "@/services/student-report-service";
import { formatMoney } from "@/types/payment";
import {
  formatAttendanceDate,
  formatAttendanceTime,
  getAttendanceStatusBadgeClass,
} from "@/types/attendance";
import type { ReportPeriod } from "@/types/report";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "تقرير الطالب",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

/** Periods a guardian can switch between (no custom range on the public page). */
const GUARDIAN_REPORT_PERIODS: { value: ReportPeriod; label: string }[] = [
  { value: "daily", label: "اليوم" },
  { value: "weekly", label: "هذا الأسبوع" },
  { value: "monthly", label: "هذا الشهر" },
  { value: "semester", label: "فصلي" },
  { value: "annual", label: "سنوي" },
];

const ATTENDANCE_DAYS_LIMIT = 30;

type GuardianReportPageProps = {
  params: Promise<{ token: string }>;
  searchParams?: Promise<{ period?: string }>;
};

export default async function GuardianReportPage({ params, searchParams }: GuardianReportPageProps) {
  const { token } = await params;
  const student = await findStudentByGuardianToken(token);
  if (!student) notFound();

  const requestedPeriod = (await searchParams)?.period;
  const period =
    GUARDIAN_REPORT_PERIODS.find((item) => item.value === requestedPeriod)?.value ??
    DEFAULT_STUDENT_REPORT_PERIOD;
  const range = getStudentReportDateRange(period);

  const { grades, attendance, gradeStats, attendanceStats, financialStats } = await getStudentReport(student, range);
  const subjects = groupGradesBySubject(grades);

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-amber-50 px-4 py-6 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 sm:py-10">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <header className="app-card relative overflow-hidden p-5 sm:p-6">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-indigo-500 via-amber-500 to-indigo-500" />
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-amber-600 text-white shadow-lg shadow-indigo-500/20">
              <GraduationCap size={24} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[var(--app-text-muted)]">ثانوية مارينا الأهلية — تقرير ولي الأمر</p>
              <h1 className="mt-1 truncate text-xl font-extrabold text-[var(--app-text)] sm:text-2xl">{student.fullName}</h1>
              <p className="mt-0.5 text-sm font-semibold text-[var(--app-text-muted)]">{student.classDisplay}</p>
            </div>
          </div>

          <nav aria-label="فترة التقرير" className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {GUARDIAN_REPORT_PERIODS.map((item) => {
              const active = item.value === period;
              return (
                <Link
                  key={item.value}
                  href={`/p/${token}?period=${item.value}`}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "shrink-0 rounded-full border px-4 py-2 text-sm font-extrabold transition",
                    active
                      ? "border-transparent bg-[var(--app-primary)] text-white"
                      : "border-[var(--app-border)] bg-white text-[var(--app-text-muted)] hover:text-[var(--app-primary)]",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <p className="mt-3 text-sm font-semibold text-[var(--app-text-muted)]">
            الفترة: <span className="font-extrabold text-[var(--app-text)]">{range.label}</span>
          </p>
        </header>

        <Section title="الحضور" icon={CalendarCheck}>
          <div className="grid grid-cols-3 gap-2">
            <StatTile label="حضور" value={attendanceStats.presentCount} className="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" />
            <StatTile label="غياب" value={attendanceStats.absentCount} className="bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300" />
            <StatTile label="تأخير" value={attendanceStats.lateCount} className="bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" />
          </div>

          {attendance.length === 0 ? (
            <EmptyLine>لا توجد سجلات حضور خلال هذه الفترة.</EmptyLine>
          ) : (
            <ul className="mt-4 divide-y divide-[var(--app-border-soft)]">
              {attendance.slice(0, ATTENDANCE_DAYS_LIMIT).map((record) => (
                <li key={record.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`badge ${getAttendanceStatusBadgeClass(record.status)}`}>{record.statusLabel}</span>
                    <span className="text-sm font-bold text-[var(--app-text)]">{formatAttendanceDate(record.date)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold text-[var(--app-text-muted)]">
                    <span className="inline-flex items-center gap-1">
                      <LogIn size={14} aria-hidden />
                      دخول {record.checkInAt ? formatAttendanceTime(record.checkInAt, { withSeconds: false }) : "-"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <LogOut size={14} aria-hidden />
                      انصراف {record.checkOutAt ? formatAttendanceTime(record.checkOutAt, { withSeconds: false }) : "-"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section
          title="الدرجات"
          icon={Award}
          aside={
            <span className="badge badge-info">
              المعدل: {gradeStats.average == null ? "-" : `${gradeStats.average}%`}
            </span>
          }
        >
          {subjects.length === 0 ? (
            <EmptyLine>لا توجد درجات مسجلة خلال هذه الفترة.</EmptyLine>
          ) : (
            <div className="flex flex-col gap-3">
              {subjects.map((subject) => (
                <div key={subject.subjectName} className="rounded-2xl border border-[var(--app-border-soft)] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-extrabold text-[var(--app-text)]">{subject.subjectName}</h3>
                    {subject.average != null ? (
                      <span className="text-sm font-extrabold text-[var(--app-primary)]">{subject.average}%</span>
                    ) : null}
                  </div>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {subject.grades.map((grade) => (
                      <li key={grade.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="min-w-0 truncate font-semibold text-[var(--app-text-muted)]">{grade.title?.trim() || "درجة"}</span>
                        <span className="shrink-0 font-extrabold text-[var(--app-text)]" dir="ltr">
                          {formatGradeValue(grade.score)} / {formatGradeValue(grade.maxScore)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="الأقساط" icon={Banknote}>
          <div className="grid grid-cols-2 gap-2">
            <StatTile label="المدفوع" value={formatMoney(financialStats.totalPaid)} className="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" />
            <StatTile label="المتبقي" value={formatMoney(financialStats.totalRemaining)} className="bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300" />
          </div>
        </Section>

        <p className="px-2 pb-4 text-center text-xs leading-6 text-[var(--app-text-muted)]">
          تُعرض هنا آخر المعلومات المسجلة في المدرسة في كل مرة تفتح الرابط.
          <br />
          هذا الرابط خاص بولي أمر الطالب، يرجى عدم مشاركته.
        </p>
      </div>
    </main>
  );
}

function Section({ title, icon: Icon, aside, children }: { title: string; icon: ElementType; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="app-card p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
            <Icon size={18} />
          </div>
          <h2 className="text-lg font-extrabold text-[var(--app-text)]">{title}</h2>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

function StatTile({ label, value, className }: { label: string; value: ReactNode; className: string }) {
  return (
    <div className={`rounded-2xl px-3 py-3 text-center ${className}`}>
      <p className="text-xs font-bold opacity-80">{label}</p>
      <p className="mt-1 text-lg font-extrabold">{value}</p>
    </div>
  );
}

function EmptyLine({ children }: { children: ReactNode }) {
  return <p className="mt-4 text-center text-sm font-semibold text-[var(--app-text-muted)]">{children}</p>;
}
