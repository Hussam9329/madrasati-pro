import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // Try DATABASE_URL_UNPOOLED first (direct connection, better for DDL),
    // fall back to DATABASE_URL (pooled connection)
    const databaseUrl =
      process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
    if (!databaseUrl) {
      return NextResponse.json(
        { status: "error", message: "DATABASE_URL not configured" },
        { status: 500 },
      );
    }

    // Dynamic import to avoid bundling issues
    const postgres = (await import("postgres")).default;
    const sql = postgres(databaseUrl, {
      ssl: "require",
      connect_timeout: 30,
    });

    try {
      // Run migration statements
      await sql`
        ALTER TABLE IF EXISTS class_fee_settings
          ADD COLUMN IF NOT EXISTS "uniformAmount" numeric NOT NULL DEFAULT 0
      `;
      console.log("[migration] Added uniformAmount to class_fee_settings");

      await sql`
        ALTER TABLE IF EXISTS exams
          ADD COLUMN IF NOT EXISTS "teacherId" text NULL
      `;
      console.log("[migration] Added teacherId to exams");

      await sql`
        ALTER TABLE IF EXISTS grades
          ADD COLUMN IF NOT EXISTS "examId" text NULL
      `;
      console.log("[migration] Added examId to grades");

      // Create indexes (these may fail if they already exist, which is fine)
      try {
        await sql`
          CREATE INDEX IF NOT EXISTS payments_student_year_type_idx
            ON payments ("studentId", "academicYear", "feeType")
        `;
        console.log("[migration] Created payments index");
      } catch (e) {
        console.log("[migration] Payments index skipped:", e);
      }

      try {
        await sql`
          CREATE INDEX IF NOT EXISTS attendance_student_date_idx
            ON attendance_records ("studentId", "date")
        `;
        console.log("[migration] Created attendance index");
      } catch (e) {
        console.log("[migration] Attendance index skipped:", e);
      }

      try {
        await sql`
          CREATE INDEX IF NOT EXISTS attendance_inside_school_idx
            ON attendance_records ("date", "checkInAt", "checkOutAt")
        `;
        console.log("[migration] Created attendance inside school index");
      } catch (e) {
        console.log("[migration] Attendance inside school index skipped:", e);
      }

      try {
        await sql`
          CREATE INDEX IF NOT EXISTS grades_exam_student_idx
            ON grades ("examId", "studentId")
        `;
        console.log("[migration] Created grades exam index");
      } catch (e) {
        console.log("[migration] Grades exam index skipped:", e);
      }

      return NextResponse.json({
        status: "success",
        message:
          "Migration completed successfully. All columns and indexes created.",
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
