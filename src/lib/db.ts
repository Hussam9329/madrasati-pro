import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
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
  try {
    await db.$connect();
  } catch (e) {
    console.error("[ensureDatabase] Failed to connect:", e);
    throw e;
  }

  // Seed admin account if it doesn't exist
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
 * Used to prevent Server Component crashes when the database is unavailable.
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
