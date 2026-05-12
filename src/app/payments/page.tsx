import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  Hash,
  Receipt,
  RefreshCcw,
  Search,
  Trash2,
  UserRound,
  Wallet,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SmartAlert } from "@/components/shared/smart-alert";
import { getStudents } from "@/services/student-service";
import {
  createPayment,
  deletePayment,
  getPayments,
  getPaymentsCount,
} from "@/services/payment-service";
import {
  FEE_TYPES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
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

type PaymentsPageProps = {
  searchParams?: {
    q?: string;
    feeType?: string;
    status?: string;
    overdueOnly?: string;
    saved?: string;
    deleted?: string;
    error?: string;
  };
};

export default async function PaymentsPage({
  searchParams,
}: PaymentsPageProps) {
  const query = searchParams?.q?.trim() ?? "";
  const feeType = searchParams?.feeType?.trim() ?? "";
  const status = searchParams?.status?.trim() ?? "";
  const overdueOnly = searchParams?.overdueOnly === "1";

  const [payments, students, counts] = await Promise.all([
    getPayments({
      query,
      feeType,
      status,
      overdueOnly,
    }),
    getStudents(),
    getPaymentsCount(),
  ]);

  const hasPayments = counts.total > 0;

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-[1350px] flex-col gap-6">
        <PageHeader
          title="المدفوعات"
          description="سجّل المدفوعات والأقساط لكل طالب، وتابع حالة الدفع والمبالغ المعلّقة والمستحقة."
          icon="fees"
          badge="الخطوة الأخيرة"
        />

        <PaymentsFeedback
          saved={searchParams?.saved}
          deleted={searchParams?.deleted}
          error={searchParams?.error}
        />

        <SmartAlert
          tone="info"
          title="المدفوعات تعتمد على الطلاب"
          description="يجب إضافة الطلاب أولًا حتى تتمكن من تسجيل المدفوعات والأقساط المرتبطة بهم."
          actionLabel="إدارة الطلاب"
          actionHref="/students"
        />

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <PaymentCreateForm students={students} />

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
            />
          </div>
        </section>

        {!hasPayments ? (
          <EmptyState
            icon="fees"
            title="لا توجد مدفوعات بعد"
            description="ابدأ بتسجيل أول دفعة بعد إضافة الطلاب. يمكنك متابعة المدفوعات والمتبقي لكل طالب."
            actionLabel="تسجيل أول دفعة"
            actionHref="#payment-form"
            secondaryLabel="إدارة الطلاب"
            secondaryHref="/students"
          />
        ) : payments.length === 0 ? (
          <EmptyState
            icon="search"
            title="لا توجد نتائج مطابقة"
            description="جرّب البحث بعنوان الرسم أو اسم الطالب، أو غيّر فلتر النوع أو الحالة."
            actionLabel="عرض كل المدفوعات"
            actionHref="/payments"
          />
        ) : (
          <PaymentsList payments={payments} />
        )}
      </div>
    </AppShell>
  );
}

async function createPaymentAction(formData: FormData) {
  "use server";

  const input: PaymentFormInput = {
    feeTitle: String(formData.get("feeTitle") ?? ""),
    feeType: String(formData.get("feeType") ?? "tuition"),
    amount: String(formData.get("amount") ?? "0"),
    status: String(formData.get("status") ?? "paid"),
    method: String(formData.get("method") ?? "cash"),
    academicYear: String(formData.get("academicYear") ?? ""),
    dueDate: String(formData.get("dueDate") ?? ""),
    paidAt: String(formData.get("paidAt") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    studentId: String(formData.get("studentId") ?? ""),
  };

  const result = await createPayment(input);

  if (!result.ok) {
    redirect("/payments?error=create");
  }

  revalidatePath("/");
  revalidatePath("/payments");
  redirect("/payments?saved=1");
}

async function deletePaymentAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");

  if (!id) {
    redirect("/payments?error=missing-id");
  }

  const result = await deletePayment(id);

  if (!result.ok) {
    redirect("/payments?error=delete");
  }

  revalidatePath("/");
  revalidatePath("/payments");
  redirect("/payments?deleted=1");
}

type PaymentsFeedbackProps = {
  saved?: string;
  deleted?: string;
  error?: string;
};

function PaymentsFeedback({ saved, deleted, error }: PaymentsFeedbackProps) {
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
    const description =
      error === "delete"
        ? "لا يمكن حذف الدفعة حاليًا. تحقق من البيانات وحاول مرة أخرى."
        : error === "missing-id"
          ? "لم يتم تحديد الدفعة المراد حذفها."
          : "تأكد من إدخال بيانات الدفعة بشكل صحيح، وأن الطالب المحدد موجود.";

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

type PaymentCreateFormProps = {
  students: {
    id: string;
    fullName: string;
    studentCode: string | null;
    sectionName: string | null;
    className: string | null;
    classLevel: string | null;
  }[];
};

function PaymentCreateForm({ students }: PaymentCreateFormProps) {
  const academicYear = getCurrentAcademicYear();

  return (
    <form
      id="payment-form"
      action={createPaymentAction}
      className="app-card overflow-hidden"
    >
      <div className="border-b border-[var(--app-border-soft)] p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <CreditCard size={24} />
          </div>

          <div>
            <h3 className="text-xl font-extrabold text-[var(--app-text)]">
              تسجيل دفعة جديدة
            </h3>

            <p className="mt-1 text-sm leading-7 text-[var(--app-text-muted)]">
              أدخل بيانات الدفعة واربطها بالطالب. عنوان الرسم والمبلغ والطالب
              مطلوبون.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-6">
        <div>
          <label
            htmlFor="studentId"
            className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
          >
            الطالب <span className="text-red-600">*</span>
          </label>

          <select
            id="studentId"
            name="studentId"
            required
            className="input"
            defaultValue=""
          >
            <option value="">اختر الطالب...</option>

            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.fullName}{" "}
                {student.studentCode ? `(${student.studentCode})` : ""}{" "}
                {student.className
                  ? `- ${getStudentClassDisplay({
                      className: student.className,
                      classLevel: student.classLevel,
                      sectionName: student.sectionName,
                    })}`
                  : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="feeTitle"
              className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
            >
              عنوان الرسم <span className="text-red-600">*</span>
            </label>

            <input
              id="feeTitle"
              name="feeTitle"
              required
              minLength={2}
              maxLength={120}
              placeholder="مثال: قسط الشهر الأول"
              className="input"
            />
          </div>

          <div>
            <label
              htmlFor="feeType"
              className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
            >
              نوع الرسم
            </label>

            <select id="feeType" name="feeType" className="input" defaultValue="tuition">
              {FEE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div>
            <label
              htmlFor="amount"
              className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
            >
              المبلغ <span className="text-red-600">*</span>
            </label>

            <input
              id="amount"
              name="amount"
              type="number"
              required
              min={1}
              placeholder="مثال: 500000"
              className="input"
            />
          </div>

          <div>
            <label
              htmlFor="status"
              className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
            >
              حالة الدفع
            </label>

            <select id="status" name="status" className="input" defaultValue="paid">
              {PAYMENT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="method"
              className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
            >
              طريقة الدفع
            </label>

            <select id="method" name="method" className="input" defaultValue="cash">
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div>
            <label
              htmlFor="academicYear"
              className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
            >
              السنة الدراسية
            </label>

            <input
              id="academicYear"
              name="academicYear"
              maxLength={20}
              placeholder={academicYear}
              className="input"
              defaultValue={academicYear}
            />
          </div>

          <div>
            <label
              htmlFor="dueDate"
              className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
            >
              تاريخ الاستحقاق
            </label>

            <input
              id="dueDate"
              name="dueDate"
              type="date"
              className="input"
            />
          </div>

          <div>
            <label
              htmlFor="paidAt"
              className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
            >
              تاريخ الدفع
            </label>

            <input
              id="paidAt"
              name="paidAt"
              type="date"
              className="input"
            />
          </div>
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
            placeholder="أي ملاحظات إضافية حول الدفعة..."
            className="input min-h-[95px] resize-y leading-7"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-[var(--app-border-soft)] bg-slate-50/70 p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-7 text-[var(--app-text-muted)]">
          بعد تسجيل الدفعة، يمكنك متابعة حالتها وتحديثها لاحقًا.
        </p>

        <button type="submit" className="btn btn-primary">
          <CheckCircle2 size={18} />
          حفظ الدفعة
        </button>
      </div>
    </form>
  );
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
  pending,
  overdue,
}: PaymentsStatsProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <MoneyCard
          label="المدفوع"
          amount={totalPaid}
          icon={Banknote}
          iconClass="bg-emerald-100 text-emerald-700"
        />

        <MoneyCard
          label="المعلّق"
          amount={totalPending}
          icon={Clock}
          iconClass="bg-amber-100 text-amber-700"
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
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
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
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
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
};

function PaymentSearchForm({
  query,
  feeType,
  status,
  overdueOnly,
}: PaymentSearchFormProps) {
  return (
    <form action="/payments" className="app-card p-5">
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

        <select name="feeType" defaultValue={feeType} className="input">
          <option value="">كل الأنواع</option>

          {FEE_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>

        <select name="status" defaultValue={status} className="input">
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
    </form>
  );
}

type PaymentsListProps = {
  payments: PaymentListItem[];
};

function PaymentsList({ payments }: PaymentsListProps) {
  return (
    <section className="app-card overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-[var(--app-border-soft)] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-extrabold text-[var(--app-text)]">
            قائمة المدفوعات
          </h3>

          <p className="mt-1 text-sm leading-6 text-[var(--app-text-muted)]">
            تابع المدفوعات وحالاتها والمبالغ المرتبطة بكل طالب.
          </p>
        </div>

        <span className="badge badge-info">
          {payments.length} دفعة
        </span>
      </div>

      <div className="divide-y divide-[var(--app-border-soft)]">
        {payments.map((payment) => (
          <PaymentRow key={payment.id} payment={payment} />
        ))}
      </div>
    </section>
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
    <article className="grid gap-4 p-5 transition hover:bg-slate-50/70 xl:grid-cols-[1fr_auto] xl:items-center">
      <div className="flex min-w-0 gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700">
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
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 font-bold text-emerald-800">
              <Banknote size={14} />
              {payment.formattedAmount}
            </span>

            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-bold">
              {getFeeTypeLabel(payment.feeType)}
            </span>

            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-bold">
              {getPaymentMethodLabel(payment.method)}
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

            {payment.dueDate && (
              <p>
                الاستحقاق:{" "}
                <span className={overdue ? "font-bold text-red-600" : "font-bold text-[var(--app-text)]"}>
                  {new Date(payment.dueDate).toLocaleDateString("ar-IQ")}
                </span>
              </p>
            )}

            {payment.paidAt && (
              <p>
                تاريخ الدفع:{" "}
                <span className="font-bold text-[var(--app-text)]">
                  {new Date(payment.paidAt).toLocaleDateString("ar-IQ")}
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

      <div className="grid gap-2 sm:grid-cols-1 xl:w-[160px]">
        <form action={deletePaymentAction}>
          <input type="hidden" name="id" value={payment.id} />

          <button
            type="submit"
            className="btn w-full border-red-100 bg-red-50 text-red-700 hover:bg-red-100"
          >
            <Trash2 size={17} />
            حذف
          </button>
        </form>
      </div>
    </article>
  );
}
