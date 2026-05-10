// ==================== Dashboard Types ====================

export interface DashboardData {
  totals: {
    students: number;
    teachers: number;
    subjects: number;
    classes: number;
  };
  todayAttendance: {
    present: number;
    absent: number;
    late: number;
    earlyExit: number;
    excused: number;
    sickLeave: number;
    officialLeave: number;
    partialAttendance: number;
    total: number;
  };
  recentAttendance: Array<{
    id: string;
    status: string;
    time: string;
    date: string;
    student: {
      id: string;
      fullName: string;
      studentNumber: string;
      class: { name: string };
      section: { name: string } | null;
    };
  }>;
  gradeCompletion: Array<{
    subjectId: string;
    subjectName: string;
    totalStudents: number;
    examTypesCount: number;
    expectedGrades: number;
    totalGrades: number;
    completedGrades: number;
    missingGrades: number;
    completionPercentage: number;
  }>;
  studentsByStatus: Array<{
    status: string;
    count: number;
  }>;
  classAttendanceStats: Array<{
    classId: string;
    className: string;
    totalStudents: number;
    present: number;
    absent: number;
    attendancePercentage: number;
  }>;
  weeklyAttendanceTrend: Array<{
    date: string;
    day: string;
    attendance: number;
    late: number;
    absent: number;
  }>;
  classPerformance: Array<{
    classId: string;
    className: string;
    avgGrade: number;
    studentCount: number;
    gradeCount: number;
  }>;
}
