import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function getClassFeeSettings(academicYear?: string) {
  const where: Prisma.ClassFeeSettingWhereInput = {};
  if (academicYear) where.academicYear = academicYear;

  return db.classFeeSetting.findMany({
    where,
    include: { class: true },
    orderBy: { class: { name: "asc" } },
  });
}

export async function getClassFeeSetting(classId: string, academicYear?: string) {
  if (academicYear) {
    return db.classFeeSetting.findUnique({
      where: { classId_academicYear: { classId, academicYear } },
    });
  }
  return db.classFeeSetting.findFirst({
    where: { classId, academicYear: null },
  });
}

export async function upsertClassFeeSetting(input: {
  classId: string;
  amount: number;
  academicYear?: string;
  notes?: string;
}) {
  const academicYear = input.academicYear || null;

  // Check if setting exists
  const existing = academicYear
    ? await db.classFeeSetting.findUnique({
        where: { classId_academicYear: { classId: input.classId, academicYear } },
      })
    : await db.classFeeSetting.findFirst({
        where: { classId: input.classId, academicYear: null },
      });

  if (existing) {
    return db.classFeeSetting.update({
      where: { id: existing.id },
      data: { amount: input.amount, notes: input.notes?.trim() || null },
    });
  }

  return db.classFeeSetting.create({
    data: {
      classId: input.classId,
      amount: input.amount,
      academicYear,
      notes: input.notes?.trim() || null,
    },
  });
}

export async function getStudentFeePlan(
  studentId: string,
  academicYear?: string,
): Promise<
  | { ok: false; message: string }
  | {
      ok: true;
      data: {
        studentId: string;
        studentName: string;
        className: string | null;
        sectionName: string | null;
        academicYear: string;
        fullAmount: number;
        totalDiscount: number;
        totalPaid: number;
        remaining: number;
        feeSettingId: string;
      };
    }
> {
  const student = await db.student.findUnique({
    where: { id: studentId },
    include: { section: { include: { class: true } } },
  });

  if (!student || !student.section) {
    return { ok: false, message: "الطالب غير موجود أو غير مرتبط بشعبة." };
  }

  const year = academicYear || new Date().getFullYear().toString();
  const feeSetting = await getClassFeeSetting(student.section.classId, year);

  if (!feeSetting) {
    return { ok: false, message: "لم يتم تحديد قسط لهذا الصف بعد." };
  }

  const payments = await db.payment.findMany({
    where: {
      studentId,
      academicYear: year,
      status: { in: ["paid", "partial"] },
    },
  });

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalDiscount = payments.reduce((sum, p) => sum + (p.discountAmount || 0), 0);
  const fullAmount = feeSetting.amount;
  const remaining = Math.max(0, fullAmount - totalDiscount - totalPaid);

  return {
    ok: true,
    data: {
      studentId: student.id,
      studentName: student.fullName,
      className: student.section.class?.name ?? null,
      sectionName: student.section.name,
      academicYear: year,
      fullAmount,
      totalDiscount,
      totalPaid,
      remaining,
      feeSettingId: feeSetting.id,
    },
  };
}
