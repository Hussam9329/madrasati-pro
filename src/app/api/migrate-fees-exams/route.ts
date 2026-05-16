import { supabase } from "@/lib/supabase-client";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // Check if class_fee_settings table has uniformAmount column
    const { data: feeTest, error: feeError } = await supabase
      .from("class_fee_settings")
      .select("id, uniformAmount")
      .limit(1);

    const hasUniformAmount = !feeError;

    // Check if exams table has teacherId column
    const { data: examTest, error: examError } = await supabase
      .from("exams")
      .select("id, teacherId")
      .limit(1);

    const hasTeacherId = !examError;

    // Check if grades table has examId column
    const { data: gradeTest, error: gradeError } = await supabase
      .from("grades")
      .select("id, examId")
      .limit(1);

    const hasExamId = !gradeError;

    const missing = [];
    if (!hasUniformAmount) missing.push("class_fee_settings.uniformAmount");
    if (!hasTeacherId) missing.push("exams.teacherId");
    if (!hasExamId) missing.push("grades.examId");

    if (missing.length === 0) {
      return NextResponse.json({
        status: "already_migrated",
        message: "All required columns exist.",
        checks: { hasUniformAmount, hasTeacherId, hasExamId },
      });
    }

    return NextResponse.json({
      status: "needs_migration",
      message: `Missing columns: ${missing.join(", ")}. Please run the SQL migration in Supabase SQL Editor.`,
      missing,
      sql_file: "database/2026-05-16-fees-exams-settings.sql",
      checks: { hasUniformAmount, hasTeacherId, hasExamId },
      errors: {
        feeError: feeError?.message,
        examError: examError?.message,
        gradeError: gradeError?.message,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        status: "error",
        message: e.message,
      },
      { status: 500 },
    );
  }
}
