import { NextRequest, NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api-auth";
import {
  getOrCreateGuardianToken,
  regenerateGuardianToken,
} from "@/services/guardian-link-service";

const STUDENT_NOT_FOUND_MESSAGE = "لم يتم العثور على الطالب.";
const SERVER_ERROR_MESSAGE = "تعذر تجهيز رابط ولي الأمر. حاول مرة أخرى.";

/** Returns the student's guardian-link token, creating it on first request. */
export const GET = withApiAuth(async (
  _request: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => {
  try {
    const { id } = await ctx.params;
    const token = await getOrCreateGuardianToken(id);

    if (!token) {
      return NextResponse.json({ ok: false, message: STUDENT_NOT_FOUND_MESSAGE }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: { token } });
  } catch (error) {
    console.error("[guardian-link] GET failed:", error);
    return NextResponse.json({ ok: false, message: SERVER_ERROR_MESSAGE }, { status: 500 });
  }
});

/** Replaces the token; the previous guardian link stops working. */
export const POST = withApiAuth(async (
  _request: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => {
  try {
    const { id } = await ctx.params;
    const token = await regenerateGuardianToken(id);

    if (!token) {
      return NextResponse.json({ ok: false, message: STUDENT_NOT_FOUND_MESSAGE }, { status: 404 });
    }

    return NextResponse.json({ ok: true, message: "تم إنشاء رابط جديد، والرابط القديم لم يعد يعمل.", data: { token } });
  } catch (error) {
    console.error("[guardian-link] POST failed:", error);
    return NextResponse.json({ ok: false, message: SERVER_ERROR_MESSAGE }, { status: 500 });
  }
});
