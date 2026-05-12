export const dynamic = 'force-dynamic';
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  School,
  Sparkles,
} from "lucide-react";
import { safeQuery } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { SmartAlert } from "@/components/shared/smart-alert";
import { getSchoolOverview, createOrUpdateSchool } from "@/services/school-service";
import type { SchoolFormInput } from "@/types/school";

type SchoolPageProps = {
  searchParams?: {
    saved?: string;
    error?: string;
  };
};

export default async function SchoolPage({ searchParams }: SchoolPageProps) {
  const { school, summary, completionPercentage } = await safeQuery(
    () => getSchoolOverview(),
    { school: null, summary: null, completionPercentage: 0 },
  );

  const hasSavedMessage = searchParams?.saved === "1";
  const hasErrorMessage = searchParams?.error === "validation";

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
        <PageHeader
          title="بيانات المدرسة"
          description="أضف معلومات المدرسة الأساسية حتى تظهر لاحقًا في التقارير والواجهات الرسمية."
          icon="school"
          badge="خطوة تأسيسية"
        />

        {hasSavedMessage ? (
          <SmartAlert
            tone="success"
            title="تم حفظ بيانات المدرسة"
            description="رائع، تم تحديث معلومات المدرسة بنجاح. الآن يمكنك الانتقال إلى المواد الدراسية."
            actionLabel="الانتقال إلى المواد"
            actionHref="/subjects"
          />
        ) : null}

        {hasErrorMessage ? (
          <SmartAlert
            tone="warning"
            title="توجد بيانات ناقصة أو غير صحيحة"
            description="تأكد من كتابة اسم المدرسة بشكل صحيح، ومراجعة البريد الإلكتروني أو رابط الشعار إن وجد."
          />
        ) : null}

        {!school ? (
          <SmartAlert
            tone="info"
            title="ابدأ بتسجيل بيانات المدرسة"
            description="هذه الخطوة ليست معقدة. اسم المدرسة يكفي كبداية، ويمكنك إكمال الهاتف والعنوان والشعار لاحقًا."
          />
        ) : (
          <SchoolOverviewCard
            name={school.name}
            academicYear={school.academicYear}
            completionPercentage={completionPercentage}
            contactStatus={summary?.contactStatus ?? "empty"}
          />
        )}

        <section className="grid gap-6 xl:grid-cols-[1fr_0.75fr]">
          <SchoolForm
            defaultValues={{
              name: school?.name ?? "",
              academicYear: school?.academicYear ?? "",
              address: school?.address ?? "",
              phone: school?.phone ?? "",
              email: school?.email ?? "",
              logoUrl: school?.logoUrl ?? "",
              notes: school?.notes ?? "",
            }}
          />

          <SchoolTips />
        </section>
      </div>
    </AppShell>
  );
}

async function saveSchoolAction(formData: FormData) {
  "use server";

  const input: SchoolFormInput = {
    name: String(formData.get("name") ?? ""),
    academicYear: String(formData.get("academicYear") ?? ""),
    address: String(formData.get("address") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    logoUrl: String(formData.get("logoUrl") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  };

  const result = await createOrUpdateSchool(input);

  if (!result.ok) {
    redirect("/school?error=validation");
  }

  revalidatePath("/");
  revalidatePath("/school");
  redirect("/school?saved=1");
}

type SchoolFormProps = {
  defaultValues: SchoolFormInput;
};

function SchoolForm({ defaultValues }: SchoolFormProps) {
  return (
    <form action={saveSchoolAction} className="app-card overflow-hidden">
      <div className="border-b border-[var(--app-border-soft)] bg-gradient-to-l from-indigo-50/40 to-violet-50/20 p-6">
        <h3 className="text-xl font-extrabold text-[var(--app-text)]">
          معلومات المدرسة
        </h3>

        <p className="mt-1 text-sm leading-7 text-[var(--app-text-muted)]">
          املأ البيانات الأساسية. الحقول الاختيارية تساعد في جعل التقارير أكثر
          احترافية.
        </p>
      </div>

      <div className="grid gap-5 p-6">
        <FormField
          label="اسم المدرسة"
          name="name"
          placeholder="مثال: مدرسة النور الأهلية"
          defaultValue={defaultValues.name}
          required
        />

        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            label="السنة الدراسية"
            name="academicYear"
            placeholder="مثال: 2025 - 2026"
            defaultValue={defaultValues.academicYear}
          />

          <FormField
            label="رقم الهاتف"
            name="phone"
            placeholder="مثال: 07700000000"
            defaultValue={defaultValues.phone}
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            label="البريد الإلكتروني"
            name="email"
            type="email"
            placeholder="school@example.com"
            defaultValue={defaultValues.email}
          />

          <FormField
            label="رابط الشعار"
            name="logoUrl"
            type="url"
            placeholder="https://example.com/logo.png"
            defaultValue={defaultValues.logoUrl}
          />
        </div>

        <FormField
          label="العنوان"
          name="address"
          placeholder="مثال: بغداد - الكرادة - شارع..."
          defaultValue={defaultValues.address}
        />

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
            rows={4}
            defaultValue={defaultValues.notes}
            placeholder="أي ملاحظات إضافية عن المدرسة..."
            className="input min-h-[110px] resize-y leading-7"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-[var(--app-border-soft)] bg-gradient-to-l from-indigo-50/30 to-violet-50/20 p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-7 text-[var(--app-text-muted)]">
          سيتم استخدام هذه البيانات لاحقًا في التقارير والطباعة.
        </p>

        <button type="submit" className="btn btn-primary">
          <CheckCircle2 size={18} />
          حفظ بيانات المدرسة
        </button>
      </div>
    </form>
  );
}

type FormFieldProps = {
  label: string;
  name: keyof SchoolFormInput;
  placeholder?: string;
  defaultValue?: string;
  type?: string;
  required?: boolean;
};

function FormField({
  label,
  name,
  placeholder,
  defaultValue,
  type = "text",
  required = false,
}: FormFieldProps) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
      >
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="input"
      />
    </div>
  );
}

type SchoolOverviewCardProps = {
  name: string;
  academicYear: string | null;
  completionPercentage: number;
  contactStatus: "complete" | "partial" | "empty";
};

function SchoolOverviewCard({
  name,
  academicYear,
  completionPercentage,
  contactStatus,
}: SchoolOverviewCardProps) {
  const contactLabel =
    contactStatus === "complete"
      ? "مكتملة"
      : contactStatus === "partial"
        ? "جزئية"
        : "غير مضافة";

  const contactBadgeClass =
    contactStatus === "complete"
      ? "badge-success"
      : contactStatus === "partial"
        ? "badge-warning"
        : "badge-danger";

  return (
    <section className="app-card p-6">
      <div className="grid gap-5 md:grid-cols-[1fr_220px] md:items-center">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700">
            <School size={27} />
          </div>

          <div>
            <h3 className="text-xl font-extrabold text-[var(--app-text)]">
              {name}
            </h3>

            <p className="mt-2 text-sm leading-7 text-[var(--app-text-muted)]">
              السنة الدراسية:{" "}
              <span className="font-bold text-[var(--app-text)]">
                {academicYear || "لم تحدد بعد"}
              </span>
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="badge badge-info">
                اكتمال البيانات {completionPercentage}%
              </span>

              <span className={["badge", contactBadgeClass].join(" ")}>
                معلومات الاتصال {contactLabel}
              </span>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-xs font-extrabold text-[var(--app-text-muted)]">
            <span>جاهزية البيانات</span>
            <span>{completionPercentage}%</span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-l from-indigo-500 to-violet-500 transition-all"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function SchoolTips() {
  const tips = [
    {
      icon: Building2,
      title: "اسم المدرسة مهم",
      description: "سيظهر في رأس التقارير والوثائق الرسمية.",
    },
    {
      icon: Phone,
      title: "رقم الهاتف",
      description: "يساعد في إكمال معلومات التواصل داخل التقارير.",
    },
    {
      icon: Mail,
      title: "البريد الإلكتروني",
      description: "اختياري، لكنه يعطي طابعًا رسميًا للبيانات.",
    },
    {
      icon: MapPin,
      title: "العنوان",
      description: "يفيد عند طباعة التقارير أو مشاركة بيانات المدرسة.",
    },
  ];

  return (
    <aside className="flex flex-col gap-5">
      <div className="app-card p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-700">
            <Sparkles size={21} />
          </div>

          <div>
            <h3 className="font-extrabold text-[var(--app-text)]">
              إرشادات سريعة
            </h3>

            <p className="mt-1 text-sm text-[var(--app-text-muted)]">
              معلومات صغيرة، فائدتها كبيرة.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {tips.map((tip) => {
            const Icon = tip.icon;

            return (
              <div
                key={tip.title}
                className="flex gap-3 rounded-2xl border border-[var(--app-border-soft)] bg-white p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 text-slate-600">
                  <Icon size={19} />
                </div>

                <div>
                  <p className="font-extrabold text-[var(--app-text)]">
                    {tip.title}
                  </p>

                  <p className="mt-1 text-sm leading-6 text-[var(--app-text-muted)]">
                    {tip.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <SmartAlert
        tone="info"
        title="بعد حفظ بيانات المدرسة"
        description="الخطوة التالية هي إضافة المواد الدراسية، لأنها الأساس الذي تعتمد عليه الصفوف والمدرسون والدرجات."
        actionLabel="إدارة المواد"
        actionHref="/subjects"
      />
    </aside>
  );
}
