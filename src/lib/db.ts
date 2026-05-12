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
