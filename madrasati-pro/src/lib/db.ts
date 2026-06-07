import bcrypt from "bcryptjs";
import { cache as reactCache } from "react";
import { supabaseDB } from "@/lib/supabase-client";

/**
 * Database client using Supabase REST API.
 * This replaces Prisma's PostgreSQL connection to work around IPv4/IPv6
 * connectivity issues between Vercel and Supabase.
 *
 * The supabaseDB object provides the same API surface as Prisma:
 *   db.model.findMany(), findUnique(), findFirst(), create(), update(), delete(), count(), aggregate()
 *   db.$connect(), db.$disconnect()
 *
 * All existing service files work without modification.
 */
export const db = supabaseDB;

// Track whether database has been initialized in this process
let dbInitialized = false;
let dbInitPromise: Promise<void> | null = null;

function hasDatabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export const ensureDatabase = reactCache(async () => {
  // Do not open a placeholder Supabase connection during production builds or local checks.
  if (!hasDatabaseEnv()) {
    return;
  }

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
});

async function initializeDatabase() {
  if (!hasDatabaseEnv()) {
    return;
  }

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
 *
 * Wrapped with React cache() for request-level deduplication:
 * if multiple server components call safeQuery with the same function
 * reference during the same render, only one execution will occur.
 */
export const safeQuery = reactCache(async function safeQuery<T>(
  fn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  if (!hasDatabaseEnv()) {
    return fallback;
  }

  try {
    return await fn();
  } catch {
    return fallback;
  }
});

export async function checkDatabaseConnection() {
  try {
    await db.$connect();
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
