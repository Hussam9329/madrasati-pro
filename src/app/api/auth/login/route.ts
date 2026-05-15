import { db, ensureDatabase } from "@/lib/db";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "madrasati-secret-key-2024-marina-school"
);

const SESSION_COOKIE_NAME = "madrasati_session";
const DEFAULT_SESSION_SECONDS = 8 * 60 * 60;
const REMEMBER_ME_SESSION_SECONDS = 30 * 24 * 60 * 60;

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

    // Ensure database is initialized (especially on Vercel)
    await ensureDatabase();

    const admin = await db.admin.findUnique({ where: { username } });
    if (!admin) {
      return NextResponse.json(
        { error: "اسم المستخدم أو كلمة المرور غير صحيحة." },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "اسم المستخدم أو كلمة المرور غير صحيحة." },
        { status: 401 }
      );
    }

    const sessionSeconds = rememberMe
      ? REMEMBER_ME_SESSION_SECONDS
      : DEFAULT_SESSION_SECONDS;

    // Create JWT token
    const token = await new SignJWT({ adminId: admin.id, isRoot: Boolean(admin.isRoot) })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(`${sessionSeconds}s`)
      .sign(JWT_SECRET);

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: sessionSeconds,
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[login] Error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تسجيل الدخول." },
      { status: 500 }
    );
  }
}
