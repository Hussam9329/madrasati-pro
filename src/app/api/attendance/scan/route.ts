import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { scanAttendanceByStudentCode, scanAttendanceByStudentId } from "@/services/attendance-service";
import type { AttendanceScanInput } from "@/types/attendance";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ ok: false, message: "غير مصرح." }, { status: 401 });
  }

  const body = await request.json();
  const { studentCode, studentId, mode, source } = body;

  // Support both studentCode (from QR/manual code) and studentId (from name search)
  if (studentId) {
    if (!mode) {
      return NextResponse.json(
        { ok: false, message: "نوع العملية مطلوب." },
        { status: 400 },
      );
    }

    const result = await scanAttendanceByStudentId({
      studentId,
      mode,
      source: source || "manual-name",
    });

    return NextResponse.json(result);
  }

  if (!studentCode || !mode) {
    return NextResponse.json(
      { ok: false, message: "الرمز أو معرّف الطالب ونوع العملية مطلوبان." },
      { status: 400 },
    );
  }

  const input: AttendanceScanInput = { studentCode, mode, source: source || "qr" };
  const result = await scanAttendanceByStudentCode(input);

  return NextResponse.json(result);
}
