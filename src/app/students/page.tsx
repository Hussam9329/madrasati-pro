export const dynamic = 'force-dynamic';
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  Hash,
  Phone,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SmartAlert } from "@/components/shared/smart-alert";
import { getSections } from "@/services/class-service";
import {
  createStudent,
  deleteStudent,
  getStudents,
  getStudentsCount,
  updateStudentStatus,
} from "@/services/student-service";
import {
  calculateAge,
  getGenderLabel,
  getStudentClassDisplay,
  getStudentStatusBadgeClass,
  getStudentStatusLabel,
  type StudentFormInput,
  type StudentListItem,
  type StudentStatus,
} from "@/types/student";
import type { SectionListItem } from "@/types/class";

type StudentsPageProps = {
  searchParams?: {
    q?: string;
    status?: string;
    saved?: string;
    deleted?: string;
    statusUpdated?: string;
    error?: string;
  };
};

export default async function StudentsPage({
  searchParams,
}: StudentsPageProps) {
  const query = searchParams?.q?.trim() ?? "";
  const status = searchParams?.status?.trim() ?? "";

  const [students, sections, counts] = await Promise.all([
    getStudents({
      query,
      status,
    }),
    getSections(),
    getStudentsCount(),
  ]);

  const activeSections = sections.filter((section) => section.isActive);
  const hasStudents = counts.total > 0;

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-[1350px] flex-col gap-6">
        <PageHeader
          title="الطلاب"
          description="أضف الطلاب واربط كل طالب بالشعبة المناسبة، مع متابعة الحالة والمعلومات الأساسية."
          icon="students"
          badge="الخطوة الرابعة"
        />

        <StudentsFeedback
          saved={searchParams?.saved}
          deleted={searchParams?.deleted}
          statusUpdated={searchParams?.statusUpdated}
          error={searchParams?.error}
        />

        <SmartAlert
          tone="info"
          title="الطلاب يعتمدون على الشُعب"
          description="يمكنك إضافة الطالب بدون شعبة مؤقتًا، لكن الأفضل ربطه بشعبة حتى تعمل الحضور والدرجات والتقارير بشكل أدق."
          actionLabel="إدارة الصفوف والشُعب"
          actionHref="/classes"
        />

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <StudentCreateForm sections={activeSections} />

          <div className="flex flex-col gap-6">
            <StudentsStats
              total={counts.total}
              active={counts.active}
              inactive={counts.inactive}
              graduated={counts.graduated}
              transferred={counts.transferred}
              withoutSection={counts.withoutSection}
            />

            <StudentSearchForm query={query} status={status} />
          </div>
        </section>

        {!hasStudents ? (
          <EmptyState
            icon="students"
            title="لا يوجد طلاب بعد"
            description="ابدأ بإضافة أول طالب، ثم اربطه بالشعبة المناسبة. بعدها يصبح تسجيل الحضور والدرجات والأقساط أسهل."
            actionLabel="إضافة أول طالب"
            actionHref="#student-form"
            secondaryLabel="إدارة الشُعب"
            secondaryHref="/classes"
          />
        ) : students.length === 0 ? (
          <EmptyState
            icon="search"
            title="لا توجد نتائج مطابقة"
            description="جرّب البحث باسم الطالب أو رقم الطالب أو ولي الأمر، أو غيّر فلتر الحالة."
            actionLabel="عرض كل الطلاب"
            actionHref="/students"
          />
        ) : (
          <StudentsList students={students} />
        )}
      </div>
    </AppShell>
  );
}

async function createStudentAction(formData: FormData) {
  "use server";

  const input: StudentFormInput = {
    fullName: String(formData.get("fullName") ?? ""),
    studentCode: String(formData.get("studentCode") ?? ""),
    gender: String(formData.get("gender") ?? "unspecified"),
    birthDate: String(formData.get("birthDate") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    guardianName: String(formData.get("guardianName") ?? ""),
    guardianPhone: String(formData.get("guardianPhone") ?? ""),
    address: String(formData.get("address") ?? ""),
    enrollmentDate: String(formData.get("enrollmentDate") ?? ""),
    status: String(formData.get("status") ?? "active") as StudentStatus,
    notes: String(formData.get("notes") ?? ""),
    sectionId: String(formData.get("sectionId") ?? ""),
  };

  const result = await createStudent(input);

  if (!result.ok) {
    redirect("/students?error=create");
  }

  revalidatePath("/");
  revalidatePath("/students");
  redirect("/students?saved=1");
}

async function updateStudentStatusAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!id || !status) {
    redirect("/students?error=missing-data");
  }

  const result = await updateStudentStatus(id, status);

  if (!result.ok) {
    redirect("/students?error=status");
  }

  revalidatePath("/");
  revalidatePath("/students");
  redirect("/students?statusUpdated=1");
}

async function deleteStudentAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");

  if (!id) {
    redirect("/students?error=missing-id");
  }

  const result = await deleteStudent(id);

  if (!result.ok) {
    redirect("/students?error=delete");
  }

  revalidatePath("/");
  revalidatePath("/students");
  redirect("/students?deleted=1");
}

type StudentsFeedbackProps = {
  saved?: string;
  deleted?: string;
  statusUpdated?: string;
  error?: string;
};

function StudentsFeedback({
  saved,
  deleted,
  statusUpdated,
  error,
}: StudentsFeedbackProps) {
  if (saved === "1") {
    return (
      <SmartAlert
        tone="success"
        title="تمت إضافة الطالب بنجاح"
        description="تم حفظ بيانات الطالب وربطه بالشعبة المحددة إن وُجدت."
      />
    );
  }

  if (deleted === "1") {
    return (
      <SmartAlert
        tone="success"
        title="تم حذف الطالب"
        description="تم حذف الطالب لأنه لا يملك سجلات حضور أو درجات أو أقساط مرتبطة."
      />
    );
  }

  if (statusUpdated === "1") {
    return (
      <SmartAlert
        tone="success"
        title="تم تحديث حالة الطالب"
        description="تم تغيير حالة الطالب بنجاح."
      />
    );
  }

  if (error) {
    const description =
      error === "delete"
        ? "لا يمكن حذف الطالب إذا كانت لديه درجات أو حضور أو أقساط. غيّر حالته بدل الحذف."
        : error === "status"
          ? "تعذر تغيير حالة الطالب. تأكد من اختيار حالة صحيحة."
          : "تأكد من إدخال اسم الطالب بشكل صحيح، وأن رقم الطالب غير مكرر.";

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

type StudentCreateFormProps = {
  sections: SectionListItem[];
};

function StudentCreateForm({ sections }: StudentCreateFormProps) {
  return (
    <form
      id="student-form"
      action={createStudentAction}
      className="app-card overflow-hidden"
    >
      <div className="border-b border-[var(--app-border-soft)] bg-gradient-to-l from-indigo-50/40 to-violet-50/20 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700">
            <UserRound size={24} />
          </div>

          <div>
            <h3 className="text-xl font-extrabold text-[var(--app-text)]">
              إضافة طالب
            </h3>

            <p className="mt-1 text-sm leading-7 text-[var(--app-text-muted)]">
              أدخل بيانات الطالب الأساسية. الاسم فقط مطلوب، وباقي التفاصيل يمكن
              إكمالها لاحقًا.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-6">
        <div>
          <label
            htmlFor="fullName"
            className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
          >
            اسم الطالب <span className="text-red-600">*</span>
          </label>

          <input
            id="fullName"
            name="fullName"
            required
            minLength={3}
            maxLength={120}
            placeholder="مثال: أحمد علي حسين"
            className="input"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            label="رقم الطالب"
            name="studentCode"
            placeholder="مثال: ST-1001"
            maxLength={40}
          />

          <div>
            <label
              htmlFor="sectionId"
              className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
            >
              الشعبة
            </label>

            <select id="sectionId" name="sectionId" className="input" defaultValue="">
              <option value="">بدون شعبة مؤقتًا</option>

              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {getStudentClassDisplay({
                    className: section.className,
                    sectionName: section.name,
                  })}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div>
            <label
              htmlFor="gender"
              className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
            >
              الجنس
            </label>

            <select
              id="gender"
              name="gender"
              defaultValue="unspecified"
              className="input"
            >
              <option value="unspecified">غير محدد</option>
              <option value="male">ذكر</option>
              <option value="female">أنثى</option>
            </select>
          </div>

          <FormField label="تاريخ الميلاد" name="birthDate" type="date" />

          <div>
            <label
              htmlFor="status"
              className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
            >
              الحالة
            </label>

            <select id="status" name="status" defaultValue="active" className="input">
              <option value="active">مستمر</option>
              <option value="inactive">متوقف</option>
              <option value="graduated">متخرج</option>
              <option value="transferred">منقول</option>
            </select>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            label="هاتف الطالب"
            name="phone"
            placeholder="مثال: 07700000000"
          />

          <FormField
            label="تاريخ التسجيل"
            name="enrollmentDate"
            type="date"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            label="اسم ولي الأمر"
            name="guardianName"
            placeholder="مثال: علي حسين"
            maxLength={120}
          />

          <FormField
            label="هاتف ولي الأمر"
            name="guardianPhone"
            placeholder="مثال: 07800000000"
          />
        </div>

        <div>
          <label
            htmlFor="address"
            className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
          >
            العنوان
          </label>

          <textarea
            id="address"
            name="address"
            rows={3}
            maxLength={300}
            placeholder="عنوان الطالب..."
            className="input min-h-[95px] resize-y leading-7"
          />
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
            placeholder="أي ملاحظات إضافية..."
            className="input min-h-[95px] resize-y leading-7"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-[var(--app-border-soft)] bg-gradient-to-l from-indigo-50/30 to-violet-50/20 p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-7 text-[var(--app-text-muted)]">
          بعد إضافة الطلاب، يمكن استخدامهم في الحضور والدرجات والأقساط.
        </p>

        <button type="submit" className="btn btn-primary">
          <CheckCircle2 size={18} />
          حفظ الطالب
        </button>
      </div>
    </form>
  );
}

type FormFieldProps = {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
  maxLength?: number;
};

function FormField({
  label,
  name,
  placeholder,
  type = "text",
  maxLength,
}: FormFieldProps) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        maxLength={maxLength}
        placeholder={placeholder}
        className="input"
      />
    </div>
  );
}

type StudentsStatsProps = {
  total: number;
  active: number;
  inactive: number;
  graduated: number;
  transferred: number;
  withoutSection: number;
};

function StudentsStats({
  total,
  active,
  inactive,
  graduated,
  transferred,
  withoutSection,
}: StudentsStatsProps) {
  const stats = [
    {
      label: "إجمالي الطلاب",
      value: total,
      icon: Users,
      className: "bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700",
    },
    {
      label: "مستمرون",
      value: active,
      icon: CheckCircle2,
      className: "bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700",
    },
    {
      label: "متوقفون",
      value: inactive,
      icon: AlertTriangle,
      className: "bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700",
    },
    {
      label: "متخرجون",
      value: graduated,
      icon: GraduationCap,
      className: "bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-700",
    },
    {
      label: "منقولون",
      value: transferred,
      icon: ShieldCheck,
      className: "bg-gradient-to-br from-rose-100 to-pink-100 text-rose-700",
    },
    {
      label: "بدون شعبة",
      value: withoutSection,
      icon: UserRound,
      className: "bg-gradient-to-br from-slate-100 to-slate-50 text-slate-700",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div key={stat.label} className="app-card app-card-hover p-5">
            <div className="flex items-center gap-4">
              <div
                className={[
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                  stat.className,
                ].join(" ")}
              >
                <Icon size={22} />
              </div>

              <div>
                <p className="text-sm font-bold text-[var(--app-text-muted)]">
                  {stat.label}
                </p>

                <p className="mt-1 text-3xl font-extrabold text-[var(--app-text)]">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

type StudentSearchFormProps = {
  query: string;
  status: string;
};

function StudentSearchForm({ query, status }: StudentSearchFormProps) {
  return (
    <form action="/students" className="app-card p-5">
      <label
        htmlFor="q"
        className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
      >
        البحث والتصفية
      </label>

      <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
        <div className="relative">
          <Search
            size={18}
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--app-text-soft)]"
          />

          <input
            id="q"
            name="q"
            defaultValue={query}
            placeholder="اسم الطالب، الرقم، الهاتف، ولي الأمر..."
            className="input pr-11"
          />
        </div>

        <select name="status" defaultValue={status} className="input">
          <option value="">كل الحالات</option>
          <option value="active">مستمر</option>
          <option value="inactive">متوقف</option>
          <option value="graduated">متخرج</option>
          <option value="transferred">منقول</option>
        </select>

        <button type="submit" className="btn btn-secondary">
          بحث
        </button>
      </div>
    </form>
  );
}

type StudentsListProps = {
  students: StudentListItem[];
};

function StudentsList({ students }: StudentsListProps) {
  return (
    <section className="app-card overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-[var(--app-border-soft)] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-extrabold text-[var(--app-text)]">
            قائمة الطلاب
          </h3>

          <p className="mt-1 text-sm leading-6 text-[var(--app-text-muted)]">
            تابع الطلاب وحالاتهم وربطهم بالشُعب والسجلات المرتبطة.
          </p>
        </div>

        <span className="badge badge-info">{students.length} طالب</span>
      </div>

      <div className="divide-y divide-[var(--app-border-soft)]">
        {students.map((student) => (
          <StudentRow key={student.id} student={student} />
        ))}
      </div>
    </section>
  );
}

type StudentRowProps = {
  student: StudentListItem;
};

function StudentRow({ student }: StudentRowProps) {
  const age = calculateAge(student.birthDate);
  const statusClass = getStudentStatusBadgeClass(student.status);

  return (
    <article className="grid gap-4 p-5 transition hover:bg-indigo-50/40 xl:grid-cols-[1fr_auto] xl:items-center">
      <div className="flex min-w-0 gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700">
          <UserRound size={25} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-lg font-extrabold text-[var(--app-text)]">
              {student.fullName}
            </h4>

            <span className={["badge", statusClass].join(" ")}>
              {getStudentStatusLabel(student.status)}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-2 text-sm text-[var(--app-text-muted)]">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-bold">
              <Hash size={14} />
              {student.studentCode || "بدون رقم"}
            </span>

            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-bold">
              <GraduationCap size={14} />
              {getStudentClassDisplay({
                className: student.className,
                classLevel: student.classLevel,
                sectionName: student.sectionName,
              })}
            </span>

            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-bold">
              <CalendarDays size={14} />
              العمر: {age ?? "غير محدد"}
            </span>
          </div>

          <div className="mt-3 grid gap-2 text-sm leading-6 text-[var(--app-text-muted)] md:grid-cols-2">
            <p>
              الجنس:{" "}
              <span className="font-bold text-[var(--app-text)]">
                {getGenderLabel(student.gender)}
              </span>
            </p>

            <p>
              هاتف الطالب:{" "}
              <span className="font-bold text-[var(--app-text)]">
                {student.phone || "غير مضاف"}
              </span>
            </p>

            <p>
              ولي الأمر:{" "}
              <span className="font-bold text-[var(--app-text)]">
                {student.guardianName || "غير مضاف"}
              </span>
            </p>

            <p>
              هاتف ولي الأمر:{" "}
              <span className="font-bold text-[var(--app-text)]">
                {student.guardianPhone || "غير مضاف"}
              </span>
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="badge bg-slate-100 text-slate-600">
              الحضور: {student.attendanceCount}
            </span>

            <span className="badge bg-slate-100 text-slate-600">
              الدرجات: {student.gradesCount}
            </span>

            <span className="badge bg-slate-100 text-slate-600">
              الأقساط: {student.feesCount}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:w-[260px] xl:grid-cols-1">
        <form action={updateStudentStatusAction} className="flex gap-2">
          <input type="hidden" name="id" value={student.id} />

          <select
            name="status"
            defaultValue={student.status}
            className="input h-11 flex-1 py-0 text-sm"
          >
            <option value="active">مستمر</option>
            <option value="inactive">متوقف</option>
            <option value="graduated">متخرج</option>
            <option value="transferred">منقول</option>
          </select>

          <button type="submit" className="btn btn-secondary h-11 px-3">
            حفظ
          </button>
        </form>

        <a
          href={`tel:${student.guardianPhone || student.phone || ""}`}
          className={[
            "btn btn-secondary w-full",
            !student.guardianPhone && !student.phone
              ? "pointer-events-none opacity-60"
              : "",
          ].join(" ")}
        >
          <Phone size={17} />
          اتصال
        </a>

        <form action={deleteStudentAction}>
          <input type="hidden" name="id" value={student.id} />

          <button
            type="submit"
            className="btn w-full border-red-100 bg-gradient-to-r from-red-50 to-rose-50 text-red-700 hover:from-red-100 hover:to-rose-100"
          >
            <Trash2 size={17} />
            حذف
          </button>
        </form>
      </div>
    </article>
  );
}
