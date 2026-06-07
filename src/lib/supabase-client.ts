/**
 * Supabase REST API client for database operations.
 * Used as a fallback when Prisma can't connect via PostgreSQL (e.g., IPv4/IPv6 issues on Vercel).
 * Provides a Prisma-compatible API surface so existing service code doesn't need changes.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const globalForSupabase = globalThis as unknown as {
  supabase?: SupabaseClient;
};

// ─── In-Memory Query Cache ─────────────────────────────────────
// Caches read query results for a short TTL to avoid redundant
// HTTP round-trips to Supabase within the same serverless invocation
// or during SSR of the same page.

type CacheEntry = {
  data: any;
  expiresAt: number;
};

const queryCache = new Map<string, CacheEntry>();

/** Default TTL for cached reads (15 seconds — balances freshness with performance) */
const DEFAULT_CACHE_TTL_MS = 15_000;

/** Maximum cache entries to prevent unbounded memory growth */
const MAX_CACHE_ENTRIES = 200;

function getCacheKey(table: string, method: string, args: Record<string, any>): string {
  try {
    return `${table}:${method}:${JSON.stringify(args)}`;
  } catch {
    return `${table}:${method}:${Date.now()}`;
  }
}

function getCached(key: string): CacheEntry | undefined {
  const entry = queryCache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    queryCache.delete(key);
    return undefined;
  }
  return entry;
}

function setCache(key: string, data: any, ttlMs = DEFAULT_CACHE_TTL_MS): void {
  // Evict oldest entries if cache is full
  if (queryCache.size >= MAX_CACHE_ENTRIES) {
    const now = Date.now();
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    for (const [k, v] of queryCache) {
      if (v.expiresAt < oldestTime) {
        oldestTime = v.expiresAt;
        oldestKey = k;
      }
      // Also clean expired entries while iterating
      if (now > v.expiresAt) {
        queryCache.delete(k);
      }
    }
    if (oldestKey && queryCache.size >= MAX_CACHE_ENTRIES) {
      queryCache.delete(oldestKey);
    }
  }

  queryCache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Invalidate all cache entries for a given table.
 * Called automatically after write operations (create, update, delete).
 */
function invalidateTableCache(table: string): void {
  const prefix = `${table}:`;
  for (const key of queryCache.keys()) {
    if (key.startsWith(prefix)) {
      queryCache.delete(key);
    }
  }
}

// Tables with data that rarely changes — can use longer TTL
const LONG_CACHE_TABLES = new Set([
  "school_settings",
  "school_classes",
  "subjects",
  "sections",
]);
const LONG_CACHE_TTL_MS = 60_000; // 60 seconds

function getCacheTtlForTable(table: string): number {
  return LONG_CACHE_TABLES.has(table) ? LONG_CACHE_TTL_MS : DEFAULT_CACHE_TTL_MS;
}

/**
 * Get or create the Supabase client lazily.
 * This avoids "supabaseUrl is required" errors during build time
 * when env vars are not available.
 */
export function hasSupabaseConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function getSupabaseConfigErrorMessage(): string {
  return "إعدادات قاعدة البيانات غير مكتملة. أضف NEXT_PUBLIC_SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY في ملف البيئة أو إعدادات Vercel ثم أعد التشغيل.";
}

function assertSupabaseConfig() {
  if (!hasSupabaseConfig()) {
    throw new Error(getSupabaseConfigErrorMessage());
  }
}

function getSupabaseClient(): SupabaseClient {
  assertSupabaseConfig();

  if (!globalForSupabase.supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

    globalForSupabase.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return globalForSupabase.supabase;
}

// Initialize eagerly if env vars are available, otherwise defer
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (supabaseUrl && supabaseKey) {
  getSupabaseClient();
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabaseClient() as any)[prop];
  },
});

// Model name to table name mapping (matches Prisma @@map annotations)
const MODEL_TO_TABLE: Record<string, string> = {
  admin: "admins",
  subject: "subjects",
  schoolClass: "school_classes",
  section: "sections",
  teacher: "teachers",
  teacherSubject: "teacher_subjects",
  teacherSection: "teacher_sections",
  classSubject: "class_subjects",
  student: "students",
  schedule: "schedules",
  attendanceRecord: "attendance_records",
  exam: "exams",
  grade: "grades",
  classFeeSetting: "class_fee_settings",
  payment: "payments",
  schoolSetting: "school_settings",
};

// Relation mappings for include/select operations
// Maps Prisma relation names to { table, foreignKey, thisKey } info
type RelationInfo = {
  table: string;
  foreignKey: string;
  thisKey: string;
  isMany: boolean;
};

const SUPABASE_IN_BATCH_SIZE = 200;

const RELATION_MAP: Record<string, Record<string, RelationInfo>> = {
  student: {
    section: { table: "sections", foreignKey: "id", thisKey: "sectionId", isMany: false },
    grades: { table: "grades", foreignKey: "studentId", thisKey: "id", isMany: true },
    attendanceRecords: { table: "attendance_records", foreignKey: "studentId", thisKey: "id", isMany: true },
    payments: { table: "payments", foreignKey: "studentId", thisKey: "id", isMany: true },
  },
  section: {
    class: { table: "school_classes", foreignKey: "id", thisKey: "classId", isMany: false },
    students: { table: "students", foreignKey: "sectionId", thisKey: "id", isMany: true },
    schedules: { table: "schedules", foreignKey: "sectionId", thisKey: "id", isMany: true },
    teacherSections: { table: "teacher_sections", foreignKey: "sectionId", thisKey: "id", isMany: true },
    exams: { table: "exams", foreignKey: "sectionId", thisKey: "id", isMany: true },
  },
  schoolClass: {
    sections: { table: "sections", foreignKey: "classId", thisKey: "id", isMany: true },
    classSubjects: { table: "class_subjects", foreignKey: "classId", thisKey: "id", isMany: true },
    feeSettings: { table: "class_fee_settings", foreignKey: "classId", thisKey: "id", isMany: true },
  },
  teacher: {
    teacherSubjects: { table: "teacher_subjects", foreignKey: "teacherId", thisKey: "id", isMany: true },
    teacherSections: { table: "teacher_sections", foreignKey: "teacherId", thisKey: "id", isMany: true },
    schedules: { table: "schedules", foreignKey: "teacherId", thisKey: "id", isMany: true },
    exams: { table: "exams", foreignKey: "teacherId", thisKey: "id", isMany: true },
    grades: { table: "grades", foreignKey: "teacherId", thisKey: "id", isMany: true },
  },
  teacherSubject: {
    teacher: { table: "teachers", foreignKey: "id", thisKey: "teacherId", isMany: false },
    subject: { table: "subjects", foreignKey: "id", thisKey: "subjectId", isMany: false },
  },
  teacherSection: {
    teacher: { table: "teachers", foreignKey: "id", thisKey: "teacherId", isMany: false },
    section: { table: "sections", foreignKey: "id", thisKey: "sectionId", isMany: false },
  },
  classSubject: {
    class: { table: "school_classes", foreignKey: "id", thisKey: "classId", isMany: false },
    subject: { table: "subjects", foreignKey: "id", thisKey: "subjectId", isMany: false },
  },
  schedule: {
    section: { table: "sections", foreignKey: "id", thisKey: "sectionId", isMany: false },
    subject: { table: "subjects", foreignKey: "id", thisKey: "subjectId", isMany: false },
    teacher: { table: "teachers", foreignKey: "id", thisKey: "teacherId", isMany: false },
    attendanceRecords: { table: "attendance_records", foreignKey: "scheduleId", thisKey: "id", isMany: true },
  },
  attendanceRecord: {
    student: { table: "students", foreignKey: "id", thisKey: "studentId", isMany: false },
    schedule: { table: "schedules", foreignKey: "id", thisKey: "scheduleId", isMany: false },
  },
  subject: {
    teacherSubjects: { table: "teacher_subjects", foreignKey: "subjectId", thisKey: "id", isMany: true },
    classSubjects: { table: "class_subjects", foreignKey: "subjectId", thisKey: "id", isMany: true },
    grades: { table: "grades", foreignKey: "subjectId", thisKey: "id", isMany: true },
    schedules: { table: "schedules", foreignKey: "subjectId", thisKey: "id", isMany: true },
    exams: { table: "exams", foreignKey: "subjectId", thisKey: "id", isMany: true },
  },
  exam: {
    subject: { table: "subjects", foreignKey: "id", thisKey: "subjectId", isMany: false },
    section: { table: "sections", foreignKey: "id", thisKey: "sectionId", isMany: false },
    teacher: { table: "teachers", foreignKey: "id", thisKey: "teacherId", isMany: false },
    grades: { table: "grades", foreignKey: "examId", thisKey: "id", isMany: true },
  },
  grade: {
    student: { table: "students", foreignKey: "id", thisKey: "studentId", isMany: false },
    subject: { table: "subjects", foreignKey: "id", thisKey: "subjectId", isMany: false },
    teacher: { table: "teachers", foreignKey: "id", thisKey: "teacherId", isMany: false },
    exam: { table: "exams", foreignKey: "id", thisKey: "examId", isMany: false },
  },
  classFeeSetting: {
    class: { table: "school_classes", foreignKey: "id", thisKey: "classId", isMany: false },
  },
  payment: {
    student: { table: "students", foreignKey: "id", thisKey: "studentId", isMany: false },
  },
  schoolSetting: {},
};

/**
 * Convert Prisma where clause to Supabase PostgREST query params
 */
function buildQueryParams(
  where: Record<string, any>,
  table: string,
  prefix = ""
): string[] {
  const params: string[] = [];

  for (const [key, value] of Object.entries(where)) {
    const col = prefix ? `${prefix}.${key}` : key;

    if (value === null) {
      params.push(`${key}=is.null`);
    } else if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      params.push(`${key}=eq.${value}`);
    } else if (key === "AND" && Array.isArray(value)) {
      for (const cond of value) {
        params.push(...buildQueryParams(cond, table, prefix));
      }
    } else if (key === "OR" && Array.isArray(value)) {
      const orParts: string[] = [];
      for (const cond of value) {
        const subParams = buildQueryParams(cond, table, prefix);
        orParts.push(subParams.join(","));
      }
      params.push(`or=(${orParts.join(",")})`);
    } else if (key === "id" && typeof value === "object" && value.not) {
      params.push(`id=neq.${value.not}`);
    } else if (typeof value === "object" && value !== null) {
      // Handle Prisma operators
      if (value.startsWith !== undefined) {
        params.push(`${key}=like.${value.startsWith}*`);
      } else if (value.contains !== undefined) {
        params.push(`${key}=like.*${value.contains}*`);
      } else if (value.eq !== undefined) {
        params.push(`${key}=eq.${value.eq}`);
      } else if (value.ne !== undefined) {
        params.push(`${key}=neq.${value.ne}`);
      } else if (value.gt !== undefined) {
        params.push(`${key}=gt.${value.gt}`);
      } else if (value.gte !== undefined) {
        params.push(`${key}=gte.${value.gte}`);
      } else if (value.lt !== undefined) {
        params.push(`${key}=lt.${value.lt}`);
      } else if (value.lte !== undefined) {
        params.push(`${key}=lte.${value.lte}`);
      } else if (value.in !== undefined) {
        const vals = Array.isArray(value.in) ? value.in.join(",") : value.in;
        params.push(`${key}=in.(${vals})`);
      } else if (value.not !== undefined) {
        if (value.not === null) {
          params.push(`${key}=not.is.null`);
        } else {
          params.push(`${key}=neq.${value.not}`);
        }
      }
      // Handle nested relation filters like { section: { classId: "xxx" } }
      else {
        // Check if this is a relation filter
        const relations = RELATION_MAP[Object.keys(MODEL_TO_TABLE).find(k => MODEL_TO_TABLE[k] === table) || ""] || {};
        const relation = relations[key];
        if (relation) {
          // This is a relation filter - we'll handle it via post-filtering for now
          // Complex relation filters need special handling
        }
      }
    }
  }

  return params;
}

/**
 * Build select string for Supabase from Prisma include/select
 */
function buildSelectString(
  model: string,
  include?: Record<string, any>,
  select?: Record<string, any>
): string | undefined {
  if (select) {
    // Explicit select - just list the columns
    return Object.keys(select).join(",");
  }

  if (!include) return undefined;

  const parts: string[] = [];

  for (const [key, value] of Object.entries(include)) {
    if (key === "_count") {
      // _count is handled specially in post-processing
      continue;
    }

    const relations = RELATION_MAP[model] || {};
    const relation = relations[key];

    if (typeof value === "object" && value !== null) {
      if (relation) {
        // Use the actual table name for PostgREST, not the Prisma relation key
        const tableName = relation.table;
        const nestedSelect = buildSelectString(
          getTableModelName(relation.table),
          value.include,
          value.select
        );

        if (nestedSelect) {
          parts.push(`${tableName}!${relation.foreignKey}(${nestedSelect})`);
        } else {
          // Include all columns of related table
          parts.push(`${tableName}!${relation.foreignKey}(*)`);
        }
      }
    } else if (value === true) {
      if (relation) {
        // Use the actual table name for PostgREST
        const tableName = relation.table;
        parts.push(`${tableName}!${relation.foreignKey}(*)`);
      }
    }
  }

  if (parts.length === 0) return undefined;
  return `*,${parts.join(",")}`;
}

/**
 * Convert a snake_case table name back to camelCase model name
 */
function getTableModelName(tableName: string): string {
  for (const [model, table] of Object.entries(MODEL_TO_TABLE)) {
    if (table === tableName) return model;
  }
  // Fallback: convert snake_case to camelCase
  return tableName.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

/**
 * Generate a cuid-like ID for new records
 */
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `cl${timestamp}${random}`;
}

/**
 * Build order by string for Supabase from Prisma orderBy
 */
function buildOrderBy(orderBy: any): string {
  if (Array.isArray(orderBy)) {
    return orderBy
      .map((o) => {
        const [key, dir] = Object.entries(o)[0] as [string, string];
        return `${key}.${dir === "desc" ? "desc" : "asc"}.nullslast`;
      })
      .join(",");
  }
  if (typeof orderBy === "object") {
    const [key, dir] = Object.entries(orderBy)[0] as [string, string];
    return `${key}.${dir === "desc" ? "desc" : "asc"}.nullslast`;
  }
  return orderBy;
}

/**
 * Convert Supabase row to camelCase and handle nested relations
 */
function transformRow<T>(row: Record<string, any>): T {
  // Supabase already returns camelCase for our tables (since columns were created in camelCase)
  // Just handle nested objects
  for (const [key, value] of Object.entries(row)) {
    if (Array.isArray(value)) {
      row[key] = value.map((v: any) =>
        typeof v === "object" && v !== null ? transformRow(v) : v
      );
    } else if (typeof value === "object" && value !== null && !(value instanceof Date)) {
      row[key] = transformRow(value);
    }
  }
  return row as T;
}

function getTruthySelectKeys(select?: Record<string, any>): string[] {
  if (!select) return [];
  return Object.entries(select)
    .filter(([, enabled]) => Boolean(enabled))
    .map(([key]) => key);
}

function uniqueCompactValues(values: any[]): any[] {
  const seen = new Set<string>();
  const unique: any[] = [];

  for (const value of values) {
    if (value === null || value === undefined || value === "") continue;
    const key = String(value);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(value);
  }

  return unique;
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function groupRowsByKey(rows: Record<string, any>[], keyName: string): Map<string, Record<string, any>[]> {
  const grouped = new Map<string, Record<string, any>[]>();

  for (const row of rows) {
    const key = row[keyName];
    if (key === null || key === undefined) continue;

    const mapKey = String(key);
    const existing = grouped.get(mapKey);
    if (existing) {
      existing.push(row);
    } else {
      grouped.set(mapKey, [row]);
    }
  }

  return grouped;
}

function pickSelectedColumns(row: Record<string, any>, selectedKeys?: Set<string>): Record<string, any> {
  if (!selectedKeys) return row;

  const picked: Record<string, any> = {};
  for (const key of selectedKeys) {
    if (Object.prototype.hasOwnProperty.call(row, key)) {
      picked[key] = row[key];
    }
  }
  return picked;
}

/**
 * Supabase-backed model handler that mimics Prisma's model API
 */
class SupabaseModelHandler {
  constructor(private model: string, private table: string) {}

  private getClient() {
    return supabase;
  }

  private prepareWriteData(data: Record<string, any>): Record<string, any> {
    const prepared: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) continue;
      prepared[key] = value instanceof Date ? value.toISOString() : value;
    }

    return prepared;
  }

  private splitNestedWrites(data: Record<string, any>): {
    scalarData: Record<string, any>;
    nestedCreates: Array<{
      relationName: string;
      relation: RelationInfo;
      rows: Record<string, any>[];
    }>;
  } {
    const scalarData: Record<string, any> = {};
    const nestedCreates: Array<{
      relationName: string;
      relation: RelationInfo;
      rows: Record<string, any>[];
    }> = [];
    const relations = RELATION_MAP[this.model] || {};

    for (const [key, value] of Object.entries(data)) {
      const relation = relations[key];
      const maybeNested = value as { create?: Record<string, any> | Record<string, any>[] } | null;

      if (relation && maybeNested && typeof maybeNested === "object" && maybeNested.create !== undefined) {
        const rows = Array.isArray(maybeNested.create)
          ? maybeNested.create
          : [maybeNested.create];

        nestedCreates.push({
          relationName: key,
          relation,
          rows: rows.filter(Boolean),
        });
        continue;
      }

      scalarData[key] = value;
    }

    return { scalarData, nestedCreates };
  }

  private async createNestedRows(
    parent: Record<string, any>,
    nestedCreates: Array<{
      relationName: string;
      relation: RelationInfo;
      rows: Record<string, any>[];
    }>
  ) {
    for (const nested of nestedCreates) {
      if (!nested.relation.isMany || nested.rows.length === 0) continue;

      const parentKeyValue = parent[nested.relation.thisKey] ?? parent.id;
      if (!parentKeyValue) {
        throw new Error(`Cannot create nested ${nested.relationName}: parent key is missing.`);
      }

      const relatedRows = nested.rows.map((row) =>
        this.prepareWriteData({
          ...row,
          [nested.relation.foreignKey]: parentKeyValue,
        })
      );

      const handler = new SupabaseModelHandler(
        getTableModelName(nested.relation.table),
        nested.relation.table
      );
      await handler.createMany({ data: relatedRows });
    }
  }

  private getBaseSelect(select?: Record<string, any>): string {
    const keys = getTruthySelectKeys(select);
    return keys.length > 0 ? keys.join(",") : "*";
  }

  private getRelationSelect(
    value: any,
    relation: RelationInfo,
  ): { select: string; selectedKeys?: Set<string> } {
    if (typeof value === "object" && value !== null && value.select) {
      const keys = getTruthySelectKeys(value.select);
      const selectedKeys = new Set(keys);
      const technicalKey = relation.foreignKey;

      if (!keys.includes(technicalKey)) {
        keys.push(technicalKey);
      }

      return {
        select: keys.length > 0 ? keys.join(",") : "*",
        selectedKeys,
      };
    }

    return { select: "*" };
  }

  private applyOrderBy(query: any, orderBy?: any): any {
    if (!orderBy) return query;

    const orderByArr = Array.isArray(orderBy) ? orderBy : [orderBy];
    for (const ob of orderByArr) {
      const [key, dir] = Object.entries(ob)[0] as [string, string];
      query = query.order(key, { ascending: dir === "asc", nullsFirst: false });
    }

    return query;
  }

  private async fetchRowsByIn(
    table: string,
    select: string,
    column: string,
    values: any[],
    options?: { orderBy?: any; where?: Record<string, any>; model?: string },
  ): Promise<Record<string, any>[]> {
    const uniqueValues = uniqueCompactValues(values);
    if (uniqueValues.length === 0) return [];

    const relatedHandler = options?.model
      ? new SupabaseModelHandler(options.model, table)
      : this;

    const batches = await Promise.all(
      chunkArray(uniqueValues, SUPABASE_IN_BATCH_SIZE).map(async (batch) => {
        let query = this.getClient()
          .from(table)
          .select(select)
          .in(column, batch);

        if (options?.where) {
          query = relatedHandler.applyWhere(query, options.where);
        }

        query = this.applyOrderBy(query, options?.orderBy);

        const { data, error } = await query;

        if (error) {
          console.error(`[SupabaseModel.fetchRowsByIn] Error on ${table}:`, error);
          return [] as Record<string, any>[];
        }

        return (data || []) as Record<string, any>[];
      }),
    );

    return batches.flat();
  }

  async findUnique(args: { where: Record<string, any>; include?: Record<string, any>; select?: Record<string, any> }): Promise<any> {
    const where = args.where;
    const id = where.id;

    if (!id && !where.username && !where.studentCode && !where.receiptNumber) {
      // For other unique constraints, use findFirst
      return this.findFirst(args);
    }

    // Check query cache
    const cacheKey = getCacheKey(this.table, "findUnique", args);
    const cached = getCached(cacheKey);
    if (cached) return cached.data;

    const baseSelect = args.include ? "*" : this.getBaseSelect(args.select);
    let query = this.getClient().from(this.table).select(baseSelect);

    if (id) {
      query = query.eq("id", id);
    } else if (where.username) {
      query = query.eq("username", where.username);
    } else if (where.studentCode) {
      query = query.eq("studentCode", where.studentCode);
    } else if (where.receiptNumber) {
      query = query.eq("receiptNumber", where.receiptNumber);
    }

    const { data, error } = await query.limit(1).single();

    if (error) {
      if (error.code === "PGRST116") return null; // No rows found
      console.error(`[SupabaseModel.findUnique] Error on ${this.table}:`, error);
      return null;
    }

    const [result] = await this.processResults(data ? [data] : [], args.include);
    const finalResult = result ?? null;

    setCache(cacheKey, finalResult, getCacheTtlForTable(this.table));
    return finalResult;
  }

  async findFirst(args: { where?: Record<string, any>; orderBy?: any; include?: Record<string, any>; select?: Record<string, any> }): Promise<any> {
    // Check query cache
    const cacheKey = getCacheKey(this.table, "findFirst", args);
    const cached = getCached(cacheKey);
    if (cached) return cached.data;

    const baseSelect = args.include ? "*" : this.getBaseSelect(args.select);
    let query = this.getClient().from(this.table).select(baseSelect);

    // Apply where filters
    if (args.where) {
      query = this.applyWhere(query, args.where);
    }

    query = this.applyOrderBy(query, args.orderBy);

    const { data, error } = await query.limit(1);

    if (error) {
      console.error(`[SupabaseModel.findFirst] Error on ${this.table}:`, error);
      return null;
    }

    if (!data || data.length === 0) return null;

    const [result] = await this.processResults(data, args.include);
    const finalResult = result ?? null;

    setCache(cacheKey, finalResult, getCacheTtlForTable(this.table));
    return finalResult;
  }

  async findMany(args: { where?: Record<string, any>; orderBy?: any; include?: Record<string, any>; select?: Record<string, any>; take?: number; skip?: number } = {}): Promise<any[]> {
    // Check query cache
    const cacheKey = getCacheKey(this.table, "findMany", args);
    const cached = getCached(cacheKey);
    if (cached) return cached.data;

    const baseSelect = args.include ? "*" : this.getBaseSelect(args.select);
    let query = this.getClient().from(this.table).select(baseSelect);

    // Apply where filters
    if (args.where) {
      query = this.applyWhere(query, args.where);
    }

    query = this.applyOrderBy(query, args.orderBy);

    // Apply pagination
    if (args.skip) {
      query = query.range(args.skip, args.skip + (args.take || 100) - 1);
    } else if (args.take) {
      query = query.limit(args.take);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`[SupabaseModel.findMany] Error on ${this.table}:`, error);
      return [];
    }

    const result = await this.processResults((data || []) as Record<string, any>[], args.include);

    setCache(cacheKey, result, getCacheTtlForTable(this.table));
    return result;
  }

  private toPrismaLikeError(error: any): Error & { code?: string; meta?: Record<string, any> } {
    const prismaError: Error & { code?: string; meta?: Record<string, any> } = new Error(
      error?.message || "Database operation failed"
    );

    if (error?.code === "23505") {
      prismaError.code = "P2002";
      prismaError.meta = { target: [] };
    }

    return prismaError;
  }

  private isMissingAutoColumnError(error: any): boolean {
    const message = String(error?.message || error?.details || "");
    return (
      error?.code === "PGRST204" ||
      error?.code === "42703" ||
      /Could not find the '(id|createdAt)' column/.test(message) ||
      /column "(id|createdAt)" .* does not exist/.test(message)
    );
  }

  private async rollbackNestedCreate(
    parent: Record<string, any>,
    nestedCreates: Array<{
      relationName: string;
      relation: RelationInfo;
      rows: Record<string, any>[];
    }>
  ) {
    const parentKeyValue = parent.id;

    if (!parentKeyValue) return;

    for (const nested of nestedCreates) {
      if (!nested.relation.isMany) continue;

      const { error } = await this.getClient()
        .from(nested.relation.table)
        .delete()
        .eq(nested.relation.foreignKey, parentKeyValue);

      if (error) {
        console.error(`[SupabaseModel.rollbackNestedCreate] Error on ${nested.relation.table}:`, error);
      }
    }

    const { error } = await this.getClient()
      .from(this.table)
      .delete()
      .eq("id", parentKeyValue);

    if (error) {
      console.error(`[SupabaseModel.rollbackNestedCreate] Error on ${this.table}:`, error);
    }
  }

  async create(args: { data: Record<string, any>; include?: Record<string, any> }): Promise<any> {
    const { scalarData, nestedCreates } = this.splitNestedWrites({ ...args.data });
    const data = this.prepareWriteData(scalarData);

    // Auto-generate ID if not provided
    if (!data.id) {
      data.id = generateId();
    }

    // Auto-set timestamps (mimics Prisma @default(now()) and @updatedAt)
    const now = new Date().toISOString();
    if (!data.createdAt) {
      data.createdAt = now;
    }
    if (!data.updatedAt) {
      data.updatedAt = now;
    }

    // Invalidate cache before write
    invalidateTableCache(this.table);

    const { data: result, error } = await this.getClient()
      .from(this.table)
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error(`[SupabaseModel.create] Error on ${this.table}:`, error);
      throw this.toPrismaLikeError(error);
    }

    const transformed = transformRow(result);

    try {
      await this.createNestedRows(transformed, nestedCreates);
    } catch (error) {
      await this.rollbackNestedCreate(transformed, nestedCreates);
      throw error;
    }

    return this.processResult(transformed, args.include);
  }

  async createMany(args: { data: Record<string, any>[] }): Promise<{ count: number }> {
    if (args.data.length === 0) {
      return { count: 0 };
    }

    // Invalidate cache before write
    invalidateTableCache(this.table);

    const now = new Date().toISOString();
    const rows = args.data.map((d) =>
      this.prepareWriteData({
        ...d,
        id: d.id || generateId(),
        createdAt: d.createdAt || now,
      })
    );

    const insertRows = async (data: Record<string, any>[]) => {
      return this.getClient()
        .from(this.table)
        .insert(data)
        .select();
    };

    let { data: result, error } = await insertRows(rows);

    if (error && this.isMissingAutoColumnError(error)) {
      const fallbackRows = args.data.map((d) => this.prepareWriteData({ ...d }));
      const retry = await insertRows(fallbackRows);
      result = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error(`[SupabaseModel.createMany] Error on ${this.table}:`, error);
      throw this.toPrismaLikeError(error);
    }

    return { count: result?.length || 0 };
  }

  async update(args: { where: Record<string, any>; data: Record<string, any>; include?: Record<string, any> }): Promise<any> {
    // Invalidate cache before write
    invalidateTableCache(this.table);

    const where = args.where;
    const { scalarData, nestedCreates } = this.splitNestedWrites({ ...args.data });
    // Auto-update the updatedAt timestamp (mimics Prisma @updatedAt)
    const updateData = this.prepareWriteData({
      ...scalarData,
      updatedAt: new Date().toISOString(),
    });
    let query = this.getClient()
      .from(this.table)
      .update(updateData);

    if (where.id) {
      query = query.eq("id", where.id);
    } else if (where.username) {
      query = query.eq("username", where.username);
    } else if (where.studentCode) {
      query = query.eq("studentCode", where.studentCode);
    } else {
      // Apply generic where conditions
      for (const [key, value] of Object.entries(where)) {
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
          query = query.eq(key, value);
        }
      }
    }

    const { data: result, error } = await query.select().single();

    if (error) {
      console.error(`[SupabaseModel.update] Error on ${this.table}:`, error);
      const prismaError: any = new Error(error.message);
      if (error.code === "23505") {
        prismaError.code = "P2002";
        prismaError.meta = { target: [] };
      }
      throw prismaError;
    }

    const transformed = transformRow(result);
    await this.createNestedRows(transformed, nestedCreates);

    return this.processResult(transformed, args.include);
  }

  async delete(args: { where: Record<string, any> }): Promise<any> {
    // Invalidate cache before write
    invalidateTableCache(this.table);

    const where = args.where;
    let query = this.getClient()
      .from(this.table)
      .delete();

    if (where.id) {
      query = query.eq("id", where.id);
    } else {
      for (const [key, value] of Object.entries(where)) {
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
          query = query.eq(key, value);
        }
      }
    }

    const { data: result, error } = await query.select();

    if (error) {
      console.error(`[SupabaseModel.delete] Error on ${this.table}:`, error);
      throw new Error(error.message);
    }

    // If no rows were deleted, the record may not exist
    if (!result || result.length === 0) {
      console.warn(`[SupabaseModel.delete] No rows deleted on ${this.table} for where:`, where);
      return null;
    }

    return transformRow(result[0]);
  }

  async deleteMany(args: { where?: Record<string, any> } = {}): Promise<{ count: number }> {
    // Invalidate cache before write
    invalidateTableCache(this.table);

    let query = this.getClient()
      .from(this.table)
      .delete();

    if (args.where) {
      query = this.applyWhere(query, args.where);
    }

    const { data: result, error } = await query.select();

    if (error) {
      console.error(`[SupabaseModel.deleteMany] Error on ${this.table}:`, error);
      throw new Error(error.message);
    }

    return { count: result?.length || 0 };
  }

  async count(args: { where?: Record<string, any> } = {}): Promise<number> {
    // Check query cache for counts
    const cacheKey = getCacheKey(this.table, "count", args);
    const cached = getCached(cacheKey);
    if (cached) return cached.data as number;

    // Use head: true to get count without fetching data
    let query = this.getClient()
      .from(this.table)
      .select("*", { count: "exact", head: true });

    if (args.where) {
      query = this.applyWhere(query, args.where);
    }

    const { count, error } = await query;

    if (error) {
      console.error(`[SupabaseModel.count] Error on ${this.table}:`, error);
      return 0;
    }

    const result = count || 0;
    setCache(cacheKey, result, getCacheTtlForTable(this.table));
    return result;
  }

  async aggregate(args: { where?: Record<string, any>; _sum?: Record<string, true>; _avg?: Record<string, true>; _count?: boolean | Record<string, true>; _min?: Record<string, true>; _max?: Record<string, true> }): Promise<any> {
    // Supabase REST does not expose Prisma-style aggregate helpers.
    // Fetch only the columns needed for the requested calculations to reduce payload size.
    const aggregateColumns = new Set<string>();
    for (const group of [args._sum, args._avg, args._min, args._max]) {
      if (group) {
        Object.keys(group).forEach((key) => aggregateColumns.add(key));
      }
    }
    if (typeof args._count === "object") {
      Object.keys(args._count).forEach((key) => aggregateColumns.add(key));
    }

    let query = this.getClient()
      .from(this.table)
      .select(aggregateColumns.size > 0 ? Array.from(aggregateColumns).join(",") : "id");

    if (args.where) {
      query = this.applyWhere(query, args.where);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`[SupabaseModel.aggregate] Error on ${this.table}:`, error);
      return { _sum: {}, _avg: {}, _count: 0, _min: {}, _max: {} };
    }

    const rows = data || [];
    const result: any = {};

    if (args._sum) {
      result._sum = {};
      for (const key of Object.keys(args._sum)) {
        result._sum[key] = rows.reduce((sum: number, r: any) => sum + (Number(r[key]) || 0), 0);
      }
    }

    if (args._avg) {
      result._avg = {};
      for (const key of Object.keys(args._avg)) {
        const vals = rows.map((r: any) => Number(r[key])).filter((v: number) => !isNaN(v));
        result._avg[key] = vals.length > 0 ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : null;
      }
    }

    if (args._count) {
      if (typeof args._count === "boolean") {
        result._count = rows.length;
      } else {
        result._count = {};
        for (const key of Object.keys(args._count)) {
          result._count[key] = rows.filter((r: any) => r[key] !== null && r[key] !== undefined).length;
        }
      }
    }

    if (args._min) {
      result._min = {};
      for (const key of Object.keys(args._min)) {
        const vals = rows.map((r: any) => r[key]).filter((v: any) => v !== null && v !== undefined);
        result._min[key] = vals.length > 0 ? Math.min(...vals) : null;
      }
    }

    if (args._max) {
      result._max = {};
      for (const key of Object.keys(args._max)) {
        const vals = rows.map((r: any) => r[key]).filter((v: any) => v !== null && v !== undefined);
        result._max[key] = vals.length > 0 ? Math.max(...vals) : null;
      }
    }

    return result;
  }

  private applyWhere(query: any, where: Record<string, any>): any {
    for (const [key, value] of Object.entries(where)) {
      if (key === "OR") {
        if (Array.isArray(value)) {
          const orParts: string[] = [];
          for (const cond of value) {
            const subParts: string[] = [];
            for (const [k, v] of Object.entries(cond)) {
              const vo = typeof v === "object" && v !== null ? v as Record<string, any> : null;

              // PostgREST OR cannot express our nested Prisma-like relation filters here.
              // They are intentionally skipped instead of generating invalid column names.
              if (vo && RELATION_MAP[this.model]?.[k]) continue;

              if (v === null) {
                subParts.push(`${k}.is.null`);
              } else if (vo && vo.contains !== undefined) {
                subParts.push(`${k}.ilike.*${vo.contains}*`);
              } else if (vo && vo.startsWith !== undefined) {
                subParts.push(`${k}.ilike.${vo.startsWith}*`);
              } else if (vo && vo.not !== undefined) {
                if (vo.not === null) {
                  subParts.push(`${k}.not.is.null`);
                } else {
                  subParts.push(`${k}.neq.${vo.not}`);
                }
              } else if (vo && vo.in !== undefined) {
                const vals = Array.isArray(vo.in) ? vo.in.join(",") : vo.in;
                subParts.push(`${k}.in.(${vals})`);
              } else if (!vo) {
                subParts.push(`${k}.eq.${v}`);
              }
            }
            if (subParts.length > 0) {
              orParts.push(subParts.join(","));
            }
          }
          if (orParts.length > 0) {
            query = query.or(orParts.join(","));
          }
        }
      } else if (key === "AND") {
        if (Array.isArray(value)) {
          for (const cond of value) {
            query = this.applyWhere(query, cond);
          }
        }
      } else if (value === null) {
        query = query.is(key, null);
      } else if (typeof value === "object" && value !== null) {
        // Range operators (gt, gte, lt, lte) can be combined and must all be applied.
        // Other operators (contains, startsWith, eq, etc.) are mutually exclusive.
        const hasRangeOps = value.gt !== undefined || value.gte !== undefined || value.lt !== undefined || value.lte !== undefined;

        if (hasRangeOps) {
          // Apply each range operator independently — they AND together correctly
          if (value.gt !== undefined) {
            query = query.gt(key, value.gt instanceof Date ? value.gt.toISOString() : value.gt);
          }
          if (value.gte !== undefined) {
            query = query.gte(key, value.gte instanceof Date ? value.gte.toISOString() : value.gte);
          }
          if (value.lt !== undefined) {
            query = query.lt(key, value.lt instanceof Date ? value.lt.toISOString() : value.lt);
          }
          if (value.lte !== undefined) {
            query = query.lte(key, value.lte instanceof Date ? value.lte.toISOString() : value.lte);
          }
        } else if (value.contains !== undefined) {
          query = query.ilike(key, `%${value.contains}%`);
        } else if (value.startsWith !== undefined) {
          query = query.ilike(key, `${value.startsWith}%`);
        } else if (value.eq !== undefined) {
          query = query.eq(key, value.eq);
        } else if (value.ne !== undefined) {
          query = query.neq(key, value.ne);
        } else if (value.not !== undefined) {
          if (value.not === null) {
            query = query.not(key, "is", null);
          } else {
            query = query.neq(key, value.not);
          }
        } else if (value.in !== undefined) {
          query = query.in(key, Array.isArray(value.in) ? value.in : [value.in]);
        } else if (RELATION_MAP[this.model]?.[key]) {
          // Relation filters require joins; service-level code handles the most important cases.
          continue;
        }
      } else {
        query = query.eq(key, value);
      }
    }

    return query;
  }

  private async processResult(row: Record<string, any>, include?: Record<string, any>): Promise<any> {
    const [result] = await this.processResults(row ? [row] : [], include);
    return result ?? null;
  }

  private async processResults(rows: Record<string, any>[], include?: Record<string, any>): Promise<any[]> {
    const results = rows.map((row) => transformRow<Record<string, any>>({ ...row }));

    if (!include || results.length === 0) return results;

    const relations = RELATION_MAP[this.model] || {};
    const tasks: Promise<void>[] = [];

    if (include._count) {
      tasks.push(
        (async () => {
          const countSelect = include._count.select || {};
          const countEntries = Object.entries(countSelect) as [string, boolean][];

          const countMaps = await Promise.all(
            countEntries.map(async ([relationName, enabled]) => {
              const countsByParent = new Map<string, number>();
              if (!enabled) return [relationName, countsByParent] as const;

              const relation = relations[relationName];
              if (!relation) return [relationName, countsByParent] as const;

              const parentKeys = uniqueCompactValues(
                results.map((result) => result[relation.thisKey] ?? result.id),
              );

              const relatedRows = await this.fetchRowsByIn(
                relation.table,
                relation.foreignKey,
                relation.foreignKey,
                parentKeys,
                { model: getTableModelName(relation.table) },
              );

              for (const row of relatedRows) {
                const parentKey = row[relation.foreignKey];
                if (parentKey === null || parentKey === undefined) continue;
                const key = String(parentKey);
                countsByParent.set(key, (countsByParent.get(key) || 0) + 1);
              }

              return [relationName, countsByParent] as const;
            }),
          );

          for (const result of results) {
            const countPayload: Record<string, number> = {};
            for (const [relationName, countsByParent] of countMaps) {
              const relation = relations[relationName];
              const parentKey = relation ? result[relation.thisKey] ?? result.id : undefined;
              countPayload[relationName] = parentKey === undefined ? 0 : countsByParent.get(String(parentKey)) || 0;
            }
            result._count = countPayload;
          }
        })(),
      );
    }

    for (const [key, value] of Object.entries(include)) {
      if (key === "_count") continue;

      const relation = relations[key];
      if (!relation) continue;

      tasks.push(
        (async () => {
          const nestedInclude = typeof value === "object" && value !== null ? value.include : undefined;
          const relationWhere = typeof value === "object" && value !== null ? value.where : undefined;
          const relationOrderBy = typeof value === "object" && value !== null ? value.orderBy : undefined;
          const { select, selectedKeys } = this.getRelationSelect(value, relation);
          const nestedModel = getTableModelName(relation.table);
          const nestedHandler = new SupabaseModelHandler(nestedModel, relation.table);

          if (relation.isMany) {
            const parentKeys = uniqueCompactValues(
              results.map((result) => result[relation.thisKey] ?? result.id),
            );

            const relatedRows = await this.fetchRowsByIn(
              relation.table,
              select,
              relation.foreignKey,
              parentKeys,
              { orderBy: relationOrderBy, where: relationWhere, model: nestedModel },
            );

            const processedRows = nestedInclude
              ? await nestedHandler.processResults(relatedRows, nestedInclude)
              : relatedRows.map((row) => transformRow<Record<string, any>>({ ...row }));

            const grouped = groupRowsByKey(processedRows, relation.foreignKey);

            for (const result of results) {
              const parentKey = result[relation.thisKey] ?? result.id;
              const rowsForParent = parentKey === undefined ? [] : grouped.get(String(parentKey)) || [];
              result[key] = rowsForParent.map((row) => pickSelectedColumns(row, selectedKeys));
            }
          } else {
            const foreignKeys = uniqueCompactValues(
              results.map((result) => result[relation.thisKey]),
            );

            const relatedRows = await this.fetchRowsByIn(
              relation.table,
              select,
              relation.foreignKey,
              foreignKeys,
              { orderBy: relationOrderBy, where: relationWhere, model: nestedModel },
            );

            const processedRows = nestedInclude
              ? await nestedHandler.processResults(relatedRows, nestedInclude)
              : relatedRows.map((row) => transformRow<Record<string, any>>({ ...row }));

            const rowsByKey = new Map<string, Record<string, any>>();
            for (const row of processedRows) {
              const rowKey = row[relation.foreignKey];
              if (rowKey !== null && rowKey !== undefined) {
                rowsByKey.set(String(rowKey), row);
              }
            }

            for (const result of results) {
              const fkValue = result[relation.thisKey];
              const relatedRow = fkValue === undefined || fkValue === null ? null : rowsByKey.get(String(fkValue)) || null;
              result[key] = relatedRow ? pickSelectedColumns(relatedRow, selectedKeys) : null;
            }
          }
        })(),
      );
    }

    await Promise.all(tasks);
    return results;
  }

  private getRelatedModel(relationName: string): string {
    const relations = RELATION_MAP[this.model] || {};
    const relation = relations[relationName];
    if (!relation) return "";
    // Convert table name back to model name
    for (const [model, table] of Object.entries(MODEL_TO_TABLE)) {
      if (table === relation.table) return model;
    }
    return "";
  }

  private buildNestedSelect(include: Record<string, any>): string {
    const parts: string[] = ["*"];
    const relations = RELATION_MAP[this.model] || {};
    for (const [key, value] of Object.entries(include)) {
      if (key === "_count") continue;
      const relation = relations[key];
      const tableName = relation?.table || key;
      if (value === true) {
        parts.push(`${tableName}(*)`);
      } else if (typeof value === "object" && value?.include) {
        parts.push(`${tableName}(${this.buildNestedSelect(value.include)})`);
      } else if (typeof value === "object" && value?.select) {
        parts.push(`${tableName}(${Object.keys(value.select).join(",")})`);
      }
    }
    return parts.join(",");
  }
}

/**
 * Type for the model handler that provides Prisma-compatible methods
 */
type ModelHandler = SupabaseModelHandler;

/**
 * Database client interface matching Prisma's API surface
 */
interface SupabaseDB {
  admin: ModelHandler;
  subject: ModelHandler;
  schoolClass: ModelHandler;
  section: ModelHandler;
  teacher: ModelHandler;
  teacherSubject: ModelHandler;
  teacherSection: ModelHandler;
  classSubject: ModelHandler;
  student: ModelHandler;
  schedule: ModelHandler;
  attendanceRecord: ModelHandler;
  exam: ModelHandler;
  grade: ModelHandler;
  classFeeSetting: ModelHandler;
  payment: ModelHandler;
  schoolSetting: ModelHandler;
  $connect: () => Promise<void>;
  $disconnect: () => Promise<void>;
  $queryRaw: (strings: TemplateStringsArray, ...values: any[]) => Promise<any[]>;
  $executeRawUnsafe: (sql: string, ...values: any[]) => Promise<{ count: number }>;
  $transaction: (fn: (tx: SupabaseDB) => Promise<any>) => Promise<any>;
}

/**
 * Create the Supabase-backed database client with Prisma-compatible API
 */
function createSupabaseDB(): SupabaseDB {
  return {
    admin: new SupabaseModelHandler("admin", "admins"),
    subject: new SupabaseModelHandler("subject", "subjects"),
    schoolClass: new SupabaseModelHandler("schoolClass", "school_classes"),
    section: new SupabaseModelHandler("section", "sections"),
    teacher: new SupabaseModelHandler("teacher", "teachers"),
    teacherSubject: new SupabaseModelHandler("teacherSubject", "teacher_subjects"),
    teacherSection: new SupabaseModelHandler("teacherSection", "teacher_sections"),
    classSubject: new SupabaseModelHandler("classSubject", "class_subjects"),
    student: new SupabaseModelHandler("student", "students"),
    schedule: new SupabaseModelHandler("schedule", "schedules"),
    attendanceRecord: new SupabaseModelHandler("attendanceRecord", "attendance_records"),
    exam: new SupabaseModelHandler("exam", "exams"),
    grade: new SupabaseModelHandler("grade", "grades"),
    classFeeSetting: new SupabaseModelHandler("classFeeSetting", "class_fee_settings"),
    payment: new SupabaseModelHandler("payment", "payments"),
    schoolSetting: new SupabaseModelHandler("schoolSetting", "school_settings"),
    $connect: async () => {
      // Test connection by fetching one row from admins
      const { error } = await supabase.from("admins").select("id").limit(1);
      if (error) throw new Error(`Supabase connection failed: ${error.message}`);
    },
    $disconnect: async () => {
      // No-op for Supabase REST client
    },
    $queryRaw: async (strings: TemplateStringsArray, ...values: any[]) => {
      // Not supported in REST API - return empty result
      console.warn("[SupabaseDB] $queryRaw is not supported via REST API");
      return [];
    },
    $executeRawUnsafe: async (sql: string, ...values: any[]) => {
      // Not supported in REST API - return empty result
      console.warn("[SupabaseDB] $executeRawUnsafe is not supported via REST API");
      return { count: 0 };
    },
    $transaction: async (fn: (tx: SupabaseDB) => Promise<any>) => {
      // Supabase REST API doesn't support transactions natively
      // Just execute the function with the same db client
      // Individual operations will still be atomic
      return fn(supabaseDB);
    },
  };
}

export const supabaseDB = createSupabaseDB();
