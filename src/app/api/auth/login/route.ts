import { db, ensureDatabase } from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "يرجى إدخال اسم المستخدم وكلمة المرور." },
        { status: 400 }
      );
    }

    await ensureDatabase();

    let admin;
    try {
      admin = await db.admin.findUnique({ where: { username } });
    } catch (dbError: any) {
      return NextResponse.json(
        { error: `DB error: ${dbError.message}` },
        { status: 500 }
      );
    }

    if (!admin) {
      return NextResponse.json(
        { error: "اسم المستخدم غير موجود." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: false,
      debug: `Found admin: ${admin.username}, hash length: ${admin.passwordHash?.length}`
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: `Outer error: ${error.message}` },
      { status: 500 }
    );
  }
}
