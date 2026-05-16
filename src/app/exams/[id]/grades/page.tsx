export const dynamic = "force-dynamic";

import { revalidatePath } from "next/cache";
import { redirect, notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, Search } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { SmartAlert } from "@/components/shared/smart-alert";
import { getExamById, saveExamGrades } from "@/services/exam-service";
import { EXAM_TYPES } from "@/types/grade";

type ExamGradesPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ saved?: string; error?: string; q?: string }>;
};

export default async function ExamGradesPage({ params, searchParams }: ExamGradesPageProps) {
  await requireAdmin();
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams?.q?.trim().toLowerCase() || "";
  const exam = await getExamById(id);

  if (!exam) notFound();

  const gradeByStudentId = new Map((exam.grades ?? []).map((grade: any) => [grade.studentId, grade]));
  const students = ((exam.section?.students ?? []) as any[])
    .filter((student) => student.status !== "inactive")
    .filter((student) => !query || student.fullName.toLowerCase().includes(query) || student.studentCode?.toLowerCase().includes(query));

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
        <div>
          <a href="/exams" className="inline-flex items-center gap-2 text-sm font-extrabold text-[var(--app-text-muted)] hover:text-[var(--app-primary)]">
            <ArrowRight size={16} /> العودة إلى الامتحانات
          </a>
        </div>

        <PageHeader
          title={`درجات: ${exam.name}`}
          description={`${exam.subject?.name ?? "مادة غير محددة"} — ${exam.teacher?.fullName ?? "مدرس غير محدد"} — الدرجة الكلية ${exam.maxScore} ودرجة النجاح ${exam.passScore}`}
          icon="grades"
          badge={EXAM_TYPES.find((type) => type.value === exam.type)?.label ?? exam.type}
        />

        {resolvedSearchParams?.saved === "1" && <SmartAlert tone="success" title="تم حفظ الدرجات" description="تم حفظ أو تحديث درجات الطلاب لهذا الامتحان." />}
        {resolvedSearchParams?.error && <SmartAlert tone="warning" title="لم يتم الحفظ" description="تأكد من إدخال درجات صحيحة لا تتجاوز الدرجة الكلية." />}

        <form action={`/exams/${id}/grades`} className="app-card p-5">
          <label htmlFor="q" className="mb-2 block text-sm font-extrabold text-[var(--app-text)]">بحث سريع داخل الطلاب</label>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--app-text-soft)]" />
              <input id="q" name="q" defaultValue={resolvedSearchParams?.q ?? ""} placeholder="اكتب اسم الطالب..." className="input pr-11" />
            </div>
            <button type="submit" className="btn btn-secondary">بحث</button>
          </div>
        </form>

        <form action={saveExamGradesAction} className="app-card overflow-hidden">
          <input type="hidden" name="examId" value={exam.id} />
          <div className="border-b border-[var(--app-border-soft)] p-6">
            <h3 className="text-xl font-extrabold text-[var(--app-text)]">إدخال درجات الطلاب</h3>
            <p className="mt-1 text-sm text-[var(--app-text-muted)]">ستظهر كل طالبة/طالب حسب الصف المختار، ويمكن ترك الحقل فارغًا لمن لا تريد حفظ درجته الآن.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-slate-50 text-[var(--app-text-muted)]">
                <tr>
                  <th className="p-3 text-right">الطالب</th>
                  <th className="p-3 text-right">الرمز</th>
                  <th className="p-3 text-right">درجة الامتحان</th>
                  <th className="p-3 text-right">ملاحظات</th>
                  <th className="p-3 text-right">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--app-border-soft)]">
                {students.length === 0 ? (
                  <tr><td colSpan={5} className="p-6 text-center text-[var(--app-text-muted)]">لا توجد نتائج مطابقة</td></tr>
                ) : students.map((student) => {
                  const existing = gradeByStudentId.get(student.id) as any;
                  return (
                    <tr key={student.id}>
                      <td className="p-3 font-extrabold text-[var(--app-text)]">
                        {student.fullName}
                        <input type="hidden" name="studentIds" value={student.id} />
                      </td>
                      <td className="p-3" dir="ltr">{student.studentCode ?? "-"}</td>
                      <td className="p-3">
                        <input
                          name={`score_${student.id}`}
                          type="number"
                          min={0}
                          max={exam.maxScore}
                          step="0.5"
                          defaultValue={existing?.score ?? ""}
                          className="input max-w-[180px]"
                          placeholder={`من ${exam.maxScore}`}
                        />
                      </td>
                      <td className="p-3"><input name={`notes_${student.id}`} defaultValue={existing?.notes ?? ""} className="input" placeholder="اختياري" /></td>
                      <td className="p-3">{existing ? <span className="badge badge-success">محفوظة</span> : <span className="badge badge-info">جديدة</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="border-t border-[var(--app-border-soft)] p-6">
            <button type="submit" className="btn btn-primary"><CheckCircle2 size={18} /> حفظ الدرجات</button>
          </div>
        </form>
      </div>
    </AppShell>
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

  const result = await saveExamGrades(examId, grades);
  if (!result.ok) redirect(`/exams/${examId}/grades?error=1`);

  revalidatePath(`/exams/${examId}/grades`);
  revalidatePath("/grades");
  redirect(`/exams/${examId}/grades?saved=1`);
}
