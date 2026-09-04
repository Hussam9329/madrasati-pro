import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock,
  Receipt,
  RefreshCcw,
  Search,
  Tag,
  Wallet,
} from "lucide-react";
import { safeQuery } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { InstantFilterForm } from "@/components/shared/instant-filter-form";
import { SmartAlert } from "@/components/shared/smart-alert";
import {
  createPayment,
  deletePayment,
  getPayments,
  getPaymentsCount,
} from "@/services/payment-service";
import {
  FEE_TYPES,
  PAYMENT_STATUSES,
  resolvePaymentAmounts,
  formatMoney,
  getFeeTypeLabel,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
  getPaymentStatusBadgeClass,
  isPaymentOverdue,
  getCurrentAcademicYear,
  type PaymentFormInput,
  type PaymentListItem,
} from "@/types/payment";
import { getStudentClassDisplay } from "@/types/student";
import { DeleteConfirmButton } from "@/components/shared/delete-confirm-button";
import { PaymentCreateForm } from "@/components/payments/payment-create-form";
import { getStudentFeePlans, getActiveAcademicYear, getAcademicYearOptions } from "@/services/class-fee-service";

export const dynamic = "force-dynamic";



type PaymentsPageProps = {
  searchParams?: Promise<{
    q?: string;
    feeType?: string;
    status?: string;
    overdueOnly?: string;
    academicYear?: string;
    saved?: string;
    deleted?: string;
    error?: string;
    reason?: string;
  }>;
};

export default async function PaymentsPage({
  searchParams,
}: PaymentsPageProps) {
  await requireAdmin();
  const resolvedSearchParams = await searchParams;

  const query = resolvedSearchParams?.q?.trim() ?? "";
  const feeType = resolvedSearchParams?.feeType?.trim() ?? "";
  const status = resolvedSearchParams?.status?.trim() ?? "";
  const overdueOnly = resolvedSearchParams?.overdueOnly === "1";

  // The whole page (form + list + stats + fee plans) operates on ONE
  // academic year so the numbers never mix across years. It defaults to
  // the "active" year — the newest year that actually has class fee
  // settings — instead of the raw calendar-derived year, so recording
  // installments keeps working right after the September rollover and
  // before the school configures the new year's fees.
  const [academicYear, yearOptions] = await Promise.all([
    resolvedSearchParams?.academicYear?.trim()
      ? Promise.resolve(resolvedSearchParams.academicYear.trim())
      : safeQuery(() => getActiveAcademicYear(), getCurrentAcademicYear()),
    safeQuery(() => getAcademicYearOptions(), [getCurrentAcademicYear()]),
  ]);

  const [payments, studentFeePlans, counts] = await Promise.all([
    safeQuery(() => getPayments({
      query,
      feeType,
      status,
      overdueOnly,
      academicYear,
    }), []),
    safeQuery(() => getStudentFeePlans(academicYear), []),
    safeQuery(() => getPaymentsCount(academicYear), { total: 0, paid: 0, partial: 0, pending: 0, refunded: 0, overdue: 0, totalPaid: 0, totalPending: 0, totalRefunded: 0 }),
  ]);

  const hasPayments = counts.total > 0;

  // Do fee settings exist for the year being viewed? If not, the create
  // form cannot resolve amounts and the stats' pending figure is an
  // estimate — surface a clear, actionable warning instead of a silently
  // dead form.
  const yearHasFeeSettings = studentFeePlans.some(
    (plan) => plan.tuitionAmount > 0 || plan.uniformAmount > 0,
  );

  return (
    <div className="mx-auto flex w-full max-w-[1350px] flex-col gap-6">
        <PageHeader
          title="المدفوعات"
          description="سجّل المدفوعات والأقساط لكل طالب، وتابع حالة الدفع والمبالغ المعلّقة والمستحقة."
          icon="fees"
          badge="الخطوة الأخيرة"
        />

        <PaymentsFeedback
          saved={resolvedSearchParams?.saved}
          deleted={resolvedSearchParams?.deleted}
          error={resolvedSearchParams?.error}
          reason={resolvedSearchParams?.reason}
        />

        {!yearHasFeeSettings && (
          <SmartAlert
            tone="warning"
            title={`لا توجد رسوم محددة للسنة ${academicYear}`}
            description="حدّد الرسوم الدراسية وسعر الزي لكل صف في صفحة إدارة الأقساط لهذه السنة حتى تتمكن من تسجيل الدفعات والأقساط."
            actionLabel="إدارة الأقساط والرسوم"
            actionHref="/fees"
          />
        )}

        <AcademicYearSwitcher
          academicYear={academicYear}
          yearOptions={yearOptions}
          activeCount={payments.length}
        />

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <PaymentCreateForm
            students={studentFeePlans}
            academicYear={academicYear}
            action={createPaymentAction}
          />

          <div className="flex flex-col gap-6">
            <PaymentsStats
              totalPaid={counts.totalPaid}
              totalPending={counts.totalPending}
              totalRefunded={counts.totalRefunded}
              total={counts.total}
              paid={counts.paid}
              pending={counts.pending}
              overdue={counts.overdue}
            />

            <PaymentSearchForm
              query={query}
              feeType={feeType}
              status={status}
              overdueOnly={overdueOnly}
              academicYear={academicYear}
            />
          </div>
        </section>

        {!hasPayments ? (
          <EmptyState
            icon="fees"
            title={`لا توجد مدفوعات في السنة ${academicYear}`}
            description="ابدأ بتسجيل أول دفعة لهذه السنة الدراسية بعد تحديد رسوم الصفوف. يمكنك متابعة المدفوعات والمتبقي لكل طالب."
            actionLabel="تسجيل أول دفعة"
            actionHref="#payment-form"
            secondaryLabel="إدارة الأقساط والرسوم"
            secondaryHref="/fees"
          />
        ) : payments.length === 0 ? (
          <EmptyState
            icon="search"
            title="لا توجد نتائج مطابقة"
            description="جرّب البحث بعنوان الرسم أو اسم الطالب، أو غيّر فلتر النوع أو الحالة."
            actionLabel="عرض كل المدفوعات"
            actionHref={`/payments?academicYear=${encodeURIComponent(academicYear)}`}
          />
        ) : (
          <PaymentsList payments={payments} studentFeePlans={studentFeePlans} />
        )}
      </div>
  );
}

async function createPaymentAction(formData: FormData) {
  "use server";

  // The form's year field is read-only and defaults to the active
  // academic year. As defense-in-depth, validate the submitted year's
  // format ("YYYY" or "YYYY-YYYY"): anything else — an empty value, a
  // stray note typed into the field, arbitrary text — falls back to
  // the active year so the payment is never orphaned from its fee plan
  // by a malformed year string.
  const formYear = String(formData.get("academicYear") ?? "").trim();
  const isYearFormat = /^\d{4}(-\d{4})?$/.test(formYear);
  const academicYear = isYearFormat ? formYear : await getActiveAcademicYear();

  const rawInput: PaymentFormInput = {
    feeTitle: String(formData.get("feeTitle") ?? ""),
    feeType: String(formData.get("feeType") ?? "tuition"),
    amount: String(formData.get("paidAmount") ?? "") || String(formData.get("originalAmount") ?? "0"),
    originalAmount: String(formData.get("originalAmount") ?? ""),
    discountAmount: String(formData.get("discountAmount") ?? "0"),
    discountPercent: String(formData.get("discountPercent") ?? "0"),
    discountReason: String(formData.get("discountReason") ?? "").trim() || undefined,
    finalAmount: "",
    status: String(formData.get("status") ?? "paid"),
    method: String(formData.get("method") ?? "cash"),
    academicYear,
    dueDate: String(formData.get("dueDate") ?? ""),
    paidAt: String(formData.get("paidAt") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    studentId: String(formData.get("studentId") ?? ""),
  };

  const paymentMode = String(formData.get("paymentMode") ?? "full");
  const resolved = resolvePaymentAmounts(rawInput);
  const feeType = rawInput.feeType ?? "tuition";
  const isUniform = feeType === "uniform";
  const isFullTuition = paymentMode === "full" || resolved.paidAmount >= resolved.finalAmount;
  let status = rawInput.status ?? "paid";
  let paidAmount = resolved.paidAmount;

  if (isUniform || isFullTuition) {
    status = "paid";
    paidAmount = resolved.finalAmount;
  } else {
    status = "partial";
    paidAmount = Math.max(0, Math.min(resolved.paidAmount, Math.max(0, resolved.finalAmount - 1)));
  }

  const input: PaymentFormInput = {
    ...rawInput,
    feeTitle: rawInput.feeTitle || (isUniform ? "زي مدرسي" : "رسوم دراسية"),
    feeType,
    amount: String(paidAmount),
    originalAmount: String(resolved.originalAmount),
    discountAmount: String(resolved.discountAmount),
    discountPercent: String(resolved.discountPercent),
    finalAmount: String(resolved.finalAmount),
    status,
  };

  const result = await createPayment(input);

  if (!result.ok) {
    const reason = encodeURIComponent(result.message);
    redirect(`/payments?academicYear=${encodeURIComponent(academicYear)}&error=create&reason=${reason}`);
  }

  revalidatePath("/");
  revalidatePath("/payments");
  revalidatePath("/fees");
  revalidatePath("/reports");
  redirect(`/payments?saved=1&academicYear=${encodeURIComponent(academicYear)}`);
}

async function deletePaymentAction(formData: FormData): Promise<{ ok: boolean; message?: string }> {
  "use server";

  const id = String(formData.get("id") ?? "");

  if (!id) {
    return { ok: false, message: "معرّف الدفعة مفقود." };
  }

  let result;
  try {
    result = await deletePayment(id);
  } catch (error) {
    console.error("[deletePaymentAction] Error:", error);
    return { ok: false, message: "حدث خطأ أثناء الحذف. تأكد من عدم وجود بيانات مرتبطة." };
  }

  if (!result.ok) {
    return { ok: false, message: result.message || "حدث خطأ أثناء الحذف." };
  }

  revalidatePath("/");
  revalidatePath("/payments");
  revalidatePath("/fees");
  revalidatePath("/reports");
  redirect("/payments?deleted=1");
}

type AcademicYearSwitcherProps = {
  academicYear: string;
  yearOptions: string[];
  activeCount: number;
};

function AcademicYearSwitcher({ academicYear, yearOptions, activeCount }: AcademicYearSwitcherProps) {
  return (
    <div className="app-card flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="flex items-center gap-2 text-sm font-extrabold text-[var(--app-text)]">
        <CalendarDays size={18} className="text-indigo-600" />
        السنة الدراسية المعروضة:
        <span className="rounded-lg bg-indigo-100 px-3 py-1 text-indigo-800" dir="ltr">{academicYear}</span>
        <span className="text-xs font-bold text-[var(--app-text-muted)]">({activeCount} دفعة)</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {yearOptions.map((year) => (
          <a
            key={year}
            href={`/payments?academicYear=${encodeURIComponent(year)}`}
            className={
              year === academicYear
                ? "btn btn-primary px-4 py-1.5 text-xs"
                : "btn btn-secondary px-4 py-1.5 text-xs"
            }
            dir="ltr"
          >
            {year}
          </a>
        ))}
      </div>
    </div>
  );
}

type PaymentsFeedbackProps = {
  saved?: string;
  deleted?: string;
  error?: string;
  reason?: string;
};

function PaymentsFeedback({ saved, deleted, error, reason }: PaymentsFeedbackProps) {
  if (saved === "1") {
    return (
      <SmartAlert
        tone="success"
        title="تمت إضافة الدفعة بنجاح"
        description="تم حفظ بيانات الدفعة وربطها بالطالب المحدد."
      />
    );
  }

  if (deleted === "1") {
    return (
      <SmartAlert
        tone="success"
        title="تم حذف الدفعة"
        description="تم حذف الدفعة من السجلات بنجاح."
      />
    );
  }

  if (error) {
    let description: string;
    if (reason) {
      description = reason;
    } else if (error === "delete") {
      description = "لا يمكن حذف الدفعة حاليًا. تحقق من البيانات وحاول مرة أخرى.";
    } else if (error === "missing-id") {
      description = "لم يتم تحديد الدفعة المراد حذفها.";
    } else {
      description = "تأكد من إدخال بيانات الدفعة بشكل صحيح، وأن الطالب المحدد موجود.";
    }

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

type MoneyCardProps = {
  label: string;
  amount: number;
  icon: React.ElementType;
  iconClass: string;
};

function MoneyCard({ label, amount, icon: Icon, iconClass }: MoneyCardProps) {
  return (
    <div className="app-card app-card-hover p-5">
      <div className="flex items-center gap-4">
        <div
          className={[
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
            iconClass,
          ].join(" ")}
        >
          <Icon size={22} />
        </div>

        <div>
          <p className="text-sm font-bold text-[var(--app-text-muted)]">
            {label}
          </p>

          <p className="mt-1 text-2xl font-extrabold text-[var(--app-text)]">
            {formatMoney(amount)}
          </p>
        </div>
      </div>
    </div>
  );
}

type PaymentsStatsProps = {
  totalPaid: number;
  totalPending: number;
  totalRefunded: number;
  total: number;
  paid: number;
  pending: number;
  overdue: number;
};

function PaymentsStats({
  totalPaid,
  totalPending,
  totalRefunded,
  total,
  paid,
  overdue,
}: PaymentsStatsProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <MoneyCard
          label="المدفوع"
          amount={totalPaid}
          icon={Banknote}
          iconClass="bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700"
        />

        <MoneyCard
          label="المعلّق"
          amount={totalPending}
          icon={Clock}
          iconClass="bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700"
        />

        <MoneyCard
          label="المسترجع"
          amount={totalRefunded}
          icon={RefreshCcw}
          iconClass="bg-sky-100 text-sky-700"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="app-card app-card-hover p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700">
              <Receipt size={22} />
            </div>

            <div>
              <p className="text-sm font-bold text-[var(--app-text-muted)]">
                إجمالي المدفوعات
              </p>

              <p className="mt-1 text-3xl font-extrabold text-[var(--app-text)]">
                {total}
              </p>
            </div>
          </div>
        </div>

        <div className="app-card app-card-hover p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700">
              <CheckCircle2 size={22} />
            </div>

            <div>
              <p className="text-sm font-bold text-[var(--app-text-muted)]">
                مدفوعة
              </p>

              <p className="mt-1 text-3xl font-extrabold text-[var(--app-text)]">
                {paid}
              </p>
            </div>
          </div>
        </div>

        <div className="app-card app-card-hover p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-700">
              <AlertTriangle size={22} />
            </div>

            <div>
              <p className="text-sm font-bold text-[var(--app-text-muted)]">
                متأخرة
              </p>

              <p className="mt-1 text-3xl font-extrabold text-[var(--app-text)]">
                {overdue}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type PaymentSearchFormProps = {
  query: string;
  feeType: string;
  status: string;
  overdueOnly: boolean;
  academicYear: string;
};

function PaymentSearchForm({
  query,
  feeType,
  status,
  overdueOnly,
  academicYear,
}: PaymentSearchFormProps) {
  return (
    <InstantFilterForm action="/payments" className="app-card p-5">
      {/* Keep the year context when filtering — without this, every
          search reset the page to the default year. */}
      <input type="hidden" name="academicYear" value={academicYear} />

      <label
        htmlFor="q"
        className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
      >
        البحث والتصفية
      </label>

      <div className="grid gap-3 md:grid-cols-[1fr_160px_160px_auto]">
        <div className="relative">
          <Search
            size={18}
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--app-text-soft)]"
          />

          <input
            id="q"
            name="q"
            defaultValue={query}
            placeholder="عنوان الرسم، اسم الطالب..."
            className="input pr-11"
          />
        </div>

        <select id="payment-fee-type-filter" name="feeType" defaultValue={feeType} className="input">
          <option value="">كل الأنواع</option>

          {FEE_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>

        <select id="payment-status-filter" name="status" defaultValue={status} className="input">
          <option value="">كل الحالات</option>

          {PAYMENT_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <button type="submit" className="btn btn-secondary">
          بحث
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          type="checkbox"
          id="overdueOnly"
          name="overdueOnly"
          value="1"
          defaultChecked={overdueOnly}
          className="h-4 w-4 rounded border-[var(--app-border)] text-blue-600 focus:ring-blue-500"
        />

        <label
          htmlFor="overdueOnly"
          className="text-sm font-bold text-[var(--app-text-muted)]"
        >
          عرض المتأخرة فقط
        </label>
      </div>
    </InstantFilterForm>
  );
}

type PaymentsListProps = {
  payments: PaymentListItem[];
  studentFeePlans: ReturnType<typeof getStudentFeePlans> extends Promise<infer T> ? T : never;
};

type StudentFeePlan = PaymentsListProps["studentFeePlans"][number];

/**
 * Group payments by studentId so each student appears as a single
 * expandable card with a summary row (total / paid / remaining) and the
 * individual payment rows nested beneath.
 */
function PaymentsList({ payments, studentFeePlans }: PaymentsListProps) {
  // Build a lookup: studentId → fee plan (so we can show the canonical
  // tuitionAmount / uniformAmount for each student).
  const feePlanByStudent = new Map<string, StudentFeePlan>();
  for (const plan of studentFeePlans) {
    feePlanByStudent.set(plan.studentId, plan);
  }

  // Group payments by studentId, preserving first-occurrence order
  // (payments arrive sorted by createdAt desc, so the most recent
  // payment's student appears first).
  const studentsInOrder: string[] = [];
  const paymentsByStudent = new Map<string, PaymentListItem[]>();
  for (const p of payments) {
    if (!paymentsByStudent.has(p.studentId)) {
      paymentsByStudent.set(p.studentId, []);
      studentsInOrder.push(p.studentId);
    }
    paymentsByStudent.get(p.studentId)!.push(p);
  }

  return (
    <section className="app-card overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-[var(--app-border-soft)] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-extrabold text-[var(--app-text)]">
            قائمة المدفوعات حسب الطالب
          </h3>
          <p className="mt-1 text-sm leading-6 text-[var(--app-text-muted)]">
            لكل طالب: المبلغ الكلي، المدفوع، والمتبقي — مع تفاصيل كل دفعة بالأسفل.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="badge badge-info">
            {studentsInOrder.length} طالب — {payments.length} دفعة
          </span>
        </div>
      </div>

      <div className="divide-y divide-[var(--app-border-soft)]">
        {studentsInOrder.map((studentId) => (
          <StudentPaymentsGroup
            key={studentId}
            studentId={studentId}
            payments={paymentsByStudent.get(studentId) ?? []}
            feePlan={feePlanByStudent.get(studentId) ?? null}
          />
        ))}
      </div>
    </section>
  );
}

type StudentPaymentsGroupProps = {
  studentId: string;
  payments: PaymentListItem[];
  feePlan: StudentFeePlan | null;
};

function StudentPaymentsGroup({ studentId, payments, feePlan }: StudentPaymentsGroupProps) {
  if (payments.length === 0) return null;

  const first = payments[0];
  const studentName = first.studentName;
  const studentCode = first.studentCode;
  const classDisplay = getStudentClassDisplay({
    className: first.className,
    classLevel: first.classLevel,
    sectionName: first.sectionName,
  }) || "غير محدد";

  // ─── Compute per-student totals ───────────────────────────────────
  // Use the StudentFeePlan as the canonical source for the tuition +
  // uniform amounts. If the plan is missing (e.g., student has no
  // active class fee setting), fall back to summing the payment rows.
  const tuitionAmount = feePlan ? feePlan.tuitionAmount : 0;
  const uniformAmount = feePlan ? feePlan.uniformAmount : 0;

  // Total fee this student owes (tuition + uniform) for the academic year.
  const totalFee = tuitionAmount + uniformAmount;

  // Sum of all PAID + PARTIAL payment amounts (actual cash received).
  const totalPaid = payments
    .filter((p) => p.status === "paid" || p.status === "partial")
    .reduce((sum, p) => sum + Number(p.amount ?? 0), 0);

  // Remaining = total fee - total paid. If we don't have a fee plan,
  // fall back to the last payment's remainingAmount (best effort).
  const totalRemaining = feePlan
    ? Math.max(0, totalFee - totalPaid)
    : Math.max(0, (first.remainingAmount ?? 0));

  // Count installments (partial payments) for this student.
  const installmentsCount = payments.filter((p) => p.status === "partial").length;
  const paidCount = payments.filter((p) => p.status === "paid").length;

  const isFullyPaid = totalFee > 0 && totalPaid >= totalFee;

  return (
    <details className="group" open>
      <summary className="flex cursor-pointer flex-col gap-3 p-5 transition hover:bg-indigo-50/40 lg:flex-row lg:items-center lg:justify-between">
        {/* Student identity */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700">
            <Wallet size={22} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-base font-extrabold text-[var(--app-text)]">
                {studentName}
              </h4>
              {studentCode && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700" dir="ltr">
                  {studentCode}
                </span>
              )}
              {isFullyPaid ? (
                <span className="badge bg-emerald-100 text-emerald-700">
                  <CheckCircle2 size={12} className="ml-1" />
                  مسدّد بالكامل
                </span>
              ) : (
                <span className="badge bg-amber-100 text-amber-700">
                  <Clock size={12} className="ml-1" />
                  عليه متبقٍ
                </span>
              )}
            </div>
            <p className="mt-1 text-xs font-bold text-[var(--app-text-muted)]">
              {classDisplay} — {payments.length} دفعة
              {installmentsCount > 0 && ` (${installmentsCount} قسط)`}
              {paidCount > 0 && ` (${paidCount} مدفوع)`}
            </p>
          </div>
        </div>

        {/* Summary stats: الكلي / المدفوع / المتبقي */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:flex lg:items-center">
          <div className="flex flex-col items-center rounded-2xl bg-blue-50 px-3 py-2 text-center lg:w-[140px]">
            <span className="text-[11px] font-bold text-blue-700">المبلغ الكلي</span>
            <span className="mt-0.5 text-sm font-extrabold text-blue-900" dir="ltr">
              {formatMoney(totalFee)}
            </span>
          </div>
          <div className="flex flex-col items-center rounded-2xl bg-emerald-50 px-3 py-2 text-center lg:w-[140px]">
            <span className="text-[11px] font-bold text-emerald-700">المدفوع</span>
            <span className="mt-0.5 text-sm font-extrabold text-emerald-900" dir="ltr">
              {formatMoney(totalPaid)}
            </span>
          </div>
          <div className={`flex flex-col items-center rounded-2xl px-3 py-2 text-center lg:w-[140px] ${totalRemaining > 0 ? "bg-red-50" : "bg-slate-50"}`}>
            <span className={`text-[11px] font-bold ${totalRemaining > 0 ? "text-red-700" : "text-slate-600"}`}>المتبقي</span>
            <span className={`mt-0.5 text-sm font-extrabold ${totalRemaining > 0 ? "text-red-900" : "text-slate-700"}`} dir="ltr">
              {formatMoney(totalRemaining)}
            </span>
          </div>
        </div>
      </summary>

      {/* Per-payment rows */}
      <div className="border-t border-[var(--app-border-soft)] bg-[var(--app-card-soft)]/40">
        {payments.map((payment) => (
          <PaymentRow key={payment.id} payment={payment} />
        ))}
      </div>
    </details>
  );
}

type PaymentRowProps = {
  payment: PaymentListItem;
};

function PaymentRow({ payment }: PaymentRowProps) {
  const statusClass = getPaymentStatusBadgeClass(payment.status);

  const overdue = isPaymentOverdue({
    status: payment.status,
    dueDate: payment.dueDate,
  });

  return (
    <article className="grid gap-4 p-5 transition hover:bg-indigo-50/40 xl:grid-cols-[1fr_auto] xl:items-center">
      <div className="flex min-w-0 gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700">
          <Wallet size={25} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-lg font-extrabold text-[var(--app-text)]">
              {payment.feeTitle}
            </h4>

            <span className={["badge", statusClass].join(" ")}>
              {getPaymentStatusLabel(payment.status)}
            </span>

            {overdue && (
              <span className="badge bg-red-100 text-red-700">
                متأخرة
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-2 text-sm text-[var(--app-text-muted)]">
            {payment.originalAmount != null && payment.originalAmount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 font-bold text-blue-800">
                <Banknote size={14} />
                أصل المبلغ: {payment.formattedOriginalAmount}
              </span>
            )}

            {payment.discountAmount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 font-bold text-amber-800">
                <Tag size={14} />
                خصم: {payment.formattedDiscountAmount}
                {payment.discountPercent != null && payment.discountPercent > 0 && (
                  <> ({payment.discountPercent}٪)</>
                )}
              </span>
            )}

            {payment.finalAmount != null && payment.finalAmount > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 font-bold text-emerald-800">
                <Banknote size={14} />
                المبلغ النهائي: {payment.formattedFinalAmount}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 font-bold text-emerald-800">
                <Banknote size={14} />
                {payment.formattedAmount}
              </span>
            )}

            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-bold">
              {getFeeTypeLabel(payment.feeType)}
            </span>

            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-bold">
              {getPaymentMethodLabel(payment.method)}
            </span>

            <span className={payment.isUniformPaid ? "inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 font-bold text-emerald-800" : "inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-700"}>
              الزي المدرسي: {payment.isUniformPaid ? "صح" : "غلط"}
            </span>

            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 font-bold text-purple-800">
              المتبقي: {payment.formattedRemainingAmount}
            </span>
          </div>

          <div className="mt-3 grid gap-2 text-sm leading-6 text-[var(--app-text-muted)] md:grid-cols-2">
            <p>
              الطالب:{" "}
              <span className="font-bold text-[var(--app-text)]">
                {payment.studentName}
              </span>
            </p>

            <p>
              الصف:{" "}
              <span className="font-bold text-[var(--app-text)]">
                {getStudentClassDisplay({
                  className: payment.className,
                  classLevel: payment.classLevel,
                  sectionName: payment.sectionName,
                }) || "غير محدد"}
              </span>
            </p>

            <p>
              طريقة الدفع:{" "}
              <span className="font-bold text-[var(--app-text)]">
                {getPaymentMethodLabel(payment.method)}
              </span>
            </p>

            {payment.discountReason && (
              <p>
                سبب الخصم:{" "}
                <span className="font-bold text-amber-700">
                  {payment.discountReason}
                </span>
              </p>
            )}

            {payment.dueDate && (
              <p>
                الاستحقاق:{" "}
                <span className={overdue ? "font-bold text-red-600" : "font-bold text-[var(--app-text)]"}>
                  {new Date(payment.dueDate).toLocaleDateString("ar-IQ-u-nu-latn")}
                </span>
              </p>
            )}

            {payment.paidAt && (
              <p>
                تاريخ الدفع:{" "}
                <span className="font-bold text-[var(--app-text)]">
                  {new Date(payment.paidAt).toLocaleDateString("ar-IQ-u-nu-latn")}
                </span>
              </p>
            )}

            {payment.academicYear && (
              <p>
                السنة الدراسية:{" "}
                <span className="font-bold text-[var(--app-text)]">
                  {payment.academicYear}
                </span>
              </p>
            )}
          </div>

          {payment.notes && (
            <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">
              ملاحظات: {payment.notes}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-1 xl:w-[170px]">
        <a
          href={`/api/payments/${payment.id}/receipt`}
          target="_blank"
          rel="noreferrer"
          className="btn btn-secondary justify-center"
        >
          <Receipt size={16} />
          طباعة الوصل
        </a>

        <DeleteConfirmButton
          action={deletePaymentAction}
          itemId={payment.id}
          entityName="الدفعة"
          associations={[]}
        />
      </div>
    </article>
  );
}
