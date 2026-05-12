export type PaymentStatus = "paid" | "partial" | "pending" | "refunded";

export type PaymentMethod =
  | "cash"
  | "card"
  | "bank_transfer"
  | "wallet"
  | "other";

export type FeeType =
  | "tuition"
  | "transport"
  | "books"
  | "uniform"
  | "activity"
  | "exam"
  | "other";

export type Payment = {
  id: string;
  feeTitle: string;
  feeType: string;
  amount: number;
  status: string;
  method: string;
  academicYear: string | null;
  dueDate: Date | null;
  paidAt: Date | null;
  notes: string | null;
  studentId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type PaymentFormInput = {
  feeTitle: string;
  feeType?: string;
  amount: number | string;
  status?: string;
  method?: string;
  academicYear?: string;
  dueDate?: string | Date;
  paidAt?: string | Date;
  notes?: string;
  studentId: string;
};

export type PaymentListItem = {
  id: string;
  feeTitle: string;
  feeType: string;
  feeTypeLabel: string;
  amount: number;
  formattedAmount: string;
  status: string;
  statusLabel: string;
  statusClass: string;
  method: string;
  methodLabel: string;
  academicYear: string | null;
  dueDate: Date | null;
  paidAt: Date | null;
  notes: string | null;
  isOverdue: boolean;

  studentId: string;
  studentName: string;
  studentCode: string | null;
  guardianName: string | null;
  guardianPhone: string | null;

  sectionId: string | null;
  sectionName: string | null;

  classId: string | null;
  className: string | null;
  classLevel: string | null;

  createdAt: Date;
};

export type PaymentDetails = PaymentListItem & {
  updatedAt: Date;
};

export type PaymentValidationResult = {
  valid: boolean;
  errors: Partial<Record<keyof PaymentFormInput, string>>;
};

export type PaymentFilter = {
  query?: string;
  studentId?: string;
  sectionId?: string;
  classId?: string;
  feeType?: string;
  status?: string;
  method?: string;
  academicYear?: string;
  fromDate?: string;
  toDate?: string;
  dueFromDate?: string;
  dueToDate?: string;
  overdueOnly?: boolean;
};

export const FEE_TYPES: {
  value: FeeType;
  label: string;
}[] = [
  {
    value: "tuition",
    label: "رسوم دراسية",
  },
  {
    value: "transport",
    label: "نقل",
  },
  {
    value: "books",
    label: "كتب",
  },
  {
    value: "uniform",
    label: "زي مدرسي",
  },
  {
    value: "activity",
    label: "نشاط",
  },
  {
    value: "exam",
    label: "اختبار",
  },
  {
    value: "other",
    label: "أخرى",
  },
];

export const PAYMENT_STATUSES: {
  value: PaymentStatus;
  label: string;
  tone: "success" | "warning" | "danger" | "info";
}[] = [
  {
    value: "paid",
    label: "مدفوع",
    tone: "success",
  },
  {
    value: "partial",
    label: "مدفوع جزئيًا",
    tone: "warning",
  },
  {
    value: "pending",
    label: "معلّق",
    tone: "danger",
  },
  {
    value: "refunded",
    label: "مسترجع",
    tone: "info",
  },
];

export const PAYMENT_METHODS: {
  value: PaymentMethod;
  label: string;
}[] = [
  {
    value: "cash",
    label: "نقدًا",
  },
  {
    value: "card",
    label: "بطاقة",
  },
  {
    value: "bank_transfer",
    label: "تحويل بنكي",
  },
  {
    value: "wallet",
    label: "محفظة إلكترونية",
  },
  {
    value: "other",
    label: "أخرى",
  },
];

export function getEmptyPaymentForm(): PaymentFormInput {
  return {
    feeTitle: "",
    feeType: "tuition",
    amount: "",
    status: "paid",
    method: "cash",
    academicYear: getCurrentAcademicYear(),
    dueDate: "",
    paidAt: "",
    notes: "",
    studentId: "",
  };
}

export function normalizePaymentInput(
  input: PaymentFormInput,
): PaymentFormInput {
  return {
    feeTitle: input.feeTitle.trim(),
    feeType: input.feeType?.trim() || "tuition",
    amount:
      typeof input.amount === "string"
        ? Number(input.amount.trim())
        : input.amount,
    status: input.status?.trim() || "paid",
    method: input.method?.trim() || "cash",
    academicYear: input.academicYear?.trim() || undefined,
    dueDate: input.dueDate || undefined,
    paidAt: input.paidAt || undefined,
    notes: input.notes?.trim() || undefined,
    studentId: input.studentId.trim(),
  };
}

export function validatePaymentInput(
  input: PaymentFormInput,
): PaymentValidationResult {
  const normalized = normalizePaymentInput(input);
  const errors: Partial<Record<keyof PaymentFormInput, string>> = {};

  if (!normalized.feeTitle) {
    errors.feeTitle = "عنوان الرسم مطلوب.";
  }

  if (normalized.feeTitle && normalized.feeTitle.length < 2) {
    errors.feeTitle = "عنوان الرسم قصير جدًا.";
  }

  if (normalized.feeTitle && normalized.feeTitle.length > 120) {
    errors.feeTitle = "عنوان الرسم طويل جدًا.";
  }

  if (Number.isNaN(Number(normalized.amount))) {
    errors.amount = "المبلغ يجب أن يكون رقمًا.";
  }

  if (!Number.isNaN(Number(normalized.amount)) && Number(normalized.amount) <= 0) {
    errors.amount = "المبلغ يجب أن يكون أكبر من صفر.";
  }

  if (
    normalized.feeType &&
    !FEE_TYPES.some((item) => item.value === normalized.feeType)
  ) {
    errors.feeType = "نوع الرسم غير صحيح.";
  }

  if (
    normalized.status &&
    !PAYMENT_STATUSES.some((item) => item.value === normalized.status)
  ) {
    errors.status = "حالة الدفع غير صحيحة.";
  }

  if (
    normalized.method &&
    !PAYMENT_METHODS.some((item) => item.value === normalized.method)
  ) {
    errors.method = "طريقة الدفع غير صحيحة.";
  }

  if (normalized.academicYear && normalized.academicYear.length > 20) {
    errors.academicYear = "السنة الدراسية طويلة جدًا.";
  }

  if (normalized.dueDate && !parsePaymentDate(normalized.dueDate)) {
    errors.dueDate = "تاريخ الاستحقاق غير صحيح.";
  }

  if (normalized.paidAt && !parsePaymentDate(normalized.paidAt)) {
    errors.paidAt = "تاريخ الدفع غير صحيح.";
  }

  if (!normalized.studentId) {
    errors.studentId = "الطالب مطلوب.";
  }

  if (normalized.notes && normalized.notes.length > 500) {
    errors.notes = "الملاحظات يجب ألا تتجاوز 500 حرف.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function parsePaymentDate(value?: string | Date): Date | undefined {
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

export function normalizePaymentDate(value?: string | Date): Date | null {
  const parsed = parsePaymentDate(value);

  if (!parsed) {
    return null;
  }

  return new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate(),
    12,
    0,
    0,
    0,
  );
}

export function getPaymentDateRange(value?: string | Date): {
  start: Date;
  end: Date;
} | null {
  const parsed = parsePaymentDate(value);

  if (!parsed) {
    return null;
  }

  const start = new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate(),
    0,
    0,
    0,
    0,
  );

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return {
    start,
    end,
  };
}

export function getFeeTypeLabel(feeType: string): string {
  return FEE_TYPES.find((item) => item.value === feeType)?.label ?? feeType;
}

export function getPaymentStatusLabel(status: string): string {
  return (
    PAYMENT_STATUSES.find((item) => item.value === status)?.label ?? "غير محدد"
  );
}

export function getPaymentStatusBadgeClass(status: string): string {
  if (status === "paid") {
    return "badge-success";
  }

  if (status === "partial") {
    return "badge-warning";
  }

  if (status === "pending") {
    return "badge-danger";
  }

  if (status === "refunded") {
    return "badge-info";
  }

  return "badge-info";
}

export function getPaymentMethodLabel(method: string): string {
  return PAYMENT_METHODS.find((item) => item.value === method)?.label ?? method;
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("ar-IQ", {
    style: "currency",
    currency: "IQD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPaymentDate(date: Date): string {
  return new Intl.DateTimeFormat("ar-IQ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatPaymentShortDate(date: Date): string {
  return new Intl.DateTimeFormat("ar-IQ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function isPaymentOverdue(input: {
  status: string;
  dueDate: Date | null;
}): boolean {
  if (!input.dueDate) {
    return false;
  }

  if (input.status === "paid" || input.status === "refunded") {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(input.dueDate);
  dueDate.setHours(0, 0, 0, 0);

  return dueDate < today;
}

export function getCurrentAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  if (month >= 9) {
    return `${year}-${year + 1}`;
  }

  return `${year - 1}-${year}`;
}

export function canDeletePayment(): {
  allowed: boolean;
  reason?: string;
} {
  return {
    allowed: true,
  };
}
