import { cache as reactCache } from "react";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

/**
 * Database client backed by Neon serverless Postgres via Prisma 7's
 * driver-adapter feature.
 *
 * All existing services use `db.student.findMany()`, `db.student.create()`,
 * etc — these are native Prisma APIs, so the swap from the old Supabase REST
 * shim to real Prisma is transparent to the rest of the codebase.
 *
 * The Neon adapter uses HTTP-fetch transport under the hood, which means
 * no long-lived PgBouncer connection — perfect for Vercel serverless.
 */

// Lazy-init the singleton — avoids running at module load time during
// `next build` when DATABASE_URL is not set.
let _db: PrismaClient | null = null;

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Configure it in Vercel environment variables.",
    );
  }

  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}

function getDb(): PrismaClient {
  if (!_db) {
    _db = createPrismaClient();
  }
  return _db;
}

// Export `db` as a Proxy so we don't eagerly construct PrismaClient at
// module load time — this is important for `next build` which evaluates
// modules without env vars available.
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getDb();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});

function hasDatabaseEnv() {
  return Boolean(process.env.DATABASE_URL);
}

// No-op for the new Neon backend — connection is opened lazily by the
// adapter. Kept for backward compatibility with existing callers.
export const ensureDatabase = reactCache(async () => {
  if (!hasDatabaseEnv()) {
    return;
  }
  // Touch the client so any connection error surfaces here rather than
  // mid-request. Real queries are made on-demand by services.
  try {
    getDb();
  } catch (e) {
    console.error("[ensureDatabase] Initialization failed:", e);
  }
});

/**
 * Safely executes a database query with a fallback value.
 * Used to prevent Server Component crashes when the database is unavailable.
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
  } catch (e) {
    console.error("[safeQuery] Database query failed:", e);
    return fallback;
  }
});

export async function checkDatabaseConnection() {
  if (!hasDatabaseEnv()) {
    return {
      ok: false,
      message: "DATABASE_URL غير مضبوط في متغيرات البيئة.",
    };
  }

  try {
    // Force a fresh client + a trivial query.
    const client = getDb();
    await client.$queryRaw`SELECT 1`;
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
  if (_db) {
    await _db.$disconnect();
    _db = null;
  }
}
