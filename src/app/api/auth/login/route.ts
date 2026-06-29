import { db, ensureDatabase } from "@/lib/db";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, rememberMe } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "يرجى إدخال اسم المستخدم وكلمة المرور." },
        { status: 400 }
      );
    }

    await ensureDatabase();

    const admin = await db.admin.findUnique({ where: { username } });
    if (!admin) {
      return NextResponse.json(
        { error: "اسم المستخدم أو كلمة المرور غير صحيحة." },
        { status: 401 }
      );
    }

    let isValid = false;
    try {
      isValid = await bcrypt.compare(password, admin.passwordHash);
    } catch (bcryptError: any) {
      return NextResponse.json(
        { error: `bcrypt error: ${bcryptError.message}` },
        { status: 500 }
      );
    }

    if (!isValid) {
      return NextResponse.json(
        { error: "اسم المستخدم أو كلمة المرور غير صحيحة." },
        { status: 401 }
      );
    }

    try {
      await createSession(admin.id, Boolean(rememberMe));
    } catch (sessionError: any) {
      return NextResponse.json(
        { error: `session error: ${sessionError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: `outer error: ${error.message}` },
      { status: 500 }
    );
  }
}
