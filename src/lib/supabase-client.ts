/**
 * Supabase REST API client for database operations.
 * Used as a fallback when Prisma can't connect via PostgreSQL (e.g., IPv4/IPv6 issues on Vercel).
 * Provides a Prisma-compatible API surface so existing service code doesn't need changes.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const globalForSupabase = globalThis as unknown as {
  supabase?: SupabaseClient;
};

/**
 * Get or create the Supabase client lazily.
 * This avoids "supabaseUrl is required" errors during build time
 * when env vars are not available.
 */
function getSupabaseClient(): SupabaseClient {
  if (!globalForSupabase.supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    if (!supabaseUrl || !supabaseKey) {
      console.warn("[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
    }

    globalForSupabase.supabase = createClient(
      supabaseUrl || "https://placeholder.supabase.co",
      supabaseKey || "placeholder-key",
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
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
const RELATION_MAP: Record<string, Record<string, {
  table: string;
  foreignKey: string;
  thisKey: string;
  isMany: boolean;
}>> = {
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

/**
 * Supabase-backed model handler that mimics Prisma's model API
 */
class SupabaseModelHandler {
  constructor(private model: string, private table: string) {}

  private getClient() {
    return supabase;
  }

  async findUnique(args: { where: Record<string, any>; include?: Record<string, any>; select?: Record<string, any> }): Promise<any> {
    const where = args.where;
    const id = where.id;

    if (!id && !where.username && !where.studentCode && !where.receiptNumber) {
      // For other unique constraints, use findFirst
      return this.findFirst(args);
    }

    let query = this.getClient().from(this.table).select("*");

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

    return this.processResult(data, args.include);
  }

  async findFirst(args: { where?: Record<string, any>; orderBy?: any; include?: Record<string, any>; select?: Record<string, any> }): Promise<any> {
    let query = this.getClient().from(this.table).select("*");

    // Apply where filters
    if (args.where) {
      this.applyWhere(query, args.where);
    }

    // Apply orderBy
    if (args.orderBy) {
      const orderByArr = Array.isArray(args.orderBy) ? args.orderBy : [args.orderBy];
      for (const ob of orderByArr) {
        const [key, dir] = Object.entries(ob)[0] as [string, string];
        query = query.order(key, { ascending: dir === "asc", nullsFirst: false });
      }
    }

    const { data, error } = await query.limit(1);

    if (error) {
      console.error(`[SupabaseModel.findFirst] Error on ${this.table}:`, error);
      return null;
    }

    if (!data || data.length === 0) return null;

    return this.processResult(data[0], args.include);
  }

  async findMany(args: { where?: Record<string, any>; orderBy?: any; include?: Record<string, any>; select?: Record<string, any>; take?: number; skip?: number } = {}): Promise<any[]> {
    let query = this.getClient().from(this.table).select("*");

    // Apply where filters
    if (args.where) {
      this.applyWhere(query, args.where);
    }

    // Apply orderBy
    if (args.orderBy) {
      const orderByArr = Array.isArray(args.orderBy) ? args.orderBy : [args.orderBy];
      for (const ob of orderByArr) {
        const [key, dir] = Object.entries(ob)[0] as [string, string];
        query = query.order(key, { ascending: dir === "asc", nullsFirst: false });
      }
    }

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

    return Promise.all((data || []).map((row: any) => this.processResult(row, args.include)));
  }

  async create(args: { data: Record<string, any>; include?: Record<string, any> }): Promise<any> {
    const data = { ...args.data };

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

    const { data: result, error } = await this.getClient()
      .from(this.table)
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error(`[SupabaseModel.create] Error on ${this.table}:`, error);
      // Convert to Prisma-like error for unique constraint violations
      const prismaError: any = new Error(error.message);
      if (error.code === "23505") {
        prismaError.code = "P2002";
        prismaError.meta = { target: [] };
      }
      throw prismaError;
    }

    return transformRow(result);
  }

  async createMany(args: { data: Record<string, any>[] }): Promise<{ count: number }> {
    const now = new Date().toISOString();
    const rows = args.data.map((d) => ({
      ...d,
      id: d.id || generateId(),
      createdAt: d.createdAt || now,
      updatedAt: d.updatedAt || now,
    }));

    const { data: result, error } = await this.getClient()
      .from(this.table)
      .insert(rows)
      .select();

    if (error) {
      console.error(`[SupabaseModel.createMany] Error on ${this.table}:`, error);
      const prismaError: any = new Error(error.message);
      if (error.code === "23505") {
        prismaError.code = "P2002";
        prismaError.meta = { target: [] };
      }
      throw prismaError;
    }

    return { count: result?.length || 0 };
  }

  async update(args: { where: Record<string, any>; data: Record<string, any> }): Promise<any> {
    const where = args.where;
    // Auto-update the updatedAt timestamp (mimics Prisma @updatedAt)
    const updateData = {
      ...args.data,
      updatedAt: new Date().toISOString(),
    };
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

    return transformRow(result);
  }

  async delete(args: { where: Record<string, any> }): Promise<any> {
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
    let query = this.getClient()
      .from(this.table)
      .delete();

    if (args.where) {
      this.applyWhere(query, args.where);
    }

    const { data: result, error } = await query.select();

    if (error) {
      console.error(`[SupabaseModel.deleteMany] Error on ${this.table}:`, error);
      throw new Error(error.message);
    }

    return { count: result?.length || 0 };
  }

  async count(args: { where?: Record<string, any> } = {}): Promise<number> {
    // Use head: true to get count without fetching data
    let query = this.getClient()
      .from(this.table)
      .select("*", { count: "exact", head: true });

    if (args.where) {
      this.applyWhere(query, args.where);
    }

    const { count, error } = await query;

    if (error) {
      console.error(`[SupabaseModel.count] Error on ${this.table}:`, error);
      return 0;
    }

    return count || 0;
  }

  async aggregate(args: { where?: Record<string, any>; _sum?: Record<string, true>; _avg?: Record<string, true>; _count?: boolean | Record<string, true>; _min?: Record<string, true>; _max?: Record<string, true> }): Promise<any> {
    // Supabase doesn't have a direct aggregate API, so we fetch and compute
    let query = this.getClient()
      .from(this.table)
      .select("*");

    if (args.where) {
      this.applyWhere(query, args.where);
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

  private applyWhere(query: any, where: Record<string, any>): void {
    for (const [key, value] of Object.entries(where)) {
      if (key === "OR") {
        if (Array.isArray(value)) {
          const orParts: string[] = [];
          for (const cond of value) {
            const subParts: string[] = [];
            for (const [k, v] of Object.entries(cond)) {
              const vo = typeof v === "object" && v !== null ? v as Record<string, any> : null;
              if (v === null) {
                subParts.push(`${k}.is.null`);
              } else if (vo && vo.contains !== undefined) {
                subParts.push(`${k}.like.*${vo.contains}*`);
              } else if (vo && vo.startsWith !== undefined) {
                subParts.push(`${k}.like.${vo.startsWith}*`);
              } else if (vo && vo.not !== undefined) {
                if (vo.not === null) {
                  subParts.push(`${k}.not.is.null`);
                } else {
                  subParts.push(`${k}.neq.${vo.not}`);
                }
              } else {
                subParts.push(`${k}.eq.${v}`);
              }
            }
            orParts.push(subParts.join(","));
          }
          query = query.or(orParts.join(","));
        }
      } else if (key === "AND") {
        if (Array.isArray(value)) {
          for (const cond of value) {
            this.applyWhere(query, cond);
          }
        }
      } else if (value === null) {
        query = query.is(key, null);
      } else if (typeof value === "object" && value !== null) {
        if (value.contains !== undefined) {
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
        } else if (value.gt !== undefined) {
          query = query.gt(key, value.gt instanceof Date ? value.gt.toISOString() : value.gt);
        } else if (value.gte !== undefined) {
          query = query.gte(key, value.gte instanceof Date ? value.gte.toISOString() : value.gte);
        } else if (value.lt !== undefined) {
          query = query.lt(key, value.lt instanceof Date ? value.lt.toISOString() : value.lt);
        } else if (value.lte !== undefined) {
          query = query.lte(key, value.lte instanceof Date ? value.lte.toISOString() : value.lte);
        } else if (key === "section" || key === "class" || key === "student" || key === "teacher" || key === "subject") {
          // Relation filter - need special handling
          // For now, we'll handle the most common cases
          const relations = RELATION_MAP[this.model] || {};
          const relation = relations[key];
          if (relation) {
            // This is a relation filter - apply to the foreign key
            // e.g., { section: { classId: "xxx" } } -> filter by sectionId where section has classId
            // This needs a join which PostgREST handles differently
            // For simple foreign key filters, we can use the foreign key directly
            for (const [fk, fv] of Object.entries(value)) {
              if (fk === "classId" && key === "section") {
                // Need to find sections with this classId, then filter students by those sectionIds
                // This is complex - handle in post-filtering for now
              }
            }
          }
        }
      } else {
        query = query.eq(key, value);
      }
    }
  }

  private async processResult(row: Record<string, any>, include?: Record<string, any>): Promise<any> {
    const result: Record<string, any> = transformRow(row);

    if (!include) return result;

    const relations = RELATION_MAP[this.model] || {};

    // Process all includes (relations + _count) in parallel
    const tasks: Promise<void>[] = [];

    // Handle _count
    if (include._count) {
      const countSelect = include._count.select || {};
      tasks.push(
        (async () => {
          const countEntries = Object.entries(countSelect) as [string, boolean][];
          const countResults = await Promise.all(
            countEntries.map(async ([relationName, enabled]) => {
              if (!enabled) return [relationName, 0] as const;
              const relation = relations[relationName];
              if (!relation) return [relationName, 0] as const;

              const { count, error } = await this.getClient()
                .from(relation.table)
                .select("*", { count: "exact", head: true })
                .eq(relation.foreignKey, result["id"] as string);

              return [relationName, count || 0] as const;
            })
          );
          result._count = Object.fromEntries(countResults);
        })()
      );
    }

    // Handle relation includes
    for (const [key, value] of Object.entries(include)) {
      if (key === "_count") continue;
      const relation = relations[key];
      if (!relation) continue;

      tasks.push(
        (async () => {
          if (relation.isMany) {
            // Has-many relation: fetch related rows where foreignKey = this.id
            const nestedInclude = typeof value === "object" && value !== null ? value.include : undefined;
            const nestedSelect = typeof value === "object" && value !== null && value.select ? Object.keys(value.select).join(",") : "*";

            const { data, error } = await this.getClient()
              .from(relation.table)
              .select(nestedSelect)
              .eq(relation.foreignKey, result["id"] as string);

            if (error) {
              console.error(`[processResult] Error fetching ${key}:`, error);
              result[key] = [];
              return;
            }

            // Recursively process nested includes
            if (nestedInclude && data) {
              const nestedModel = getTableModelName(relation.table);
              result[key] = await Promise.all(
                data.map(async (item: any) => {
                  const handler = new SupabaseModelHandler(nestedModel, relation.table);
                  return handler.processResult(item, nestedInclude);
                })
              );
            } else {
              result[key] = (data || []).map(transformRow);
            }
          } else {
            // Belongs-to relation: fetch related row where id = this.thisKey
            const fkValue = result[relation.thisKey];
            if (!fkValue) {
              result[key] = null;
              return;
            }

            const nestedInclude = typeof value === "object" && value !== null ? value.include : undefined;
            const nestedSelect = typeof value === "object" && value !== null && value.select ? Object.keys(value.select).join(",") : "*";

            const { data, error } = await this.getClient()
              .from(relation.table)
              .select(nestedSelect)
              .eq("id", fkValue)
              .limit(1);

            if (error || !data || data.length === 0) {
              result[key] = null;
              return;
            }

            // Recursively process nested includes
            if (nestedInclude) {
              const nestedModel = getTableModelName(relation.table);
              const handler = new SupabaseModelHandler(nestedModel, relation.table);
              result[key] = await handler.processResult(data[0], nestedInclude);
            } else {
              result[key] = transformRow(data[0]);
            }
          }
        })()
      );
    }

    await Promise.all(tasks);
    return result;
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
