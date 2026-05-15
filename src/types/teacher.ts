import { IRAQI_PHONE_REGEX, validateQuadrupleName } from "@/lib/validators";

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
  phone: string;
  subjectIds: string[];
  sectionIds?: string[];
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
  sections: {
    id: string;
    name: string;
    className: string;
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
    subjectIds: [],
    sectionIds: [],
  };
}

export function normalizeTeacherInput(
  input: TeacherFormInput,
): TeacherFormInput {
  return {
    fullName: input.fullName.trim(),
    phone: input.phone?.trim() || "",
    subjectIds: Array.isArray(input.subjectIds)
      ? input.subjectIds.filter(Boolean)
      : [],
    sectionIds: Array.isArray(input.sectionIds)
      ? input.sectionIds.filter(Boolean)
      : [],
  };
}

export function validateTeacherInput(
  input: TeacherFormInput,
): TeacherValidationResult {
  const normalized = normalizeTeacherInput(input);
  const errors: Partial<Record<keyof TeacherFormInput, string>> = {};

  if (!normalized.fullName) {
    errors.fullName = "الاسم الرباعي للمدرس مطلوب.";
  } else if (!validateQuadrupleName(normalized.fullName)) {
    errors.fullName = "يجب إدخال الاسم الرباعي كاملًا.";
  }

  if (!normalized.phone) {
    errors.phone = "رقم هاتف المدرس يجب أن يتكون من 11 رقم ويبدأ بـ 07.";
  } else if (!IRAQI_PHONE_REGEX.test(normalized.phone)) {
    errors.phone = "رقم هاتف المدرس يجب أن يتكون من 11 رقم ويبدأ بـ 07.";
  }

  if (!normalized.subjectIds || normalized.subjectIds.length === 0) {
    errors.subjectIds = "يجب اختيار المادة التي يدرّسها المدرس.";
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
  teacherSubjectsCount?: number;
  teacherSectionsCount?: number;
  gradesCount?: number;
}): {
  allowed: boolean;
  reason?: string;
} {
  const schedulesCount = input.schedulesCount ?? 0;
  const teacherSubjectsCount = input.teacherSubjectsCount ?? 0;
  const teacherSectionsCount = input.teacherSectionsCount ?? 0;
  const gradesCount = input.gradesCount ?? 0;

  if (gradesCount > 0) {
    return {
      allowed: false,
      reason:
        "لا يمكن حذف المدرس لأنه مرتبط بدرجات طلاب. يمكنك تعطيله بدل حذفه.",
    };
  }

  if (schedulesCount > 0) {
    return {
      allowed: false,
      reason:
        "لا يمكن حذف المدرس لأنه مرتبط بمحاضرات في الجدول الدراسي. يمكنك تعطيله بدل حذفه.",
    };
  }

  if (teacherSubjectsCount > 0) {
    return {
      allowed: false,
      reason:
        "لا يمكن حذف المدرس لأنه مرتبط بمواد دراسية. يمكنك تعطيله بدل حذفه.",
    };
  }

  if (teacherSectionsCount > 0) {
    return {
      allowed: false,
      reason:
        "لا يمكن حذف المدرس لأنه مرتبط بشعب دراسية. يمكنك تعطيله بدل حذفه.",
    };
  }

  return {
    allowed: true,
  };
}
