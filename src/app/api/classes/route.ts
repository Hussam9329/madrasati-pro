import { NextRequest, NextResponse } from "next/server";
import {
  createClass,
  deleteClass,
  getClasses,
  searchClasses,
  toggleClassStatus,
  updateClass,
} from "@/services/class-service";
import type { ClassFormInput } from "@/types/class";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") ?? "";

    const classes = query.trim()
      ? await searchClasses(query)
      : await getClasses();

    return NextResponse.json({
      ok: true,
      message: "تم جلب الصفوف بنجاح.",
      data: classes,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "حدث خطأ أثناء جلب الصفوف.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<ClassFormInput>;

    const result = await createClass({
      name: body.name ?? "",
      level: body.level ?? "",
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
        message: "حدث خطأ أثناء إضافة الصف.",
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
          message: "معرّف الصف مطلوب.",
        },
        { status: 400 },
      );
    }

    const body = (await request.json()) as Partial<ClassFormInput>;

    const result = await updateClass(id, {
      name: body.name ?? "",
      level: body.level ?? "",
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
        message: "حدث خطأ أثناء تحديث الصف.",
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
          message: "معرّف الصف مطلوب.",
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

    const result = await toggleClassStatus(id);

    if (!result.ok) {
      return NextResponse.json(result, { status: 404 });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "حدث خطأ أثناء تغيير حالة الصف.",
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
          message: "معرّف الصف مطلوب.",
        },
        { status: 400 },
      );
    }

    const result = await deleteClass(id);

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "حدث خطأ أثناء حذف الصف.",
      },
      { status: 500 },
    );
  }
}
