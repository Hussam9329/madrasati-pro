// ==================== Subject & Exam Types ====================

export interface Subject {
  id: string;
  name: string;
  code: string;
  type: string;
  maxScore: number;
  passScore: number;
  schoolId?: string;
  teachers?: {
    id: string;
    teacherId: string;
    teacher: { id: string; fullName: string; phone?: string };
  }[];
  classes?: {
    id: string;
    classId: string;
    class: { id: string; name: string };
  }[];
  examTypes?: {
    id: string;
    name: string;
    maxScore: number;
  }[];
}

/** Minimal subject used in schedule/teachers pages */
export interface SubjectBasic {
  id: string;
  name: string;
  code: string;
  type: string;
}

export interface ExamTypeData {
  id: string;
  name: string;
  maxScore: number;
  subjectId: string;
  subject?: { id: string; name: string; code: string };
  _count?: { grades: number };
}
