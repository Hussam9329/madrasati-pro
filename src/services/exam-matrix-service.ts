import { db } from "@/lib/db";

export type ExamMatrixStudent = {
  id: string;
  fullName: string;
  studentCode: string | null;
};

export type ExamMatrixExam = {
  id: string;
  name: string;
  type: string;
  date: string | null;
  maxScore: number;
  passScore: number;
  teacherName: string | null;
  gradesCount: number;
};

export type ExamMatrixGradeCell = {
  id: string;
  studentId: string;
  examId: string;
  score: number;
  notes: string | null;
};

export type ExamMatrixData = {
  section: {
    id: string;
    name: string;
    className: string | null;
  } | null;
  subject: {
    id: string;
    name: string;
  } | null;
  students: ExamMatrixStudent[];
  exams: ExamMatrixExam[];
  grades: ExamMatrixGradeCell[];
  totalExams: number;
  visibleCount: number;
};

export type ExamMatrixResult<T> = {
  ok: boolean;
  data?: T;
  message: string;
};

export const DEFAULT_VISIBLE_EXAMS_COUNT = 4;
export const ALL_VISIBLE_EXAMS_VALUE = 0;
export const VISIBLE_EXAM_COUNT_OPTIONS = [4, 8, 12, 16, ALL_VISIBLE_EXAMS_VALUE] as const;

function toNumber(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function normalizeVisibleExamCount(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return DEFAULT_VISIBLE_EXAMS_COUNT;
  if (numeric === ALL_VISIBLE_EXAMS_VALUE) return ALL_VISIBLE_EXAMS_VALUE;
  if (numeric <= 0) return DEFAULT_VISIBLE_EXAMS_COUNT;
  return Math.min(30, Math.max(1, Math.floor(numeric)));
}

export async function getExamMatrixData(input: {
  sectionId?: string;
  subjectId?: string;
  visibleCount?: number | string;
}): Promise<ExamMatrixData | null> {
  const sectionId = input.sectionId?.trim() ?? "";
  const subjectId = input.subjectId?.trim() ?? "";
  const visibleCount = normalizeVisibleExamCount(input.visibleCount ?? DEFAULT_VISIBLE_EXAMS_COUNT);

  if (!sectionId || !subjectId) return null;

  const [section, subject, students, allExams] = await Promise.all([
    db.section.findUnique({
      where: { id: sectionId },
      include: { class: true },
    }),
    db.subject.findUnique({
      where: { id: subjectId },
      select: { id: true, name: true },
    }),
    db.student.findMany({
      where: { sectionId, status: "active" },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true, studentCode: true },
    }),
    db.exam.findMany({
      where: { sectionId, subjectId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      include: {
        teacher: { select: { fullName: true } },
        _count: { select: { grades: true } },
      },
    }),
  ]);

  const visibleExams = visibleCount === ALL_VISIBLE_EXAMS_VALUE
    ? allExams
    : allExams.slice(0, visibleCount);

  const examIds = visibleExams.map((exam) => exam.id);
  const studentIds = students.map((student) => student.id);

  const grades = examIds.length && studentIds.length
    ? await db.grade.findMany({
        where: {
          examId: { in: examIds },
          studentId: { in: studentIds },
        },
        select: {
          id: true,
          studentId: true,
          examId: true,
          score: true,
          notes: true,
        },
      })
    : [];

  return {
    section: section
      ? {
          id: section.id,
          name: section.name,
          className: section.class?.name ?? null,
        }
      : null,
    subject,
    students: students.map((student) => ({
      id: student.id,
      fullName: student.fullName,
      studentCode: student.studentCode ?? null,
    })),
    exams: visibleExams.map((exam) => ({
      id: exam.id,
      name: exam.name,
      type: exam.type,
      date: exam.date ? exam.date.toISOString() : null,
      maxScore: toNumber(exam.maxScore, 100),
      passScore: toNumber(exam.passScore, 50),
      teacherName: exam.teacher?.fullName ?? null,
      gradesCount: exam._count?.grades ?? 0,
    })),
    grades: grades.map((grade) => ({
      id: grade.id,
      studentId: grade.studentId,
      examId: grade.examId ?? "",
      score: toNumber(grade.score),
      notes: grade.notes ?? null,
    })).filter((grade) => Boolean(grade.examId)),
    totalExams: allExams.length,
    visibleCount,
  };
}

export async function saveExamMatrixGrades(input: {
  sectionId: string;
  subjectId: string;
  cells: { studentId: string; examId: string; score: number; notes?: string }[];
}): Promise<ExamMatrixResult<{ created: number; updated: number; skipped: number }>> {
  const sectionId = input.sectionId?.trim() ?? "";
  const subjectId = input.subjectId?.trim() ?? "";

  if (!sectionId || !subjectId) {
    return { ok: false, message: "اختر الصف والمادة قبل حفظ دفتر الدرجات." };
  }

  const cells = input.cells.filter((cell) => cell.studentId && cell.examId && Number.isFinite(cell.score));
  if (cells.length === 0) {
    return { ok: true, data: { created: 0, updated: 0, skipped: 0 }, message: "لا توجد درجات جديدة للحفظ." };
  }

  const examIds = [...new Set(cells.map((cell) => cell.examId))];
  const studentIds = [...new Set(cells.map((cell) => cell.studentId))];

  const [exams, students] = await Promise.all([
    db.exam.findMany({
      where: {
        id: { in: examIds },
        sectionId,
        subjectId,
      },
      select: {
        id: true,
        name: true,
        type: true,
        date: true,
        maxScore: true,
        subjectId: true,
        teacherId: true,
      },
    }),
    db.student.findMany({
      where: {
        id: { in: studentIds },
        sectionId,
        status: "active",
      },
      select: { id: true },
    }),
  ]);

  const examById = new Map((exams as any[]).map((exam) => [exam.id, exam]));
  const validStudentIds = new Set((students as any[]).map((student) => student.id));

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const cell of cells) {
    const exam = examById.get(cell.examId);
    const studentIsValid = validStudentIds.has(cell.studentId);

    if (!exam || !studentIsValid) {
      skipped++;
      continue;
    }

    const maxScore = toNumber(exam.maxScore, 100);
    if (cell.score < 0 || cell.score > maxScore) {
      return {
        ok: false,
        message: `درجة امتحان ${exam.name} يجب أن تكون بين 0 و ${maxScore}.`,
      };
    }

    const existing = await db.grade.findFirst({
      where: {
        examId: cell.examId,
        studentId: cell.studentId,
      },
      select: { id: true },
    });

    const notes = cell.notes?.trim() || null;

    if (existing) {
      await db.grade.update({
        where: { id: existing.id },
        data: {
          score: cell.score,
          maxScore,
          notes,
          title: exam.name || "درجة امتحان",
          examType: exam.type || "daily",
          subjectId: exam.subjectId,
          teacherId: exam.teacherId ?? null,
          date: exam.date ?? new Date(),
        },
      });
      updated++;
    } else {
      await db.grade.create({
        data: {
          title: exam.name || "درجة امتحان",
          score: cell.score,
          maxScore,
          examType: exam.type || "daily",
          term: exam.type === "midyear" ? "first" : exam.type === "final" ? "annual" : "first",
          date: exam.date ?? new Date(),
          subjectId: exam.subjectId,
          teacherId: exam.teacherId ?? null,
          studentId: cell.studentId,
          examId: cell.examId,
          notes,
        },
      });
      created++;
    }
  }

  return {
    ok: true,
    data: { created, updated, skipped },
    message: `تم حفظ دفتر الدرجات: ${created} درجة جديدة، ${updated} درجة محدّثة.`,
  };
}
