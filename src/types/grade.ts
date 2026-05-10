// ==================== Grade Types ====================

export interface GradeData {
  id: string;
  studentId: string;
  subjectId: string;
  examTypeId: string;
  score: number | null;
  status: string;
  approved: boolean;
  approvedBy: string | null;
  student: {
    id: string;
    fullName: string;
    studentNumber: string;
    class: { id: string; name: string };
    section: { id: string; name: string };
  };
  subject: { id: string; name: string; code: string; maxScore: number; passScore: number };
  examType: { id: string; name: string; maxScore: number };
  modifications: { id: string; oldScore: number; newScore: number; reason: string; modifiedBy: string; createdAt: string }[];
}

export interface GradeRecord {
  id: string;
  score: number | null;
  status: string;
  approved: boolean;
  student: {
    id: string;
    fullName: string;
    studentNumber: string;
    class: { id: string; name: string };
    section: { id: string; name: string };
  };
  subject: { id: string; name: string; passScore: number };
  examType: { id: string; name: string; maxScore: number };
}
