import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getClassFeeSettings, upsertClassFeeSetting } from "@/services/class-fee-service";

export async function GET(request: NextRequest) {
  await ensureDatabase();
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json(
      { ok: false, message: "غير مصرح." },
      { status: 401 },
    );
  }

  try {
    const academicYear =
      request.nextUrl.searchParams.get("academicYear") || undefined;
    const settings = await getClassFeeSettings(academicYear);
    return NextResponse.json({ ok: true, data: settings });
  } catch {
    return NextResponse.json(
      { ok: false, message: "حدث خطأ أثناء جلب إعدادات الأقساط." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  await ensureDatabase();
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json(
      { ok: false, message: "غير مصرح." },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const { classId, amount, tuitionAmount, uniformAmount, academicYear, notes } = body;
    const normalizedTuitionAmount = Number(tuitionAmount ?? amount ?? 0);
    const normalizedUniformAmount = Number(uniformAmount ?? 0);

    if (!classId || normalizedTuitionAmount < 0 || normalizedUniformAmount < 0) {
      return NextResponse.json(
        { ok: false, message: "الصف والمبالغ مطلوبة." },
        { status: 400 },
      );
    }

    const setting = await upsertClassFeeSetting({
      classId,
      tuitionAmount: normalizedTuitionAmount,
      uniformAmount: normalizedUniformAmount,
      academicYear,
      notes,
    });
    return NextResponse.json({
      ok: true,
      data: setting,
      message: "تم حفظ إعدادات الرسوم بنجاح.",
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "حدث خطأ أثناء الحفظ." },
      { status: 500 },
    );
  }
}
