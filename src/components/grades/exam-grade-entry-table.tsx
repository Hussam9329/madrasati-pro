"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Search } from "lucide-react";

type ExamGradeEntryStudent = {
  id: string;
  fullName: string;
  studentCode: string | null;
  existingScore: number | string | null;
  existingNotes: string | null;
};

type ExamGradeEntryTableProps = {
  examId: string;
  maxScore: number;
  passScore: number;
  students: ExamGradeEntryStudent[];
  action: (formData: FormData) => void | Promise<void>;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function ExamGradeEntryTable({
  examId,
  maxScore,
  passScore,
  students,
  action,
}: ExamGradeEntryTableProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = normalize(query);

  const visibleStudents = useMemo(() => {
    if (!normalizedQuery) return students;
    return students.filter((student) => {
      const haystack = `${student.fullName} ${student.studentCode ?? ""}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery, students]);

  const visibleIds = new Set(visibleStudents.map((student) => student.id));

  return (
    <form action={action} className="app-card overflow-hidden">
      <input type="hidden" name="examId" value={examId} />

      <div className="grid gap-4 border-b border-[var(--app-border-soft)] p-6 lg:grid-cols-[1fr_360px] lg:items-end">
        <div>
          <h3 className="text-xl font-extrabold text-[var(--app-text)]">إدخال درجات الطلاب</h3>
          <p className="mt-1 text-sm leading-7 text-[var(--app-text-muted)]">
            كل طلاب الصف ظاهرين في نفس الجدول. البحث السريع يفلتر العرض فقط، ولا يحذف أي طالب من نموذج الحفظ.
          </p>
        </div>

        <div>
          <label htmlFor="student-grade-search" className="mb-2 block text-sm font-extrabold text-[var(--app-text)]">
            بحث سريع داخل الطلاب
          </label>
          <div className="relative">
            <Search size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--app-text-soft)]" />
            <input
              id="student-grade-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="اكتب اسم الطالب أو الرمز..."
              className="input pr-11"
              autoComplete="off"
            />
          </div>
          <p className="mt-2 text-xs font-bold text-[var(--app-text-soft)]">
            المعروض الآن: {visibleStudents.length} من {students.length}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
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
              <tr>
                <td colSpan={5} className="p-6 text-center text-[var(--app-text-muted)]">
                  لا يوجد طلاب فعالين في هذا الصف.
                </td>
              </tr>
            ) : visibleStudents.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-[var(--app-text-muted)]">
                  لا توجد نتيجة مطابقة للبحث.
                </td>
              </tr>
            ) : null}

            {students.map((student) => {
              const isVisible = visibleIds.has(student.id);
              const score = student.existingScore;
              const numericScore = Number(score);
              const hasScore = Number.isFinite(numericScore);
              const passed = hasScore && numericScore >= passScore;

              return (
                <tr key={student.id} className={isVisible ? "" : "hidden"}>
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
                      max={maxScore}
                      step="0.5"
                      defaultValue={score ?? ""}
                      className="input max-w-[180px]"
                      placeholder={`من ${maxScore}`}
                    />
                  </td>
                  <td className="p-3">
                    <input
                      name={`notes_${student.id}`}
                      defaultValue={student.existingNotes ?? ""}
                      className="input"
                      placeholder="اختياري"
                    />
                  </td>
                  <td className="p-3">
                    {!hasScore ? (
                      <span className="badge badge-info">غير محفوظة</span>
                    ) : passed ? (
                      <span className="badge badge-success">ناجح</span>
                    ) : (
                      <span className="badge badge-warning">أقل من النجاح</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-[var(--app-border-soft)] p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-7 text-[var(--app-text-muted)]">
          أي حقل درجة يُترك فارغًا لن يتم حفظه أو تعديله. الدرجة لا يمكن أن تتجاوز {maxScore}.
        </p>
        <button type="submit" className="btn btn-primary">
          <CheckCircle2 size={18} /> حفظ الدرجات
        </button>
      </div>
    </form>
  );
}
