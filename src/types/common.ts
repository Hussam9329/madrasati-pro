// ==================== Navigation & Common Types ====================

export type PageKey =
  | 'dashboard'
  | 'students'
  | 'teachers'
  | 'subjects'
  | 'exams'
  | 'attendance'
  | 'grades'
  | 'classes'
  | 'payments'
  | 'schedule'
  | 'reports'
  | 'settings'
  | 'users'
  | 'profile';

/** Common dialog open/close props */
export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
