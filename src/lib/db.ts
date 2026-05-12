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
      execSync("npx prisma db push --accept-data-loss --skip-generate", {
        stdio: "pipe",
        env: {
          ...process.env,
          DATABASE_URL: "file:/tmp/madrasati.db",
        },
      });
    } catch {
      // Database might already exist
    }
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
