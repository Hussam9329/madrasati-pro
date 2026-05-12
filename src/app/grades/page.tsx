export const dynamic = 'force-dynamic';
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Search,
  Star,
  TrendingDown,
  TrendingUp,
  Trash2,
  UserRound,
  XCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SmartAlert } from "@/components/shared/smart-alert";
import {
  createGrade,
  deleteGrade,
  getGrades,
  getGradesCount,
} from "@/services/grade-service";
import { getActiveStudents } from "@/services/student-service";
import { getActiveSubjects } from "@/services/subject-service";
import { getActiveTeachers } from "@/services/teacher-service";
import {
  EXAM_TYPES,
  TERMS,
  formatGradeShortDate,
  getExamTypeLabel,
  getTermLabel,
  type GradeFormInput,
  type GradeListItem,
} from "@/types/grade";

type GradesPageProps = {
  searchParams?: {
    q?: string;
    examType?: string;
    term?: string;
    saved?: string;
    deleted?: string;
    error?: string;
  };
};

export default async function GradesPage({ searchParams }: GradesPageProps) {
  const query = searchParams?.q?.trim() ?? "";
  const examType = searchParams?.examType?.trim() ?? "";
  const term = searchParams?.term?.trim() ?? "";

  const [grades, counts, students, subjects, teachers] = await Promise.all([
    getGrades({
      query,
      examType: examType || undefined,
      term: term || undefined,
    }),
    getGradesCount(),
    getActiveStudents(),
    getActiveSubjects(),
    getActiveTeachers(),
  ]);

  const hasGrades = counts.total > 0;

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-[1350px] flex-col gap-6">
        <PageHeader
          title="الدرجات"
          description="أدخل درجات الطلاب وتابع مستواهم في المواد والاختبارات المختلفة."
          icon="grades"
          badge="الخطوة الخامسة"
        />

        <GradesFeedback
          saved={searchParams?.saved}
          deleted={searchParams?.deleted}
          error={searchParams?.error}
        />

        <SmartAlert
          tone="info"
          title="الدرجات تحتاج مواد وطلاب"
          description="قبل إدخال الدرجات، تأكد من إضافة المواد الدراسية والطلاب وربطهم بالصفوف."
          actionLabel="إدارة المواد"
          actionHref="/subjects"
        />

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <GradeCreateForm
            students={students}
            subjects={subjects}
            teachers={teachers}
          />

          <div className="flex flex-col gap-6">
            <GradesStats
              total={counts.total}
              excellent={counts.excellent}
              passed={counts.passed}
              failed={counts.failed}
              averagePercentage={counts.averagePercentage}
            />

            <GradeSearchForm
              query={query}
              examType={examType}
              term={term}
            />
          </div>
        </section>

        {!hasGrades ? (
          <EmptyState
            icon="grades"
            title="لا توجد درجات بعد"
            description="اختر الصف والمادة والاختبار، ثم أدخل درجات الطلاب بطريقة سهلة وسريعة."
            actionLabel="إدخال درجات"
            actionHref="#grade-form"
            secondaryLabel="إدارة المواد"
            secondaryHref="/subjects"
          />
        ) : grades.length === 0 ? (
          <EmptyState
            icon="search"
            title="لا توجد نتائج مطابقة"
            description="جرّب البحث بعنوان الدرجة أو اسم الطالب، أو غيّر فلتر الاختبار أو الفصل."
            actionLabel="عرض كل الدرجات"
            actionHref="/grades"
          />
        ) : (
          <GradesList grades={grades} />
        )}
      </div>
    </AppShell>
  );
}

async function createGradeAction(formData: FormData) {
  "use server";

  const input: GradeFormInput = {
    title: String(formData.get("title") ?? ""),
    score: String(formData.get("score") ?? "0"),
    maxScore: String(formData.get("maxScore") ?? "100"),
    examType: String(formData.get("examType") ?? "monthly"),
    term: String(formData.get("term") ?? "first"),
    date: String(formData.get("date") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    studentId: String(formData.get("studentId") ?? ""),
    subjectId: String(formData.get("subjectId") ?? ""),
    teacherId: String(formData.get("teacherId") ?? ""),
  };

  const result = await createGrade(input);

  if (!result.ok) {
    redirect("/grades?error=create");
  }

  revalidatePath("/");
  revalidatePath("/grades");
  redirect("/grades?saved=1");
}

async function deleteGradeAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");

  if (!id) {
    redirect("/grades?error=missing-id");
  }

  const result = await deleteGrade(id);

  if (!result.ok) {
    redirect("/grades?error=delete");
  }

  revalidatePath("/");
  revalidatePath("/grades");
  redirect("/grades?deleted=1");
}

type GradesFeedbackProps = {
  saved?: string;
  deleted?: string;
  error?: string;
};

function GradesFeedback({ saved, deleted, error }: GradesFeedbackProps) {
  if (saved === "1") {
    return (
      <SmartAlert
        tone="success"
        title="تمت إضافة الدرجة بنجاح"
        description="تم حفظ الدرجة وربطها بالطالب والمادة المحددة."
      />
    );
  }

  if (deleted === "1") {
    return (
      <SmartAlert
        tone="success"
        title="تم حذف الدرجة"
        description="تم حذف الدرجة من السجل بنجاح."
      />
    );
  }

  if (error) {
    const description =
      error === "delete"
        ? "لا يمكن حذف الدرجة حاليًا. تحقق من البيانات وحاول مرة أخرى."
        : "تأكد من إدخال جميع البيانات المطلوبة بشكل صحيح، وأن الطالب مستمر والمادة فعّالة.";

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

type GradeCreateFormProps = {
  students: Awaited<ReturnType<typeof getActiveStudents>>;
  subjects: Awaited<ReturnType<typeof getActiveSubjects>>;
  teachers: Awaited<ReturnType<typeof getActiveTeachers>>;
};

function GradeCreateForm({ students, subjects, teachers }: GradeCreateFormProps) {
  return (
    <form
      id="grade-form"
      action={createGradeAction}
      className="app-card overflow-hidden"
    >
      <div className="border-b border-[var(--app-border-soft)] bg-gradient-to-l from-indigo-50/40 to-violet-50/20 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700">
            <ClipboardList size={24} />
          </div>

          <div>
            <h3 className="text-xl font-extrabold text-[var(--app-text)]">
              إدخال درجة
            </h3>

            <p className="mt-1 text-sm leading-7 text-[var(--app-text-muted)]">
              أدخل بيانات الدرجة واختر الطالب والمادة والاختبار.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-6">
        <div>
          <label
            htmlFor="title"
            className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
          >
            عنوان الدرجة <span className="text-red-600">*</span>
          </label>

          <input
            id="title"
            name="title"
            required
            minLength={2}
            maxLength={120}
            placeholder="مثال: اختبار الرياضيات الشهري"
            className="input"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="score"
              className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
            >
              درجة الطالب <span className="text-red-600">*</span>
            </label>

            <input
              id="score"
              name="score"
              type="number"
              required
              min={0}
              step="0.5"
              placeholder="مثال: 85"
              className="input ltr text-right"
            />
          </div>

          <div>
            <label
              htmlFor="maxScore"
              className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
            >
              الدرجة الكلية <span className="text-red-600">*</span>
            </label>

            <input
              id="maxScore"
              name="maxScore"
              type="number"
              required
              min={1}
              step="0.5"
              defaultValue={100}
              placeholder="مثال: 100"
              className="input ltr text-right"
            />
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div>
            <label
              htmlFor="date"
              className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
            >
              تاريخ الاختبار
            </label>

            <input
              id="date"
              name="date"
              type="date"
              className="input"
            />
          </div>

          <div>
            <label
              htmlFor="examType"
              className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
            >
              نوع الاختبار
            </label>

            <select id="examType" name="examType" defaultValue="monthly" className="input">
              {EXAM_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="term"
              className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
            >
              الفصل الدراسي
            </label>

            <select id="term" name="term" defaultValue="first" className="input">
              {TERMS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
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
              <option value="" disabled>
                اختر الطالب
              </option>

              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.fullName}
                  {student.studentCode ? ` - ${student.studentCode}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="subjectId"
              className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
            >
              المادة الدراسية <span className="text-red-600">*</span>
            </label>

            <select id="subjectId" name="subjectId" required defaultValue="" className="input">
              <option value="" disabled>
                اختر المادة
              </option>

              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                  {subject.code ? ` (${subject.code})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="teacherId"
            className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
          >
            المدرس
          </label>

          <select id="teacherId" name="teacherId" defaultValue="" className="input">
            <option value="">بدون مدرس محدد</option>

            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.fullName}
                {teacher.specialty ? ` - ${teacher.specialty}` : ""}
              </option>
            ))}
          </select>
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
          بعد إدخال الدرجات، يمكنك متابعة مستوى الطلاب والتقارير.
        </p>

        <button type="submit" className="btn btn-primary">
          <CheckCircle2 size={18} />
          حفظ الدرجة
        </button>
      </div>
    </form>
  );
}

type GradesStatsProps = {
  total: number;
  excellent: number;
  passed: number;
  failed: number;
  averagePercentage: number;
};

function GradesStats({
  total,
  excellent,
  passed,
  failed,
  averagePercentage,
}: GradesStatsProps) {
  const stats = [
    {
      label: "إجمالي الدرجات",
      value: total,
      icon: BarChart3,
      className: "bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700",
    },
    {
      label: "ممتاز",
      value: excellent,
      icon: Star,
      className: "bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700",
    },
    {
      label: "ناجح",
      value: passed,
      icon: TrendingUp,
      className: "bg-gradient-to-br from-sky-100 to-cyan-100 text-sky-700",
    },
    {
      label: "راسب",
      value: failed,
      icon: TrendingDown,
      className: "bg-rose-100 text-rose-700",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
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

      <div className="app-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Award size={20} />
            </div>

            <div>
              <p className="text-sm font-bold text-[var(--app-text-muted)]">
                متوسط النسبة المئوية
              </p>

              <p className="text-2xl font-extrabold text-[var(--app-text)]">
                {averagePercentage}%
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-amber-500 transition-all duration-500"
            style={{ width: `${averagePercentage}%` }}
          />
        </div>

        <p className="mt-2 text-xs text-[var(--app-text-soft)]">
          {averagePercentage >= 70
            ? "مستوى جيد بشكل عام"
            : averagePercentage >= 50
              ? "المستوى يحتاج تحسين"
              : "المستوى ضعيف ويحتاج متابعة"}
        </p>
      </div>
    </div>
  );
}

type GradeSearchFormProps = {
  query: string;
  examType: string;
  term: string;
};

function GradeSearchForm({ query, examType, term }: GradeSearchFormProps) {
  return (
    <form action="/grades" className="app-card p-5">
      <label
        htmlFor="q"
        className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
      >
        البحث والتصفية
      </label>

      <div className="grid gap-3 md:grid-cols-[1fr_160px_140px_auto]">
        <div className="relative">
          <Search
            size={18}
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--app-text-soft)]"
          />

          <input
            id="q"
            name="q"
            defaultValue={query}
            placeholder="عنوان الدرجة، اسم الطالب، المادة..."
            className="input pr-11"
          />
        </div>

        <select name="examType" defaultValue={examType} className="input">
          <option value="">كل الاختبارات</option>
          {EXAM_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>

        <select name="term" defaultValue={term} className="input">
          <option value="">كل الفصول</option>
          {TERMS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
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

type GradesListProps = {
  grades: GradeListItem[];
};

function GradesList({ grades }: GradesListProps) {
  return (
    <section className="app-card overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-[var(--app-border-soft)] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-extrabold text-[var(--app-text)]">
            قائمة الدرجات
          </h3>

          <p className="mt-1 text-sm leading-6 text-[var(--app-text-muted)]">
            تابع الدرجات المسجلة وتصنيفاتها ومستويات الطلاب.
          </p>
        </div>

        <span className="badge badge-info">{grades.length} درجة</span>
      </div>

      <div className="divide-y divide-[var(--app-border-soft)]">
        {grades.map((grade) => (
          <GradeRow key={grade.id} grade={grade} />
        ))}
      </div>
    </section>
  );
}

type GradeRowProps = {
  grade: GradeListItem;
};

function GradeRow({ grade }: GradeRowProps) {
  const ratingBadgeClass =
    grade.ratingClass === "badge-success"
      ? "bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700"
      : grade.ratingClass === "badge-info"
        ? "bg-gradient-to-br from-sky-100 to-cyan-100 text-sky-700"
        : grade.ratingClass === "badge-warning"
          ? "bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700"
          : "bg-rose-100 text-rose-700";

  return (
    <article className="grid gap-4 p-5 transition hover:bg-indigo-50/40 xl:grid-cols-[1fr_auto] xl:items-center">
      <div className="flex min-w-0 gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700">
          <ClipboardList size={25} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-lg font-extrabold text-[var(--app-text)]">
              {grade.title}
            </h4>

            <span className={["badge", ratingBadgeClass].join(" ")}>
              {grade.rating}
            </span>

            <span className="badge bg-slate-100 text-slate-600">
              {grade.examTypeLabel}
            </span>

            <span className="badge bg-slate-100 text-slate-600">
              {grade.termLabel}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-2 text-sm text-[var(--app-text-muted)]">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-bold">
              <UserRound size={14} />
              {grade.studentName}
            </span>

            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-bold">
              <BookOpen size={14} />
              {grade.subjectName}
            </span>

            {grade.teacherName && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-bold">
                {grade.teacherName}
              </span>
            )}
          </div>

          <div className="mt-3 grid gap-2 text-sm leading-6 text-[var(--app-text-muted)] md:grid-cols-3">
            <p>
              الدرجة:{" "}
              <span className="font-bold text-[var(--app-text)]">
                {grade.score} / {grade.maxScore}
              </span>
            </p>

            <p>
              النسبة:{" "}
              <span className="font-bold text-[var(--app-text)]">
                {grade.percentage}%
              </span>
            </p>

            <p>
              التاريخ:{" "}
              <span className="font-bold text-[var(--app-text)]">
                {formatGradeShortDate(grade.date)}
              </span>
            </p>
          </div>

          {grade.className && (
            <div className="mt-2">
              <span className="badge bg-slate-100 text-slate-600">
                {grade.className}
                {grade.sectionName ? ` / شعبة ${grade.sectionName}` : ""}
              </span>
            </div>
          )}

          {grade.notes && (
            <p className="mt-2 text-sm leading-6 text-[var(--app-text-soft)]">
              {grade.notes}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row xl:flex-col">
        <div className="flex items-center gap-2">
          <div className="h-3 w-24 overflow-hidden rounded-full bg-slate-200">
            <div
              className={[
                "h-full rounded-full transition-all duration-500",
                grade.percentage >= 90
                  ? "bg-emerald-500"
                  : grade.percentage >= 70
                    ? "bg-sky-500"
                    : grade.percentage >= 50
                      ? "bg-amber-500"
                      : "bg-rose-500",
              ].join(" ")}
              style={{ width: `${grade.percentage}%` }}
            />
          </div>

          <span className="text-sm font-bold text-[var(--app-text)]">
            {grade.percentage}%
          </span>
        </div>

        <form action={deleteGradeAction}>
          <input type="hidden" name="id" value={grade.id} />

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
