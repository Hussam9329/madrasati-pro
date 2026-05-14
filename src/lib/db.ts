import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  vercelDbInitialized?: boolean;
};

function getDatabaseUrl(): string {
  const defaultUrl = "file:./dev.db";

  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  // On Vercel, use /tmp for the SQLite database
  if (process.env.VERCEL) {
    return "file:/tmp/madrasati.db";
  }

  return defaultUrl;
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

/**
 * Initialize the database on Vercel (serverless) environments.
 * Creates tables if they don't exist and seeds the admin user + grade levels.
 * Uses a global flag so it only runs once per cold start.
 */
export async function ensureDatabase() {
  // Skip on non-Vercel environments
  if (!process.env.VERCEL) return;

  // Skip if already initialized in this cold start
  if (globalForPrisma.vercelDbInitialized) return;

  try {
    // Step 1: Create tables using raw SQL (more reliable than prisma db push in serverless)
    await createTablesIfNotExist();

    // Step 2: Seed the admin user if not exists
    await seedAdminIfNotExists();

    // Step 3: Seed grade levels if not exists
    await seedClassesIfNotExists();

    globalForPrisma.vercelDbInitialized = true;
    console.log("[DB] Vercel database initialized successfully");
  } catch (error) {
    console.error("[DB] Vercel database initialization failed:", error);
    // Don't throw - let the request continue and fail gracefully
  }
}

async function createTablesIfNotExist() {
  // Create all tables needed by the Prisma schema
  // Using IF NOT EXISTS so it's safe to run multiple times
  const statements = [
    `CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY NOT NULL,
      username TEXT NOT NULL,
      passwordHash TEXT NOT NULL,
      isRoot BOOLEAN NOT NULL DEFAULT true,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS admins_username_key ON admins(username)`,

    `CREATE TABLE IF NOT EXISTS schools (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      academicYear TEXT,
      address TEXT,
      phone TEXT,
      email TEXT,
      logoUrl TEXT,
      notes TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      isActive BOOLEAN NOT NULL DEFAULT true,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS subjects_name_key ON subjects(name)`,

    `CREATE TABLE IF NOT EXISTS school_classes (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      level TEXT,
      description TEXT,
      isActive BOOLEAN NOT NULL DEFAULT true,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS school_classes_name_level_key ON school_classes(name, level)`,

    `CREATE TABLE IF NOT EXISTS sections (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      capacity INTEGER,
      description TEXT,
      isActive BOOLEAN NOT NULL DEFAULT true,
      classId TEXT NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (classId) REFERENCES school_classes(id) ON DELETE CASCADE
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS sections_classId_name_key ON sections(classId, name)`,
    `CREATE INDEX IF NOT EXISTS sections_classId_idx ON sections(classId)`,

    `CREATE TABLE IF NOT EXISTS teachers (
      id TEXT PRIMARY KEY NOT NULL,
      fullName TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      specialty TEXT,
      salary REAL,
      notes TEXT,
      isActive BOOLEAN NOT NULL DEFAULT true,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS teachers_fullName_idx ON teachers(fullName)`,

    `CREATE TABLE IF NOT EXISTS teacher_subjects (
      id TEXT PRIMARY KEY NOT NULL,
      teacherId TEXT NOT NULL,
      subjectId TEXT NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (teacherId) REFERENCES teachers(id) ON DELETE CASCADE,
      FOREIGN KEY (subjectId) REFERENCES subjects(id) ON DELETE CASCADE
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS teacher_subjects_teacherId_subjectId_key ON teacher_subjects(teacherId, subjectId)`,
    `CREATE INDEX IF NOT EXISTS teacher_subjects_teacherId_idx ON teacher_subjects(teacherId)`,
    `CREATE INDEX IF NOT EXISTS teacher_subjects_subjectId_idx ON teacher_subjects(subjectId)`,

    `CREATE TABLE IF NOT EXISTS class_subjects (
      id TEXT PRIMARY KEY NOT NULL,
      classId TEXT NOT NULL,
      subjectId TEXT NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (classId) REFERENCES school_classes(id) ON DELETE CASCADE,
      FOREIGN KEY (subjectId) REFERENCES subjects(id) ON DELETE CASCADE
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS class_subjects_classId_subjectId_key ON class_subjects(classId, subjectId)`,
    `CREATE INDEX IF NOT EXISTS class_subjects_classId_idx ON class_subjects(classId)`,
    `CREATE INDEX IF NOT EXISTS class_subjects_subjectId_idx ON class_subjects(subjectId)`,

    `CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY NOT NULL,
      fullName TEXT NOT NULL,
      studentCode TEXT,
      gender TEXT,
      birthDate DATETIME,
      phone TEXT,
      guardianName TEXT,
      guardianPhone TEXT,
      address TEXT,
      enrollmentDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      status TEXT NOT NULL DEFAULT 'active',
      notes TEXT,
      sectionId TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sectionId) REFERENCES sections(id) ON DELETE SET NULL
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS students_studentCode_key ON students(studentCode)`,
    `CREATE INDEX IF NOT EXISTS students_fullName_idx ON students(fullName)`,
    `CREATE INDEX IF NOT EXISTS students_sectionId_idx ON students(sectionId)`,

    `CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY NOT NULL,
      dayOfWeek TEXT NOT NULL,
      startTime TEXT NOT NULL,
      endTime TEXT NOT NULL,
      room TEXT,
      notes TEXT,
      isActive BOOLEAN NOT NULL DEFAULT true,
      sectionId TEXT NOT NULL,
      subjectId TEXT NOT NULL,
      teacherId TEXT NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sectionId) REFERENCES sections(id) ON DELETE CASCADE,
      FOREIGN KEY (subjectId) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (teacherId) REFERENCES teachers(id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS schedules_sectionId_idx ON schedules(sectionId)`,
    `CREATE INDEX IF NOT EXISTS schedules_subjectId_idx ON schedules(subjectId)`,
    `CREATE INDEX IF NOT EXISTS schedules_teacherId_idx ON schedules(teacherId)`,
    `CREATE INDEX IF NOT EXISTS schedules_dayOfWeek_idx ON schedules(dayOfWeek)`,

    `CREATE TABLE IF NOT EXISTS attendance_records (
      id TEXT PRIMARY KEY NOT NULL,
      date DATETIME NOT NULL,
      status TEXT NOT NULL DEFAULT 'present',
      notes TEXT,
      studentId TEXT NOT NULL,
      scheduleId TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (scheduleId) REFERENCES schedules(id) ON DELETE SET NULL
    )`,
    `CREATE INDEX IF NOT EXISTS attendance_records_studentId_idx ON attendance_records(studentId)`,
    `CREATE INDEX IF NOT EXISTS attendance_records_scheduleId_idx ON attendance_records(scheduleId)`,
    `CREATE INDEX IF NOT EXISTS attendance_records_date_idx ON attendance_records(date)`,

    `CREATE TABLE IF NOT EXISTS grades (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      score REAL NOT NULL,
      maxScore REAL NOT NULL DEFAULT 100,
      examType TEXT NOT NULL DEFAULT 'monthly',
      term TEXT NOT NULL DEFAULT 'first',
      date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      weight REAL,
      assessmentGroup TEXT,
      isReviewed BOOLEAN NOT NULL DEFAULT false,
      warningLevel TEXT,
      studentId TEXT NOT NULL,
      subjectId TEXT NOT NULL,
      teacherId TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (subjectId) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (teacherId) REFERENCES teachers(id) ON DELETE SET NULL
    )`,
    `CREATE INDEX IF NOT EXISTS grades_studentId_idx ON grades(studentId)`,
    `CREATE INDEX IF NOT EXISTS grades_subjectId_idx ON grades(subjectId)`,
    `CREATE INDEX IF NOT EXISTS grades_teacherId_idx ON grades(teacherId)`,

    `CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY NOT NULL,
      feeTitle TEXT NOT NULL,
      feeType TEXT NOT NULL DEFAULT 'tuition',
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'paid',
      method TEXT NOT NULL DEFAULT 'cash',
      academicYear TEXT,
      dueDate DATETIME,
      paidAt DATETIME,
      notes TEXT,
      originalAmount REAL,
      discountAmount REAL NOT NULL DEFAULT 0,
      discountPercent REAL,
      discountReason TEXT,
      finalAmount REAL,
      studentId TEXT NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS payments_studentId_idx ON payments(studentId)`,
    `CREATE INDEX IF NOT EXISTS payments_status_idx ON payments(status)`,
    `CREATE INDEX IF NOT EXISTS payments_feeType_idx ON payments(feeType)`,

    // Junction table for attendance_records and schedules
    `CREATE TABLE IF NOT EXISTS _AttendanceRecordToSchedule (
      A TEXT NOT NULL,
      B TEXT NOT NULL,
      FOREIGN KEY (A) REFERENCES attendance_records(id) ON DELETE CASCADE,
      FOREIGN KEY (B) REFERENCES schedules(id) ON DELETE CASCADE
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS _AttendanceRecordToSchedule_AB_unique ON _AttendanceRecordToSchedule(A, B)`,
    `CREATE INDEX IF NOT EXISTS _AttendanceRecordToSchedule_B_index ON _AttendanceRecordToSchedule(B)`,
  ];

  for (const sql of statements) {
    try {
      await db.$executeRawUnsafe(sql);
    } catch {
      // Table or index might already exist, that's fine
    }
  }
}

async function seedAdminIfNotExists() {
  try {
    const existing = await db.admin.findUnique({ where: { username: "admin" } });
    if (!existing) {
      const passwordHash = await bcrypt.hash("1993", 12);
      await db.admin.create({
        data: {
          username: "admin",
          passwordHash,
          isRoot: true,
        },
      });
      console.log("[DB] Admin user seeded (admin/1993)");
    }
  } catch (error) {
    console.error("[DB] Failed to seed admin:", error);
  }
}

async function seedClassesIfNotExists() {
  try {
    const existingCount = await db.schoolClass.count();
    if (existingCount > 0) return;

    const classNames = [
      { name: "الأول", level: "1" },
      { name: "الثاني", level: "2" },
      { name: "الثالث", level: "3" },
      { name: "الرابع", level: "4" },
      { name: "الخامس", level: "5" },
      { name: "السادس", level: "6" },
    ];

    for (const cls of classNames) {
      const schoolClass = await db.schoolClass.create({
        data: {
          name: cls.name,
          level: cls.level,
          description: `الصف ${cls.name}`,
        },
      });

      await db.section.create({
        data: {
          name: "أ",
          classId: schoolClass.id,
          description: `شعبة أ - الصف ${cls.name}`,
        },
      });
    }

    console.log("[DB] Grade levels + sections seeded");
  } catch (error) {
    console.error("[DB] Failed to seed classes:", error);
  }
}

/**
 * Safely executes a database query with a fallback value.
 * Used to prevent Server Component crashes when the database is unavailable
 * (e.g., on Vercel serverless where SQLite in /tmp may not be ready).
 */
export async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export async function checkDatabaseConnection() {
  try {
    await db.$queryRaw`SELECT 1`;
    return {
      ok: true,
      message: "قاعدة البيانات متصلة بنجاح",
    };
  } catch {
    return {
      ok: false,
      message: "تعذر الاتصال بقاعدة البيانات",
    };
  }
}

export async function disconnectDatabase() {
  await db.$disconnect();
}
