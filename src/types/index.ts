// ==================== Shared Types Index ====================
// Re-export all types from a single entry point

export type { Student, StudentBasic, StudentMinimal, StudentProfile, GradeEntry } from './student';
export type { Teacher, TeacherBasic, TeacherOption, TeacherClassItem, SubjectItem } from './teacher';
export type { Section, ClassData, ClassItem, ClassOption, SectionItem } from './class';
export type { Subject, SubjectBasic, ExamTypeData } from './subject';
export type { GradeData, GradeRecord } from './grade';
export type { AttendanceRecord, ScanResult } from './attendance';
export type { FeePlanData, InstallmentData, PaymentData } from './payment';
export type { ScheduleSlot } from './schedule';
export type { SchoolData } from './school';
export type { AuthUser, UserData, AuthState } from './user';
export type { DashboardData } from './dashboard';
export type { PageKey, DialogProps } from './common';
