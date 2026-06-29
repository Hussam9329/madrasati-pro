/**
 * Backward-compatibility shim.
 *
 * Previously this module hosted a hand-written Supabase REST client that
 * mimicked Prisma's API. The data layer has been migrated to real Prisma +
 * Neon serverless (see src/lib/db.ts). Existing service code still imports
 * `hasSupabaseConfig`, `getSupabaseConfigErrorMessage`, and the `supabase`
 * raw client from this module, so we re-export Prisma-backed equivalents
 * here.
 *
 * Long-term we should rewrite those services to use Prisma directly, but
 * keeping the shim lets us ship the Neon migration as a single swap.
 */

import { db } from "@/lib/db";

/**
 * Returns true if a database connection is configured.
 * Previously checked for Supabase env vars; now checks for DATABASE_URL.
 */
export function hasSupabaseConfig(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/**
 * Arabic error message shown to users when the DB is not configured.
 * Name kept for backward compat; the underlying check is for DATABASE_URL.
 */
export function getSupabaseConfigErrorMessage(): string {
  return "إعدادات قاعدة البيانات غير مكتملة. أضف DATABASE_URL في ملف البيئة أو إعدادات Vercel ثم أعد التشغيل.";
}

/**
 * Tiny `supabase.from(table)` shim that proxies to the Prisma client.
 *
 * Only the methods used by src/lib/auth.ts and src/lib/api-auth.ts
 * (select / insert / update / eq / single) are implemented. If a code path
 * hits an unsupported method, it throws with a clear message.
 *
 * This exists ONLY to keep auth.ts / api-auth.ts working without a rewrite
 * in this migration commit. New code should use `db` directly.
 */
type SupabaseQueryState = {
  table: string;
  filters: Array<{ column: string; value: unknown }>;
  payload?: Record<string, unknown> | null;
  select?: string;
};

type SupabaseRow = Record<string, unknown>;

class SupabaseQueryBuilder {
  private state: SupabaseQueryState;

  constructor(table: string) {
    this.state = { table, filters: [] };
  }

  select(columns: string = "*") {
    this.state.select = columns;
    return this;
  }

  insert(payload: Record<string, unknown>) {
    this.state.payload = payload;
    return this;
  }

  update(payload: Record<string, unknown>) {
    this.state.payload = payload;
    return this;
  }

  eq(column: string, value: unknown) {
    this.state.filters.push({ column, value });
    return this;
  }

  is(column: string, value: unknown) {
    // PGRST-style `is.null` — Prisma equivalent is `where: { column: null }`.
    this.state.filters.push({ column, value });
    return this;
  }

  async single(): Promise<{ data: SupabaseRow | null; error: unknown | null }> {
    const result = await this.many();
    if (result.error) return result;
    return { data: result.data?.[0] ?? null, error: null };
  }

  async maybeSingle(): Promise<{ data: SupabaseRow | null; error: unknown | null }> {
    return this.single();
  }

  async then(onFulfilled: (data: SupabaseRow[]) => unknown, onRejected?: (e: unknown) => unknown) {
    return this.many().then((r) => onFulfilled(r.data ?? []), onRejected);
  }

  async many(): Promise<{ data: SupabaseRow[] | null; error: unknown | null }> {
    const { table, filters, payload } = this.state;
    const where: Record<string, unknown> = {};
    for (const f of filters) {
      where[f.column] = f.value;
    }

    // Map table name → Prisma model delegate.
    const model = prismaModelForTable(table);
    if (!model) {
      return {
        data: null,
        error: new Error(`Unsupported table in supabase shim: ${table}`),
      };
    }

    try {
      if (payload !== undefined) {
        // Insert or update — decide based on whether filters are present.
        if (filters.length > 0) {
          // Update via the first filter as the where clause.
          const updated = await (model as any).update({
            where: filtersToWhere(filters),
            data: payload,
          });
          return { data: [updated], error: null };
        }
        // Insert.
        const created = await (model as any).create({ data: payload });
        return { data: [created], error: null };
      }

      // Select.
      if (filters.length > 0) {
        const row = await (model as any).findUnique({ where });
        return { data: row ? [row] : [], error: null };
      }
      const rows = await (model as any).findMany();
      return { data: rows, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
}

function filtersToWhere(
  filters: Array<{ column: string; value: unknown }>,
): Record<string, unknown> {
  if (filters.length === 0) {
    throw new Error("filtersToWhere: at least one filter required");
  }
  // Use the first filter as the unique key. Prisma's findUnique/update
  // requires a unique field — which is exactly what auth.ts does
  // (jti is unique on AdminSession).
  const f = filters[0];
  return { [f.column]: f.value };
}

function prismaModelForTable(table: string): unknown {
  const dbAny = db as any;
  switch (table) {
    case "admin_sessions":
      return dbAny.adminSession;
    case "admins":
      return dbAny.admin;
    default:
      return null;
  }
}

type SupabaseProxy = {
  from(table: string): SupabaseQueryBuilder;
};

/**
 * `supabase` proxy — mimics the small slice of the Supabase JS client API
 * that auth.ts and api-auth.ts rely on (from / select / insert / update /
 * eq / single / maybeSingle). All calls are routed through Prisma.
 */
export const supabase: SupabaseProxy = {
  from(table: string) {
    return new SupabaseQueryBuilder(table);
  },
};
