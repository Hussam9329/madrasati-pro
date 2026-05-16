import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
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
      // Check current database and schema
      const currentDb =
        await sql`SELECT current_database() as db, current_schema() as schema`;

      // Check all columns in class_fee_settings
      const feeColumns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'class_fee_settings'
        ORDER BY ordinal_position
      `;

      // Check all columns in exams
      const examColumns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'exams'
        ORDER BY ordinal_position
      `;

      return NextResponse.json({
        currentDb: currentDb[0],
        class_fee_settings_columns: feeColumns.map(
          (c: { column_name: string; data_type: string }) => c.column_name,
        ),
        exams_columns: examColumns.map(
          (c: { column_name: string; data_type: string }) => c.column_name,
        ),
      });
    } finally {
      await sql.end();
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
