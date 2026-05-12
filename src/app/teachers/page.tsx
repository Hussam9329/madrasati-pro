export const dynamic = 'force-dynamic';
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Mail,
  Phone,
  Power,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";
import { safeQuery } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SmartAlert } from "@/components/shared/smart-alert";
import {
  createTeacher,
  deleteTeacher,
  getTeachers,
  getTeachersCount,
  toggleTeacherStatus,
} from "@/services/teacher-service";
import { getActiveSubjects } from "@/services/subject-service";
import {
  formatTeacherSalary,
  formatTeacherSubjects,
  getTeacherStatusBadgeClass,
  getTeacherStatusLabel,
  type TeacherFormInput,
  type TeacherListItem,
  type TeacherStatus,
} from "@/types/teacher";
import type { Subject } from "@/types/subject";

type TeachersPageProps = {
  searchParams?: {
    q?: string;
    saved?: string;
    deleted?: string;
    toggled?: string;
    error?: string;
  };
};

export default async function TeachersPage({
  searchParams,
}: TeachersPageProps) {
  const query = searchParams?.q?.trim() ?? "";

  const [teachers, counts, subjects] = await Promise.all([
    safeQuery(() => getTeachers(), []),
    safeQuery(() => getTeachersCount(), { total: 0, active: 0, inactive: 0, withSubjects: 0, withoutSubjects: 0 }),
    safeQuery(() => getActiveSubjects(), []),
  ]);

  const filteredTeachers = query
    ? teachers.filter(
        (t) =>
          t.fullName.includes(query) ||
          (t.phone && t.phone.includes(query)) ||
          (t.email && t.email.includes(query)) ||
          (t.specialty && t.specialty.includes(query)) ||
          t.subjects.some((s) => s.name.includes(query)),
      )
    : teachers;

  const hasTeachers = counts.total > 0;

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-[1350px] flex-col gap-6">
        <PageHeader
          title="المدرسون"
          description="أضف المدرسين واربطهم بالمواد الدراسية."
          icon="teachers"
          badge="الخطوة الثالثة"
        />

        <TeachersFeedback
          saved={searchParams?.saved}
          deleted={searchParams?.deleted}
          toggled={searchParams?.toggled}
          error={searchParams?.error}
        />

        <SmartAlert
          tone="info"
          title="المدرسون يُربطون بالمواد أولاً"
          description="أضف المدرس وحدّد المواد التي يدرّسها، ثم يمكنك استخدامه في بناء الجدول الدراسي."
          actionLabel="إدارة المواد"
          actionHref="/subjects"
        />

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <TeacherCreateForm subjects={subjects} />

          <div className="flex flex-col gap-6">
            <TeacherStats
              total={counts.total}
              active={counts.active}
              inactive={counts.inactive}
              withSubjects={counts.withSubjects}
            />

            <TeacherSearchForm query={query} />
          </div>
        </section>

        {!hasTeachers ? (
          <EmptyState
            icon="teachers"
            title="لا يوجد مدرسون بعد"
            description="ابدأ بإضافة أول مدرس وربطه بالمواد الدراسية. بعد ذلك يمكنك بناء الجدول الدراسي."
            actionLabel="إضافة أول مدرس"
            actionHref="#teacher-form"
            secondaryLabel="إدارة المواد"
            secondaryHref="/subjects"
          />
        ) : filteredTeachers.length === 0 ? (
          <EmptyState
            icon="search"
            title="لا توجد نتائج مطابقة للبحث"
            description="جرّب البحث باسم المدرس أو هاتفه أو تخصصه أو المادة، أو امسح حقل البحث لعرض الكل."
            actionLabel="عرض كل المدرسين"
            actionHref="/teachers"
          />
        ) : (
          <TeacherList teachers={filteredTeachers} />
        )}
      </div>
    </AppShell>
  );
}

// ─── Server Actions ──────────────────────────────────────────────

async function createTeacherAction(formData: FormData) {
  "use server";

  const subjectIds = formData.getAll("subjectIds").map(String).filter(Boolean);

  const input: TeacherFormInput = {
    fullName: String(formData.get("fullName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    specialty: String(formData.get("specialty") ?? ""),
    salary: String(formData.get("salary") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    isActive: formData.get("isActive") === "on",
    subjectIds,
  };

  const result = await createTeacher(input);

  if (!result.ok) {
    redirect("/teachers?error=create");
  }

  revalidatePath("/");
  revalidatePath("/teachers");
  redirect("/teachers?saved=1");
}

async function deleteTeacherAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");

  if (!id) {
    redirect("/teachers?error=missing-id");
  }

  const result = await deleteTeacher(id);

  if (!result.ok) {
    redirect("/teachers?error=delete");
  }

  revalidatePath("/");
  revalidatePath("/teachers");
  redirect("/teachers?deleted=1");
}

async function toggleTeacherStatusAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");

  if (!id) {
    redirect("/teachers?error=missing-id");
  }

  const result = await toggleTeacherStatus(id);

  if (!result.ok) {
    redirect("/teachers?error=toggle");
  }

  revalidatePath("/");
  revalidatePath("/teachers");
  redirect("/teachers?toggled=1");
}

// ─── Feedback ────────────────────────────────────────────────────

type TeachersFeedbackProps = {
  saved?: string;
  deleted?: string;
  toggled?: string;
  error?: string;
};

function TeachersFeedback({
  saved,
  deleted,
  toggled,
  error,
}: TeachersFeedbackProps) {
  if (saved === "1") {
    return (
      <SmartAlert
        tone="success"
        title="تمت إضافة المدرس بنجاح"
        description="رائع، تم حفظ بيانات المدرس. يمكنك الآن إضافة مدرسين آخرين أو بناء الجدول الدراسي."
      />
    );
  }

  if (deleted === "1") {
    return (
      <SmartAlert
        tone="success"
        title="تم حذف المدرس"
        description="تم حذف المدرس من النظام لأنه غير مرتبط بحصص في الجدول."
      />
    );
  }

  if (toggled === "1") {
    return (
      <SmartAlert
        tone="success"
        title="تم تحديث حالة المدرس"
        description="تم تغيير حالة المدرس بين فعّال ومتوقف بنجاح."
      />
    );
  }

  if (error) {
    const description =
      error === "delete"
        ? "لا يمكن حذف المدرس إذا كان مرتبطًا بحصص في الجدول. عطّله بدل حذفه."
        : error === "toggle"
          ? "لا يمكن تحديث حالة المدرس. حاول مرة أخرى."
          : "تأكد من إدخال اسم المدرس بشكل صحيح (3 أحرف على الأقل).";

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

type TeacherCreateFormProps = {
  subjects: Subject[];
};

function TeacherCreateForm({ subjects }: TeacherCreateFormProps) {
  return (
    <form
      id="teacher-form"
      action={createTeacherAction}
      className="app-card overflow-hidden"
    >
      <div className="border-b border-[var(--app-border-soft)] bg-gradient-to-l from-indigo-50/40 to-violet-50/20 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700">
            <GraduationCap size={24} />
          </div>

          <div>
            <h3 className="text-xl font-extrabold text-[var(--app-text)]">
              إضافة مدرس
            </h3>

            <p className="mt-1 text-sm leading-7 text-[var(--app-text-muted)]">
              أدخل بيانات المدرس واربطه بالمواد الدراسية التي يدرّسها.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-6">
        <div>
          <label
            htmlFor="fullName"
            className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
          >
            الاسم الكامل <span className="text-red-600">*</span>
          </label>

          <input
            id="fullName"
            name="fullName"
            required
            minLength={3}
            maxLength={120}
            placeholder="مثال: محمد أحمد"
            className="input"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="phone"
              className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
            >
              رقم الهاتف
            </label>

            <input
              id="phone"
              name="phone"
              type="tel"
              maxLength={20}
              placeholder="مثال: 07701234567"
              className="input ltr text-right"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
            >
              البريد الإلكتروني
            </label>

            <input
              id="email"
              name="email"
              type="email"
              maxLength={120}
              placeholder="مثال: teacher@school.com"
              className="input ltr text-right"
            />
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="specialty"
              className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
            >
              التخصص
            </label>

            <input
              id="specialty"
              name="specialty"
              maxLength={100}
              placeholder="مثال: رياضيات"
              className="input"
            />
          </div>

          <div>
            <label
              htmlFor="salary"
              className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
            >
              الراتب
            </label>

            <input
              id="salary"
              name="salary"
              type="number"
              min={0}
              step="0.01"
              placeholder="مثال: 500000"
              className="input ltr text-right"
            />
          </div>
        </div>

        {subjects.length > 0 ? (
          <div>
            <label className="mb-2 block text-sm font-extrabold text-[var(--app-text)]">
              المواد الدراسية
            </label>

            <div className="max-h-52 overflow-y-auto rounded-2xl border border-[var(--app-border-soft)] bg-gradient-to-l from-indigo-50/30 to-violet-50/20 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {subjects.map((subject) => (
                  <label
                    key={subject.id}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--app-border-soft)] bg-white p-3 transition hover:border-indigo-200 hover:bg-indigo-50/40"
                  >
                    <input
                      type="checkbox"
                      name="subjectIds"
                      value={subject.id}
                      className="h-4 w-4 accent-indigo-600"
                    />

                    <span className="flex items-center gap-2">
                      <BookOpen
                        size={15}
                        className="text-[var(--app-text-soft)]"
                      />

                      <span className="text-sm font-bold text-[var(--app-text)]">
                        {subject.name}
                      </span>

                      {subject.code ? (
                        <span className="text-xs text-[var(--app-text-soft)]">
                          ({subject.code})
                        </span>
                      ) : null}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <p className="mt-2 text-xs leading-6 text-[var(--app-text-soft)]">
              اختر المواد التي يدرّسها هذا المدرس. يمكنك تعديلها لاحقًا.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
            <p className="text-sm leading-7 text-amber-800">
              لا توجد مواد فعّالة حاليًا.{" "}
              <a
                href="/subjects"
                className="font-extrabold underline underline-offset-2 hover:text-amber-900"
              >
                أضف مواد أولًا
              </a>{" "}
              لربطها بالمدرسين.
            </p>
          </div>
        )}

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

        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[var(--app-border-soft)] bg-gradient-to-l from-indigo-50/30 to-violet-50/20 p-4">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked
            className="h-5 w-5 accent-indigo-600"
          />

          <span>
            <span className="block font-extrabold text-[var(--app-text)]">
              المدرس فعّال
            </span>

            <span className="mt-1 block text-sm leading-6 text-[var(--app-text-muted)]">
              المدرسون الفعّالون يظهرون في الجدول الدراسي والتقارير.
            </span>
          </span>
        </label>
      </div>

      <div className="flex flex-col gap-3 border-t border-[var(--app-border-soft)] bg-gradient-to-l from-indigo-50/30 to-violet-50/20 p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-7 text-[var(--app-text-muted)]">
          بعد إضافة المدرس، يمكنك بناء الجدول الدراسي وربطه بالحصص.
        </p>

        <button type="submit" className="btn btn-primary">
          <CheckCircle2 size={18} />
          حفظ المدرس
        </button>
      </div>
    </form>
  );
}

// ─── Stats ───────────────────────────────────────────────────────

type TeacherStatsProps = {
  total: number;
  active: number;
  inactive: number;
  withSubjects: number;
};

function TeacherStats({
  total,
  active,
  inactive,
  withSubjects,
}: TeacherStatsProps) {
  const stats = [
    {
      label: "إجمالي المدرسين",
      value: total,
      icon: GraduationCap,
      className: "bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700",
    },
    {
      label: "مدرسون فعّالون",
      value: active,
      icon: CheckCircle2,
      className: "bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700",
    },
    {
      label: "مدرسون متوقفون",
      value: inactive,
      icon: AlertTriangle,
      className: "bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700",
    },
    {
      label: "مرتبطون بمواد",
      value: withSubjects,
      icon: BookOpen,
      className: "bg-gradient-to-br from-teal-100 to-cyan-100 text-teal-700",
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

type TeacherSearchFormProps = {
  query: string;
};

function TeacherSearchForm({ query }: TeacherSearchFormProps) {
  return (
    <form action="/teachers" className="app-card p-5">
      <label
        htmlFor="q"
        className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
      >
        البحث في المدرسين
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
            placeholder="ابحث بالاسم أو الهاتف أو التخصص أو المادة..."
            className="input pr-11"
          />
        </div>

        <button type="submit" className="btn btn-secondary">
          بحث
        </button>
      </div>
    </form>
  );
}

// ─── List ────────────────────────────────────────────────────────

type TeacherListProps = {
  teachers: TeacherListItem[];
};

function TeacherList({ teachers }: TeacherListProps) {
  return (
    <section className="app-card overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-[var(--app-border-soft)] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-extrabold text-[var(--app-text)]">
            قائمة المدرسين
          </h3>

          <p className="mt-1 text-sm leading-6 text-[var(--app-text-muted)]">
            تابع بيانات المدرسين وحالتهم والمواد المرتبطة بهم.
          </p>
        </div>

        <span className="badge badge-info">{teachers.length} مدرس</span>
      </div>

      <div className="divide-y divide-[var(--app-border-soft)]">
        {teachers.map((teacher) => (
          <TeacherRow key={teacher.id} teacher={teacher} />
        ))}
      </div>
    </section>
  );
}

type TeacherRowProps = {
  teacher: TeacherListItem;
};

function TeacherRow({ teacher }: TeacherRowProps) {
  const status: TeacherStatus = teacher.isActive ? "active" : "inactive";
  const statusLabel = getTeacherStatusLabel(status);
  const statusClass = getTeacherStatusBadgeClass(status);

  return (
    <article className="grid gap-4 p-5 transition hover:bg-indigo-50/40 lg:grid-cols-[1fr_auto] lg:items-center">
      <div className="flex min-w-0 gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700">
          <UserRound size={25} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-lg font-extrabold text-[var(--app-text)]">
              {teacher.fullName}
            </h4>

            <span className={["badge", statusClass].join(" ")}>
              {statusLabel}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-2 text-sm text-[var(--app-text-muted)]">
            {teacher.phone ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-bold">
                <Phone size={14} />
                {teacher.phone}
              </span>
            ) : null}

            {teacher.email ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-bold">
                <Mail size={14} />
                {teacher.email}
              </span>
            ) : null}

            {teacher.specialty ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-bold">
                تخصص: {teacher.specialty}
              </span>
            ) : null}
          </div>

          {teacher.salary !== null ? (
            <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">
              الراتب:{" "}
              <span className="font-bold text-[var(--app-text)]">
                {formatTeacherSalary(teacher.salary)}
              </span>
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2">
            {teacher.subjects.length > 0 ? (
              teacher.subjects.map((subject) => (
                <span
                  key={subject.id}
                  className="badge bg-blue-50 text-blue-700"
                >
                  <BookOpen size={12} />
                  {subject.name}
                </span>
              ))
            ) : (
              <span className="badge bg-slate-100 text-slate-500">
                لا توجد مواد مرتبطة
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <span className="badge bg-slate-100 text-slate-600">
              المواد: {teacher.subjectsCount}
            </span>

            <span className="badge bg-slate-100 text-slate-600">
              الحصص: {teacher.schedulesCount}
            </span>
          </div>

          {teacher.notes ? (
            <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">
              ملاحظات:{" "}
              <span className="font-bold text-[var(--app-text)]">
                {teacher.notes}
              </span>
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
        <form action={toggleTeacherStatusAction}>
          <input type="hidden" name="id" value={teacher.id} />

          <button type="submit" className="btn btn-secondary w-full">
            <Power size={17} />
            {teacher.isActive ? "تعطيل" : "تفعيل"}
          </button>
        </form>

        <form action={deleteTeacherAction}>
          <input type="hidden" name="id" value={teacher.id} />

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
