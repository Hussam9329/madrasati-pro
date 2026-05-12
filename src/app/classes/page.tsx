export const dynamic = 'force-dynamic';
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  DoorOpen,
  GraduationCap,
  Layers3,
  ListTree,
  Power,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { safeQuery } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SmartAlert } from "@/components/shared/smart-alert";
import {
  createClass,
  createSection,
  deleteClass,
  deleteSection,
  getActiveClasses,
  getClassesCount,
  getSections,
  searchClasses,
  toggleClassStatus,
  toggleSectionStatus,
} from "@/services/class-service";
import {
  getClassDisplayName,
  getClassStatus,
  getClassStatusLabel,
  getSectionDisplayName,
  type ClassFormInput,
  type ClassListItem,
  type SchoolClass,
  type SectionFormInput,
  type SectionListItem,
} from "@/types/class";

type ClassesPageProps = {
  searchParams?: {
    q?: string;
    classSaved?: string;
    sectionSaved?: string;
    deleted?: string;
    toggled?: string;
    error?: string;
  };
};

export default async function ClassesPage({ searchParams }: ClassesPageProps) {
  const query = searchParams?.q?.trim() ?? "";

  const [classes, activeClasses, sections, counts] = await Promise.all([
    safeQuery(() => searchClasses(query), []),
    safeQuery(() => getActiveClasses(), []),
    safeQuery(() => getSections(), []),
    safeQuery(() => getClassesCount(), { total: 0, active: 0, inactive: 0, sections: 0 }),
  ]);

  const hasClasses = counts.total > 0;

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-[1350px] flex-col gap-6">
        <PageHeader
          title="الصفوف والشُعب"
          description="أنشئ الصفوف الدراسية ثم أضف الشُعب داخل كل صف، حتى يصبح تسجيل الطلاب وبناء الجدول أكثر ترتيبًا."
          icon="classes"
          badge="الخطوة الثالثة"
        />

        <ClassesFeedback
          classSaved={searchParams?.classSaved}
          sectionSaved={searchParams?.sectionSaved}
          deleted={searchParams?.deleted}
          toggled={searchParams?.toggled}
          error={searchParams?.error}
        />

        <SmartAlert
          tone="info"
          title="الترتيب الذكي: صف ثم شعبة ثم طالب"
          description="يفضل إنشاء الصفوف أولًا، ثم الشُعب، وبعدها إضافة الطلاب داخل الشُعب المناسبة."
          actionLabel="الخطوة التالية: الطلاب"
          actionHref="/students"
        />

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <ClassCreateForm />

          <div className="flex flex-col gap-6">
            <ClassesStats
              total={counts.total}
              active={counts.active}
              inactive={counts.inactive}
              sections={counts.sections}
            />

            <ClassSearchForm query={query} />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <SectionCreateForm classes={activeClasses} />

          <SectionsPanel sections={sections} />
        </section>

        {!hasClasses ? (
          <EmptyState
            icon="classes"
            title="لا توجد صفوف بعد"
            description="ابدأ بإضافة أول صف مثل: الأول الابتدائي، الثاني المتوسط، أو السادس الإعدادي. بعد ذلك أضف الشُعب."
            actionLabel="إضافة أول صف"
            actionHref="#class-form"
            secondaryLabel="الرجوع إلى المواد"
            secondaryHref="/subjects"
          />
        ) : classes.length === 0 ? (
          <EmptyState
            icon="search"
            title="لا توجد صفوف مطابقة للبحث"
            description="جرّب البحث باسم الصف أو المرحلة، أو امسح البحث لعرض كل الصفوف."
            actionLabel="عرض كل الصفوف"
            actionHref="/classes"
          />
        ) : (
          <ClassesList classes={classes} />
        )}
      </div>
    </AppShell>
  );
}

async function createClassAction(formData: FormData) {
  "use server";

  const input: ClassFormInput = {
    name: String(formData.get("name") ?? ""),
    level: String(formData.get("level") ?? ""),
    description: String(formData.get("description") ?? ""),
    isActive: formData.get("isActive") === "on",
  };

  const result = await createClass(input);

  if (!result.ok) {
    redirect("/classes?error=create-class");
  }

  revalidatePath("/");
  revalidatePath("/classes");
  redirect("/classes?classSaved=1");
}

async function createSectionAction(formData: FormData) {
  "use server";

  const input: SectionFormInput = {
    name: String(formData.get("name") ?? ""),
    capacity: String(formData.get("capacity") ?? ""),
    description: String(formData.get("description") ?? ""),
    classId: String(formData.get("classId") ?? ""),
    isActive: formData.get("isActive") === "on",
  };

  const result = await createSection(input);

  if (!result.ok) {
    redirect("/classes?error=create-section");
  }

  revalidatePath("/");
  revalidatePath("/classes");
  redirect("/classes?sectionSaved=1");
}

async function toggleClassAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");

  if (!id) {
    redirect("/classes?error=missing-id");
  }

  const result = await toggleClassStatus(id);

  if (!result.ok) {
    redirect("/classes?error=toggle-class");
  }

  revalidatePath("/");
  revalidatePath("/classes");
  redirect("/classes?toggled=1");
}

async function deleteClassAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");

  if (!id) {
    redirect("/classes?error=missing-id");
  }

  const result = await deleteClass(id);

  if (!result.ok) {
    redirect("/classes?error=delete-class");
  }

  revalidatePath("/");
  revalidatePath("/classes");
  redirect("/classes?deleted=1");
}

async function toggleSectionAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");

  if (!id) {
    redirect("/classes?error=missing-id");
  }

  const result = await toggleSectionStatus(id);

  if (!result.ok) {
    redirect("/classes?error=toggle-section");
  }

  revalidatePath("/");
  revalidatePath("/classes");
  redirect("/classes?toggled=1");
}

async function deleteSectionAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");

  if (!id) {
    redirect("/classes?error=missing-id");
  }

  const result = await deleteSection(id);

  if (!result.ok) {
    redirect("/classes?error=delete-section");
  }

  revalidatePath("/");
  revalidatePath("/classes");
  redirect("/classes?deleted=1");
}

type ClassesFeedbackProps = {
  classSaved?: string;
  sectionSaved?: string;
  deleted?: string;
  toggled?: string;
  error?: string;
};

function ClassesFeedback({
  classSaved,
  sectionSaved,
  deleted,
  toggled,
  error,
}: ClassesFeedbackProps) {
  if (classSaved === "1") {
    return (
      <SmartAlert
        tone="success"
        title="تمت إضافة الصف بنجاح"
        description="ممتاز، يمكنك الآن إضافة شعبة داخل هذا الصف."
      />
    );
  }

  if (sectionSaved === "1") {
    return (
      <SmartAlert
        tone="success"
        title="تمت إضافة الشعبة بنجاح"
        description="تم إنشاء الشعبة وربطها بالصف المختار."
      />
    );
  }

  if (deleted === "1") {
    return (
      <SmartAlert
        tone="success"
        title="تم الحذف بنجاح"
        description="تم حذف العنصر لأنه غير مرتبط بطلاب أو جدول دراسي."
      />
    );
  }

  if (toggled === "1") {
    return (
      <SmartAlert
        tone="success"
        title="تم تحديث الحالة"
        description="تم تغيير الحالة بين فعّال ومتوقف بنجاح."
      />
    );
  }

  if (error) {
    const description =
      error === "delete-class"
        ? "لا يمكن حذف الصف إذا كان يحتوي على شُعب أو طلاب أو جدول أو مواد مرتبطة."
        : error === "delete-section"
          ? "لا يمكن حذف الشعبة إذا كانت تحتوي على طلاب أو حصص في الجدول."
          : "تأكد من إدخال البيانات بشكل صحيح، وعدم تكرار الصف أو الشعبة.";

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

function ClassCreateForm() {
  return (
    <form
      id="class-form"
      action={createClassAction}
      className="app-card overflow-hidden"
    >
      <div className="border-b border-[var(--app-border-soft)] bg-gradient-to-l from-indigo-50/40 to-violet-50/20 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700">
            <GraduationCap size={24} />
          </div>

          <div>
            <h3 className="text-xl font-extrabold text-[var(--app-text)]">
              إضافة صف دراسي
            </h3>

            <p className="mt-1 text-sm leading-7 text-[var(--app-text-muted)]">
              الصف هو المستوى الدراسي، مثل الأول الابتدائي أو الثالث المتوسط.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-6">
        <div>
          <label
            htmlFor="class-name"
            className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
          >
            اسم الصف <span className="text-red-600">*</span>
          </label>

          <input
            id="class-name"
            name="name"
            required
            minLength={2}
            maxLength={80}
            placeholder="مثال: الأول الابتدائي"
            className="input"
          />
        </div>

        <div>
          <label
            htmlFor="class-level"
            className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
          >
            المرحلة
          </label>

          <input
            id="class-level"
            name="level"
            maxLength={50}
            placeholder="مثال: الابتدائية"
            className="input"
          />
        </div>

        <div>
          <label
            htmlFor="class-description"
            className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
          >
            وصف مختصر
          </label>

          <textarea
            id="class-description"
            name="description"
            rows={4}
            maxLength={300}
            placeholder="ملاحظات بسيطة عن الصف..."
            className="input min-h-[110px] resize-y leading-7"
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
              الصف فعّال
            </span>

            <span className="mt-1 block text-sm leading-6 text-[var(--app-text-muted)]">
              الصفوف الفعّالة تظهر عند إضافة الشُعب والطلاب.
            </span>
          </span>
        </label>
      </div>

      <div className="flex flex-col gap-3 border-t border-[var(--app-border-soft)] bg-gradient-to-l from-indigo-50/30 to-violet-50/20 p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-7 text-[var(--app-text-muted)]">
          بعد حفظ الصف، أضف شعبة واحدة على الأقل.
        </p>

        <button type="submit" className="btn btn-primary">
          <CheckCircle2 size={18} />
          حفظ الصف
        </button>
      </div>
    </form>
  );
}

type SectionCreateFormProps = {
  classes: SchoolClass[];
};

function SectionCreateForm({ classes }: SectionCreateFormProps) {
  return (
    <form action={createSectionAction} className="app-card overflow-hidden">
      <div className="border-b border-[var(--app-border-soft)] bg-gradient-to-l from-indigo-50/40 to-violet-50/20 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-700">
            <DoorOpen size={24} />
          </div>

          <div>
            <h3 className="text-xl font-extrabold text-[var(--app-text)]">
              إضافة شعبة
            </h3>

            <p className="mt-1 text-sm leading-7 text-[var(--app-text-muted)]">
              الشعبة تكون داخل الصف، مثل شعبة أ أو ب.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-6">
        <div>
          <label
            htmlFor="section-class"
            className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
          >
            الصف <span className="text-red-600">*</span>
          </label>

          <select
            id="section-class"
            name="classId"
            required
            disabled={classes.length === 0}
            className="input"
            defaultValue=""
          >
            <option value="" disabled>
              اختر الصف
            </option>

            {classes.map((schoolClass) => (
              <option key={schoolClass.id} value={schoolClass.id}>
                {getClassDisplayName(schoolClass)}
              </option>
            ))}
          </select>

          {classes.length === 0 ? (
            <p className="mt-2 text-sm leading-6 text-amber-700">
              أضف صفًا فعّالًا أولًا حتى تتمكن من إنشاء الشُعب.
            </p>
          ) : null}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="section-name"
              className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
            >
              اسم الشعبة <span className="text-red-600">*</span>
            </label>

            <input
              id="section-name"
              name="name"
              required
              maxLength={30}
              placeholder="مثال: أ"
              className="input"
            />
          </div>

          <div>
            <label
              htmlFor="section-capacity"
              className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
            >
              السعة
            </label>

            <input
              id="section-capacity"
              name="capacity"
              type="number"
              min={1}
              placeholder="مثال: 30"
              className="input"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="section-description"
            className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
          >
            وصف مختصر
          </label>

          <textarea
            id="section-description"
            name="description"
            rows={4}
            maxLength={300}
            placeholder="ملاحظات بسيطة عن الشعبة..."
            className="input min-h-[110px] resize-y leading-7"
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
              الشعبة فعّالة
            </span>

            <span className="mt-1 block text-sm leading-6 text-[var(--app-text-muted)]">
              الشُعب الفعّالة تظهر عند تسجيل الطلاب.
            </span>
          </span>
        </label>
      </div>

      <div className="flex flex-col gap-3 border-t border-[var(--app-border-soft)] bg-gradient-to-l from-indigo-50/30 to-violet-50/20 p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-7 text-[var(--app-text-muted)]">
          الشعبة ستُربط بالصف المختار مباشرة.
        </p>

        <button
          type="submit"
          disabled={classes.length === 0}
          className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          <CheckCircle2 size={18} />
          حفظ الشعبة
        </button>
      </div>
    </form>
  );
}

type ClassesStatsProps = {
  total: number;
  active: number;
  inactive: number;
  sections: number;
};

function ClassesStats({ total, active, inactive, sections }: ClassesStatsProps) {
  const stats = [
    {
      label: "إجمالي الصفوف",
      value: total,
      icon: GraduationCap,
      className: "bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700",
    },
    {
      label: "صفوف فعّالة",
      value: active,
      icon: CheckCircle2,
      className: "bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700",
    },
    {
      label: "صفوف متوقفة",
      value: inactive,
      icon: AlertTriangle,
      className: "bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700",
    },
    {
      label: "إجمالي الشُعب",
      value: sections,
      icon: DoorOpen,
      className: "bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-700",
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

type ClassSearchFormProps = {
  query: string;
};

function ClassSearchForm({ query }: ClassSearchFormProps) {
  return (
    <form action="/classes" className="app-card p-5">
      <label
        htmlFor="q"
        className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
      >
        البحث في الصفوف
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
            placeholder="ابحث باسم الصف أو المرحلة..."
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

type SectionsPanelProps = {
  sections: SectionListItem[];
};

function SectionsPanel({ sections }: SectionsPanelProps) {
  return (
    <section className="app-card overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-[var(--app-border-soft)] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-extrabold text-[var(--app-text)]">
            الشُعب المسجلة
          </h3>

          <p className="mt-1 text-sm leading-6 text-[var(--app-text-muted)]">
            قائمة مختصرة بالشُعب المرتبطة بالصفوف.
          </p>
        </div>

        <span className="badge badge-info">{sections.length} شعبة</span>
      </div>

      {sections.length === 0 ? (
        <div className="p-6">
          <SmartAlert
            tone="info"
            title="لا توجد شُعب بعد"
            description="بعد إضافة الصف، أنشئ شعبة واحدة على الأقل حتى يمكن تسجيل الطلاب داخلها."
          />
        </div>
      ) : (
        <div className="divide-y divide-[var(--app-border-soft)]">
          {sections.map((section) => (
            <SectionRow key={section.id} section={section} />
          ))}
        </div>
      )}
    </section>
  );
}

type SectionRowProps = {
  section: SectionListItem;
};

function SectionRow({ section }: SectionRowProps) {
  const statusClass = section.isActive ? "badge-success" : "badge-warning";
  const statusLabel = section.isActive ? "فعّالة" : "متوقفة";

  return (
    <article className="grid gap-4 p-5 transition hover:bg-indigo-50/40 lg:grid-cols-[1fr_auto] lg:items-center">
      <div className="flex gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-700">
          <DoorOpen size={22} />
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-extrabold text-[var(--app-text)]">
              {getSectionDisplayName(section)}
            </h4>

            <span className={["badge", statusClass].join(" ")}>
              {statusLabel}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <span className="badge bg-slate-100 text-slate-600">
              الطلاب: {section.studentsCount}
            </span>

            <span className="badge bg-slate-100 text-slate-600">
              الحصص: {section.schedulesCount}
            </span>

            <span className="badge bg-slate-100 text-slate-600">
              السعة: {section.capacity ?? "غير محددة"}
            </span>
          </div>

          {section.description ? (
            <p className="mt-3 text-sm leading-7 text-[var(--app-text-muted)]">
              {section.description}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
        <form action={toggleSectionAction}>
          <input type="hidden" name="id" value={section.id} />

          <button type="submit" className="btn btn-secondary w-full">
            <Power size={17} />
            {section.isActive ? "تعطيل" : "تفعيل"}
          </button>
        </form>

        <form action={deleteSectionAction}>
          <input type="hidden" name="id" value={section.id} />

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

type ClassesListProps = {
  classes: ClassListItem[];
};

function ClassesList({ classes }: ClassesListProps) {
  return (
    <section className="app-card overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-[var(--app-border-soft)] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-extrabold text-[var(--app-text)]">
            قائمة الصفوف
          </h3>

          <p className="mt-1 text-sm leading-6 text-[var(--app-text-muted)]">
            تابع الصفوف وعدد الشُعب والطلاب والمواد المرتبطة بها.
          </p>
        </div>

        <span className="badge badge-info">{classes.length} صف</span>
      </div>

      <div className="divide-y divide-[var(--app-border-soft)]">
        {classes.map((schoolClass) => (
          <ClassRow key={schoolClass.id} schoolClass={schoolClass} />
        ))}
      </div>
    </section>
  );
}

type ClassRowProps = {
  schoolClass: ClassListItem;
};

function ClassRow({ schoolClass }: ClassRowProps) {
  const status = getClassStatus(schoolClass);
  const statusLabel = getClassStatusLabel(status);
  const statusClass = status === "active" ? "badge-success" : "badge-warning";

  return (
    <article className="grid gap-4 p-5 transition hover:bg-indigo-50/40 lg:grid-cols-[1fr_auto] lg:items-center">
      <div className="flex min-w-0 gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700">
          <GraduationCap size={25} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-lg font-extrabold text-[var(--app-text)]">
              {getClassDisplayName(schoolClass)}
            </h4>

            <span className={["badge", statusClass].join(" ")}>
              {statusLabel}
            </span>
          </div>

          {schoolClass.description ? (
            <p className="mt-3 text-sm leading-7 text-[var(--app-text-muted)]">
              {schoolClass.description}
            </p>
          ) : (
            <p className="mt-3 text-sm leading-7 text-[var(--app-text-soft)]">
              لا يوجد وصف لهذا الصف.
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="badge bg-slate-100 text-slate-600">
              <ListTree size={14} />
              الشُعب: {schoolClass.sectionsCount}
            </span>

            <span className="badge bg-slate-100 text-slate-600">
              <Users size={14} />
              الطلاب: {schoolClass.studentsCount}
            </span>

            <span className="badge bg-slate-100 text-slate-600">
              <Layers3 size={14} />
              المواد: {schoolClass.subjectsCount}
            </span>

            <span className="badge bg-slate-100 text-slate-600">
              الحصص: {schoolClass.schedulesCount}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
        <form action={toggleClassAction}>
          <input type="hidden" name="id" value={schoolClass.id} />

          <button type="submit" className="btn btn-secondary w-full">
            <Power size={17} />
            {schoolClass.isActive ? "تعطيل" : "تفعيل"}
          </button>
        </form>

        <form action={deleteClassAction}>
          <input type="hidden" name="id" value={schoolClass.id} />

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
