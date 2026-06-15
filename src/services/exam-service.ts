import { db } from "@/lib/db";
import { getSupabaseConfigErrorMessage, hasSupabaseConfig } from "@/lib/supabase-client";
import { Prisma } from "@/lib/prisma-types";

export type ExamServiceResult<T> = {
  ok: boolean;
  data?: T;
  message: string;
  errors?: Record<string, string>;
};

async function safeExamQuery<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error(`[exam-service:${label}] Error:`, error);
    return fallback;
  }
}

export async function createExam(input: {
  name: string;
  type: string;
  date?: string | Date;
  maxScore?: number;
  passScore?: number;
  failScore?: number;
  notes?: string;
  subjectId: string;
  sectionId: string;
  teacherId?: string;
}): Promise<ExamServiceResult<Prisma.ExamGetPayload<{ include: { subject: true; section: { include: { class: true } } } }>>> {
  if (!hasSupabaseConfig()) {
    return {
      ok: false,
      message: getSupabaseConfigErrorMessage(),
    };
  }

  // Validate subject exists
  const subject = await db.subject.findUnique({ where: { id: input.subjectId } });
  if (!subject) return { ok: false, message: "المادة غير موجودة." };

  // Validate section exists
  const section = await db.section.findUnique({ where: { id: input.sectionId } });
  if (!section) return { ok: false, message: "الشعبة غير موجودة." };

  if (input.teacherId) {
    const teacher = await db.teacher.findUnique({ where: { id: input.teacherId } });
    if (!teacher) return { ok: false, message: "المدرس غير موجود." };
  }

  try {
    const exam = await db.exam.create({
      data: {
        name: input.name.trim(),
        type: input.type,
        date: input.date ? new Date(input.date) : new Date(),
        maxScore: input.maxScore ?? 100,
        passScore: input.passScore ?? 50,
        failScore: input.failScore,
        notes: input.notes?.trim() || null,
        subjectId: input.subjectId,
        sectionId: input.sectionId,
        teacherId: input.teacherId || null,
      },
      include: {
        subject: true,
        section: { include: { class: true } },
      },
    });
    return { ok: true, data: exam, message: "تم إنشاء الامتحان بنجاح." };
  } catch {
    return { ok: false, message: "حدث خطأ أثناء إنشاء الامتحان." };
  }
}

export async function saveExamGrades(
  examId: string,
  grades: { studentId: string; score: number; notes?: string }[],
): Promise<ExamServiceResult<{ created: number; updated: number }>> {
  if (!examId.trim()) {
    return { ok: false, message: "معرّف الامتحان مفقود." };
  }

  try {
    const exam = await db.exam.findUnique({ where: { id: examId } });
    if (!exam) return { ok: false, message: "الامتحان غير موجود." };

    const maxScore = Number(exam.maxScore) || 100;
    let created = 0;
    let updated = 0;

    for (const grade of grades) {
      if (!grade.studentId || !Number.isFinite(grade.score) || grade.score < 0 || grade.score > maxScore) {
        return { ok: false, message: "توجد درجة غير صحيحة أو أكبر من الدرجة الكلية." };
      }

      const existing = await db.grade.findFirst({
        where: { examId, studentId: grade.studentId },
      });

      if (existing) {
        await db.grade.update({
          where: { id: existing.id },
          data: {
            score: grade.score,
            maxScore,
            notes: grade.notes?.trim() || null,
          },
        });
        updated++;
      } else {
        await db.grade.create({
          data: {
            title: exam.name || "درجة امتحان",
            score: grade.score,
            maxScore,
            examType: exam.type || "monthly",
            subjectId: exam.subjectId,
            teacherId: (exam as any).teacherId ?? null,
            term: exam.type === "midyear" ? "first" : exam.type === "final" ? "annual" : "first",
            date: exam.date ?? new Date(),
            studentId: grade.studentId,
            examId,
            notes: grade.notes?.trim() || null,
          },
        });
        created++;
      }
    }

    return {
      ok: true,
      data: { created, updated },
      message: `تم حفظ الدرجات: ${created} جديد، ${updated} محدّث.`,
    };
  } catch (error) {
    console.error("[saveExamGrades] Error:", error);
    return { ok: false, message: "حدث خطأ أثناء حفظ درجات الامتحان." };
  }
}

export async function getExams(filter?: { subjectId?: string; sectionId?: string; teacherId?: string; type?: string }) {
  const where: Prisma.ExamWhereInput = {};
  if (filter?.subjectId) where.subjectId = filter.subjectId;
  if (filter?.sectionId) where.sectionId = filter.sectionId;
  if (filter?.teacherId) (where as any).teacherId = filter.teacherId;
  if (filter?.type) where.type = filter.type;

  return safeExamQuery("getExams", () => db.exam.findMany({
    where,
    include: {
      subject: true,
      teacher: true,
      section: { include: { class: true } },
      _count: { select: { grades: true } },
    },
    orderBy: { createdAt: "desc" },
  }), []);
}

export async function getExamById(id: string) {
  if (!id.trim()) return null;

  const exam = await safeExamQuery("getExamById.exam", () => db.exam.findUnique({ where: { id } }), null);
  if (!exam) return null;

  const [subject, teacher, section, grades] = await Promise.all([
    exam.subjectId ? safeExamQuery("getExamById.subject", () => db.subject.findUnique({ where: { id: exam.subjectId } }), null) : Promise.resolve(null),
    exam.teacherId ? safeExamQuery("getExamById.teacher", () => db.teacher.findUnique({ where: { id: exam.teacherId } }), null) : Promise.resolve(null),
    exam.sectionId ? safeExamQuery("getExamById.section", () => db.section.findUnique({ where: { id: exam.sectionId } }), null) : Promise.resolve(null),
    safeExamQuery("getExamById.grades", () => db.grade.findMany({
      where: { examId: id },
      orderBy: { createdAt: "asc" },
    }), []),
  ]);

  const [schoolClass, students] = await Promise.all([
    section?.classId ? safeExamQuery("getExamById.class", () => db.schoolClass.findUnique({ where: { id: section.classId } }), null) : Promise.resolve(null),
    exam.sectionId
      ? safeExamQuery("getExamById.students", () => db.student.findMany({
          where: { sectionId: exam.sectionId, status: "active" },
          orderBy: { fullName: "asc" },
        }), [])
      : Promise.resolve([]),
  ]);

  return {
    ...exam,
    subject,
    teacher,
    section: section
      ? {
          ...section,
          class: schoolClass,
          students,
        }
      : null,
    grades,
  };
}

export async function deleteExam(id: string): Promise<ExamServiceResult<null>> {
  const exam = await db.exam.findUnique({ where: { id } });
  if (!exam) return { ok: false, message: "الامتحان غير موجود." };

  await db.grade.deleteMany({ where: { examId: id } });
  await db.exam.delete({ where: { id } });
  return { ok: true, data: null, message: "تم حذف الامتحان ودرجاته." };
}
