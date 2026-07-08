"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, FileText, Search } from "lucide-react";
import type { ExamMatrixExam, ExamMatrixGradeCell, ExamMatrixStudent } from "@/services/exam-matrix-service";

type ExamMatrixTableProps = {
  sectionId: string;
  subjectId: string;
  visibleCount: number;
  students: ExamMatrixStudent[];
  exams: ExamMatrixExam[];
  grades: ExamMatrixGradeCell[];
  action: (formData: FormData) => void | Promise<void>;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function formatShortDate(value: string | null) {
  if (!value) return "بدون تاريخ";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "بدون تاريخ";
  return date.toLocaleDateString("ar-IQ-u-nu-latn", { month: "2-digit", day: "2-digit" });
}

export function ExamMatrixTable({
  sectionId,
  subjectId,
  visibleCount,
  students,
  exams,
  grades,
  action,
}: ExamMatrixTableProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = normalize(query);

  const gradeMap = useMemo(() => {
    const map = new Map<string, ExamMatrixGradeCell>();
    for (const grade of grades) {
      map.set(`${grade.studentId}::${grade.examId}`, grade);
    }
    return map;
  }, [grades]);

  const visibleStudents = useMemo(() => {
    if (!normalizedQuery) return students;
    return students.filter((student) => {
      const haystack = `${student.fullName} ${student.studentCode ?? ""}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery, students]);

  const visibleIds = new Set(visibleStudents.map((student) => student.id));
  const savedCellsCount = grades.length;
  const totalCellsCount = students.length * exams.length;

  if (exams.length === 0) {
    return (
      <section className="app-card p-6">
        <h3 className="text-xl font-extrabold text-[var(--app-text)]">دفتر الدرجات</h3>
        <p className="mt-2 text-sm leading-7 text-[var(--app-text-muted)]">
          لا توجد امتحانات لهذه المادة والصف بعد. استخدم نموذج “إضافة عمود امتحان” حتى يظهر أول عمود في الجدول.
        </p>
      </section>
    );
  }

  return (
    <form action={action} className="app-card overflow-hidden">
      <input type="hidden" name="sectionId" value={sectionId} />
      <input type="hidden" name="subjectId" value={subjectId} />
      <input type="hidden" name="visibleCount" value={visibleCount} />

      <div className="grid gap-4 border-b border-[var(--app-border-soft)] p-6 xl:grid-cols-[1fr_360px] xl:items-end">
        <div>
          <h3 className="text-xl font-extrabold text-[var(--app-text)]">دفتر الدرجات بالأعمدة</h3>
          <p className="mt-1 text-sm leading-7 text-[var(--app-text-muted)]">
            كل امتحان يظهر كعمود مستقل. اكتب الدرجات داخل الخلايا، واستخدم حقل الملاحظة عند الحاجة مثل غائبة أو لم تمتحن.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-[var(--app-text-muted)]">
            <span className="rounded-full bg-slate-100 px-3 py-1">الطلاب: {students.length}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1">الأعمدة الظاهرة: {exams.length}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1">درجات محفوظة: {savedCellsCount} / {totalCellsCount}</span>
          </div>
        </div>

        <div>
          <label htmlFor="matrix-student-search" className="mb-2 block text-sm font-extrabold text-[var(--app-text)]">
            بحث سريع داخل الطلاب
          </label>
          <div className="relative">
            <Search size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--app-text-soft)]" />
            <input
              id="matrix-student-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="اكتب اسم الطالب أو الرمز..."
              className="input pr-11"
              autoComplete="off"
            />
          </div>
          <p className="mt-2 text-xs font-bold text-[var(--app-text-soft)]">
            المعروض الآن: {visibleStudents.length} من {students.length}. البحث لا يحذف أي بيانات من الحفظ.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-separate border-spacing-0 text-sm">
          <thead className="bg-slate-50 text-[var(--app-text-muted)]">
            <tr>
              <th className="sticky right-0 z-20 min-w-[220px] border-b border-l border-[var(--app-border-soft)] bg-slate-50 p-3 text-right">
                الطالب
              </th>
              {exams.map((exam) => (
                <th key={exam.id} className="min-w-[210px] border-b border-l border-[var(--app-border-soft)] p-3 text-right align-top">
                  <div className="flex flex-col gap-1">
                    <a href={`/exams/${exam.id}/grades`} className="font-extrabold text-[var(--app-text)] hover:text-[var(--app-primary)]">
                      {exam.name}
                    </a>
                    <span className="text-xs font-bold text-[var(--app-text-soft)]">{formatShortDate(exam.date)} — من {exam.maxScore}</span>
                    {exam.teacherName ? <span className="text-xs font-bold text-[var(--app-text-soft)]">{exam.teacherName}</span> : null}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={exams.length + 1} className="p-6 text-center text-[var(--app-text-muted)]">
                  لا يوجد طلاب فعالين في هذا الصف.
                </td>
              </tr>
            ) : visibleStudents.length === 0 ? (
              <tr>
                <td colSpan={exams.length + 1} className="p-6 text-center text-[var(--app-text-muted)]">
                  لا توجد نتيجة مطابقة للبحث.
                </td>
              </tr>
            ) : null}

            {students.map((student) => {
              const isVisible = visibleIds.has(student.id);
              return (
                <tr key={student.id} className={isVisible ? "" : "hidden"}>
                  <td className="sticky right-0 z-10 border-b border-l border-[var(--app-border-soft)] bg-[var(--app-card)] p-3 align-top">
                    <div className="font-extrabold text-[var(--app-text)]">{student.fullName}</div>
                    <div className="mt-1 text-xs font-bold text-[var(--app-text-soft)]" dir="ltr">{student.studentCode ?? "بدون رمز"}</div>
                  </td>

                  {exams.map((exam) => {
                    const key = `${student.id}::${exam.id}`;
                    const grade = gradeMap.get(key);
                    const passed = grade ? grade.score >= exam.passScore : false;
                    return (
                      <td key={exam.id} className="border-b border-l border-[var(--app-border-soft)] p-3 align-top">
                        <input type="hidden" name="cellKeys" value={key} />
                        <div className="grid gap-2">
                          <input
                            name={`score__${student.id}__${exam.id}`}
                            type="number"
                            min={0}
                            max={exam.maxScore}
                            step="0.5"
                            defaultValue={grade?.score ?? ""}
                            className="input h-11 text-center font-extrabold"
                            placeholder={`0 - ${exam.maxScore}`}
                            title={`درجة ${student.fullName} في ${exam.name}`}
                          />
                          <div className="relative">
                            <FileText size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--app-text-soft)]" />
                            <input
                              name={`notes__${student.id}__${exam.id}`}
                              defaultValue={grade?.notes ?? ""}
                              className="input h-10 pr-9 text-xs"
                              placeholder="ملاحظة: غائبة / لم تمتحن"
                              title={`ملاحظة ${student.fullName} في ${exam.name}`}
                            />
                          </div>
                          {grade ? (
                            passed ? <span className="badge badge-success justify-center">محفوظة / ناجح</span> : <span className="badge badge-warning justify-center">محفوظة / أقل من النجاح</span>
                          ) : (
                            <span className="badge badge-info justify-center">غير محفوظة</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-[var(--app-border-soft)] p-6 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm leading-7 text-[var(--app-text-muted)]">
          الخلية الفارغة لا تُحفظ ولا تُحذف. لتعديل درجة محفوظة اكتب الرقم الجديد ثم اضغط حفظ الدفتر.
        </p>
        <button type="submit" className="btn btn-primary min-w-[180px] justify-center">
          <CheckCircle2 size={18} /> حفظ الدفتر
        </button>
      </div>
    </form>
  );
}
