import { Prisma } from "@/lib/prisma-types";
import { db } from "@/lib/db";
import { getSupabaseConfigErrorMessage, hasSupabaseConfig } from "@/lib/supabase-client";
import { getActiveAcademicYear } from "@/services/class-fee-service";
import {
  canDeletePayment,
  normalizePaymentDate,
  normalizePaymentInput,
  validatePaymentInput,
  formatMoney,
  getFeeTypeLabel,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
  getPaymentStatusBadgeClass,
  isPaymentOverdue,
  getCurrentAcademicYear,
  type Payment,
  type PaymentDetails,
  type PaymentFilter,
  type PaymentFormInput,
  type PaymentListItem,
} from "@/types/payment";

export type PaymentServiceResult<T> = {
  ok: boolean;
  data?: T;
  message: string;
  errors?: Record<string, string>;
};

const paymentListInclude = {
  student: {
    include: {
      section: {
        include: {
          class: true,
        },
      },
    },
  },
} satisfies Prisma.PaymentInclude;

type PaymentWithRelations = Prisma.PaymentGetPayload<{
  include: typeof paymentListInclude;
}>;

function toPaymentListItem(
  payment: PaymentWithRelations,
  feeRemaining: { feeAmount: number; totalPaid: number; remaining: number } | null,
): PaymentListItem {
  const overdue = isPaymentOverdue({
    status: payment.status,
    dueDate: payment.dueDate,
  });

  // The displayed "remaining" must reflect the TRUE remaining for this
  // student's fee (fee - sum of all installment payments), not just
  // (this payment's due - this payment's amount). The previous formula
  // double-counted the remaining across multiple installments for the
  // same fee, which caused the user to see a remaining total higher
  // than the original fee itself.
  //
  // If we have fee context (preferred), use it. Otherwise fall back to
  // the per-payment calculation so the field still works for legacy
  // payments that pre-date the class_fee_settings table.
  const fallbackDue = Number(payment.finalAmount ?? payment.originalAmount ?? payment.amount ?? 0);
  const fallbackRemaining = Math.max(0, fallbackDue - Number(payment.amount || 0));
  const remainingAmount = feeRemaining ? feeRemaining.remaining : fallbackRemaining;

  const isUniformPaid = payment.feeType === "uniform" && ["paid", "partial"].includes(payment.status) && Number(payment.amount || 0) > 0;

  return {
    id: payment.id,
    feeTitle: payment.feeTitle,
    feeType: payment.feeType,
    feeTypeLabel: getFeeTypeLabel(payment.feeType),
    amount: payment.amount,
    formattedAmount: formatMoney(payment.amount),
    originalAmount: payment.originalAmount,
    discountAmount: payment.discountAmount,
    discountPercent: payment.discountPercent,
    discountReason: payment.discountReason,
    finalAmount: payment.finalAmount,
    formattedOriginalAmount: payment.originalAmount != null ? formatMoney(payment.originalAmount) : "",
    formattedDiscountAmount: formatMoney(payment.discountAmount),
    formattedFinalAmount: payment.finalAmount != null ? formatMoney(payment.finalAmount) : "",
    status: payment.status,
    statusLabel: getPaymentStatusLabel(payment.status),
    statusClass: getPaymentStatusBadgeClass(payment.status),
    method: payment.method,
    methodLabel: getPaymentMethodLabel(payment.method),
    academicYear: payment.academicYear,
    dueDate: payment.dueDate,
    paidAt: payment.paidAt,
    notes: payment.notes,
    isOverdue: overdue,
    remainingAmount,
    formattedRemainingAmount: formatMoney(remainingAmount),
    isUniformPaid,

    studentId: payment.studentId,
    studentName: payment.student.fullName,
    studentCode: payment.student.studentCode,
    guardianName: payment.student.guardianName,
    guardianPhone: payment.student.guardianPhone,

    sectionId: payment.student.sectionId,
    sectionName: payment.student.section?.name ?? null,

    classId: payment.student.section?.classId ?? null,
    className: payment.student.section?.class.name ?? null,
    classLevel: payment.student.section?.class.level ?? null,

    createdAt: payment.createdAt,
  };
}

/**
 * Build a map of (studentId|feeType|academicYear) → true remaining for
 * that fee. The remaining is computed from `class_fee_settings` (the
 * authoritative fee amount per class+year) minus the sum of all
 * payment amounts with status "paid" or "partial" for the same
 * student+feeType+year.
 *
 * This is the only correct way to compute "remaining" when a student
 * pays a single fee via multiple installment payments. Treating each
 * payment row as having its own independent "due" double-counts the
 * remaining and produces totals higher than the original fee.
 *
 * Returns `null` for a key when no fee setting exists for the
 * student's class+year — callers should fall back to per-payment
 * math in that case.
 */
type FeeRemainingKey = string; // `${studentId}|${feeType}|${academicYear}`
type FeeRemainingValue = { feeAmount: number; totalPaid: number; remaining: number };

async function buildFeeRemainingMap(
  payments: PaymentWithRelations[],
): Promise<Map<FeeRemainingKey, FeeRemainingValue>> {
  const map = new Map<FeeRemainingKey, FeeRemainingValue>();
  if (payments.length === 0) return map;

  // Collect unique (classId, academicYear) pairs so we can fetch the
  // matching class_fee_settings rows in one query.
  const classYearPairs = new Set<string>();
  for (const p of payments) {
    const classId = p.student?.section?.classId;
    if (!classId) continue;
    const year = (p.academicYear ?? "").trim() || getCurrentAcademicYear();
    classYearPairs.add(`${classId}|${year}`);
  }

  if (classYearPairs.size === 0) return map;

  // Fetch all relevant fee settings in ONE query.
  const uniqueClassIds = Array.from(new Set(
    Array.from(classYearPairs).map((s) => s.split("|")[0]),
  ));
  const uniqueYears = Array.from(new Set(
    Array.from(classYearPairs).map((s) => s.split("|")[1]),
  ));

  const feeSettings = await db.classFeeSetting.findMany({
    where: {
      classId: { in: uniqueClassIds },
      academicYear: { in: uniqueYears },
    },
    select: {
      classId: true,
      academicYear: true,
      amount: true,
      uniformAmount: true,
    },
  });

  // Build a lookup: classId|year → { tuition, uniform }
  const feeByClassYear = new Map<string, { tuition: number; uniform: number }>();
  for (const s of feeSettings) {
    const key = `${s.classId}|${s.academicYear}`;
    // Latest setting wins if there are duplicates (defensive — there's a
    // unique constraint on classId+academicYear but old data may not
    // enforce it).
    feeByClassYear.set(key, {
      tuition: Number(s.amount ?? 0),
      uniform: Number(s.uniformAmount ?? 0),
    });
  }

  // Now compute per (student, feeType, year) totals. We sum all payments
  // (not just the ones passed in) for each unique (studentId, feeType,
  // year) so the remaining reflects the global state, not just the slice
  // returned by the current filter.
  const studentYearFeePairs = new Set<string>(); // `studentId|feeType|year`
  for (const p of payments) {
    const year = (p.academicYear ?? "").trim() || getCurrentAcademicYear();
    studentYearFeePairs.add(`${p.studentId}|${p.feeType}|${year}`);
  }

  // Group payment sums in-memory first using the already-fetched rows,
  // then fetch any missing totals with a single aggregate query for
  // (studentId, feeType, year) tuples not covered.
  const sumFromCurrent = new Map<string, number>();
  for (const p of payments) {
    if (p.status !== "paid" && p.status !== "partial") continue;
    const year = (p.academicYear ?? "").trim() || getCurrentAcademicYear();
    const key = `${p.studentId}|${p.feeType}|${year}`;
    sumFromCurrent.set(key, (sumFromCurrent.get(key) ?? 0) + Number(p.amount ?? 0));
  }

  // For tuples that may have additional payments outside the current
  // page/filter, fetch the true totals in one query per missing key.
  // We do this only for keys where we have a fee setting — others fall
  // back to per-payment math anyway.
  const missingKeys: Array<{ studentId: string; feeType: string; year: string }> = [];
  for (const tuple of studentYearFeePairs) {
    const [studentId, feeType, year] = tuple.split("|");
    const student = payments.find((p) => p.studentId === studentId);
    const classId = student?.student?.section?.classId;
    if (!classId) continue;
    if (!feeByClassYear.has(`${classId}|${year}`)) continue;
    if (!sumFromCurrent.has(tuple)) {
      missingKeys.push({ studentId, feeType, year });
    }
  }

  if (missingKeys.length > 0) {
    // Aggregate by studentId+feeType+year via a findMany + reduce
    // (Prisma groupBy would also work but this keeps it portable).
    const allMissing = await db.payment.findMany({
      where: {
        OR: missingKeys.map((k) => ({
          studentId: k.studentId,
          feeType: k.feeType,
          academicYear: k.year,
          status: { in: ["paid", "partial"] },
        })),
      },
      select: {
        studentId: true,
        feeType: true,
        academicYear: true,
        amount: true,
        discountAmount: true,
      },
    });
    for (const p of allMissing) {
      const year = (p.academicYear ?? "").trim() || getCurrentAcademicYear();
      const key = `${p.studentId}|${p.feeType}|${year}`;
      sumFromCurrent.set(key, (sumFromCurrent.get(key) ?? 0) + Number(p.amount ?? 0));
    }
  }

  // Build the final map: each tuple's remaining = feeAmount - totalPaid.
  for (const tuple of studentYearFeePairs) {
    const [studentId, feeType, year] = tuple.split("|");
    const student = payments.find((p) => p.studentId === studentId);
    const classId = student?.student?.section?.classId;
    if (!classId) continue;
    const fee = feeByClassYear.get(`${classId}|${year}`);
    if (!fee) continue;

    const feeAmount = feeType === "uniform" ? fee.uniform : fee.tuition;
    const totalPaid = sumFromCurrent.get(tuple) ?? 0;
    const remaining = Math.max(0, feeAmount - totalPaid);

    map.set(tuple, { feeAmount, totalPaid, remaining });
  }

  return map;
}

/**
 * Build a payment where clause that works with the Supabase adapter.
 * Nested Prisma-style relation filters (e.g., { student: { section: { classId } } })
 * are NOT supported by the Supabase REST adapter.
 * Instead, we resolve them to explicit studentId filters using pre-queries.
 */
async function buildPaymentWhere(filter: PaymentFilter): Promise<Prisma.PaymentWhereInput> {
  const query = filter.query?.trim();
  const where: Prisma.PaymentWhereInput = {};

  // Collect student IDs from relation filters
  const resolvedStudentIds = await resolveStudentIds(filter);

  if (query) {
    // For search queries, we also need to find matching student IDs
    const searchStudentIds = await resolveStudentIdsBySearch(query);

    where.OR = [
      {
        feeTitle: {
          contains: query,
        },
      },
      ...(searchStudentIds.length > 0 ? [{
        studentId: { in: searchStudentIds },
      }] : []),
      {
        notes: {
          contains: query,
        },
      },
    ];
  }

  if (filter.studentId) {
    where.studentId = filter.studentId;
  }

  // Apply resolved student ID filters from sectionId/classId
  if (resolvedStudentIds !== null) {
    // Combine with existing studentId filter if any
    if (where.studentId) {
      // If filter.studentId is also set, just keep it (it's more specific)
    } else {
      where.studentId = { in: resolvedStudentIds };
    }
  }

  if (filter.feeType) {
    where.feeType = filter.feeType;
  }

  if (filter.status) {
    where.status = filter.status;
  }

  if (filter.method) {
    where.method = filter.method;
  }

  if (filter.academicYear) {
    where.academicYear = filter.academicYear;
  }

  if (filter.fromDate || filter.toDate) {
    where.createdAt = {};

    if (filter.fromDate) {
      const from = new Date(filter.fromDate);
      if (!Number.isNaN(from.getTime())) {
        where.createdAt.gte = from;
      }
    }

    if (filter.toDate) {
      const to = new Date(filter.toDate);
      if (!Number.isNaN(to.getTime())) {
        to.setDate(to.getDate() + 1);
        where.createdAt.lt = to;
      }
    }
  }

  if (filter.dueFromDate || filter.dueToDate) {
    where.dueDate = {};

    if (filter.dueFromDate) {
      const from = new Date(filter.dueFromDate);
      if (!Number.isNaN(from.getTime())) {
        where.dueDate.gte = from;
      }
    }

    if (filter.dueToDate) {
      const to = new Date(filter.dueToDate);
      if (!Number.isNaN(to.getTime())) {
        to.setDate(to.getDate() + 1);
        where.dueDate.lt = to;
      }
    }
  }

  if (filter.overdueOnly) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : []),
      {
        status: {
          in: ["pending", "partial"],
        },
        dueDate: {
          lt: today,
        },
      },
    ];
  }

  return where;
}

/**
 * Resolve student IDs from sectionId/classId filters.
 * Returns null if no relation filters are active (no filtering needed).
 * Returns an array of student IDs if sectionId or classId filtering is needed.
 */
async function resolveStudentIds(filter: PaymentFilter): Promise<string[] | null> {
  if (!filter.sectionId && !filter.classId) return null;

  if (filter.sectionId && filter.classId) {
    // Both filters: find sections that match classId, then students in those sections
    const sections = await db.section.findMany({
      where: { classId: filter.classId, id: filter.sectionId },
      select: { id: true },
    });
    const sectionIds = sections.map((s: any) => s.id);
    if (sectionIds.length === 0) return [];
    const students = await db.student.findMany({
      where: { sectionId: { in: sectionIds }, status: "active" },
      select: { id: true },
    });
    return students.map((s: any) => s.id);
  }

  if (filter.sectionId) {
    const students = await db.student.findMany({
      where: { sectionId: filter.sectionId },
      select: { id: true },
    });
    return students.map((s: any) => s.id);
  }

  if (filter.classId) {
    // Find sections for this class, then students in those sections
    const sections = await db.section.findMany({
      where: { classId: filter.classId },
      select: { id: true },
    });
    const sectionIds = sections.map((s: any) => s.id);
    if (sectionIds.length === 0) return [];
    const students = await db.student.findMany({
      where: { sectionId: { in: sectionIds } },
      select: { id: true },
    });
    return students.map((s: any) => s.id);
  }

  return null;
}

/**
 * Find student IDs that match a search query on fullName, studentCode, or guardianName.
 */
async function resolveStudentIdsBySearch(query: string): Promise<string[]> {
  if (!query.trim()) return [];
  try {
    const students = await db.student.findMany({
      where: {
        OR: [
          { fullName: { contains: query } },
          { studentCode: { contains: query } },
          { guardianName: { contains: query } },
        ],
      },
      select: { id: true },
    });
    return students.map((s: any) => s.id);
  } catch {
    return [];
  }
}

async function validatePaymentRelations(input: PaymentFormInput): Promise<{
  ok: boolean;
  message: string;
}> {
  if (!input.studentId) {
    return {
      ok: false,
      message: "الطالب مطلوب.",
    };
  }

  const student = await db.student.findUnique({
    where: {
      id: input.studentId,
    },
  });

  if (!student) {
    return {
      ok: false,
      message: "الطالب المحدد غير موجود.",
    };
  }

  return {
    ok: true,
    message: "العلاقات صالحة.",
  };
}

export async function getPayments(
  filter: PaymentFilter = {},
): Promise<PaymentListItem[]> {
  const where = await buildPaymentWhere(filter);

  const payments = await db.payment.findMany({
    where,
    orderBy: [
      {
        createdAt: "desc",
      },
    ],
    include: paymentListInclude,
  });

  const feeRemainingMap = await buildFeeRemainingMap(payments);

  return payments.map((payment) => {
    const year = (payment.academicYear ?? "").trim() || getCurrentAcademicYear();
    const key = `${payment.studentId}|${payment.feeType}|${year}`;
    return toPaymentListItem(payment, feeRemainingMap.get(key) ?? null);
  });
}

export async function searchPayments(
  query: string,
): Promise<PaymentListItem[]> {
  return getPayments({
    query,
  });
}

export async function getPaymentById(id: string): Promise<Payment | null> {
  return db.payment.findUnique({
    where: {
      id,
    },
  });
}

export async function getPaymentDetails(
  id: string,
): Promise<PaymentDetails | null> {
  const payment = await db.payment.findUnique({
    where: {
      id,
    },
    include: paymentListInclude,
  });

  if (!payment) {
    return null;
  }

  const feeRemainingMap = await buildFeeRemainingMap([payment]);
  const year = (payment.academicYear ?? "").trim() || getCurrentAcademicYear();
  const key = `${payment.studentId}|${payment.feeType}|${year}`;
  const listItem = toPaymentListItem(payment, feeRemainingMap.get(key) ?? null);

  return {
    ...listItem,
    updatedAt: payment.updatedAt,
  };
}

export async function createPayment(
  input: PaymentFormInput,
): Promise<PaymentServiceResult<Payment>> {
  const validation = validatePaymentInput(input);

  if (!validation.valid) {
    return {
      ok: false,
      message: (Object.values(validation.errors).find(Boolean) as string) || "توجد بيانات ناقصة أو غير صحيحة.",
      errors: validation.errors as Record<string, string>,
    };
  }

  if (!hasSupabaseConfig()) {
    return {
      ok: false,
      message: getSupabaseConfigErrorMessage(),
    };
  }

  const data = normalizePaymentInput(input);

  const relationsCheck = await validatePaymentRelations(data);

  if (!relationsCheck.ok) {
    return {
      ok: false,
      message: relationsCheck.message,
      errors: {
        studentId: relationsCheck.message,
      },
    };
  }

  try {
    // A payment with a blank academic year becomes invisible to every
    // fee-remaining calculation (they all group by year). Normalize the
    // year here — the single choke point for both the server action and
    // the REST API: a well-formed year ("YYYY" or "YYYY-YYYY") passes
    // through; anything malformed falls back to the active year.
    const rawYear = data.academicYear?.trim() ?? "";
    const isYearFormat = /^\d{4}(-\d{4})?$/.test(rawYear);
    const academicYear = isYearFormat ? rawYear : await getActiveAcademicYear();

    const payment = await db.payment.create({
      data: {
        feeTitle: data.feeTitle,
        feeType: data.feeType ?? "tuition",
        amount: Number(data.amount),
        originalAmount: data.originalAmount != null ? Number(data.originalAmount) : null,
        discountAmount: data.discountAmount != null ? Number(data.discountAmount) : 0,
        discountPercent: data.discountPercent != null ? Number(data.discountPercent) : null,
        discountReason: data.discountReason ?? null,
        finalAmount: data.finalAmount != null ? Number(data.finalAmount) : null,
        status: data.status ?? "paid",
        method: data.method ?? "cash",
        academicYear,
        dueDate: normalizePaymentDate(data.dueDate),
        paidAt: normalizePaymentDate(data.paidAt),
        notes: data.notes ?? null,
        studentId: data.studentId,
      },
    });

    return {
      ok: true,
      data: payment,
      message: "تمت إضافة الدفعة بنجاح.",
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        ok: false,
        message: "توجد دفعة مكررة.",
      };
    }

    console.error("[createPayment] Error:", error);

    return {
      ok: false,
      message: "حدث خطأ أثناء إضافة الدفعة.",
    };
  }
}

export async function updatePayment(
  id: string,
  input: PaymentFormInput,
): Promise<PaymentServiceResult<Payment>> {
  const validation = validatePaymentInput(input);

  if (!validation.valid) {
    return {
      ok: false,
      message: (Object.values(validation.errors).find(Boolean) as string) || "توجد بيانات ناقصة أو غير صحيحة.",
      errors: validation.errors as Record<string, string>,
    };
  }

  if (!hasSupabaseConfig()) {
    return {
      ok: false,
      message: getSupabaseConfigErrorMessage(),
    };
  }

  const existingPayment = await getPaymentById(id);

  if (!existingPayment) {
    return {
      ok: false,
      message: "لم يتم العثور على الدفعة.",
    };
  }

  const data = normalizePaymentInput(input);

  const relationsCheck = await validatePaymentRelations(data);

  if (!relationsCheck.ok) {
    return {
      ok: false,
      message: relationsCheck.message,
      errors: {
        studentId: relationsCheck.message,
      },
    };
  }

  try {
    const rawYear = data.academicYear?.trim() ?? "";
    const isYearFormat = /^\d{4}(-\d{4})?$/.test(rawYear);
    const academicYear = isYearFormat ? rawYear : await getActiveAcademicYear();

    const payment = await db.payment.update({
      where: {
        id,
      },
      data: {
        feeTitle: data.feeTitle,
        feeType: data.feeType ?? "tuition",
        amount: Number(data.amount),
        originalAmount: data.originalAmount != null ? Number(data.originalAmount) : null,
        discountAmount: data.discountAmount != null ? Number(data.discountAmount) : 0,
        discountPercent: data.discountPercent != null ? Number(data.discountPercent) : null,
        discountReason: data.discountReason ?? null,
        finalAmount: data.finalAmount != null ? Number(data.finalAmount) : null,
        status: data.status ?? "paid",
        method: data.method ?? "cash",
        academicYear,
        dueDate: normalizePaymentDate(data.dueDate),
        paidAt: normalizePaymentDate(data.paidAt),
        notes: data.notes ?? null,
        studentId: data.studentId,
      },
    });

    return {
      ok: true,
      data: payment,
      message: "تم تحديث بيانات الدفعة بنجاح.",
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        ok: false,
        message: "توجد دفعة مكررة.",
      };
    }

    return {
      ok: false,
      message: "حدث خطأ أثناء تحديث بيانات الدفعة.",
    };
  }
}

export async function deletePayment(
  id: string,
): Promise<PaymentServiceResult<null>> {
  const payment = await db.payment.findUnique({
    where: {
      id,
    },
  });

  if (!payment) {
    return {
      ok: false,
      message: "لم يتم العثور على الدفعة.",
    };
  }

  const deleteCheck = canDeletePayment();

  if (!deleteCheck.allowed) {
    return {
      ok: false,
      message: deleteCheck.reason ?? "لا يمكن حذف الدفعة حاليًا.",
    };
  }

  try {
    await db.payment.delete({
      where: {
        id,
      },
    });
  } catch (error) {
    console.error("[deletePayment] Error:", error);
    return {
      ok: false,
      message: "حدث خطأ أثناء حذف الدفعة.",
    };
  }

  return {
    ok: true,
    data: null,
    message: "تم حذف الدفعة بنجاح.",
  };
}

export async function getPaymentsCount(academicYear?: string): Promise<{
  total: number;
  paid: number;
  partial: number;
  pending: number;
  refunded: number;
  overdue: number;
  totalPaid: number;
  totalPending: number;
  totalRefunded: number;
}> {
  // Optional year scope: when provided, every stat below is computed for
  // that academic year only, so the payments page stats match the year
  // the user is viewing. Without it, stats are school-wide (dashboard).
  const year = academicYear?.trim() || null;
  const yearWhere = year ? { academicYear: year } : {};

  const [total, paid, partial, pending, refunded] = await Promise.all([
    db.payment.count({ where: yearWhere }),
    db.payment.count({ where: { ...yearWhere, status: "paid" } }),
    db.payment.count({ where: { ...yearWhere, status: "partial" } }),
    db.payment.count({ where: { ...yearWhere, status: "pending" } }),
    db.payment.count({ where: { ...yearWhere, status: "refunded" } }),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdue = await db.payment.count({
    where: {
      ...yearWhere,
      status: { in: ["pending", "partial"] },
      dueDate: { lt: today },
    },
  });

  // ─── Total paid ───────────────────────────────────────────────────
  // Sum of all payment amounts with status "paid" or "partial".
  // This is the actual cash collected.
  const allPaidPayments = await db.payment.findMany({
    where: { ...yearWhere, status: { in: ["paid", "partial"] } },
    select: { amount: true, status: true },
  });
  const totalPaid = allPaidPayments.reduce(
    (sum, p) => sum + Number(p.amount ?? 0),
    0,
  );

  // ─── Total pending ────────────────────────────────────────────────
  // The CORRECT way to compute "money still owed" across the whole
  // school: for each (student, feeType, academicYear) tuple, look up
  // the fee from class_fee_settings and compute remaining =
  // max(0, fee - totalPaidForThisFee). Sum these remainings.
  //
  // The previous formula summed (finalAmount - amount) across every
  // partial/pending payment row, which double-counted installments
  // for the same fee and produced totals higher than the actual fees.
  const allPartialPayments = await db.payment.findMany({
    where: { ...yearWhere, status: { in: ["pending", "partial"] } },
    select: {
      studentId: true,
      feeType: true,
      academicYear: true,
      amount: true,
      finalAmount: true,
      originalAmount: true,
    },
  });

  // Collect unique (classId, year) pairs to fetch class_fee_settings.
  // First we need students → section → classId. Batch one query.
  const uniqueStudentIds = Array.from(new Set(allPartialPayments.map((p) => p.studentId)));
  const students = uniqueStudentIds.length > 0
    ? await db.student.findMany({
        where: { id: { in: uniqueStudentIds } },
        select: { id: true, section: { select: { classId: true } } },
      })
    : [];
  const classIdByStudent = new Map<string, string | null>();
  for (const s of students) {
    classIdByStudent.set(s.id, s.section?.classId ?? null);
  }

  // Group sums by (studentId, feeType, year)
  const sumByTuple = new Map<string, number>();
  for (const p of allPartialPayments) {
    const year = (p.academicYear ?? "").trim() || getCurrentAcademicYear();
    const key = `${p.studentId}|${p.feeType}|${year}`;
    sumByTuple.set(key, (sumByTuple.get(key) ?? 0) + Number(p.amount ?? 0));
  }

  // Also include "paid" payments in the sum, since those also reduce
  // the remaining for the same fee.
  if (allPaidPayments.length > 0 && allPartialPayments.length > 0) {
    // Need to re-fetch with full fields since allPaidPayments only had amount+status
    const allPaidForSum = await db.payment.findMany({
      where: { ...yearWhere, status: "paid" },
      select: {
        studentId: true,
        feeType: true,
        academicYear: true,
        amount: true,
      },
    });
    for (const p of allPaidForSum) {
      const year = (p.academicYear ?? "").trim() || getCurrentAcademicYear();
      const key = `${p.studentId}|${p.feeType}|${year}`;
      // Only add to tuples that already exist (i.e., have a partial payment)
      if (sumByTuple.has(key)) {
        sumByTuple.set(key, (sumByTuple.get(key) ?? 0) + Number(p.amount ?? 0));
      }
    }
  }

  // Fetch class_fee_settings for all relevant (classId, year) pairs.
  const classYearPairs = new Set<string>();
  for (const [tupleKey] of sumByTuple) {
    const [studentId, , year] = tupleKey.split("|");
    const classId = classIdByStudent.get(studentId);
    if (!classId) continue;
    classYearPairs.add(`${classId}|${year}`);
  }
  const uniqueClassIds = Array.from(new Set(Array.from(classYearPairs).map((s) => s.split("|")[0])));
  const uniqueYears = Array.from(new Set(Array.from(classYearPairs).map((s) => s.split("|")[1])));

  let feeByClassYear = new Map<string, { tuition: number; uniform: number }>();
  if (uniqueClassIds.length > 0 && uniqueYears.length > 0) {
    const feeSettings = await db.classFeeSetting.findMany({
      where: {
        classId: { in: uniqueClassIds },
        academicYear: { in: uniqueYears },
      },
      select: { classId: true, academicYear: true, amount: true, uniformAmount: true },
    });
    for (const s of feeSettings) {
      feeByClassYear.set(`${s.classId}|${s.academicYear}`, {
        tuition: Number(s.amount ?? 0),
        uniform: Number(s.uniformAmount ?? 0),
      });
    }
  }

  let totalPending = 0;
  for (const [tupleKey, totalPaidForFee] of sumByTuple) {
    const [studentId, feeType, year] = tupleKey.split("|");
    const classId = classIdByStudent.get(studentId);
    if (!classId) continue;
    const fee = feeByClassYear.get(`${classId}|${year}`);
    if (!fee) {
      // No fee setting → fall back to per-payment math for this tuple.
      // Use the highest originalAmount/finalAmount seen on any payment
      // for this tuple as an estimate of the fee.
      const tuplePayments = allPartialPayments.filter(
        (p) => p.studentId === studentId
          && p.feeType === feeType
          && ((p.academicYear ?? "").trim() || getCurrentAcademicYear()) === year,
      );
      const feeEstimate = tuplePayments.reduce(
        (max, p) => Math.max(max, Number(p.finalAmount ?? p.originalAmount ?? 0)),
        0,
      );
      totalPending += Math.max(0, feeEstimate - totalPaidForFee);
      continue;
    }
    const feeAmount = feeType === "uniform" ? fee.uniform : fee.tuition;
    totalPending += Math.max(0, feeAmount - totalPaidForFee);
  }

  // ─── Total refunded ───────────────────────────────────────────────
  const allRefunded = await db.payment.findMany({
    where: { ...yearWhere, status: "refunded" },
    select: { amount: true },
  });
  const totalRefunded = allRefunded.reduce(
    (sum, p) => sum + Number(p.amount ?? 0),
    0,
  );

  return {
    total,
    paid,
    partial,
    pending,
    refunded,
    overdue,
    totalPaid,
    totalPending,
    totalRefunded,
  };
}

export async function getPaymentsByStudentId(
  studentId: string,
): Promise<PaymentListItem[]> {
  return getPayments({
    studentId,
  });
}

export async function getStudentPaymentSummary(
  studentId: string,
): Promise<{
  totalPaid: number;
  totalPending: number;
  totalRefunded: number;
  paymentsCount: number;
}> {
  // ─── Total paid ───────────────────────────────────────────────────
  // All payment amounts with status "paid" or "partial" are money the
  // school actually received. Sum them.
  const paidPayments = await db.payment.findMany({
    where: { studentId, status: { in: ["paid", "partial"] } },
    select: { amount: true, feeType: true, academicYear: true },
  });
  const totalPaid = paidPayments.reduce(
    (sum, p) => sum + Number(p.amount ?? 0),
    0,
  );

  // ─── Total pending ────────────────────────────────────────────────
  // For each unique (feeType, academicYear) the student has payments
  // for, look up the fee from class_fee_settings and compute remaining
  // = max(0, fee - sum of all amounts for this fee). Sum these.
  //
  // The previous implementation used `aggregate({ _sum: { amount: true }
  // })` over pending/partial payments, which counted the paid amounts
  // (not the remaining) AND ignored the actual fee from
  // class_fee_settings — completely wrong.
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: { section: { select: { classId: true } } },
  });
  const classId = student?.section?.classId ?? null;

  // Group paid totals by (feeType, year)
  const paidByFeeYear = new Map<string, number>();
  for (const p of paidPayments) {
    const year = (p.academicYear ?? "").trim() || getCurrentAcademicYear();
    const key = `${p.feeType}|${year}`;
    paidByFeeYear.set(key, (paidByFeeYear.get(key) ?? 0) + Number(p.amount ?? 0));
  }

  let totalPending = 0;
  if (classId) {
    // Fetch fee settings for every year the student has payments in.
    const years = Array.from(new Set(Array.from(paidByFeeYear.keys()).map((k) => k.split("|")[1])));
    if (years.length > 0) {
      const feeSettings = await db.classFeeSetting.findMany({
        where: { classId, academicYear: { in: years } },
        select: { academicYear: true, amount: true, uniformAmount: true },
      });
      const feeByYear = new Map<string, { tuition: number; uniform: number }>();
      for (const s of feeSettings) {
        feeByYear.set(s.academicYear, {
          tuition: Number(s.amount ?? 0),
          uniform: Number(s.uniformAmount ?? 0),
        });
      }

      for (const [key, paid] of paidByFeeYear) {
        const [feeType, year] = key.split("|");
        const fee = feeByYear.get(year);
        if (!fee) continue;
        const feeAmount = feeType === "uniform" ? fee.uniform : fee.tuition;
        totalPending += Math.max(0, feeAmount - paid);
      }
    }
  }

  // ─── Total refunded ───────────────────────────────────────────────
  const refundedAggregate = await db.payment.aggregate({
    where: { studentId, status: "refunded" },
    _sum: { amount: true },
  });
  const totalRefunded = refundedAggregate._sum.amount ?? 0;

  const paymentsCount = await db.payment.count({ where: { studentId } });

  return {
    totalPaid,
    totalPending,
    totalRefunded,
    paymentsCount,
  };
}

export async function hasPayments(): Promise<boolean> {
  const count = await db.payment.count();
  return count > 0;
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    (error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002") ||
    ((error as any)?.code === "P2002")
  );
}
