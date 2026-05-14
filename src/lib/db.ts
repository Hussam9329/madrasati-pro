import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function getDatabaseUrl(): string {
  // On Vercel, ALWAYS use /tmp for the SQLite database
  // This must take priority over any DATABASE_URL env var,
  // since Vercel's env might have an invalid or PostgreSQL URL
  if (process.env.VERCEL) {
    return "file:/tmp/madrasati.db";
  }

  // For local development, use DATABASE_URL if set, otherwise default
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  return "file:./dev.db";
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

// Track whether database has been initialized in this process
let dbInitialized = false;
let dbInitPromise: Promise<void> | null = null;

export async function ensureDatabase() {
  if (!process.env.VERCEL) return;
  
  // If already initialized in this process, skip
  if (dbInitialized) return;
  
  // If initialization is already running, wait for it
  if (dbInitPromise) {
    await dbInitPromise;
    return;
  }
  
  // Start initialization
  dbInitPromise = initializeDatabase();
  try {
    await dbInitPromise;
    dbInitialized = true;
  } catch (e) {
    dbInitPromise = null;
    console.error("[ensureDatabase] Initialization failed:", e);
    // Don't throw - let queries fail gracefully via safeQuery
  }
}

async function initializeDatabase() {
  // First, ensure the Prisma client is connected
  try {
    await db.$connect();
  } catch (e) {
    console.error("[ensureDatabase] Failed to connect:", e);
    throw e;
  }

  // Use raw SQL to create all tables — much more reliable than execSync on Vercel
  
  const createTablesSQL = [
    // admins
    `CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY NOT NULL,
      username TEXT NOT NULL,
      passwordHash TEXT NOT NULL,
      isRoot BOOLEAN NOT NULL DEFAULT 1,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS admins_username_unique ON admins(username)`,
    
    // schools
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
    
    // subjects
    `CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      isActive BOOLEAN NOT NULL DEFAULT 1,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS subjects_name_unique ON subjects(name)`,
    
    // school_classes
    `CREATE TABLE IF NOT EXISTS school_classes (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      level TEXT,
      description TEXT,
      isActive BOOLEAN NOT NULL DEFAULT 1,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS school_classes_name_level_unique ON school_classes(name, level)`,
    
    // sections
    `CREATE TABLE IF NOT EXISTS sections (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      capacity INTEGER,
      description TEXT,
      isActive BOOLEAN NOT NULL DEFAULT 1,
      classId TEXT NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (classId) REFERENCES school_classes(id) ON DELETE CASCADE
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS sections_classId_name_unique ON sections(classId, name)`,
    `CREATE INDEX IF NOT EXISTS sections_classId_index ON sections(classId)`,
    
    // teachers
    `CREATE TABLE IF NOT EXISTS teachers (
      id TEXT PRIMARY KEY NOT NULL,
      fullName TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      specialty TEXT,
      salary REAL,
      notes TEXT,
      isActive BOOLEAN NOT NULL DEFAULT 1,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS teachers_fullName_index ON teachers(fullName)`,
    
    // teacher_subjects
    `CREATE TABLE IF NOT EXISTS teacher_subjects (
      id TEXT PRIMARY KEY NOT NULL,
      teacherId TEXT NOT NULL,
      subjectId TEXT NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (teacherId) REFERENCES teachers(id) ON DELETE CASCADE,
      FOREIGN KEY (subjectId) REFERENCES subjects(id) ON DELETE CASCADE
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS teacher_subjects_teacherId_subjectId_unique ON teacher_subjects(teacherId, subjectId)`,
    `CREATE INDEX IF NOT EXISTS teacher_subjects_teacherId_index ON teacher_subjects(teacherId)`,
    `CREATE INDEX IF NOT EXISTS teacher_subjects_subjectId_index ON teacher_subjects(subjectId)`,
    
    // class_subjects
    `CREATE TABLE IF NOT EXISTS class_subjects (
      id TEXT PRIMARY KEY NOT NULL,
      classId TEXT NOT NULL,
      subjectId TEXT NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (classId) REFERENCES school_classes(id) ON DELETE CASCADE,
      FOREIGN KEY (subjectId) REFERENCES subjects(id) ON DELETE CASCADE
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS class_subjects_classId_subjectId_unique ON class_subjects(classId, subjectId)`,
    `CREATE INDEX IF NOT EXISTS class_subjects_classId_index ON class_subjects(classId)`,
    `CREATE INDEX IF NOT EXISTS class_subjects_subjectId_index ON class_subjects(subjectId)`,
    
    // students
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
    `CREATE UNIQUE INDEX IF NOT EXISTS students_studentCode_unique ON students(studentCode)`,
    `CREATE INDEX IF NOT EXISTS students_fullName_index ON students(fullName)`,
    `CREATE INDEX IF NOT EXISTS students_sectionId_index ON students(sectionId)`,
    
    // schedules
    `CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY NOT NULL,
      dayOfWeek TEXT NOT NULL,
      startTime TEXT NOT NULL,
      endTime TEXT NOT NULL,
      room TEXT,
      notes TEXT,
      isActive BOOLEAN NOT NULL DEFAULT 1,
      sectionId TEXT NOT NULL,
      subjectId TEXT NOT NULL,
      teacherId TEXT NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sectionId) REFERENCES sections(id) ON DELETE CASCADE,
      FOREIGN KEY (subjectId) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (teacherId) REFERENCES teachers(id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS schedules_sectionId_index ON schedules(sectionId)`,
    `CREATE INDEX IF NOT EXISTS schedules_subjectId_index ON schedules(subjectId)`,
    `CREATE INDEX IF NOT EXISTS schedules_teacherId_index ON schedules(teacherId)`,
    `CREATE INDEX IF NOT EXISTS schedules_dayOfWeek_index ON schedules(dayOfWeek)`,
    
    // attendance_records
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
    `CREATE INDEX IF NOT EXISTS attendance_records_studentId_index ON attendance_records(studentId)`,
    `CREATE INDEX IF NOT EXISTS attendance_records_scheduleId_index ON attendance_records(scheduleId)`,
    `CREATE INDEX IF NOT EXISTS attendance_records_date_index ON attendance_records(date)`,
    
    // grades
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
      isReviewed BOOLEAN NOT NULL DEFAULT 0,
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
    `CREATE INDEX IF NOT EXISTS grades_studentId_index ON grades(studentId)`,
    `CREATE INDEX IF NOT EXISTS grades_subjectId_index ON grades(subjectId)`,
    `CREATE INDEX IF NOT EXISTS grades_teacherId_index ON grades(teacherId)`,
    
    // payments
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
    `CREATE INDEX IF NOT EXISTS payments_studentId_index ON payments(studentId)`,
    `CREATE INDEX IF NOT EXISTS payments_status_index ON payments(status)`,
    `CREATE INDEX IF NOT EXISTS payments_feeType_index ON payments(feeType)`,
  ];
  
  // Execute all SQL statements
  for (const sql of createTablesSQL) {
    try {
      await db.$executeRawUnsafe(sql);
    } catch (e) {
      // Table/index might already exist, that's fine
    }
  }

  // Add new columns if they don't exist (safe ALTER TABLE for existing tables)
  const alterStatements = [
    "ALTER TABLE payments ADD COLUMN originalAmount REAL",
    "ALTER TABLE payments ADD COLUMN discountAmount REAL NOT NULL DEFAULT 0",
    "ALTER TABLE payments ADD COLUMN discountPercent REAL",
    "ALTER TABLE payments ADD COLUMN discountReason TEXT",
    "ALTER TABLE payments ADD COLUMN finalAmount REAL",
    // grades new columns
    "ALTER TABLE grades ADD COLUMN weight REAL",
    "ALTER TABLE grades ADD COLUMN assessmentGroup TEXT",
    "ALTER TABLE grades ADD COLUMN isReviewed BOOLEAN NOT NULL DEFAULT 0",
    "ALTER TABLE grades ADD COLUMN warningLevel TEXT",
  ];
  
  for (const sql of alterStatements) {
    try {
      await db.$executeRawUnsafe(sql);
    } catch {
      // Column might already exist, that's fine
    }
  }

  // Add unique indexes for data integrity (safe, uses IF NOT EXISTS)
  const indexStatements = [
    "CREATE UNIQUE INDEX IF NOT EXISTS teachers_fullName_unique ON teachers(fullName)",
    "CREATE UNIQUE INDEX IF NOT EXISTS students_phone_unique ON students(phone)",
    "CREATE UNIQUE INDEX IF NOT EXISTS students_guardianPhone_unique ON students(guardianPhone)",
  ];
  
  for (const sql of indexStatements) {
    try {
      await db.$executeRawUnsafe(sql);
    } catch {
      // Index might fail if duplicates exist, that's ok for now
    }
  }

  // ── Seed admin account ──────────────────────────────────────
  await seedAdmin();
}

async function seedAdmin() {
  try {
    const existingAdmin = await db.admin.findUnique({
      where: { username: "admin" },
    });

    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash("1993", 12);
      await db.admin.create({
        data: {
          username: "admin",
          passwordHash,
          isRoot: true,
        },
      });
      console.log("[seedAdmin] Admin account created (username: admin)");
    }
  } catch (e) {
    console.error("[seedAdmin] Failed to seed admin:", e);
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
