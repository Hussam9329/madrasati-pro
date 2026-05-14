export type SchoolClass = {
  id: string;
  name: string;
  level: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Section = {
  id: string;
  name: string;
  capacity: number | null;
  description: string | null;
  isActive: boolean;
  classId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ClassFormInput = {
  name: string;
  level?: string;
  description?: string;
  isActive?: boolean;
};

export type SectionFormInput = {
  name: string;
  capacity?: number | string;
  description?: string;
  isActive?: boolean;
  classId: string;
};

export type ClassListItem = {
  id: string;
  name: string;
  level: string | null;
  description: string | null;
  isActive: boolean;
  sectionsCount: number;
  studentsCount: number;
  subjectsCount: number;
  schedulesCount: number;
  subjectIds: string[];
  createdAt: Date;
};

export type SectionListItem = {
  id: string;
  name: string;
  capacity: number | null;
  description: string | null;
  isActive: boolean;
  classId: string;
  className: string;
  studentsCount: number;
  schedulesCount: number;
  createdAt: Date;
};

export type ClassDetails = SchoolClass & {
  sections: SectionListItem[];
  subjectsCount: number;
  schedulesCount: number;
  studentsCount: number;
};

export type ClassValidationResult = {
  valid: boolean;
  errors: Partial<Record<keyof ClassFormInput, string>>;
};

export type SectionValidationResult = {
  valid: boolean;
  errors: Partial<Record<keyof SectionFormInput, string>>;
};

export type ClassStatus = "active" | "inactive";

export function getEmptyClassForm(): ClassFormInput {
  return {
    name: "",
    level: "",
    description: "",
    isActive: true,
  };
}

export function getEmptySectionForm(classId = ""): SectionFormInput {
  return {
    name: "",
    capacity: "",
    description: "",
    isActive: true,
    classId,
  };
}

export function normalizeClassInput(input: ClassFormInput): ClassFormInput {
  return {
    name: input.name.trim(),
    level: input.level?.trim() || undefined,
    description: input.description?.trim() || undefined,
    isActive: input.isActive ?? true,
  };
}

export function normalizeSectionInput(
  input: SectionFormInput,
): SectionFormInput {
  const capacityValue =
    typeof input.capacity === "string"
      ? input.capacity.trim()
      : input.capacity;

  return {
    name: input.name.trim(),
    capacity:
      capacityValue === "" || capacityValue === undefined
        ? undefined
        : Number(capacityValue),
    description: input.description?.trim() || undefined,
    isActive: input.isActive ?? true,
    classId: input.classId.trim(),
  };
}

export function validateClassInput(
  input: ClassFormInput,
): ClassValidationResult {
  const normalized = normalizeClassInput(input);
  const errors: Partial<Record<keyof ClassFormInput, string>> = {};

  if (!normalized.name) {
    errors.name = "اسم الصف مطلوب.";
  }

  if (normalized.name && normalized.name.length < 2) {
    errors.name = "اسم الصف يجب أن يحتوي على حرفين على الأقل.";
  }

  if (normalized.name && normalized.name.length > 80) {
    errors.name = "اسم الصف طويل جدًا.";
  }

  if (normalized.level && normalized.level.length > 50) {
    errors.level = "المرحلة طويلة جدًا.";
  }

  if (normalized.description && normalized.description.length > 300) {
    errors.description = "وصف الصف يجب ألا يتجاوز 300 حرف.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateSectionInput(
  input: SectionFormInput,
): SectionValidationResult {
  const normalized = normalizeSectionInput(input);
  const errors: Partial<Record<keyof SectionFormInput, string>> = {};

  if (!normalized.classId) {
    errors.classId = "يجب اختيار الصف.";
  }

  if (!normalized.name) {
    errors.name = "اسم الشعبة مطلوب.";
  }

  if (normalized.name && normalized.name.length > 30) {
    errors.name = "اسم الشعبة طويل جدًا.";
  }

  if (
    normalized.capacity !== undefined &&
    (Number.isNaN(Number(normalized.capacity)) || Number(normalized.capacity) < 1)
  ) {
    errors.capacity = "عدد الطلاب المسموح يجب أن يكون رقمًا أكبر من صفر.";
  }

  if (normalized.description && normalized.description.length > 300) {
    errors.description = "وصف الشعبة يجب ألا يتجاوز 300 حرف.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function getClassStatus(
  schoolClass: Pick<SchoolClass, "isActive">,
): ClassStatus {
  return schoolClass.isActive ? "active" : "inactive";
}

export function getClassStatusLabel(status: ClassStatus): string {
  const labels: Record<ClassStatus, string> = {
    active: "فعّال",
    inactive: "متوقف",
  };

  return labels[status];
}

export function getClassDisplayName(
  schoolClass: Pick<SchoolClass, "name" | "level">,
): string {
  if (schoolClass.level) {
    return `${schoolClass.name} - ${schoolClass.level}`;
  }

  return schoolClass.name;
}

export function getSectionDisplayName(
  section: Pick<SectionListItem, "name" | "className">,
): string {
  return `${section.className} / شعبة ${section.name}`;
}

export function canDeleteClass(input: {
  sectionsCount?: number;
  studentsCount?: number;
  subjectsCount?: number;
  schedulesCount?: number;
}): {
  allowed: boolean;
  reason?: string;
} {
  const sectionsCount = input.sectionsCount ?? 0;
  const studentsCount = input.studentsCount ?? 0;
  const subjectsCount = input.subjectsCount ?? 0;
  const schedulesCount = input.schedulesCount ?? 0;

  if (studentsCount > 0) {
    return {
      allowed: false,
      reason:
        "لا يمكن حذف الصف لأنه يحتوي على طلاب داخل الشُعب. انقل الطلاب أو احذفهم أولًا.",
    };
  }

  if (schedulesCount > 0) {
    return {
      allowed: false,
      reason:
        "لا يمكن حذف الصف لأنه مرتبط بجدول دراسي. احذف المحاضرات المرتبطة أولًا.",
    };
  }

  if (subjectsCount > 0) {
    return {
      allowed: false,
      reason:
        "لا يمكن حذف الصف لأنه مرتبط بمواد دراسية. افصل المواد عن الصف أولًا.",
    };
  }

  if (sectionsCount > 0) {
    return {
      allowed: false,
      reason:
        "لا يمكن حذف الصف لأنه يحتوي على شُعب. احذف الشُعب أولًا أو عطّل الصف بدل الحذف.",
    };
  }

  return {
    allowed: true,
  };
}

export function canDeleteSection(input: {
  studentsCount?: number;
  schedulesCount?: number;
}): {
  allowed: boolean;
  reason?: string;
} {
  const studentsCount = input.studentsCount ?? 0;
  const schedulesCount = input.schedulesCount ?? 0;

  if (studentsCount > 0) {
    return {
      allowed: false,
      reason:
        "لا يمكن حذف الشعبة لأنها تحتوي على طلاب. انقل الطلاب إلى شعبة أخرى أولًا.",
    };
  }

  if (schedulesCount > 0) {
    return {
      allowed: false,
      reason:
        "لا يمكن حذف الشعبة لأنها مرتبطة بمحاضرات في الجدول الدراسي.",
    };
  }

  return {
    allowed: true,
  };
}
