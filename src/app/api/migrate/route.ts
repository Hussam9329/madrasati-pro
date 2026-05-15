import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const existingTables = await db.$queryRaw`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    ` as { table_name: string }[];
    
    const tableNames = existingTables.map(t => t.table_name);
    
    if (tableNames.length >= 14) {
      return NextResponse.json({ 
        status: "already_migrated", 
        tables: tableNames 
      });
    }

    const statements: string[] = [
      `CREATE TABLE IF NOT EXISTS "admins" ("id" TEXT NOT NULL, "username" TEXT NOT NULL, "passwordHash" TEXT NOT NULL, "isRoot" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "admins_pkey" PRIMARY KEY ("id"))`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "admins_username_key" ON "admins"("username")`,
      `CREATE TABLE IF NOT EXISTS "subjects" ("id" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT, "isActive" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "subjects_pkey" PRIMARY KEY ("id"))`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "subjects_name_key" ON "subjects"("name")`,
      `CREATE TABLE IF NOT EXISTS "school_classes" ("id" TEXT NOT NULL, "name" TEXT NOT NULL, "level" TEXT, "description" TEXT, "isActive" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "school_classes_pkey" PRIMARY KEY ("id"))`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "school_classes_name_level_key" ON "school_classes"("name", "level")`,
      `CREATE TABLE IF NOT EXISTS "sections" ("id" TEXT NOT NULL, "name" TEXT NOT NULL, "capacity" INTEGER, "description" TEXT, "isActive" BOOLEAN NOT NULL DEFAULT true, "classId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "sections_pkey" PRIMARY KEY ("id"))`,
      `CREATE INDEX IF NOT EXISTS "sections_classId_idx" ON "sections"("classId")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "sections_classId_name_key" ON "sections"("classId", "name")`,
      `CREATE TABLE IF NOT EXISTS "teachers" ("id" TEXT NOT NULL, "fullName" TEXT NOT NULL, "phone" TEXT, "email" TEXT, "address" TEXT, "specialty" TEXT, "salary" DOUBLE PRECISION, "notes" TEXT, "isActive" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "teachers_pkey" PRIMARY KEY ("id"))`,
      `CREATE INDEX IF NOT EXISTS "teachers_fullName_idx" ON "teachers"("fullName")`,
      `CREATE TABLE IF NOT EXISTS "teacher_subjects" ("id" TEXT NOT NULL, "teacherId" TEXT NOT NULL, "subjectId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "teacher_subjects_pkey" PRIMARY KEY ("id"))`,
      `CREATE INDEX IF NOT EXISTS "teacher_subjects_teacherId_idx" ON "teacher_subjects"("teacherId")`,
      `CREATE INDEX IF NOT EXISTS "teacher_subjects_subjectId_idx" ON "teacher_subjects"("subjectId")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "teacher_subjects_teacherId_subjectId_key" ON "teacher_subjects"("teacherId", "subjectId")`,
      `CREATE TABLE IF NOT EXISTS "teacher_sections" ("id" TEXT NOT NULL, "teacherId" TEXT NOT NULL, "sectionId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "teacher_sections_pkey" PRIMARY KEY ("id"))`,
      `CREATE INDEX IF NOT EXISTS "teacher_sections_teacherId_idx" ON "teacher_sections"("teacherId")`,
      `CREATE INDEX IF NOT EXISTS "teacher_sections_sectionId_idx" ON "teacher_sections"("sectionId")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "teacher_sections_teacherId_sectionId_key" ON "teacher_sections"("teacherId", "sectionId")`,
      `CREATE TABLE IF NOT EXISTS "class_subjects" ("id" TEXT NOT NULL, "classId" TEXT NOT NULL, "subjectId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "class_subjects_pkey" PRIMARY KEY ("id"))`,
      `CREATE INDEX IF NOT EXISTS "class_subjects_classId_idx" ON "class_subjects"("classId")`,
      `CREATE INDEX IF NOT EXISTS "class_subjects_subjectId_idx" ON "class_subjects"("subjectId")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "class_subjects_classId_subjectId_key" ON "class_subjects"("classId", "subjectId")`,
      `CREATE TABLE IF NOT EXISTS "students" ("id" TEXT NOT NULL, "fullName" TEXT NOT NULL, "studentCode" TEXT, "gender" TEXT, "birthDate" TIMESTAMP(3), "phone" TEXT, "guardianName" TEXT, "guardianPhone" TEXT, "address" TEXT, "enrollmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "status" TEXT NOT NULL DEFAULT 'active', "notes" TEXT, "sectionId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "students_pkey" PRIMARY KEY ("id"))`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "students_studentCode_key" ON "students"("studentCode")`,
      `CREATE INDEX IF NOT EXISTS "students_fullName_idx" ON "students"("fullName")`,
      `CREATE INDEX IF NOT EXISTS "students_sectionId_idx" ON "students"("sectionId")`,
      `CREATE TABLE IF NOT EXISTS "schedules" ("id" TEXT NOT NULL, "dayOfWeek" TEXT NOT NULL, "startTime" TEXT NOT NULL, "endTime" TEXT NOT NULL, "room" TEXT, "notes" TEXT, "isActive" BOOLEAN NOT NULL DEFAULT true, "sectionId" TEXT NOT NULL, "subjectId" TEXT NOT NULL, "teacherId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "schedules_pkey" PRIMARY KEY ("id"))`,
      `CREATE INDEX IF NOT EXISTS "schedules_sectionId_idx" ON "schedules"("sectionId")`,
      `CREATE INDEX IF NOT EXISTS "schedules_subjectId_idx" ON "schedules"("subjectId")`,
      `CREATE INDEX IF NOT EXISTS "schedules_teacherId_idx" ON "schedules"("teacherId")`,
      `CREATE INDEX IF NOT EXISTS "schedules_dayOfWeek_idx" ON "schedules"("dayOfWeek")`,
      `CREATE TABLE IF NOT EXISTS "attendance_records" ("id" TEXT NOT NULL, "date" TIMESTAMP(3) NOT NULL, "mode" TEXT NOT NULL DEFAULT 'check-in', "status" TEXT NOT NULL DEFAULT 'present', "notes" TEXT, "checkInAt" TIMESTAMP(3), "checkOutAt" TIMESTAMP(3), "source" TEXT DEFAULT 'manual', "studentId" TEXT NOT NULL, "scheduleId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id"))`,
      `CREATE INDEX IF NOT EXISTS "attendance_records_studentId_idx" ON "attendance_records"("studentId")`,
      `CREATE INDEX IF NOT EXISTS "attendance_records_scheduleId_idx" ON "attendance_records"("scheduleId")`,
      `CREATE INDEX IF NOT EXISTS "attendance_records_date_idx" ON "attendance_records"("date")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "attendance_records_studentId_date_key" ON "attendance_records"("studentId", "date")`,
      `CREATE TABLE IF NOT EXISTS "exams" ("id" TEXT NOT NULL, "name" TEXT NOT NULL, "type" TEXT NOT NULL, "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 100, "passScore" DOUBLE PRECISION NOT NULL DEFAULT 50, "failScore" DOUBLE PRECISION, "notes" TEXT, "subjectId" TEXT NOT NULL, "sectionId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "exams_pkey" PRIMARY KEY ("id"))`,
      `CREATE INDEX IF NOT EXISTS "exams_subjectId_idx" ON "exams"("subjectId")`,
      `CREATE INDEX IF NOT EXISTS "exams_sectionId_idx" ON "exams"("sectionId")`,
      `CREATE TABLE IF NOT EXISTS "grades" ("id" TEXT NOT NULL, "title" TEXT NOT NULL, "score" DOUBLE PRECISION NOT NULL, "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 100, "examType" TEXT NOT NULL DEFAULT 'monthly', "term" TEXT NOT NULL DEFAULT 'first', "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "notes" TEXT, "weight" DOUBLE PRECISION, "assessmentGroup" TEXT, "isReviewed" BOOLEAN NOT NULL DEFAULT false, "warningLevel" TEXT, "studentId" TEXT NOT NULL, "subjectId" TEXT NOT NULL, "teacherId" TEXT, "examId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "grades_pkey" PRIMARY KEY ("id"))`,
      `CREATE INDEX IF NOT EXISTS "grades_studentId_idx" ON "grades"("studentId")`,
      `CREATE INDEX IF NOT EXISTS "grades_subjectId_idx" ON "grades"("subjectId")`,
      `CREATE INDEX IF NOT EXISTS "grades_teacherId_idx" ON "grades"("teacherId")`,
      `CREATE INDEX IF NOT EXISTS "grades_examId_idx" ON "grades"("examId")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "grades_examId_studentId_key" ON "grades"("examId", "studentId")`,
      `CREATE TABLE IF NOT EXISTS "class_fee_settings" ("id" TEXT NOT NULL, "classId" TEXT NOT NULL, "amount" DOUBLE PRECISION NOT NULL, "academicYear" TEXT, "notes" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "class_fee_settings_pkey" PRIMARY KEY ("id"))`,
      `CREATE INDEX IF NOT EXISTS "class_fee_settings_classId_idx" ON "class_fee_settings"("classId")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "class_fee_settings_classId_academicYear_key" ON "class_fee_settings"("classId", "academicYear")`,
      `CREATE TABLE IF NOT EXISTS "payments" ("id" TEXT NOT NULL, "feeTitle" TEXT NOT NULL, "feeType" TEXT NOT NULL DEFAULT 'tuition', "amount" DOUBLE PRECISION NOT NULL, "status" TEXT NOT NULL DEFAULT 'paid', "method" TEXT NOT NULL DEFAULT 'cash', "academicYear" TEXT, "dueDate" TIMESTAMP(3), "paidAt" TIMESTAMP(3), "notes" TEXT, "originalAmount" DOUBLE PRECISION, "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0, "discountPercent" DOUBLE PRECISION, "discountReason" TEXT, "discountNotes" TEXT, "finalAmount" DOUBLE PRECISION, "remainingAmount" DOUBLE PRECISION, "receiptNumber" TEXT, "studentId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "payments_pkey" PRIMARY KEY ("id"))`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "payments_receiptNumber_key" ON "payments"("receiptNumber")`,
      `CREATE INDEX IF NOT EXISTS "payments_studentId_idx" ON "payments"("studentId")`,
      `CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments"("status")`,
      `CREATE INDEX IF NOT EXISTS "payments_feeType_idx" ON "payments"("feeType")`,
      `ALTER TABLE "sections" DROP CONSTRAINT IF EXISTS "sections_classId_fkey"`,
      `ALTER TABLE "sections" ADD CONSTRAINT "sections_classId_fkey" FOREIGN KEY ("classId") REFERENCES "school_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "teacher_subjects" DROP CONSTRAINT IF EXISTS "teacher_subjects_teacherId_fkey"`,
      `ALTER TABLE "teacher_subjects" ADD CONSTRAINT "teacher_subjects_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "teacher_subjects" DROP CONSTRAINT IF EXISTS "teacher_subjects_subjectId_fkey"`,
      `ALTER TABLE "teacher_subjects" ADD CONSTRAINT "teacher_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "teacher_sections" DROP CONSTRAINT IF EXISTS "teacher_sections_teacherId_fkey"`,
      `ALTER TABLE "teacher_sections" ADD CONSTRAINT "teacher_sections_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "teacher_sections" DROP CONSTRAINT IF EXISTS "teacher_sections_sectionId_fkey"`,
      `ALTER TABLE "teacher_sections" ADD CONSTRAINT "teacher_sections_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "class_subjects" DROP CONSTRAINT IF EXISTS "class_subjects_classId_fkey"`,
      `ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_classId_fkey" FOREIGN KEY ("classId") REFERENCES "school_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "class_subjects" DROP CONSTRAINT IF EXISTS "class_subjects_subjectId_fkey"`,
      `ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "students_sectionId_fkey"`,
      `ALTER TABLE "students" ADD CONSTRAINT "students_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
      `ALTER TABLE "schedules" DROP CONSTRAINT IF EXISTS "schedules_sectionId_fkey"`,
      `ALTER TABLE "schedules" ADD CONSTRAINT "schedules_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "schedules" DROP CONSTRAINT IF EXISTS "schedules_subjectId_fkey"`,
      `ALTER TABLE "schedules" ADD CONSTRAINT "schedules_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "schedules" DROP CONSTRAINT IF EXISTS "schedules_teacherId_fkey"`,
      `ALTER TABLE "schedules" ADD CONSTRAINT "schedules_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "attendance_records" DROP CONSTRAINT IF EXISTS "attendance_records_studentId_fkey"`,
      `ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "attendance_records" DROP CONSTRAINT IF EXISTS "attendance_records_scheduleId_fkey"`,
      `ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
      `ALTER TABLE "exams" DROP CONSTRAINT IF EXISTS "exams_subjectId_fkey"`,
      `ALTER TABLE "exams" ADD CONSTRAINT "exams_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "exams" DROP CONSTRAINT IF EXISTS "exams_sectionId_fkey"`,
      `ALTER TABLE "exams" ADD CONSTRAINT "exams_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "grades" DROP CONSTRAINT IF EXISTS "grades_studentId_fkey"`,
      `ALTER TABLE "grades" ADD CONSTRAINT "grades_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "grades" DROP CONSTRAINT IF EXISTS "grades_subjectId_fkey"`,
      `ALTER TABLE "grades" ADD CONSTRAINT "grades_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "grades" DROP CONSTRAINT IF EXISTS "grades_teacherId_fkey"`,
      `ALTER TABLE "grades" ADD CONSTRAINT "grades_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
      `ALTER TABLE "grades" DROP CONSTRAINT IF EXISTS "grades_examId_fkey"`,
      `ALTER TABLE "grades" ADD CONSTRAINT "grades_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "class_fee_settings" DROP CONSTRAINT IF EXISTS "class_fee_settings_classId_fkey"`,
      `ALTER TABLE "class_fee_settings" ADD CONSTRAINT "class_fee_settings_classId_fkey" FOREIGN KEY ("classId") REFERENCES "school_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_studentId_fkey"`,
      `ALTER TABLE "payments" ADD CONSTRAINT "payments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    ];

    const errors: string[] = [];
    const success: string[] = [];

    for (const stmt of statements) {
      try {
        await db.$executeRawUnsafe(stmt);
        success.push(stmt.substring(0, 50));
      } catch (e: any) {
        errors.push(`${stmt.substring(0, 50)} => ${e.message?.substring(0, 80)}`);
      }
    }

    // Seed admin
    try {
      const bcrypt = await import('bcryptjs');
      const existingAdmin = await db.admin.findUnique({ where: { username: 'admin' } });
      if (!existingAdmin) {
        const passwordHash = await bcrypt.default.hash('1993', 12);
        await db.admin.create({ data: { username: 'admin', passwordHash, isRoot: true } });
        success.push('Admin seeded');
      }
    } catch (e: any) {
      errors.push('Admin seed: ' + e.message?.substring(0, 80));
    }

    return NextResponse.json({ 
      status: "migration_complete",
      success_count: success.length,
      error_count: errors.length,
      errors: errors.slice(0, 10),
    });
  } catch (e: any) {
    return NextResponse.json({ 
      status: "error", 
      message: e.message 
    }, { status: 500 });
  }
}
