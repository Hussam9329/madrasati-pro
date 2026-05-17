import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  CheckCircle2,
  CheckSquare,
  Clock,
  ClipboardList,
  Search,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";
import { safeQuery } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SmartAlert } from "@/components/shared/smart-alert";
import { AttendanceEntryPanel } from "@/components/attendance/attendance-entry-panel";
import {
  deleteAttendanceRecord,
  getAttendanceCounts,
  getAttendanceRecords,
} from "@/services/attendance-service";

import {
  ATTENDANCE_STATUSES,
  calculateAttendanceRate,
  formatAttendanceShortDate,
  getAttendanceStatusBadgeClass,
  type AttendanceListItem,
} from "@/types/attendance";
import { DeleteConfirmButton } from "@/components/shared/delete-confirm-button";
import { getSchoolSettings } from "@/services/school-settings-service";
import { getSchoolDayLabel } from "@/types/settings";

export const dynamic = "force-dynamic";



type AttendancePageProps = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    date?: string;
    saved?: string;
    deleted?: string;
    error?: string;
    reason?: string;
  }>;
};

export default async function AttendancePage({
  searchParams,
}: AttendancePageProps) {
  await requireAdmin();
  const resolvedSearchParams = await searchParams;

  const query = resolvedSearchParams?.q?.trim() ?? "";
  const status = resolvedSearchParams?.status?.trim() ?? "";
  const date = resolvedSearchParams?.date?.trim() ?? "";

  const [records, counts, schoolSettings] = await Promise.all([
    safeQuery(() => getAttendanceRecords({
      query,
      status,
      date,
    }), []),
    safeQuery(() => getAttendanceCounts(), { total: 0, present: 0, absent: 0, late: 0, excused: 0 }),
    safeQuery(() => getSchoolSettings(), {
      id: "main",
      weekendDays: ["friday", "saturday"],
      customHolidayDates: [],
      checkoutWarningTime: "12:00",
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  ]);

  const hasRecords = counts.total > 0;

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-[1350px] flex-col gap-6">
        <PageHeader
          title="الحضور والغياب"
          description="سجّل دخول طلاب الثانوية صباحًا وانصرافهم عند الخروج من المعهد، عبر رمز الطالب أو اسمه أو QR."
          icon="attendance"
          badge="الخطوة السادسة"
        />

        <AttendanceFeedback
          saved={resolvedSearchParams?.saved}
          deleted={resolvedSearchParams?.deleted}
          error={resolvedSearchParams?.error}
          reason={resolvedSearchParams?.reason}
        />

        <SmartAlert
          tone="info"
          title="الحضور يعتمد على إعدادات الدوام"
          description={`كل طالب له سجل يومي واحد فقط. العطل الأسبوعية الحالية: ${schoolSettings.weekendDays.map(getSchoolDayLabel).join("، ") || "غير محددة"}. تنبيه الانصراف المبكر يظهر قبل الساعة ${schoolSettings.checkoutWarningTime}.`}
          actionLabel="تعديل الإعدادات"
          actionHref="/settings"
        />

        {/* Attendance Entry — QR (mobile) + Quick Code (all devices) */}
        <section>
          <AttendanceEntryPanel checkoutWarningTime={schoolSettings.checkoutWarningTime} />
        </section>

        <section className="flex flex-col gap-6">
          <AttendanceStats
            total={counts.total}
            present={counts.present}
            absent={counts.absent}
            late={counts.late}
            excused={counts.excused}
          />

          <AttendanceSearchForm query={query} status={status} date={date} />
        </section>

        {!hasRecords ? (
          <EmptyState
            icon="attendance"
            title="لا توجد سجلات حضور بعد"
            description="ابدأ بكتابة اسم الطالب أو رمزه في لوحة الإدخال أعلاه، وسيظهر السجل مباشرة في الجدول."
            actionLabel="إدارة الطلاب"
            actionHref="/students"
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

async function deleteAttendanceAction(formData: FormData): Promise<{ ok: boolean; message?: string }> {
  "use server";

  const id = String(formData.get("id") ?? "");

  if (!id) {
    return { ok: false, message: "معرّف سجل الحضور مفقود." };
  }

  let result;
  try {
    result = await deleteAttendanceRecord(id);
  } catch (error) {
    console.error("[deleteAttendanceAction] Error:", error);
    return { ok: false, message: "حدث خطأ أثناء الحذف. تأكد من عدم وجود بيانات مرتبطة." };
  }

  if (!result.ok) {
    return { ok: false, message: result.message || "حدث خطأ أثناء الحذف." };
  }

  revalidatePath("/");
  revalidatePath("/attendance");
  revalidatePath("/reports");
  redirect("/attendance?deleted=1");
}

// ─── Feedback ────────────────────────────────────────────────────

type AttendanceFeedbackProps = {
  saved?: string;
  deleted?: string;
  error?: string;
  reason?: string;
};

function AttendanceFeedback({ saved, deleted, error, reason }: AttendanceFeedbackProps) {
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
    let description: string;
    if (error === "delete" && reason) {
      description = decodeURIComponent(reason);
    } else if (error === "delete") {
      description = "لا يمكن حذف سجل الحضور. حاول مرة أخرى.";
    } else if (error === "missing-id") {
      description = "معرّف سجل الحضور مطلوب.";
    } else {
      description = "تأكد من إدخال البيانات بشكل صحيح، وأن الطالب مسجل في النظام.";
    }

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
      className: "bg-gradient-to-br from-red-100 to-indigo-100 text-red-700",
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
            autoComplete="off"
            className="input pr-11"
          />
        </div>

        <select
          id="attendance-status-filter"
          name="status"
          defaultValue={status}
          autoComplete="off"
          className="input"
        >
          <option value="">كل الحالات</option>
          {ATTENDANCE_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <input
          id="attendance-date-filter"
          name="date"
          type="date"
          defaultValue={date}
          autoComplete="off"
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
            جدول الحضور والانصراف اليومي
          </h3>

          <p className="mt-1 text-sm leading-6 text-[var(--app-text-muted)]">
            يعرض كل طالب مرة واحدة في اليوم، مع وقت الدخول الصباحي ووقت الانصراف عند الخروج.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="badge badge-info">{records.length} سجل</span>
        </div>
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

  const sourceLabel = record.source === "qr" ? "QR" : record.source === "manual-code" ? "رمز يدوي" : record.source === "manual-name" ? "باسم الطالب" : "يدوي";

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

            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-bold">
              {sourceLabel}
            </span>
          </div>

          {/* Check-in/Check-out times */}
          {(record.checkInAt || record.checkOutAt) && (
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              {record.checkInAt && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 font-bold text-emerald-700">
                  حضور: {new Date(record.checkInAt).toLocaleTimeString("ar-IQ")}
                </span>
              )}
              {record.checkOutAt && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 font-bold text-amber-700">
                  انصراف: {new Date(record.checkOutAt).toLocaleTimeString("ar-IQ")}
                </span>
              )}
            </div>
          )}

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
        <DeleteConfirmButton
          action={deleteAttendanceAction}
          itemId={record.id}
          entityName="سجل الحضور"
          associations={[]}
        />
      </div>
    </article>
  );
}
