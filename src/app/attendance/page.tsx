export const dynamic = 'force-dynamic';
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  CheckCircle2,
  CheckSquare,
  Clock,
  ClipboardList,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  XCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SmartAlert } from "@/components/shared/smart-alert";
import {
  createAttendanceRecord,
  deleteAttendanceRecord,
  getAttendanceCounts,
  getAttendanceRecords,
} from "@/services/attendance-service";
import { getSections } from "@/services/class-service";
import { getStudents } from "@/services/student-service";
import { getSchedules } from "@/services/schedule-service";
import {
  ATTENDANCE_STATUSES,
  calculateAttendanceRate,
  formatAttendanceShortDate,
  getAttendanceStatusBadgeClass,
  type AttendanceFormInput,
  type AttendanceListItem,
} from "@/types/attendance";
import type { SectionListItem } from "@/types/class";
import type { ScheduleListItem } from "@/types/schedule";

type AttendancePageProps = {
  searchParams?: {
    q?: string;
    status?: string;
    date?: string;
    saved?: string;
    deleted?: string;
    error?: string;
  };
};

export default async function AttendancePage({
  searchParams,
}: AttendancePageProps) {
  const query = searchParams?.q?.trim() ?? "";
  const status = searchParams?.status?.trim() ?? "";
  const date = searchParams?.date?.trim() ?? "";

  const [records, sections, schedules, counts, students] = await Promise.all([
    getAttendanceRecords({
      query,
      status,
      date,
    }),
    getSections(),
    getSchedules(),
    getAttendanceCounts(),
    getStudents(),
  ]);

  const activeSections = sections.filter((s) => s.isActive);
  const hasRecords = counts.total > 0;

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-[1350px] flex-col gap-6">
        <PageHeader
          title="الحضور والغياب"
          description="سجّل حضور وغياب الطلاب يوميًا، وتابع الإحصائيات والنسب المئوية لكل صف وطالب."
          icon="attendance"
          badge="الخطوة السادسة"
        />

        <AttendanceFeedback
          saved={searchParams?.saved}
          deleted={searchParams?.deleted}
          error={searchParams?.error}
        />

        <SmartAlert
          tone="info"
          title="الحضور يعتمد على الطلاب داخل الصفوف"
          description="اختر الشعبة والتاريخ، ثم سجّل حالة كل طالب. يمكنك أيضًا ربط الحضور بحصة معينة من الجدول."
          actionLabel="إدارة الطلاب"
          actionHref="/students"
        />

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <AttendanceCreateForm
            sections={activeSections}
            schedules={schedules}
            students={students}
          />

          <div className="flex flex-col gap-6">
            <AttendanceStats
              total={counts.total}
              present={counts.present}
              absent={counts.absent}
              late={counts.late}
              excused={counts.excused}
            />

            <AttendanceSearchForm query={query} status={status} date={date} />
          </div>
        </section>

        {!hasRecords ? (
          <EmptyState
            icon="attendance"
            title="لا توجد سجلات حضور بعد"
            description="اختر الشعبة والتاريخ، ثم سجّل حالة كل طالب: حاضر، غائب، متأخر، أو مجاز."
            actionLabel="تسجيل حضور اليوم"
            actionHref="#attendance-form"
            secondaryLabel="إدارة الطلاب"
            secondaryHref="/students"
          />
        ) : records.length === 0 ? (
          <EmptyState
            icon="search"
            title="لا توجد نتائج مطابقة"
            description="جرّب البحث باسم الطالب، أو غيّر فلتر الحالة أو التاريخ."
            actionLabel="عرض كل السجلات"
            actionHref="/attendance"
          />
        ) : (
          <AttendanceList records={records} />
        )}
      </div>
    </AppShell>
  );
}

async function createAttendanceAction(formData: FormData) {
  "use server";

  const input: AttendanceFormInput = {
    date: String(formData.get("date") ?? new Date().toISOString().split("T")[0]),
    status: String(formData.get("status") ?? "present"),
    notes: String(formData.get("notes") ?? ""),
    studentId: String(formData.get("studentId") ?? ""),
    scheduleId: String(formData.get("scheduleId") ?? ""),
  };

  const result = await createAttendanceRecord(input);

  if (!result.ok) {
    redirect("/attendance?error=create");
  }

  revalidatePath("/");
  revalidatePath("/attendance");
  redirect("/attendance?saved=1");
}

async function deleteAttendanceAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");

  if (!id) {
    redirect("/attendance?error=missing-id");
  }

  const result = await deleteAttendanceRecord(id);

  if (!result.ok) {
    redirect("/attendance?error=delete");
  }

  revalidatePath("/");
  revalidatePath("/attendance");
  redirect("/attendance?deleted=1");
}

// ─── Feedback ────────────────────────────────────────────────────

type AttendanceFeedbackProps = {
  saved?: string;
  deleted?: string;
  error?: string;
};

function AttendanceFeedback({ saved, deleted, error }: AttendanceFeedbackProps) {
  if (saved === "1") {
    return (
      <SmartAlert
        tone="success"
        title="تم تسجيل الحضور بنجاح"
        description="تم حفظ سجل الحضور للطالب المحدد."
      />
    );
  }

  if (deleted === "1") {
    return (
      <SmartAlert
        tone="success"
        title="تم حذف سجل الحضور"
        description="تم حذف سجل الحضور من النظام."
      />
    );
  }

  if (error) {
    const description =
      error === "delete"
        ? "لا يمكن حذف سجل الحضور. حاول مرة أخرى."
        : error === "missing-id"
          ? "معرّف سجل الحضور مطلوب."
          : "تأكد من إدخال البيانات بشكل صحيح، وأن الطالب مسجل في النظام.";

    return (
      <SmartAlert
        tone="warning"
        title="لم تكتمل العملية"
        description={description}
      />
    );
  }

  return null;
}

// ─── Create Form ─────────────────────────────────────────────────

type AttendanceCreateFormProps = {
  sections: SectionListItem[];
  schedules: ScheduleListItem[];
  students: { id: string; fullName: string; studentCode: string | null; sectionId: string | null }[];
};

function AttendanceCreateForm({
  sections,
  schedules,
  students,
}: AttendanceCreateFormProps) {
  const today = new Date().toISOString().split("T")[0];

  return (
    <form
      id="attendance-form"
      action={createAttendanceAction}
      className="app-card overflow-hidden"
    >
      <div className="border-b border-[var(--app-border-soft)] bg-gradient-to-l from-indigo-50/40 to-violet-50/20 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700">
            <CheckSquare size={24} />
          </div>

          <div>
            <h3 className="text-xl font-extrabold text-[var(--app-text)]">
              تسجيل حضور
            </h3>

            <p className="mt-1 text-sm leading-7 text-[var(--app-text-muted)]">
              اختر الطالب والتاريخ وحالة الحضور. يمكنك ربط السجل بحصة من الجدول اختياريًا.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="date"
              className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
            >
              تاريخ الحضور <span className="text-red-600">*</span>
            </label>

            <input
              id="date"
              name="date"
              type="date"
              required
              defaultValue={today}
              className="input"
            />
          </div>

          <div>
            <label
              htmlFor="status"
              className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
            >
              حالة الحضور <span className="text-red-600">*</span>
            </label>

            <select id="status" name="status" defaultValue="present" className="input">
              {ATTENDANCE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="studentId"
              className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
            >
              الطالب <span className="text-red-600">*</span>
            </label>

            <select id="studentId" name="studentId" required defaultValue="" className="input">
              <option value="">اختر الطالب</option>

              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.fullName}
                  {student.studentCode ? ` (${student.studentCode})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="scheduleId"
              className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
            >
              الحصة (اختياري)
            </label>

            <select id="scheduleId" name="scheduleId" defaultValue="" className="input">
              <option value="">بدون حصة محددة</option>

              {schedules.map((schedule) => (
                <option key={schedule.id} value={schedule.id}>
                  {schedule.subjectName} - {schedule.dayLabel}{" "}
                  {schedule.startTime}-{schedule.endTime} ({schedule.teacherName})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="notes"
            className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
          >
            ملاحظات
          </label>

          <textarea
            id="notes"
            name="notes"
            rows={3}
            maxLength={500}
            placeholder="أي ملاحظات إضافية..."
            className="input min-h-[95px] resize-y leading-7"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-[var(--app-border-soft)] bg-gradient-to-l from-indigo-50/30 to-violet-50/20 p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-7 text-[var(--app-text-muted)]">
          بعد تسجيل الحضور، يظهر السجل في القائمة أدناه مع الإحصائيات.
        </p>

        <button type="submit" className="btn btn-primary">
          <CheckCircle2 size={18} />
          تسجيل الحضور
        </button>
      </div>
    </form>
  );
}

// ─── Stats ───────────────────────────────────────────────────────

type AttendanceStatsProps = {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
};

function AttendanceStats({
  total,
  present,
  absent,
  late,
  excused,
}: AttendanceStatsProps) {
  const rate = calculateAttendanceRate({ present, absent, late, excused });

  const stats = [
    {
      label: "إجمالي السجلات",
      value: total,
      icon: ClipboardList,
      className: "bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700",
    },
    {
      label: "حاضرون",
      value: present,
      icon: CheckCircle2,
      className: "bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700",
    },
    {
      label: "غائبون",
      value: absent,
      icon: XCircle,
      className: "bg-gradient-to-br from-red-100 to-rose-100 text-red-700",
    },
    {
      label: "متأخرون",
      value: late,
      icon: Clock,
      className: "bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700",
    },
    {
      label: "مجازون",
      value: excused,
      icon: ShieldCheck,
      className: "bg-gradient-to-br from-sky-100 to-cyan-100 text-sky-700",
    },
    {
      label: "نسبة الحضور",
      value: `${rate}%`,
      icon: CheckSquare,
      className: "bg-teal-100 text-teal-700",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div key={stat.label} className="app-card app-card-hover p-5">
            <div className="flex items-center gap-4">
              <div
                className={[
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                  stat.className,
                ].join(" ")}
              >
                <Icon size={22} />
              </div>

              <div>
                <p className="text-sm font-bold text-[var(--app-text-muted)]">
                  {stat.label}
                </p>

                <p className="mt-1 text-3xl font-extrabold text-[var(--app-text)]">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Search ──────────────────────────────────────────────────────

type AttendanceSearchFormProps = {
  query: string;
  status: string;
  date: string;
};

function AttendanceSearchForm({
  query,
  status,
  date,
}: AttendanceSearchFormProps) {
  return (
    <form action="/attendance" className="app-card p-5">
      <label
        htmlFor="q"
        className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
      >
        البحث والتصفية
      </label>

      <div className="grid gap-3 md:grid-cols-[1fr_160px_160px_auto]">
        <div className="relative">
          <Search
            size={18}
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--app-text-soft)]"
          />

          <input
            id="q"
            name="q"
            defaultValue={query}
            placeholder="اسم الطالب، المادة، المدرس..."
            className="input pr-11"
          />
        </div>

        <select name="status" defaultValue={status} className="input">
          <option value="">كل الحالات</option>
          {ATTENDANCE_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <input
          name="date"
          type="date"
          defaultValue={date}
          className="input"
          placeholder="التاريخ"
        />

        <button type="submit" className="btn btn-secondary">
          بحث
        </button>
      </div>
    </form>
  );
}

// ─── List ────────────────────────────────────────────────────────

type AttendanceListProps = {
  records: AttendanceListItem[];
};

function AttendanceList({ records }: AttendanceListProps) {
  return (
    <section className="app-card overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-[var(--app-border-soft)] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-extrabold text-[var(--app-text)]">
            سجلات الحضور
          </h3>

          <p className="mt-1 text-sm leading-6 text-[var(--app-text-muted)]">
            تابع سجلات الحضور والغياب لكل طالب مع التفاصيل الكاملة.
          </p>
        </div>

        <span className="badge badge-info">{records.length} سجل</span>
      </div>

      <div className="divide-y divide-[var(--app-border-soft)]">
        {records.map((record) => (
          <AttendanceRow key={record.id} record={record} />
        ))}
      </div>
    </section>
  );
}

type AttendanceRowProps = {
  record: AttendanceListItem;
};

function AttendanceRow({ record }: AttendanceRowProps) {
  const statusClass = getAttendanceStatusBadgeClass(record.status);

  return (
    <article className="grid gap-4 p-5 transition hover:bg-indigo-50/40 xl:grid-cols-[1fr_auto] xl:items-center">
      <div className="flex min-w-0 gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700">
          <UserRound size={25} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-lg font-extrabold text-[var(--app-text)]">
              {record.studentName}
            </h4>

            <span className={["badge", statusClass].join(" ")}>
              {record.statusLabel}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-2 text-sm text-[var(--app-text-muted)]">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-bold">
              <CheckSquare size={14} />
              {formatAttendanceShortDate(new Date(record.date))}
            </span>

            {record.studentCode ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-bold">
                {record.studentCode}
              </span>
            ) : null}

            {record.className ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-bold">
                {record.className}
                {record.sectionName ? ` / ${record.sectionName}` : ""}
              </span>
            ) : null}
          </div>

          <div className="mt-3 grid gap-2 text-sm leading-6 text-[var(--app-text-muted)] md:grid-cols-2">
            {record.subjectName ? (
              <p>
                المادة:{" "}
                <span className="font-bold text-[var(--app-text)]">
                  {record.subjectName}
                </span>
              </p>
            ) : null}

            {record.teacherName ? (
              <p>
                المدرس:{" "}
                <span className="font-bold text-[var(--app-text)]">
                  {record.teacherName}
                </span>
              </p>
            ) : null}

            {record.dayOfWeek ? (
              <p>
                اليوم:{" "}
                <span className="font-bold text-[var(--app-text)]">
                  {record.dayOfWeek === "saturday"
                    ? "السبت"
                    : record.dayOfWeek === "sunday"
                      ? "الأحد"
                      : record.dayOfWeek === "monday"
                        ? "الاثنين"
                        : record.dayOfWeek === "tuesday"
                          ? "الثلاثاء"
                          : record.dayOfWeek === "wednesday"
                            ? "الأربعاء"
                            : record.dayOfWeek === "thursday"
                              ? "الخميس"
                              : record.dayOfWeek === "friday"
                                ? "الجمعة"
                                : record.dayOfWeek}
                </span>
              </p>
            ) : null}

            {record.startTime && record.endTime ? (
              <p>
                الوقت:{" "}
                <span className="font-bold text-[var(--app-text)]">
                  {record.startTime} - {record.endTime}
                </span>
              </p>
            ) : null}
          </div>

          {record.notes ? (
            <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">
              ملاحظات:{" "}
              <span className="font-bold text-[var(--app-text)]">
                {record.notes}
              </span>
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-1 xl:w-[160px]">
        <form action={deleteAttendanceAction}>
          <input type="hidden" name="id" value={record.id} />

          <button
            type="submit"
            className="btn w-full border-red-100 bg-gradient-to-r from-red-50 to-rose-50 text-red-700 hover:from-red-100 hover:to-rose-100"
          >
            <Trash2 size={17} />
            حذف
          </button>
        </form>
      </div>
    </article>
  );
}
