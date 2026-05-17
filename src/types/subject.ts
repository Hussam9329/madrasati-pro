export type Subject = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type SubjectFormInput = {
  name: string;
  description?: string;
};

export type SubjectListItem = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  teachersCount: number;
  classesCount: number;
  gradesCount: number;
  createdAt: Date;
};

export type SubjectValidationResult = {
  valid: boolean;
  errors: Partial<Record<keyof SubjectFormInput, string>>;
};

export function getEmptySubjectForm(): SubjectFormInput {
  return {
    name: "",
    description: "",
  };
}

export function normalizeSubjectInput(
  input: SubjectFormInput,
): SubjectFormInput {
  return {
    name: input.name.trim(),
    description: input.description?.trim() || undefined,
  };
}

export function validateSubjectInput(
  input: SubjectFormInput,
): SubjectValidationResult {
  const normalized = normalizeSubjectInput(input);
  const errors: Partial<Record<keyof SubjectFormInput, string>> = {};

  if (!normalized.name) {
    errors.name = "اسم المادة مطلوب.";
  }

  if (normalized.name && normalized.name.length < 2) {
    errors.name = "اسم المادة يجب أن يحتوي على حرفين على الأقل.";
  }

  if (normalized.name && normalized.name.length > 80) {
    errors.name = "اسم المادة طويل جدًا.";
  }

  if (normalized.description && normalized.description.length > 300) {
    errors.description = "وصف المادة يجب ألا يتجاوز 300 حرف.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function canDeleteSubject(subject: {
  teachersCount?: number;
  classesCount?: number;
  gradesCount?: number;
}): {
  allowed: boolean;
  reason?: string;
} {
  const teachersCount = subject.teachersCount ?? 0;
  const classesCount = subject.classesCount ?? 0;
  const gradesCount = subject.gradesCount ?? 0;

  if (gradesCount > 0) {
    return {
      allowed: false,
      reason:
        "لا يمكن حذف هذه المادة لأنها تحتوي على درجات مسجلة. يمكنك تعطيلها بدل حذفها.",
    };
  }

  if (teachersCount > 0 || classesCount > 0) {
    return {
      allowed: false,
      reason:
        "لا يمكن حذف هذه المادة لأنها مرتبطة بمدرسين أو صفوف. افصل الارتباطات أولًا أو عطّل المادة.",
    };
  }

  return {
    allowed: true,
  };
}
