// ==================== Payment Types ====================

export interface FeePlanData {
  id: string;
  name: string;
  amount: number;
  classId: string;
  dueDate: string | null;
  sortOrder: number;
  class: { id: string; name: string };
  _count?: { installments: number };
}

export interface InstallmentData {
  id: string;
  studentId: string;
  feePlanId: string;
  classId: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  discountType: string;
  discountValue: number;
  discountNotes: string | null;
  status: string;
  dueDate: string | null;
  notes: string | null;
  createdAt: string;
  student: { id: string; fullName: string; studentNumber: string };
  feePlan: { id: string; name: string; amount: number };
  class: { id: string; name: string };
  payments?: PaymentData[];
}

export interface PaymentData {
  id: string;
  installmentId: string;
  studentId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  receiptNumber: string | null;
  notes: string | null;
  recordedBy: string | null;
  createdAt: string;
}
