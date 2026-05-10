// ==================== Student Types ====================

export interface Student {
  id: string;
  studentNumber: string;
  fullName: string;
  gender: string;
  dateOfBirth: string | null;
  nationalId: string | null;
  phone: string | null;
  address: string | null;
  photo: string | null;
  status: string;
  qrCode: string | null;
  cardStatus: string;
  classId: string;
  sectionId: string;
  schoolId: string;
  guardianName: string | null;
  guardianPhone: string | null;
  guardianRelation: string | null;
  class: { id: string; name: string };
  section: { id: string; name: string };
  grades?: {
    id: string;
    score: number | null;
    status: string;
    subject: { id: string; name: string };
    examType: { id: string; name: string; maxScore: number };
  }[];
  attendance?: {
    id: string;
    date: string;
    checkIn: string | null;
    checkOut: string | null;
    status: string;
    lateMinutes: number | null;
  }[];
}

/** Lightweight student used in attendance/grades pages */
export interface StudentBasic {
  id: string;
  fullName: string;
  studentNumber: string;
  class: { id: string; name: string };
  section: { id: string; name: string };
}

/** Minimal student used in payments */
export interface StudentMinimal {
  id: string;
  fullName: string;
  studentNumber: string;
  classId: string;
}

export interface StudentProfile {
  id: string;
  studentNumber: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  nationalId: string;
  phone: string;
  address: string;
  status: string;
  qrCode: string;
  classId: string;
  sectionId: string;
  className: string;
  sectionName: string;
  guardianName: string;
  guardianPhone: string;
  guardianRelation: string;
  attendance: {
    present: number;
    absent: number;
    late: number;
    excused: number;
    total: number;
    percentage: number;
    monthly: Array<{ month: string; percentage: number }>;
  };
  grades: {
    average: number;
    rank: number;
    totalStudents: number;
    passCount: number;
    failCount: number;
    subjects: Array<{ name: string; score: number; maxScore: number; grade: string }>;
  };
  payment: {
    totalFees: number;
    paid: number;
    remaining: number;
    status: string;
    lastPaymentDate: string;
    lastPaymentAmount: number;
  };
  activities: Array<{ id: string; type: string; message: string; date: string; icon: string }>;
}

export interface GradeEntry {
  studentId: string;
  fullName: string;
  studentNumber: string;
  sectionName: string;
  score: string;
  existingGradeId?: string;
  existingScore?: number | null;
  approved: boolean;
  status: string;
}
