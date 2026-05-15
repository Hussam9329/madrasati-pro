import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db, ensureDatabase } from "@/lib/db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "madrasati-secret-key-2024-marina-school"
);

const SESSION_COOKIE_NAME = "madrasati_session";
const DEFAULT_SESSION_SECONDS = 8 * 60 * 60;
const REMEMBER_ME_SESSION_SECONDS = 30 * 24 * 60 * 60;

export async function verifyAdmin(username: string, password: string) {
  try {
    // Ensure database is initialized (especially on Vercel)
    await ensureDatabase();

    const admin = await db.admin.findUnique({ where: { username } });
    if (!admin) return null;
    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) return null;
    return admin;
  } catch (error) {
    console.error("[verifyAdmin] Error:", error);
    return null;
  }
}

export async function createSession(adminId: string, rememberMe = false) {
  const sessionSeconds = rememberMe ? REMEMBER_ME_SESSION_SECONDS : DEFAULT_SESSION_SECONDS;
  const token = await new SignJWT({ adminId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${sessionSeconds}s`)
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: sessionSeconds,
    path: "/",
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { adminId: string };
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  // Ensure database is initialized (especially on Vercel)
  await ensureDatabase();

  const session = await getSession();
  if (!session?.adminId) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
  }
  return session;
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
