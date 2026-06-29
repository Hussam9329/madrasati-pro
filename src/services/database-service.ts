/**
 * Database backup / restore service.
 *
 * Exports every table in the application's Supabase schema as a single JSON
 * payload, and re-imports that same JSON into another Supabase project while
 * preserving all primary keys (so foreign-key relationships survive the move
 * without remapping).
 *
 * Design notes:
 * - Reads/writes go through the raw `supabase` REST client (not the
 *   Prisma-compatible wrapper) so we can control exactly which columns get
 *   sent and avoid the cache + post-processing layers.
 * - All writes use `upsert` on the primary key so the importer is
 *   idempotent — running it twice produces the same result as running it
 *   once.
 * - The exporter pulls each table's rows in chunks of 1000 to avoid hitting
 *   PostgREST's default 1000-row limit per request.
 * - The importer orders tables by dependency (parents before children) and
 *   chunks inserts in batches of 500 to stay well under PostgREST's
 *   per-request payload cap.
 */

import { supabase } from "@/lib/supabase-client";

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

const CHUNK_SIZE = 1000;
const INSERT_BATCH = 500;

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

/**
 * Pull every row from every table in TABLE_ORDER and assemble a single
 * JSON snapshot. Missing tables (e.g. admin_sessions not yet created) are
 * recorded but do not abort the export.
 */
export async function exportDatabase(): Promise<ExportResult> {
  const data: Record<string, Record<string, any>[]> = {};
  const tableRowCounts: Record<string, number> = {};
  const missingTables: string[] = [];
  let totalRows = 0;

  for (const table of TABLE_ORDER) {
    try {
      const rows = await fetchAllRows(table);
      data[table] = rows;
      tableRowCounts[table] = rows.length;
      totalRows += rows.length;
    } catch (error: any) {
      console.error(`[exportDatabase] Failed to read ${table}:`, error);
      // PGRST116 / 42P01 — table doesn't exist in this project
      if (isMissingTableError(error)) {
        missingTables.push(table);
        data[table] = [];
        tableRowCounts[table] = 0;
        continue;
      }
      return {
        ok: false,
        message: `تعذر قراءة الجدول ${table}: ${error?.message ?? "خطأ غير معروف"}`,
        partialTables: Object.keys(data),
      };
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
 * Read every row from a single table, paging through PostgREST's default
 * 1000-row limit using range-based requests.
 */
async function fetchAllRows(table: string): Promise<Record<string, any>[]> {
  const allRows: Record<string, any>[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .range(offset, offset + CHUNK_SIZE - 1);

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      break;
    }

    allRows.push(...data);
    if (data.length < CHUNK_SIZE) {
      break;
    }
    offset += CHUNK_SIZE;
  }

  return allRows;
}

/**
 * Import a previously-exported snapshot into the current Supabase project.
 * Writes happen in TABLE_ORDER so foreign-key parents exist before their
 * children. Each batch uses upsert on `id` so re-running is idempotent.
 */
export async function importDatabase(
  snapshot: DatabaseSnapshot,
): Promise<ImportResult> {
  const imported: Record<string, number> = {};
  const skipped: Record<string, number> = {};

  // First pass: validate the snapshot structure so we don't half-write a
  // malformed file.
  if (!snapshot || !snapshot.data || typeof snapshot.data !== "object") {
    return { ok: false, message: "ملف JSON غير صالح: لا يحتوي على حقل data." };
  }

  for (const table of TABLE_ORDER) {
    const rows = snapshot.data[table];

    if (!Array.isArray(rows)) {
      // Table is simply absent from the snapshot — skip silently.
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
      let count = 0;
      for (let i = 0; i < rows.length; i += INSERT_BATCH) {
        const batch = rows.slice(i, i + INSERT_BATCH);
        const { error } = await supabase
          .from(table)
          .upsert(batch, { onConflict: "id" });

        if (error) {
          // If the table doesn't exist in the target project, surface a
          // clear message so the user knows they need to run migrations.
          if (isMissingTableError(error)) {
            return {
              ok: false,
              message: `الجدول ${table} غير موجود في قاعدة البيانات الجديدة. شغّل ملفات الـ migration أولاً.`,
              partialTables: Object.keys(imported).filter((t) => imported[t] > 0),
            };
          }
          throw error;
        }
        count += batch.length;
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

function isMissingTableError(error: any): boolean {
  const code = (error?.code ?? "").toUpperCase();
  const message = String(error?.message ?? error?.details ?? "");
  return (
    code === "PGRST116" ||
    code === "42P01" ||
    code === "PGRST204" ||
    /relation "[\w.]+" does not exist/i.test(message) ||
    /Could not find the table/i.test(message) ||
    /schema "[\w.]+" does not exist/i.test(message)
  );
}

/**
 * Names of all tables the snapshot will include. Used by the UI to show
 * a checklist / summary before and after import.
 */
export function getKnownTables(): readonly string[] {
  return TABLE_ORDER;
}
