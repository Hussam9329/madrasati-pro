import { NextRequest, NextResponse } from "next/server";
import {
  createSubject,
  deleteSubject,
  getSubjects,
  searchSubjects,
  toggleSubjectStatus,
  updateSubject,
} from "@/services/subject-service";
import type { SubjectFormInput } from "@/types/subject";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") ?? "";

    const subjects = query.trim()
      ? await searchSubjects(query)
      : await getSubjects();

    return NextResponse.json({
      ok: true,
      message: "تم جلب المواد الدراسية بنجاح.",
      data: subjects,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "حدث خطأ أثناء جلب المواد الدراسية.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<SubjectFormInput>;

    const result = await createSubject({
      name: body.name ?? "",
      code: body.code ?? "",
      description: body.description ?? "",
      isActive: body.isActive ?? true,
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "حدث خطأ أثناء إضافة المادة الدراسية.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          ok: false,
          message: "معرّف المادة الدراسية مطلوب.",
        },
        { status: 400 },
      );
    }

    const body = (await request.json()) as Partial<SubjectFormInput>;

    const result = await updateSubject(id, {
      name: body.name ?? "",
      code: body.code ?? "",
      description: body.description ?? "",
      isActive: body.isActive ?? true,
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "حدث خطأ أثناء تحديث المادة الدراسية.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const action = searchParams.get("action");

    if (!id) {
      return NextResponse.json(
        {
          ok: false,
          message: "معرّف المادة الدراسية مطلوب.",
        },
        { status: 400 },
      );
    }

    if (action !== "toggle-status") {
      return NextResponse.json(
        {
          ok: false,
          message: "نوع العملية غير معروف.",
        },
        { status: 400 },
      );
    }

    const result = await toggleSubjectStatus(id);

    if (!result.ok) {
      return NextResponse.json(result, { status: 404 });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "حدث خطأ أثناء تغيير حالة المادة الدراسية.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          ok: false,
          message: "معرّف المادة الدراسية مطلوب.",
        },
        { status: 400 },
      );
    }

    const result = await deleteSubject(id);

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "حدث خطأ أثناء حذف المادة الدراسية.",
      },
      { status: 500 },
    );
  }
}
