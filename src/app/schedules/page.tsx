export const dynamic = 'force-dynamic';
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  GraduationCap,
  Layers3,
  MapPin,
  Power,
  Search,
  StickyNote,
  Trash2,
  Users,
} from "lucide-react";
import { safeQuery } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SmartAlert } from "@/components/shared/smart-alert";
import { getSections } from "@/services/class-service";
import { getActiveSubjects } from "@/services/subject-service";
import { getActiveTeachers } from "@/services/teacher-service";
import {
  createSchedule,
  deleteSchedule,
  getSchedules,
  getSchedulesCount,
  toggleScheduleStatus,
} from "@/services/schedule-service";
import {
  formatScheduleTime,
  getScheduleStatusBadgeClass,
  getScheduleStatusLabel,
  WEEK_DAYS,
  type ScheduleFormInput,
  type ScheduleListItem,
} from "@/types/schedule";
import type { SectionListItem } from "@/types/class";
import type { Teacher } from "@/types/teacher";

type SchedulesPageProps = {
  searchParams?: {
    q?: string;
    dayOfWeek?: string;
    saved?: string;
    deleted?: string;
    toggled?: string;
    error?: string;
  };
};

export default async function SchedulesPage({
  searchParams,
}: SchedulesPageProps) {
  await requireAdmin();

  const query = searchParams?.q?.trim() ?? "";
  const dayOfWeek = searchParams?.dayOfWeek?.trim() ?? "";

  const [schedules, counts, sections, subjects, teachers] = await Promise.all([
    safeQuery(() => getSchedules({
      query: query || undefined,
      dayOfWeek: dayOfWeek || undefined,
    }), []),
    safeQuery(() => getSchedulesCount(), { total: 0, active: 0, inactive: 0, today: 0 }),
    safeQuery(() => getSections(), []),
    safeQuery(() => getActiveSubjects(), []),
    safeQuery(() => getActiveTeachers(), []),
  ]);

  const hasSchedules = counts.total > 0;

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-[1350px] flex-col gap-6">
        <PageHeader
          title="الجدول الدراسي"
          description="أنشئ المحاضرات الدراسية واربطها بالشُعب والمدرسين والمواد لبناء جدول منظم وخالٍ من التعارضات."
          icon="schedule"
          badge="الخطوة الرابعة"
        />

        <SchedulesFeedback
          saved={searchParams?.saved}
          deleted={searchParams?.deleted}
          toggled={searchParams?.toggled}
          error={searchParams?.error}
        />

        <SmartAlert
          tone="info"
          title="بناء الجدول الدراسي"
          description="أضف المحاضرات واحدة تلو الأخرى. النظام يكتشف تلقائيًا تعارضات الأوقات بين المدرسين والشُعب."
          actionLabel="الخطوة التالية: الحضور"
          actionHref="/attendance"
        />

        <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <ScheduleCreateForm
            sections={sections}
            subjects={subjects}
            teachers={teachers}
          />

          <div className="flex flex-col gap-6">
            <SchedulesStats
              total={counts.total}
              active={counts.active}
              inactive={counts.inactive}
              today={counts.today}
            />

            <ScheduleSearchForm query={query} dayOfWeek={dayOfWeek} />
          </div>
        </section>

        {!hasSchedules ? (
          <EmptyState
            icon="schedule"
            title="لا توجد محاضرات في الجدول بعد"
            description="ابدأ بإضافة أول محاضرة دراسية. تأكد من إنشاء الصفوف والشُعب والمواد والمدرسين أولًا."
            actionLabel="إضافة أول محاضرة"
            actionHref="#schedule-form"
            secondaryLabel="الرجوع إلى الصفوف"
            secondaryHref="/classes"
          />
        ) : schedules.length === 0 ? (
          <EmptyState
            icon="search"
            title="لا توجد محاضرات مطابقة للبحث"
            description="جرّب البحث باسم المادة أو المدرس أو الشعبة، أو غيّر فلتر اليوم، أو امسح البحث لعرض كل المحاضرات."
            actionLabel="عرض كل المحاضرات"
            actionHref="/schedules"
          />
        ) : (
          <SchedulesList schedules={schedules} />
        )}
      </div>
    </AppShell>
  );
}

async function createScheduleAction(formData: FormData) {
  "use server";

  const input: ScheduleFormInput = {
    dayOfWeek: String(formData.get("dayOfWeek") ?? ""),
    startTime: String(formData.get("startTime") ?? ""),
    endTime: String(formData.get("endTime") ?? ""),
    room: String(formData.get("room") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    isActive: formData.get("isActive") === "on",
    sectionId: String(formData.get("sectionId") ?? ""),
    subjectId: String(formData.get("subjectId") ?? ""),
    teacherId: String(formData.get("teacherId") ?? ""),
  };

  const result = await createSchedule(input);

  if (!result.ok) {
    redirect("/schedules?error=create");
  }

  revalidatePath("/");
  revalidatePath("/schedules");
  revalidatePath("/reports");
  redirect("/schedules?saved=1");
}

async function toggleScheduleAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");

  if (!id) {
    redirect("/schedules?error=missing-id");
  }

  const result = await toggleScheduleStatus(id);

  if (!result.ok) {
    redirect("/schedules?error=toggle");
  }

  revalidatePath("/");
  revalidatePath("/schedules");
  revalidatePath("/reports");
  redirect("/schedules?toggled=1");
}

async function deleteScheduleAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");

  if (!id) {
    redirect("/schedules?error=missing-id");
  }

  const result = await deleteSchedule(id);

  if (!result.ok) {
    redirect("/schedules?error=delete");
  }

  revalidatePath("/");
  revalidatePath("/schedules");
  revalidatePath("/reports");
  redirect("/schedules?deleted=1");
}

type SchedulesFeedbackProps = {
  saved?: string;
  deleted?: string;
  toggled?: string;
  error?: string;
};

function SchedulesFeedback({
  saved,
  deleted,
  toggled,
  error,
}: SchedulesFeedbackProps) {
  if (saved === "1") {
    return (
      <SmartAlert
        tone="success"
        title="تمت إضافة المحاضرة بنجاح"
        description="رائع، تم حفظ المحاضرة في الجدول الدراسي. يمكنك الآن إضافة محاضرات أخرى أو مراجعة الجدول."
      />
    );
  }

  if (deleted === "1") {
    return (
      <SmartAlert
        tone="success"
        title="تم حذف المحاضرة"
        description="تم حذف المحاضرة من الجدول الدراسي بنجاح."
      />
    );
  }

  if (toggled === "1") {
    return (
      <SmartAlert
        tone="success"
        title="تم تحديث حالة المحاضرة"
        description="تم تغيير حالة المحاضرة بين فعّالة ومتوقفة بنجاح."
      />
    );
  }

  if (error) {
    const description =
      error === "delete"
        ? "لا يمكن حذف المحاضرة حاليًا. جرّب تعطيلها بدل الحذف."
        : error === "toggle"
          ? "لا يمكن تحديث حالة المحاضرة. تأكد من أن المحاضرة موجودة."
          : "تأكد من إدخال البيانات بشكل صحيح، وأنه لا يوجد تعارض في الأوقات أو أن المدرس مرتبط بالمادة.";

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

type ScheduleCreateFormProps = {
  sections: SectionListItem[];
  subjects: { id: string; name: string }[];
  teachers: Teacher[];
};

function ScheduleCreateForm({
  sections,
  subjects,
  teachers,
}: ScheduleCreateFormProps) {
  const hasSections = sections.length > 0;
  const hasSubjects = subjects.length > 0;
  const hasTeachers = teachers.length > 0;
  const canCreate = hasSections && hasSubjects && hasTeachers;

  return (
    <form
      id="schedule-form"
      action={createScheduleAction}
      className="app-card overflow-hidden"
    >
      <div className="border-b border-[var(--app-border-soft)] bg-gradient-to-l to-rose-50/40 to-amber-50/20 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-rose-100 text-blue-700">
            <CalendarClock size={23} />
          </div>

          <div>
            <h3 className="text-xl font-extrabold text-[var(--app-text)]">
              إضافة محاضرة دراسية
            </h3>

            <p className="mt-1 text-sm leading-7 text-[var(--app-text-muted)]">
              حدّد اليوم والوقت والشعبة والمادة والمدرس لبناء الجدول.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-6">
        <FormField label="اليوم" htmlFor="dayOfWeek" required>
          <select
            id="dayOfWeek"
            name="dayOfWeek"
            required
            className="input"
            defaultValue="saturday"
          >
            {WEEK_DAYS.map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </select>
        </FormField>

        <div className="grid gap-5 md:grid-cols-2">
          <FormField label="وقت البداية" htmlFor="startTime" required>
            <input
              id="startTime"
              name="startTime"
              type="time"
              required
              className="input ltr text-right"
              placeholder="07:30"
            />
          </FormField>

          <FormField label="وقت النهاية" htmlFor="endTime" required>
            <input
              id="endTime"
              name="endTime"
              type="time"
              required
              className="input ltr text-right"
              placeholder="08:15"
            />
          </FormField>
        </div>

        <FormField label="الشعبة" htmlFor="sectionId" required>
          <select
            id="sectionId"
            name="sectionId"
            required
            disabled={!hasSections}
            className="input"
            defaultValue=""
          >
            <option value="" disabled>
              اختر الشعبة
            </option>

            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.className} / شعبة {section.name}
              </option>
            ))}
          </select>

          {!hasSections ? (
            <p className="mt-2 text-sm leading-6 text-amber-700">
              أضف صفًا وشعبة فعّالة أولًا حتى تتمكن من اختيار الشعبة.
            </p>
          ) : null}
        </FormField>

        <FormField label="المادة" htmlFor="subjectId" required>
          <select
            id="subjectId"
            name="subjectId"
            required
            disabled={!hasSubjects}
            className="input"
            defaultValue=""
          >
            <option value="" disabled>
              اختر المادة
            </option>

            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>

          {!hasSubjects ? (
            <p className="mt-2 text-sm leading-6 text-amber-700">
              أضف مادة فعّالة أولًا حتى تتمكن من اختيار المادة.
            </p>
          ) : null}
        </FormField>

        <FormField label="المدرس" htmlFor="teacherId" required>
          <select
            id="teacherId"
            name="teacherId"
            required
            disabled={!hasTeachers}
            className="input"
            defaultValue=""
          >
            <option value="" disabled>
              اختر المدرس
            </option>

            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.fullName}
                {teacher.specialty ? ` - ${teacher.specialty}` : ""}
              </option>
            ))}
          </select>

          {!hasTeachers ? (
            <p className="mt-2 text-sm leading-6 text-amber-700">
              أضف مدرسًا فعّالًا أولًا حتى تتمكن من اختيار المدرس.
            </p>
          ) : null}
        </FormField>

        <FormField label="القاعة" htmlFor="room">
          <input
            id="room"
            name="room"
            maxLength={80}
            placeholder="مثال: قاعة 101"
            className="input"
          />
        </FormField>

        <FormField label="ملاحظات" htmlFor="notes">
          <textarea
            id="notes"
            name="notes"
            rows={3}
            maxLength={500}
            placeholder="ملاحظات إضافية عن المحاضرة..."
            className="input min-h-[90px] resize-y leading-7"
          />
        </FormField>

        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[var(--app-border-soft)] bg-gradient-to-l to-rose-50/30 to-amber-50/20 p-4">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked
            className="h-5 w-5 accent-rose-600"
          />

          <span>
            <span className="block font-extrabold text-[var(--app-text)]">
              المحاضرة فعّالة
            </span>

            <span className="mt-1 block text-sm leading-6 text-[var(--app-text-muted)]">
              المحاضرات الفعّالة تظهر في الجدول الدراسي ويمكن تسجيل الحضور فيها.
            </span>
          </span>
        </label>
      </div>

      <div className="flex flex-col gap-3 border-t border-[var(--app-border-soft)] bg-gradient-to-l to-rose-50/30 to-amber-50/20 p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-7 text-[var(--app-text-muted)]">
          النظام يكتشف تلقائيًا تعارضات الأوقات بين المدرسين والشُعب.
        </p>

        <button
          type="submit"
          disabled={!canCreate}
          className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          <CheckCircle2 size={18} />
          حفظ المحاضرة
        </button>
      </div>
    </form>
  );
}

type FormFieldProps = {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
};

function FormField({ label, htmlFor, required, children }: FormFieldProps) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
      >
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </label>

      {children}
    </div>
  );
}

type SchedulesStatsProps = {
  total: number;
  active: number;
  inactive: number;
  today: number;
};

function SchedulesStats({
  total,
  active,
  inactive,
  today,
}: SchedulesStatsProps) {
  const stats = [
    {
      label: "إجمالي المحاضرات",
      value: total,
      icon: Layers3,
      className: "bg-gradient-to-br from-blue-100 to-rose-100 text-blue-700",
    },
    {
      label: "محاضرات فعّالة",
      value: active,
      icon: CheckCircle2,
      className: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "محاضرات متوقفة",
      value: inactive,
      icon: AlertTriangle,
      className: "bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700",
    },
    {
      label: "محاضرات اليوم",
      value: today,
      icon: Clock,
      className: "bg-gradient-to-br from-rose-100 to-amber-100 text-rose-700",
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

type ScheduleSearchFormProps = {
  query: string;
  dayOfWeek: string;
};

function ScheduleSearchForm({ query, dayOfWeek }: ScheduleSearchFormProps) {
  return (
    <form action="/schedules" className="app-card p-5">
      <label
        htmlFor="q"
        className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
      >
        البحث في الجدول
      </label>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--app-text-soft)]"
          />

          <input
            id="q"
            name="q"
            defaultValue={query}
            placeholder="ابحث باسم المادة أو المدرس أو الشعبة..."
            className="input pr-11"
          />
        </div>

        <select
          name="dayOfWeek"
          defaultValue={dayOfWeek}
          className="input w-full sm:w-40"
        >
          <option value="">كل الأيام</option>

          {WEEK_DAYS.map((day) => (
            <option key={day.value} value={day.value}>
              {day.label}
            </option>
          ))}
        </select>

        <button type="submit" className="btn btn-secondary">
          بحث
        </button>
      </div>
    </form>
  );
}

type SchedulesListProps = {
  schedules: ScheduleListItem[];
};

function SchedulesList({ schedules }: SchedulesListProps) {
  return (
    <section className="app-card overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-[var(--app-border-soft)] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-extrabold text-[var(--app-text)]">
            قائمة المحاضرات الدراسية
          </h3>

          <p className="mt-1 text-sm leading-6 text-[var(--app-text-muted)]">
            يمكنك متابعة المحاضرات، حالتها، وتفاصيل كل محاضرة في الجدول.
          </p>
        </div>

        <span className="badge badge-info">{schedules.length} محاضرة</span>
      </div>

      <div className="divide-y divide-[var(--app-border-soft)]">
        {schedules.map((schedule) => (
          <ScheduleRow key={schedule.id} schedule={schedule} />
        ))}
      </div>
    </section>
  );
}

type ScheduleRowProps = {
  schedule: ScheduleListItem;
};

function ScheduleRow({ schedule }: ScheduleRowProps) {
  const statusLabel = getScheduleStatusLabel(schedule.isActive);
  const statusBadgeClass = getScheduleStatusBadgeClass(schedule.isActive);

  return (
    <article className="grid gap-4 p-5 transition hover:bg-rose-50/40 lg:grid-cols-[1fr_auto] lg:items-center">
      <div className="flex min-w-0 gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-100 to-rose-100 text-blue-700">
          <CalendarClock size={25} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-lg font-extrabold text-[var(--app-text)]">
              {schedule.subjectName}
            </h4>

            <span className={["badge", statusBadgeClass].join(" ")}>
              {statusLabel}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-2 text-sm text-[var(--app-text-muted)]">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-bold">
              <CalendarClock size={14} />
              {schedule.dayLabel}
            </span>

            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-bold">
              <Clock size={14} />
              {formatScheduleTime(schedule.startTime, schedule.endTime)}
            </span>

            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-bold">
              <GraduationCap size={14} />
              {schedule.teacherName}
            </span>

            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-bold">
              <Users size={14} />
              {schedule.className} / شعبة {schedule.sectionName}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {schedule.room ? (
              <span className="badge bg-slate-100 text-slate-600">
                <MapPin size={14} />
                {schedule.room}
              </span>
            ) : null}


            {schedule.classLevel ? (
              <span className="badge bg-slate-100 text-slate-600">
                {schedule.classLevel}
              </span>
            ) : null}
          </div>

          {schedule.notes ? (
            <p className="mt-3 flex items-start gap-2 text-sm leading-7 text-[var(--app-text-muted)]">
              <StickyNote size={15} className="mt-1.5 shrink-0" />
              {schedule.notes}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
        <form action={toggleScheduleAction}>
          <input type="hidden" name="id" value={schedule.id} />

          <button type="submit" className="btn btn-secondary w-full">
            <Power size={17} />
            {schedule.isActive ? "تعطيل" : "تفعيل"}
          </button>
        </form>

        <form action={deleteScheduleAction}>
          <input type="hidden" name="id" value={schedule.id} />

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
