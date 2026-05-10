// ==================== Class Types ====================

export interface Section {
  id: string;
  name: string;
  classId: string;
  _count?: { students: number };
}

export interface ClassData {
  id: string;
  name: string;
  level: string;
  stage: string;
  branch: string | null;
  sections: Section[];
  subjects?: { id: string; classId: string; subject: { id: string; name: string; code: string } }[];
  students?: { id: string }[];
  _count?: { students: number };
  schoolId?: string;
}

/** Alias for backward compatibility */
export type ClassItem = ClassData;

/** Minimal class used in subjects page */
export interface ClassOption {
  id: string;
  name: string;
  sections: { id: string; name: string }[];
}

/** Alias for backward compatibility */
export type SectionItem = Section;
