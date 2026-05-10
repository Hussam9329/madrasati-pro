// ==================== Schedule Types ====================

export interface ScheduleSlot {
  id: string;
  day: string;
  period: number;
  room: string | null;
  subject: { id: string; name: string; code: string; type: string };
  teacher: { id: string; fullName: string; phone: string | null };
  class: { id: string; name: string; level: string; stage: string; branch: string | null };
}
