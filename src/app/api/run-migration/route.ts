import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const databaseUrl =
      process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
    if (!databaseUrl) {
      return NextResponse.json(
        { status: "error", message: "DATABASE_URL not configured" },
        { status: 500 },
      );
    }

    const postgres = (await import("postgres")).default;
    const sql = postgres(databaseUrl, {
      ssl: "require",
      connect_timeout: 30,
    });

    try {
      const results: string[] = [];

      // Run migration statements
      try {
        await sql`
          ALTER TABLE IF EXISTS class_fee_settings
            ADD COLUMN IF NOT EXISTS "uniformAmount" numeric NOT NULL DEFAULT 0
        `;
        results.push("Added uniformAmount to class_fee_settings");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        results.push(`uniformAmount: ${msg}`);
      }

      try {
        await sql`
          ALTER TABLE IF EXISTS exams
            ADD COLUMN IF NOT EXISTS "teacherId" text NULL
        `;
        results.push("Added teacherId to exams");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        results.push(`teacherId: ${msg}`);
      }

      try {
        await sql`
          ALTER TABLE IF EXISTS grades
            ADD COLUMN IF NOT EXISTS "examId" text NULL
        `;
        results.push("Added examId to grades");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        results.push(`examId: ${msg}`);
      }

      // Notify PostgREST to reload schema cache
      try {
        await sql`NOTIFY pgrst, 'reload schema'`;
        results.push("Notified PostgREST to reload schema");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        results.push(`Schema reload notify: ${msg}`);
      }

      // Verify columns exist
      const columns = await sql`
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE (table_name = 'class_fee_settings' AND column_name = 'uniformAmount')
           OR (table_name = 'exams' AND column_name = 'teacherId')
           OR (table_name = 'grades' AND column_name = 'examId')
      `;
      results.push(
        `Verification: found ${columns.length} of 3 expected columns`,
      );

      return NextResponse.json({
        status: columns.length >= 3 ? "success" : "partial",
        message: "Migration executed.",
        details: results,
        columns_found: columns.map(
          (c: { table_name: string; column_name: string }) =>
            `${c.table_name}.${c.column_name}`,
        ),
      });
    } finally {
      await sql.end();
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Migration failed";
    console.error("[migration] Error:", message);
    return NextResponse.json(
      {
        status: "error",
        message,
      },
      { status: 500 },
    );
  }
}
