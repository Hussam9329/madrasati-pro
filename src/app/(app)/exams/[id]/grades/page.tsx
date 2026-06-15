
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpen, GraduationCap, Layers } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { safeQuery } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { SmartAlert } from "@/components/shared/smart-alert";
import { ExamGradeEntryTable } from "@/components/grades/exam-grade-entry-table";
import { getExamById, saveExamGrades } from "@/services/exam-service";
import { EXAM_TYPES } from "@/types/grade";
import { getSectionDisplayName } from "@/types/class";

export const dynamic = "force-dynamic";


type ExamGradesPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ saved?: string; error?: string }>;
};

export default async function ExamGradesPage({ params, searchParams }: ExamGradesPageProps) {
  await requireAdmin();
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const exam = await safeQuery(() => getExamById(id), null);

  if (!exam) {
    return <ExamGradesLoadError examId={id} />;
  }

  const examGrades = Array.isArray(exam.grades) ? exam.grades : [];
  const sectionStudents = Array.isArray(exam.section?.students) ? exam.section.students : [];
  const gradeByStudentId = new Map(examGrades.map((grade: any) => [grade.studentId, grade]));
  const students = sectionStudents
    .filter((student: any) => student?.status !== "inactive")
    .sort((a: any, b: any) => String(a?.fullName ?? "").localeCompare(String(b?.fullName ?? ""), "ar"))
    .map((student) => {
      const existing = gradeByStudentId.get(student.id) as any;
      return {
        id: student.id,
        fullName: student.fullName ?? "طالب غير معروف",
        studentCode: student.studentCode ?? null,
        existingScore: existing?.score ?? null,
        existingNotes: existing?.notes ?? null,
      };
    });

  const savedGradesCount = students.filter((student) => student.existingScore !== null && student.existingScore !== "").length;
  const sectionName = exam.section ? getSectionDisplayName(exam.section as any) : "صف غير محدد";
  const examTypeLabel = EXAM_TYPES.find((type) => type.value === exam.type)?.label ?? exam.type ?? "امتحان";

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <a href="/grades" className="inline-flex items-center gap-2 text-sm font-extrabold text-[var(--app-text-muted)] hover:text-[var(--app-primary)]">
            <ArrowRight size={16} /> العودة إلى الدرجات
          </a>
          <a href="/exams" className="btn btn-secondary">إدارة الامتحانات</a>
        </div>

        <PageHeader
          title={`درجات: ${exam.name}`}
          description="إدخال جماعي لدرجات طلاب الصف حسب الامتحان المختار من تبويبة الامتحانات."
          icon="grades"
          badge={examTypeLabel}
        />

        {resolvedSearchParams?.saved === "1" && <SmartAlert tone="success" title="تم حفظ الدرجات" description="تم حفظ أو تحديث درجات الطلاب لهذا الامتحان." />}
        {resolvedSearchParams?.error && <SmartAlert tone="warning" title="لم يتم الحفظ" description="تأكد من إدخال درجات صحيحة لا تتجاوز الدرجة الكلية." />}

        <section className="grid gap-4 md:grid-cols-4">
          <InfoCard icon={<Layers size={20} />} label="الصف / الشعبة" value={sectionName} />
          <InfoCard icon={<BookOpen size={20} />} label="المادة" value={exam.subject?.name ?? "مادة غير محددة"} />
          <InfoCard icon={<GraduationCap size={20} />} label="المدرس" value={exam.teacher?.fullName ?? "غير محدد"} />
          <InfoCard label="التقدم" value={`${savedGradesCount} / ${students.length}`} hint={`الدرجة الكلية ${exam.maxScore} — النجاح ${exam.passScore}`} />
        </section>

        <ExamGradeEntryTable
          examId={exam.id}
          maxScore={Number(exam.maxScore) || 100}
          passScore={Number(exam.passScore) || 50}
          students={students}
          action={saveExamGradesAction}
        />
      </div>
  );
}

function ExamGradesLoadError({ examId }: { examId: string }) {
  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <a href="/grades" className="inline-flex items-center gap-2 text-sm font-extrabold text-[var(--app-text-muted)] hover:text-[var(--app-primary)]">
          <ArrowRight size={16} /> العودة إلى الدرجات
        </a>
        <a href="/exams" className="btn btn-secondary">إدارة الامتحانات</a>
      </div>

      <SmartAlert
        tone="warning"
        title="تعذر فتح صفحة درجات هذا الامتحان"
        description="لم يتم العثور على الامتحان أو تعذر تحميل بياناته من قاعدة البيانات. تأكد من وجود الامتحان وتطبيق تحديثات قاعدة البيانات الخاصة بالامتحانات والدرجات."
      />

      <div className="app-card p-5 text-sm leading-7 text-[var(--app-text-muted)]">
        <p>معرّف الامتحان: <span dir="ltr" className="font-bold text-[var(--app-text)]">{examId}</span></p>
        <p className="mt-2">بعد تطبيق ملفات SQL الموجودة داخل مجلد database أعد فتح صفحة الامتحانات ثم اضغط إدخال الدرجات مرة ثانية.</p>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value, hint }: { icon?: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <div className="app-card p-5">
      <div className="flex items-start gap-3">
        {icon && <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">{icon}</div>}
        <div>
          <p className="text-xs font-bold text-[var(--app-text-soft)]">{label}</p>
          <p className="mt-1 text-base font-extrabold text-[var(--app-text)]">{value}</p>
          {hint && <p className="mt-1 text-xs font-bold text-[var(--app-text-muted)]">{hint}</p>}
        </div>
      </div>
    </div>
  );
}

async function saveExamGradesAction(formData: FormData) {
  "use server";
  const examId = String(formData.get("examId") ?? "");
  const studentIds = formData.getAll("studentIds").map((value) => String(value));
  const grades = studentIds
    .map((studentId) => ({
      studentId,
      score: Number(formData.get(`score_${studentId}`) ?? NaN),
      notes: String(formData.get(`notes_${studentId}`) ?? ""),
    }))
    .filter((grade) => Number.isFinite(grade.score));

  let result;
  try {
    result = await saveExamGrades(examId, grades);
  } catch (error) {
    console.error("[saveExamGradesAction] Error:", error);
    redirect(`/exams/${examId}/grades?error=1`);
  }

  if (!result.ok) redirect(`/exams/${examId}/grades?error=1`);

  revalidatePath(`/exams/${examId}/grades`);
  revalidatePath("/grades");
  revalidatePath("/reports");
  redirect(`/exams/${examId}/grades?saved=1`);
}
