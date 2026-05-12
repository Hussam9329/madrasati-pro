export type Teacher = {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  specialty: string | null;
  salary: number | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type TeacherFormInput = {
  fullName: string;
  phone?: string;
  email?: string;
  address?: string;
  specialty?: string;
  salary?: number | string;
  notes?: string;
  isActive?: boolean;
  subjectIds?: string[];
};

export type TeacherListItem = {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  specialty: string | null;
  salary: number | null;
  notes: string | null;
  isActive: boolean;
  subjects: {
    id: string;
    name: string;
  }[];
  subjectsCount: number;
  schedulesCount: number;
  createdAt: Date;
};

export type TeacherDetails = Teacher & {
  subjects: {
    id: string;
    name: string;
  }[];
  subjectsCount: number;
  schedulesCount: number;
};

export type TeacherValidationResult = {
  valid: boolean;
  errors: Partial<Record<keyof TeacherFormInput, string>>;
};

export type TeacherStatus = "active" | "inactive";

export function getEmptyTeacherForm(): TeacherFormInput {
  return {
    fullName: "",
    phone: "",
    email: "",
    address: "",
    specialty: "",
    salary: "",
    notes: "",
    isActive: true,
    subjectIds: [],
  };
}

export function normalizeTeacherInput(
  input: TeacherFormInput,
): TeacherFormInput {
  const salaryValue =
    typeof input.salary === "string" ? input.salary.trim() : input.salary;

  return {
    fullName: input.fullName.trim(),
    phone: input.phone?.trim() || undefined,
    email: input.email?.trim() || undefined,
    address: input.address?.trim() || undefined,
    specialty: input.specialty?.trim() || undefined,
    salary:
      salaryValue === "" || salaryValue === undefined
        ? undefined
        : Number(salaryValue),
    notes: input.notes?.trim() || undefined,
    isActive: input.isActive ?? true,
    subjectIds: Array.isArray(input.subjectIds)
      ? input.subjectIds.filter(Boolean)
      : [],
  };
}

export function validateTeacherInput(
  input: TeacherFormInput,
): TeacherValidationResult {
  const normalized = normalizeTeacherInput(input);
  const errors: Partial<Record<keyof TeacherFormInput, string>> = {};

  if (!normalized.fullName) {
    errors.fullName = "اسم المدرس مطلوب.";
  }

  if (normalized.fullName && normalized.fullName.length < 3) {
    errors.fullName = "اسم المدرس يجب أن يحتوي على 3 أحرف على الأقل.";
  }

  if (normalized.fullName && normalized.fullName.length > 120) {
    errors.fullName = "اسم المدرس طويل جدًا.";
  }

  if (normalized.phone && normalized.phone.length < 7) {
    errors.phone = "رقم الهاتف قصير جدًا.";
  }

  if (normalized.email && !isValidEmail(normalized.email)) {
    errors.email = "البريد الإلكتروني غير صحيح.";
  }

  if (normalized.address && normalized.address.length > 300) {
    errors.address = "العنوان يجب ألا يتجاوز 300 حرف.";
  }

  if (normalized.specialty && normalized.specialty.length > 100) {
    errors.specialty = "التخصص طويل جدًا.";
  }

  if (
    normalized.salary !== undefined &&
    (Number.isNaN(Number(normalized.salary)) || Number(normalized.salary) < 0)
  ) {
    errors.salary = "الراتب يجب أن يكون رقمًا صحيحًا أو موجبًا.";
  }

  if (normalized.notes && normalized.notes.length > 500) {
    errors.notes = "الملاحظات يجب ألا تتجاوز 500 حرف.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function getTeacherStatus(
  teacher: Pick<Teacher, "isActive">,
): TeacherStatus {
  return teacher.isActive ? "active" : "inactive";
}

export function getTeacherStatusLabel(status: TeacherStatus): string {
  const labels: Record<TeacherStatus, string> = {
    active: "فعّال",
    inactive: "متوقف",
  };

  return labels[status];
}

export function getTeacherStatusBadgeClass(status: TeacherStatus): string {
  return status === "active" ? "badge-success" : "badge-warning";
}

export function getTeacherDisplayName(
  teacher: Pick<Teacher, "fullName" | "specialty">,
): string {
  if (teacher.specialty) {
    return `${teacher.fullName} - ${teacher.specialty}`;
  }

  return teacher.fullName;
}

export function formatTeacherSalary(salary?: number | null): string {
  if (salary === null || salary === undefined) {
    return "غير محدد";
  }

  return new Intl.NumberFormat("ar-IQ").format(salary);
}

export function formatTeacherSubjects(
  subjects: {
    name: string;
  }[],
): string {
  if (subjects.length === 0) {
    return "لا توجد مواد مرتبطة";
  }

  return subjects
    .map((subject) => subject.name)
    .join("، ");
}

export function canDeleteTeacher(input: {
  schedulesCount?: number;
}): {
  allowed: boolean;
  reason?: string;
} {
  const schedulesCount = input.schedulesCount ?? 0;

  if (schedulesCount > 0) {
    return {
      allowed: false,
      reason:
        "لا يمكن حذف المدرس لأنه مرتبط بحصص في الجدول الدراسي. يمكنك تعطيله بدل حذفه.",
    };
  }

  return {
    allowed: true,
  };
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
