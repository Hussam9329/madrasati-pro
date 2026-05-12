export type Student = {
  id: string;
  fullName: string;
  studentCode: string | null;
  gender: string | null;
  birthDate: Date | null;
  phone: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  address: string | null;
  enrollmentDate: Date;
  status: string;
  notes: string | null;
  sectionId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type StudentFormInput = {
  fullName: string;
  studentCode?: string;
  gender?: string;
  birthDate?: string | Date;
  phone?: string;
  guardianName?: string;
  guardianPhone?: string;
  address?: string;
  enrollmentDate?: string | Date;
  status?: StudentStatus;
  notes?: string;
  sectionId?: string;
};

export type StudentStatus = "active" | "inactive" | "graduated" | "transferred";

export type StudentGender = "male" | "female" | "unspecified";

export type StudentListItem = {
  id: string;
  fullName: string;
  studentCode: string | null;
  gender: string | null;
  birthDate: Date | null;
  phone: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  status: string;
  sectionId: string | null;
  sectionName: string | null;
  classId: string | null;
  className: string | null;
  classLevel: string | null;
  gradesCount: number;
  attendanceCount: number;
  feesCount: number;
  enrollmentDate: Date;
  createdAt: Date;
};

export type StudentDetails = Student & {
  sectionName: string | null;
  classId: string | null;
  className: string | null;
  classLevel: string | null;
  gradesCount: number;
  attendanceCount: number;
  feesCount: number;
};

export type StudentValidationResult = {
  valid: boolean;
  errors: Partial<Record<keyof StudentFormInput, string>>;
};

export type StudentsFilter = {
  query?: string;
  sectionId?: string;
  classId?: string;
  status?: string;
};

export function getEmptyStudentForm(): StudentFormInput {
  return {
    fullName: "",
    studentCode: "",
    gender: "unspecified",
    birthDate: "",
    phone: "",
    guardianName: "",
    guardianPhone: "",
    address: "",
    enrollmentDate: "",
    status: "active",
    notes: "",
    sectionId: "",
  };
}

export function normalizeStudentInput(
  input: StudentFormInput,
): StudentFormInput {
  return {
    fullName: input.fullName.trim(),
    studentCode: input.studentCode?.trim() || undefined,
    gender: input.gender?.trim() || "unspecified",
    birthDate: input.birthDate || undefined,
    phone: input.phone?.trim() || undefined,
    guardianName: input.guardianName?.trim() || undefined,
    guardianPhone: input.guardianPhone?.trim() || undefined,
    address: input.address?.trim() || undefined,
    enrollmentDate: input.enrollmentDate || undefined,
    status: input.status ?? "active",
    notes: input.notes?.trim() || undefined,
    sectionId: input.sectionId?.trim() || undefined,
  };
}

export function validateStudentInput(
  input: StudentFormInput,
): StudentValidationResult {
  const normalized = normalizeStudentInput(input);
  const errors: Partial<Record<keyof StudentFormInput, string>> = {};

  if (!normalized.fullName) {
    errors.fullName = "اسم الطالب مطلوب.";
  }

  if (normalized.fullName && normalized.fullName.length < 3) {
    errors.fullName = "اسم الطالب يجب أن يحتوي على 3 أحرف على الأقل.";
  }

  if (normalized.fullName && normalized.fullName.length > 120) {
    errors.fullName = "اسم الطالب طويل جدًا.";
  }

  if (normalized.studentCode && normalized.studentCode.length > 40) {
    errors.studentCode = "رقم الطالب يجب ألا يتجاوز 40 حرفًا.";
  }

  if (normalized.phone && normalized.phone.length < 7) {
    errors.phone = "رقم هاتف الطالب قصير جدًا.";
  }

  if (normalized.guardianPhone && normalized.guardianPhone.length < 7) {
    errors.guardianPhone = "رقم هاتف ولي الأمر قصير جدًا.";
  }

  if (normalized.guardianName && normalized.guardianName.length > 120) {
    errors.guardianName = "اسم ولي الأمر طويل جدًا.";
  }

  if (normalized.address && normalized.address.length > 300) {
    errors.address = "العنوان يجب ألا يتجاوز 300 حرف.";
  }

  if (normalized.notes && normalized.notes.length > 500) {
    errors.notes = "الملاحظات يجب ألا تتجاوز 500 حرف.";
  }

  if (
    normalized.gender &&
    !["male", "female", "unspecified"].includes(normalized.gender)
  ) {
    errors.gender = "الجنس غير صحيح.";
  }

  if (
    normalized.status &&
    !["active", "inactive", "graduated", "transferred"].includes(
      normalized.status,
    )
  ) {
    errors.status = "حالة الطالب غير صحيحة.";
  }

  if (normalized.birthDate && !isValidDateInput(normalized.birthDate)) {
    errors.birthDate = "تاريخ الميلاد غير صحيح.";
  }

  if (
    normalized.enrollmentDate &&
    !isValidDateInput(normalized.enrollmentDate)
  ) {
    errors.enrollmentDate = "تاريخ التسجيل غير صحيح.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function parseOptionalDate(value?: string | Date): Date | undefined {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  const date = new Date(trimmed);

  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function getStudentStatusLabel(status: string): string {
  const labels: Record<StudentStatus, string> = {
    active: "مستمر",
    inactive: "متوقف",
    graduated: "متخرج",
    transferred: "منقول",
  };

  return labels[status as StudentStatus] ?? "غير محدد";
}

export function getStudentStatusBadgeClass(status: string): string {
  const classes: Record<StudentStatus, string> = {
    active: "badge-success",
    inactive: "badge-warning",
    graduated: "badge-info",
    transferred: "badge-danger",
  };

  return classes[status as StudentStatus] ?? "badge-info";
}

export function getGenderLabel(gender?: string | null): string {
  if (gender === "male") {
    return "ذكر";
  }

  if (gender === "female") {
    return "أنثى";
  }

  return "غير محدد";
}

export function getStudentDisplayName(
  student: Pick<Student, "fullName" | "studentCode">,
): string {
  if (student.studentCode) {
    return `${student.fullName} - ${student.studentCode}`;
  }

  return student.fullName;
}

export function getStudentClassDisplay(input: {
  className?: string | null;
  classLevel?: string | null;
  sectionName?: string | null;
}): string {
  if (!input.className && !input.sectionName) {
    return "غير مرتبط بشعبة";
  }

  const classPart = input.classLevel
    ? `${input.className} - ${input.classLevel}`
    : input.className;

  if (input.sectionName) {
    return `${classPart} / شعبة ${input.sectionName}`;
  }

  return classPart ?? "غير مرتبط بشعبة";
}

export function calculateAge(birthDate?: Date | null): number | null {
  if (!birthDate) {
    return null;
  }

  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();

  const monthDifference = today.getMonth() - birthDate.getMonth();
  const dayDifference = today.getDate() - birthDate.getDate();

  if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

export function canDeleteStudent(input: {
  gradesCount?: number;
  attendanceCount?: number;
  feesCount?: number;
}): {
  allowed: boolean;
  reason?: string;
} {
  const gradesCount = input.gradesCount ?? 0;
  const attendanceCount = input.attendanceCount ?? 0;
  const feesCount = input.feesCount ?? 0;

  if (gradesCount > 0) {
    return {
      allowed: false,
      reason:
        "لا يمكن حذف الطالب لأنه يحتوي على درجات مسجلة. يمكنك تغيير حالته إلى متوقف أو منقول.",
    };
  }

  if (attendanceCount > 0) {
    return {
      allowed: false,
      reason:
        "لا يمكن حذف الطالب لأنه يحتوي على سجلات حضور. يمكنك تغيير حالته بدل الحذف.",
    };
  }

  if (feesCount > 0) {
    return {
      allowed: false,
      reason:
        "لا يمكن حذف الطالب لأنه يحتوي على أقساط أو مدفوعات. راجع السجل المالي أولًا.",
    };
  }

  return {
    allowed: true,
  };
}

function isValidDateInput(value: string | Date): boolean {
  if (value instanceof Date) {
    return !Number.isNaN(value.getTime());
  }

  if (!value.trim()) {
    return true;
  }

  const date = new Date(value);

  return !Number.isNaN(date.getTime());
}
