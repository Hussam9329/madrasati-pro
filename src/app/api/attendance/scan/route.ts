import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { scanAttendanceByStudentCode } from "@/services/attendance-service";
import type { AttendanceScanInput } from "@/types/attendance";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ ok: false, message: "غير مصرح." }, { status: 401 });
  }

  const body = await request.json();
  const { studentCode, mode } = body;

  if (!studentCode || !mode) {
    return NextResponse.json(
      { ok: false, message: "الرمز ونوع العملية مطلوبان." },
      { status: 400 },
    );
  }

  const input: AttendanceScanInput = { studentCode, mode };
  const result = await scanAttendanceByStudentCode(input);

  return NextResponse.json(result);
}
