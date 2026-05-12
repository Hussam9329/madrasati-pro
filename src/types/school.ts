export type School = {
  id: string;
  name: string;
  academicYear: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SchoolFormInput = {
  name: string;
  academicYear?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  notes?: string;
};

export type SchoolSummary = {
  id: string;
  name: string;
  academicYear: string | null;
  hasLogo: boolean;
  contactStatus: "complete" | "partial" | "empty";
};

export type SchoolValidationResult = {
  valid: boolean;
  errors: Partial<Record<keyof SchoolFormInput, string>>;
};

export function getEmptySchoolForm(): SchoolFormInput {
  return {
    name: "",
    academicYear: "",
    address: "",
    phone: "",
    email: "",
    logoUrl: "",
    notes: "",
  };
}

export function normalizeSchoolInput(input: SchoolFormInput): SchoolFormInput {
  return {
    name: input.name.trim(),
    academicYear: input.academicYear?.trim() || undefined,
    address: input.address?.trim() || undefined,
    phone: input.phone?.trim() || undefined,
    email: input.email?.trim() || undefined,
    logoUrl: input.logoUrl?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
  };
}

export function validateSchoolInput(
  input: SchoolFormInput,
): SchoolValidationResult {
  const normalized = normalizeSchoolInput(input);
  const errors: Partial<Record<keyof SchoolFormInput, string>> = {};

  if (!normalized.name) {
    errors.name = "اسم المدرسة مطلوب.";
  }

  if (normalized.name && normalized.name.length < 2) {
    errors.name = "اسم المدرسة يجب أن يحتوي على حرفين على الأقل.";
  }

  if (normalized.email && !isValidEmail(normalized.email)) {
    errors.email = "البريد الإلكتروني غير صحيح.";
  }

  if (normalized.phone && normalized.phone.length < 7) {
    errors.phone = "رقم الهاتف قصير جدًا.";
  }

  if (normalized.logoUrl && !isValidUrl(normalized.logoUrl)) {
    errors.logoUrl = "رابط الشعار غير صحيح.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function getSchoolSummary(school: School): SchoolSummary {
  const hasPhone = Boolean(school.phone);
  const hasEmail = Boolean(school.email);
  const hasAddress = Boolean(school.address);

  const contactItems = [hasPhone, hasEmail, hasAddress].filter(Boolean).length;

  return {
    id: school.id,
    name: school.name,
    academicYear: school.academicYear,
    hasLogo: Boolean(school.logoUrl),
    contactStatus:
      contactItems === 3 ? "complete" : contactItems > 0 ? "partial" : "empty",
  };
}

export function getSchoolCompletionPercentage(school: School | null): number {
  if (!school) {
    return 0;
  }

  const fields = [
    school.name,
    school.academicYear,
    school.address,
    school.phone,
    school.email,
    school.logoUrl,
  ];

  const completed = fields.filter(Boolean).length;

  return Math.round((completed / fields.length) * 100);
}

export function getSchoolDisplayName(school: School | null): string {
  return school?.name || "مدرستي برو";
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
