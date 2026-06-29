/**
 * Database backup / restore service.
 *
 * Exports every table in the application's Postgres schema as a single JSON
 * payload, and re-imports that same JSON into the same (or another) Postgres
 * project while preserving all primary keys (so foreign-key relationships
 * survive the move without remapping).
 *
 * Backed by Prisma + Neon serverless. All reads/writes go through the
 * shared `db` Prisma client.
 *
 * Design notes:
 * - All writes use `upsert` on the primary key so the importer is
 *   idempotent — running it twice produces the same result as running it
 *   once.
 * - The importer orders tables by dependency (parents before children) and
 *   chunks inserts in batches of 50 with parallelism of 4 to keep
 *   throughput high without exceeding Neon's connection limits.
 * - Date / Decimal fields are normalized between JSON strings (Supabase
 *   REST shape) and Prisma's expected Date / number shapes so the same
 *   snapshot file works regardless of source.
 */

import { db } from "@/lib/db";

/** Tables ordered so that parent rows are inserted before their children. */
const TABLE_ORDER = [
  "admins",
  "school_classes",
  "subjects",
  "sections",
  "class_subjects",
  "teachers",
  "teacher_subjects",
  "teacher_sections",
  "students",
  "schedules",
  "attendance_records",
  "exams",
  "grades",
  "class_fee_settings",
  "payments",
  "school_settings",
  "admin_sessions",
] as const;

const INSERT_BATCH = 50;
const PARALLEL = 4;

export type DatabaseSnapshot = {
  meta: {
    exportedAt: string;
    tableCount: number;
    rowCount: number;
    tables: Record<string, number>;
  };
  data: Record<string, Record<string, any>[]>;
};

export type ExportResult =
  | { ok: true; snapshot: DatabaseSnapshot }
  | { ok: false; message: string; partialTables?: string[] };

export type ImportResult =
  | { ok: true; imported: Record<string, number>; skipped: Record<string, number> }
  | { ok: false; message: string; partialTables?: string[] };

/** Map snapshot table name → Prisma model delegate on `db`. */
function prismaModelForTable(table: string): any {
  const dbAny = db as any;
  switch (table) {
    case "admins": return dbAny.admin;
    case "school_classes": return dbAny.schoolClass;
    case "subjects": return dbAny.subject;
    case "sections": return dbAny.section;
    case "class_subjects": return dbAny.classSubject;
    case "teachers": return dbAny.teacher;
    case "teacher_subjects": return dbAny.teacherSubject;
    case "teacher_sections": return dbAny.teacherSection;
    case "students": return dbAny.student;
    case "schedules": return dbAny.schedule;
    case "attendance_records": return dbAny.attendanceRecord;
    case "exams": return dbAny.exam;
    case "grades": return dbAny.grade;
    case "class_fee_settings": return dbAny.classFeeSetting;
    case "payments": return dbAny.payment;
    case "school_settings": return dbAny.schoolSetting;
    case "admin_sessions": return dbAny.adminSession;
    default: return null;
  }
}

/**
 * Pull every row from every table in TABLE_ORDER and assemble a single
 * JSON snapshot. Missing tables (e.g. admin_sessions not yet created) are
 * recorded but do not abort the export.
 */
export async function exportDatabase(): Promise<ExportResult> {
  const data: Record<string, Record<string, any>[]> = {};
  const tableRowCounts: Record<string, number> = {};
  let totalRows = 0;

  for (const table of TABLE_ORDER) {
    try {
      const model = prismaModelForTable(table);
      if (!model) {
        data[table] = [];
        tableRowCounts[table] = 0;
        continue;
      }
      // findMany returns plain objects with Date fields for DateTime columns
      // and Decimal objects for numeric columns. We serialize Date → ISO
      // string and Decimal → number so the JSON snapshot is plain JSON.
      const rows = await model.findMany();
      const serialized = rows.map((row: any) => serializeRow(row));
      data[table] = serialized;
      tableRowCounts[table] = serialized.length;
      totalRows += serialized.length;
    } catch (error: any) {
      console.error(`[exportDatabase] Failed to read ${table}:`, error);
      data[table] = [];
      tableRowCounts[table] = 0;
    }
  }

  const snapshot: DatabaseSnapshot = {
    meta: {
      exportedAt: new Date().toISOString(),
      tableCount: TABLE_ORDER.length,
      rowCount: totalRows,
      tables: tableRowCounts,
    },
    data,
  };

  return { ok: true, snapshot };
}

/**
 * Convert a Prisma row to a plain JSON-safe object.
 * - Date → ISO string
 * - Decimal → number
 * - object (nested) → recursively serialized
 */
function serializeRow(row: any): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(row ?? {})) {
    out[key] = serializeValue(value);
  }
  return out;
}

function serializeValue(value: any): any {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    // Prisma Decimal objects expose .toString(); numbers pass through.
    if (typeof value.toString === "function") {
      const s = value.toString();
      // Decimal-like: looks numeric and has no JSON structure
      if (/^-?\d+(\.\d+)?$/.test(s) && !Array.isArray(value)) {
        return Number(s);
      }
    }
    if (Array.isArray(value)) return value.map(serializeValue);
    return serializeRow(value);
  }
  return value;
}

/**
 * Convert a JSON row (as produced by serializeRow / as found in a snapshot
 * file) back into the shape Prisma expects on writes.
 * - ISO string → Date for known DateTime fields
 * - Numeric strings / numbers → kept as number for Decimal fields
 */
function deserializeRow(table: string, row: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = { ...row };

  const dateTimeFields = [
    "createdAt", "updatedAt", "birthDate", "enrollmentDate",
    "date", "checkInAt", "checkOutAt", "dueDate", "paidAt",
    "expiresAt", "revokedAt",
  ];
  for (const f of dateTimeFields) {
    if (f in out && out[f] !== null && out[f] !== undefined) {
      const v = out[f];
      if (typeof v === "string") {
        const d = new Date(v);
        out[f] = Number.isNaN(d.getTime()) ? null : d;
      }
    }
  }

  // Decimal fields — Prisma accepts number or string.
  const decimalFields = [
    "salary", "maxScore", "passScore", "failScore", "score", "weight",
    "amount", "uniformAmount", "originalAmount", "discountAmount",
    "discountPercent", "finalAmount", "remainingAmount",
  ];
  for (const f of decimalFields) {
    if (f in out && out[f] !== null && out[f] !== undefined) {
      const n = typeof out[f] === "number" ? out[f] : Number(out[f]);
      out[f] = Number.isNaN(n) ? null : n;
    }
  }

  return out;
}

/**
 * Import a previously-exported snapshot into the current database.
 * Writes happen in TABLE_ORDER so foreign-key parents exist before their
 * children. Each batch uses upsert on `id` so re-running is idempotent.
 */
export async function importDatabase(
  snapshot: DatabaseSnapshot,
): Promise<ImportResult> {
  const imported: Record<string, number> = {};
  const skipped: Record<string, number> = {};

  if (!snapshot || !snapshot.data || typeof snapshot.data !== "object") {
    return { ok: false, message: "ملف JSON غير صالح: لا يحتوي على حقل data." };
  }

  for (const table of TABLE_ORDER) {
    const rows = snapshot.data[table];

    if (!Array.isArray(rows)) {
      imported[table] = 0;
      skipped[table] = 0;
      continue;
    }

    if (rows.length === 0) {
      imported[table] = 0;
      skipped[table] = 0;
      continue;
    }

    try {
      const model = prismaModelForTable(table);
      if (!model) {
        imported[table] = 0;
        skipped[table] = rows.length;
        continue;
      }

      let count = 0;
      for (let i = 0; i < rows.length; i += INSERT_BATCH * PARALLEL) {
        const promises: Promise<number>[] = [];
        for (let p = 0; p < PARALLEL && i + p * INSERT_BATCH < rows.length; p++) {
          const start = i + p * INSERT_BATCH;
          const batch = rows.slice(start, start + INSERT_BATCH);
          promises.push(
            (db as any).$transaction(
              batch.map((row: Record<string, any>) =>
                model.upsert({
                  where: { id: row.id },
                  create: deserializeRow(table, row),
                  update: deserializeRow(table, row),
                })
              ),
              { timeout: 60_000, maxWait: 10_000 }
            ).then(() => batch.length)
          );
        }
        const counts = await Promise.all(promises);
        count += counts.reduce((a, b) => a + b, 0);
      }
      imported[table] = count;
      skipped[table] = 0;
    } catch (error: any) {
      console.error(`[importDatabase] Failed to write ${table}:`, error);
      return {
        ok: false,
        message: `تعذر كتابة الجدول ${table}: ${error?.message ?? "خطأ غير معروف"}`,
        partialTables: Object.keys(imported).filter((t) => imported[t] > 0),
      };
    }
  }

  return { ok: true, imported, skipped };
}

/**
 * Names of all tables the snapshot will include. Used by the UI to show
 * a checklist / summary before and after import.
 */
export function getKnownTables(): readonly string[] {
  return TABLE_ORDER;
}
