// ==================== Teacher Types ====================

export interface Teacher {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  status: string;
  photo: string | null;
  schoolId: string;
  subjects: {
    id: string;
    subjectId: string;
    subject: { id: string; name: string };
  }[];
}

/** Lightweight teacher used in schedule page */
export interface TeacherBasic {
  id: string;
  fullName: string;
  phone: string | null;
  specialty?: string | null;
}

export interface TeacherOption {
  id: string;
  fullName: string;
  notes?: string | null;
  subjects?: string[];
}

export interface TeacherClassItem {
  id: string;
  teacherId: string;
  classId: string;
  sectionId: string | null;
  teacher: { id: string; fullName: string; notes?: string | null; phone?: string | null };
}

export interface SubjectItem {
  id: string;
  name: string;
  code: string;
}
