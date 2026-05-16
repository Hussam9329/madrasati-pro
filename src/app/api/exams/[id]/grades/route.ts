import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { saveExamGrades, getExamById } from "@/services/exam-service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
    const { id } = await params;
    const body = await request.json();
    const { grades } = body;

    if (!grades || !Array.isArray(grades)) {
      return NextResponse.json(
        { ok: false, message: "الدرجات مطلوبة." },
        { status: 400 },
      );
    }

    const result = await saveExamGrades(id, grades);

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json(
      { ok: false, message: "حدث خطأ أثناء حفظ الدرجات." },
      { status: 500 },
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
    const { id } = await params;
    const exam = await getExamById(id);

    if (!exam) {
      return NextResponse.json(
        { ok: false, message: "الامتحان غير موجود." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, data: exam });
  } catch {
    return NextResponse.json(
      { ok: false, message: "حدث خطأ أثناء جلب بيانات الامتحان." },
      { status: 500 },
    );
  }
}
