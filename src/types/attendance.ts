// ==================== Attendance Types ====================

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  lateMinutes: number | null;
  earlyExitReason?: string | null;
  earlyExitApproved?: boolean | null;
  createdAt?: string;
  student: {
    id: string;
    fullName: string;
    studentNumber: string;
    class: { id: string; name: string };
    section: { id: string; name: string };
  };
}

export interface ScanResult {
  message: string;
  action: string;
  status: string;
  lateMinutes?: number | null;
  isEarlyExit?: boolean;
  record: {
    id: string;
    checkIn: string | null;
    checkOut: string | null;
    status: string;
  };
  student: {
    id: string;
    fullName: string;
    studentNumber: string;
    class: string;
    section: string;
  };
}
