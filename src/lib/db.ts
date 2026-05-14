import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
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

export async function ensureDatabase() {
  if (process.env.VERCEL) {
    try {
      const { execSync } = await import("child_process");
      // First, generate the Prisma client if missing
      try {
        execSync("npx prisma generate", { stdio: "pipe" });
      } catch {
        // Generate may fail if already done, that's ok
      }
      // Then push the schema to create/migrate the database
      execSync("npx prisma db push --accept-data-loss --skip-generate", {
        stdio: "pipe",
        env: {
          ...process.env,
          DATABASE_URL: "file:/tmp/madrasati.db",
        },
      });

      // Add new columns if they don't exist (safe ALTER TABLE)
      const alterStatements = [
        "ALTER TABLE payments ADD COLUMN originalAmount REAL",
        "ALTER TABLE payments ADD COLUMN discountAmount REAL NOT NULL DEFAULT 0",
        "ALTER TABLE payments ADD COLUMN discountPercent REAL",
        "ALTER TABLE payments ADD COLUMN discountReason TEXT",
        "ALTER TABLE payments ADD COLUMN finalAmount REAL",
      ];
      
      for (const sql of alterStatements) {
        try {
          await db.$executeRawUnsafe(sql);
        } catch {
          // Column might already exist, that's fine
        }
      }

      // Add unique indexes
      const indexStatements = [
        "CREATE UNIQUE INDEX IF NOT EXISTS teachers_fullName_unique ON teachers(fullName)",
        "CREATE UNIQUE INDEX IF NOT EXISTS students_phone_unique ON students(phone)",
        "CREATE UNIQUE INDEX IF NOT EXISTS students_guardianPhone_unique ON students(guardianPhone)",
        "CREATE UNIQUE INDEX IF NOT EXISTS attendance_records_student_date_schedule_unique ON attendance_records(studentId, date, COALESCE(scheduleId, '__NO_SCHEDULE__'))",
      ];
      
      for (const sql of indexStatements) {
        try {
          await db.$executeRawUnsafe(sql);
        } catch {
          // Index might fail if duplicates exist, that's ok for now
        }
      }
    } catch {
      // Database might already exist or be unavailable
      // On Vercel, the database lives in /tmp and is ephemeral
    }
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
