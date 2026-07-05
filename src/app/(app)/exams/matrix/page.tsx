import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpen, CalendarDays, Columns3, GraduationCap, Layers, PlusCircle, SlidersHorizontal } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { safeQuery } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { SmartAlert } from "@/components/shared/smart-alert";
import { ExamMatrixTable } from "@/components/grades/exam-matrix-table";
import { getSections } from "@/services/class-service";
import { getActiveSubjects } from "@/services/subject-service";
import { getActiveTeachers } from "@/services/teacher-service";
import { createExam } from "@/services/exam-service";
import {
  ALL_VISIBLE_EXAMS_VALUE,
  DEFAULT_VISIBLE_EXAMS_COUNT,
  VISIBLE_EXAM_COUNT_OPTIONS,
  getExamMatrixData,
  normalizeVisibleExamCount,
  saveExamMatrixGrades,
} from "@/services/exam-matrix-service";
import { EXAM_TYPES } from "@/types/grade";
import { getSectionDisplayName } from "@/types/class";

export const dynamic = "force-dynamic";

type ExamMatrixPageProps = {
  searchParams?: Promise<{
    sectionId?: string;
    subjectId?: string;
    visibleCount?: string;
    saved?: string;
    added?: string;
    error?: string;
    reason?: string;
  }>;
};

function asArray<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

function buildMatrixHref(input: { sectionId?: string; subjectId?: string; visibleCount?: number | string; extra?: Record<string, string> }) {
  const params = new URLSearchParams();
  if (input.sectionId) params.set("sectionId", input.sectionId);
  if (input.subjectId) params.set("subjectId", input.subjectId);
  params.set("visibleCount", String(input.visibleCount ?? DEFAULT_VISIBLE_EXAMS_COUNT));
  for (const [key, value] of Object.entries(input.extra ?? {})) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return `/exams/matrix${query ? `?${query}` : ""}`;
}

function formatFullDate(value?: string | null) {
  if (!value) return "بدون تاريخ";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "بدون تاريخ";
  return date.toLocaleDateString("ar-IQ", { year: "numeric", month: "long", day: "numeric" });
}

export default async function ExamMatrixPage({ searchParams }: ExamMatrixPageProps) {
  await requireAdmin();
  const resolvedSearchParams = await searchParams;

  const sectionId = resolvedSearchParams?.sectionId?.trim() ?? "";
  const subjectId = resolvedSearchParams?.subjectId?.trim() ?? "";
  const visibleCount = normalizeVisibleExamCount(resolvedSearchParams?.visibleCount ?? DEFAULT_VISIBLE_EXAMS_COUNT);

  const [rawSections, rawSubjects, rawTeachers, matrix] = await Promise.all([
    safeQuery(() => getSections(), []),
    safeQuery(() => getActiveSubjects(), []),
    safeQuery(() => getActiveTeachers(), []),
    safeQuery(() => getExamMatrixData({ sectionId, subjectId, visibleCount }), null),
  ]);

  const sections = asArray(rawSections) as Awaited<ReturnType<typeof getSections>>;
  const subjects = asArray(rawSubjects) as Awaited<ReturnType<typeof getActiveSubjects>>;
  const teachers = asArray(rawTeachers) as Awaited<ReturnType<typeof getActiveTeachers>>;
  const hasSelection = Boolean(sectionId && subjectId);

  return (
    <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <a href="/grades" className="inline-flex items-center gap-2 text-sm font-extrabold text-[var(--app-text-muted)] hover:text-[var(--app-primary)]">
          <ArrowRight size={16} /> العودة إلى الدرجات
        </a>
        <a href="/exams" className="btn btn-secondary">إدارة الامتحانات القديمة</a>
      </div>

      <PageHeader
        title="دفتر درجات الامتحانات"
        description="صفوف الطلاب تبقى ثابتة، وكل امتحان تضيفه يظهر كعمود جديد. اختر الصف والمادة، حدد عدد الأعمدة الظاهرة، ثم احفظ كل الدرجات من جدول واحد."
        icon="grades"
        badge="أعمدة ديناميكية"
      />

      {resolvedSearchParams?.added === "1" ? (
        <SmartAlert tone="success" title="تمت إضافة عمود امتحان" description="ظهر الامتحان الجديد ضمن أعمدة دفتر الدرجات ويمكنك إدخال درجاته مباشرة." />
      ) : null}
      {resolvedSearchParams?.saved === "1" ? (
        <SmartAlert tone="success" title="تم حفظ دفتر الدرجات" description="تم حفظ أو تحديث الدرجات الموجودة داخل الأعمدة الظاهرة." />
      ) : null}
      {resolvedSearchParams?.error ? (
        <SmartAlert tone="warning" title="لم تكتمل العملية" description={resolvedSearchParams.reason ?? "راجع الصف والمادة والدرجات، ثم حاول مرة ثانية."} />
      ) : null}

      <UsageGuide />

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <MatrixFilterForm
          sections={sections}
          subjects={subjects}
          sectionId={sectionId}
          subjectId={subjectId}
          visibleCount={visibleCount}
        />

        <AddExamColumnForm
          enabled={hasSelection}
          sectionId={sectionId}
          subjectId={subjectId}
          visibleCount={visibleCount}
          teachers={teachers}
        />
      </section>

      {hasSelection && matrix ? (
        <section className="grid gap-4 md:grid-cols-4">
          <InfoCard icon={<Layers size={20} />} label="الصف / الشعبة" value={matrix.section ? `${matrix.section.className ?? "صف غير محدد"} / شعبة ${matrix.section.name}` : "غير محدد"} />
          <InfoCard icon={<BookOpen size={20} />} label="المادة" value={matrix.subject?.name ?? "غير محددة"} />
          <InfoCard icon={<Columns3 size={20} />} label="الأعمدة الظاهرة" value={`${matrix.exams.length} من ${matrix.totalExams}`} hint={visibleCount === ALL_VISIBLE_EXAMS_VALUE ? "كل الامتحانات" : `آخر ${visibleCount} امتحانات`} />
          <InfoCard icon={<CalendarDays size={20} />} label="آخر عمود" value={matrix.exams[0]?.name ?? "لا يوجد"} hint={formatFullDate(matrix.exams[0]?.date)} />
        </section>
      ) : null}

      {!hasSelection ? (
        <section className="app-card p-6">
          <h3 className="text-xl font-extrabold text-[var(--app-text)]">ابدأ باختيار الصف والمادة</h3>
          <p className="mt-2 text-sm leading-7 text-[var(--app-text-muted)]">
            بعد الاختيار ستظهر الطالبات كصفوف، والامتحانات الحالية كأعمدة. من نفس الصفحة تضيف عمود امتحان جديد وتحدد كم عمود يظهر.
          </p>
        </section>
      ) : matrix ? (
        <ExamMatrixTable
          sectionId={sectionId}
          subjectId={subjectId}
          visibleCount={visibleCount}
          students={matrix.students}
          exams={matrix.exams}
          grades={matrix.grades}
          action={saveMatrixGradesAction}
        />
      ) : (
        <SmartAlert tone="warning" title="تعذر تحميل دفتر الدرجات" description="تحقق من اتصال قاعدة البيانات أو من وجود الصف والمادة المختارين." />
      )}
    </div>
  );
}

function UsageGuide() {
  const steps = [
    "اختر الصف / الشعبة ثم المادة حتى يتحدد دفتر الدرجات الصحيح.",
    "اضغط إضافة عمود امتحان لإضافة امتحان جديد يظهر مباشرة كعمود في الجدول.",
    "من خيار عدد الأعمدة الظاهرة اختر آخر 4 أو 8 أو 12 امتحانًا، أو اعرض الكل عند الحاجة.",
    "اكتب الدرجة داخل الخلية، واكتب الملاحظة بجانبها إذا كانت الطالبة غائبة أو لم تمتحن.",
    "اضغط حفظ الدفتر مرة واحدة لحفظ كل الدرجات الظاهرة دفعة واحدة.",
  ];

  return (
    <section className="app-card overflow-hidden">
      <div className="border-b border-[var(--app-border-soft)] bg-gradient-to-l from-indigo-50/40 to-amber-50/20 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
            <SlidersHorizontal size={24} />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-[var(--app-text)]">طريقة استخدام الميزة</h3>
            <p className="mt-1 text-sm leading-7 text-[var(--app-text-muted)]">
              الميزة لا تغيّر نظام الامتحانات القديم؛ فقط تعرضه بطريقة أسرع: كل امتحان عمود، وكل طالبة صف.
            </p>
          </div>
        </div>
      </div>
      <div className="grid gap-3 p-6 lg:grid-cols-5">
        {steps.map((step, index) => (
          <div key={step} className="rounded-2xl border border-[var(--app-border-soft)] bg-[var(--app-card-soft)] p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-sm font-extrabold text-[var(--app-primary)]">{index + 1}</div>
            <p className="text-sm font-bold leading-7 text-[var(--app-text-muted)]">{step}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function MatrixFilterForm({ sections, subjects, sectionId, subjectId, visibleCount }: {
  sections: Awaited<ReturnType<typeof getSections>>;
  subjects: Awaited<ReturnType<typeof getActiveSubjects>>;
  sectionId: string;
  subjectId: string;
  visibleCount: number;
}) {
  return (
    <form action="/exams/matrix" className="app-card overflow-hidden">
      <div className="border-b border-[var(--app-border-soft)] p-6">
        <h3 className="text-xl font-extrabold text-[var(--app-text)]">اختيار دفتر الدرجات</h3>
        <p className="mt-1 text-sm leading-7 text-[var(--app-text-muted)]">الفلاتر هنا تحدد أي أعمدة امتحانات ستظهر للطلاب.</p>
      </div>

      <div className="grid gap-5 p-6 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-extrabold text-[var(--app-text)]">
          <span><Layers size={14} className="ml-1 inline" /> الصف / الشعبة</span>
          <select name="sectionId" className="input" required defaultValue={sectionId}>
            <option value="" disabled>اختر الصف</option>
            {sections.map((section) => <option key={section.id} value={section.id}>{getSectionDisplayName(section)}</option>)}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-extrabold text-[var(--app-text)]">
          <span><BookOpen size={14} className="ml-1 inline" /> المادة</span>
          <select name="subjectId" className="input" required defaultValue={subjectId}>
            <option value="" disabled>اختر المادة</option>
            {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-extrabold text-[var(--app-text)]">
          عدد الامتحانات الظاهرة
          <select name="visibleCount" className="input" defaultValue={visibleCount}>
            {VISIBLE_EXAM_COUNT_OPTIONS.map((count) => (
              <option key={count} value={count}>{count === ALL_VISIBLE_EXAMS_VALUE ? "كل الامتحانات" : `آخر ${count} امتحانات`}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-col gap-3 border-t border-[var(--app-border-soft)] p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-7 text-[var(--app-text-muted)]">اختيار آخر 4 يجعل الصفحة خفيفة، واختيار الكل يفيد للمراجعة الشاملة.</p>
        <div className="flex flex-wrap gap-2">
          <a href="/exams/matrix" className="btn btn-secondary">تصفير</a>
          <button type="submit" className="btn btn-primary">عرض الدفتر</button>
        </div>
      </div>
    </form>
  );
}

function AddExamColumnForm({ enabled, sectionId, subjectId, visibleCount, teachers }: {
  enabled: boolean;
  sectionId: string;
  subjectId: string;
  visibleCount: number;
  teachers: Awaited<ReturnType<typeof getActiveTeachers>>;
}) {
  return (
    <form action={createExamColumnAction} className="app-card overflow-hidden">
      <input type="hidden" name="sectionId" value={sectionId} />
      <input type="hidden" name="subjectId" value={subjectId} />
      <input type="hidden" name="visibleCount" value={visibleCount} />

      <div className="border-b border-[var(--app-border-soft)] p-6">
        <h3 className="text-xl font-extrabold text-[var(--app-text)]">إضافة عمود امتحان</h3>
        <p className="mt-1 text-sm leading-7 text-[var(--app-text-muted)]">
          بعد الحفظ يظهر الامتحان الجديد كعمود إضافي في دفتر نفس الصف والمادة.
        </p>
      </div>

      <fieldset disabled={!enabled} className={!enabled ? "opacity-60" : ""}>
        <div className="grid gap-5 p-6 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-extrabold text-[var(--app-text)] md:col-span-2">
            اسم الامتحان
            <input name="name" className="input" minLength={2} maxLength={120} required={enabled} placeholder="مثال: إنكليزي - امتحان الأسبوع 1" />
          </label>

          <label className="grid gap-2 text-sm font-extrabold text-[var(--app-text)]">
            الدرجة الكلية
            <input name="maxScore" type="number" min={1} className="input" defaultValue={10} required={enabled} />
          </label>

          <label className="grid gap-2 text-sm font-extrabold text-[var(--app-text)]">
            درجة النجاح
            <input name="passScore" type="number" min={0} className="input" defaultValue={5} required={enabled} />
          </label>

          <label className="grid gap-2 text-sm font-extrabold text-[var(--app-text)]">
            التاريخ
            <input name="date" type="date" className="input" />
          </label>

          <label className="grid gap-2 text-sm font-extrabold text-[var(--app-text)]">
            النوع
            <select name="type" className="input" defaultValue="daily">
              {EXAM_TYPES.slice(0, 5).map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-extrabold text-[var(--app-text)] md:col-span-2">
            <span><GraduationCap size={14} className="ml-1 inline" /> المدرس</span>
            <select name="teacherId" className="input" defaultValue="">
              <option value="">بدون مدرس محدد</option>
              {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.fullName}</option>)}
            </select>
          </label>
        </div>
      </fieldset>

      <div className="flex flex-col gap-3 border-t border-[var(--app-border-soft)] p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-7 text-[var(--app-text-muted)]">
          {!enabled ? "اختر الصف والمادة أولًا حتى تتمكن من إضافة عمود." : "الإضافة هنا لا تحفظ درجات؛ فقط تنشئ عمود امتحان جديد."}
        </p>
        <button type="submit" disabled={!enabled} className="btn btn-primary min-w-[180px] justify-center disabled:cursor-not-allowed disabled:opacity-50">
          <PlusCircle size={18} /> إضافة العمود
        </button>
      </div>
    </form>
  );
}

function InfoCard({ icon, label, value, hint }: { icon?: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <div className="app-card p-5">
      <div className="flex items-start gap-3">
        {icon ? <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">{icon}</div> : null}
        <div>
          <p className="text-xs font-bold text-[var(--app-text-soft)]">{label}</p>
          <p className="mt-1 text-base font-extrabold text-[var(--app-text)]">{value}</p>
          {hint ? <p className="mt-1 text-xs font-bold text-[var(--app-text-muted)]">{hint}</p> : null}
        </div>
      </div>
    </div>
  );
}

async function createExamColumnAction(formData: FormData) {
  "use server";

  const sectionId = String(formData.get("sectionId") ?? "");
  const subjectId = String(formData.get("subjectId") ?? "");
  const visibleCount = normalizeVisibleExamCount(formData.get("visibleCount") ?? DEFAULT_VISIBLE_EXAMS_COUNT);
  const result = await createExam({
    name: String(formData.get("name") ?? ""),
    type: String(formData.get("type") ?? "daily"),
    date: String(formData.get("date") ?? "") || undefined,
    maxScore: Number(formData.get("maxScore") ?? 10),
    passScore: Number(formData.get("passScore") ?? 5),
    notes: "",
    subjectId,
    sectionId,
    teacherId: String(formData.get("teacherId") ?? "") || undefined,
  });

  if (!result.ok) redirect(buildMatrixHref({ sectionId, subjectId, visibleCount, extra: { error: "1", reason: result.message } }));
  revalidatePath("/exams");
  revalidatePath("/grades");
  revalidatePath("/exams/matrix");
  redirect(buildMatrixHref({ sectionId, subjectId, visibleCount, extra: { added: "1" } }));
}

async function saveMatrixGradesAction(formData: FormData) {
  "use server";

  const sectionId = String(formData.get("sectionId") ?? "");
  const subjectId = String(formData.get("subjectId") ?? "");
  const visibleCount = normalizeVisibleExamCount(formData.get("visibleCount") ?? DEFAULT_VISIBLE_EXAMS_COUNT);
  const cellKeys = formData.getAll("cellKeys").map((value) => String(value));
  const cells = cellKeys
    .map((key) => {
      const [studentId, examId] = key.split("::");
      const scoreRaw = String(formData.get(`score__${studentId}__${examId}`) ?? "").trim();
      const score = scoreRaw === "" ? NaN : Number(scoreRaw);
      return {
        studentId,
        examId,
        score,
        notes: String(formData.get(`notes__${studentId}__${examId}`) ?? ""),
      };
    })
    .filter((cell) => cell.studentId && cell.examId && Number.isFinite(cell.score));

  const result = await saveExamMatrixGrades({ sectionId, subjectId, cells });
  if (!result.ok) redirect(buildMatrixHref({ sectionId, subjectId, visibleCount, extra: { error: "1", reason: result.message } }));

  revalidatePath("/exams/matrix");
  revalidatePath("/grades");
  revalidatePath("/reports");
  redirect(buildMatrixHref({ sectionId, subjectId, visibleCount, extra: { saved: "1" } }));
}
