// ==================== School Types ====================

export interface SchoolData {
  id: string;
  name: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  principalName?: string;
  academicYear: string;
  schoolType: string;
  shiftType: string;
  startTime: string;
  endTime: string;
  lateThreshold: number;
  weekendDays: string;
}
