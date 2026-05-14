import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase } from "@/lib/db";
import {
  createOrUpdateSchool,
  deleteSchool,
  getSchoolOverview,
} from "@/services/school-service";
import type { SchoolFormInput } from "@/types/school";

export async function GET() {
  await ensureDatabase();
  try {
    const overview = await getSchoolOverview();

    return NextResponse.json({
      ok: true,
      message: "تم جلب بيانات المدرسة بنجاح.",
      data: overview,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "حدث خطأ أثناء جلب بيانات المدرسة.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  await ensureDatabase();
  try {
    const body = (await request.json()) as Partial<SchoolFormInput>;

    const result = await createOrUpdateSchool({
      name: body.name ?? "",
      academicYear: body.academicYear ?? "",
      address: body.address ?? "",
      phone: body.phone ?? "",
      email: body.email ?? "",
      logoUrl: body.logoUrl ?? "",
      notes: body.notes ?? "",
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "حدث خطأ أثناء حفظ بيانات المدرسة.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  return POST(request);
}

export async function DELETE() {
  try {
    const result = await deleteSchool();

    if (!result.ok) {
      return NextResponse.json(result, { status: 404 });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "حدث خطأ أثناء حذف بيانات المدرسة.",
      },
      { status: 500 },
    );
  }
}
