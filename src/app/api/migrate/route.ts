import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  // Disable in production — migration endpoints should not be exposed
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { ok: false, message: "هذا المسار غير متاح في بيئة الإنتاج." },
      { status: 404 },
    );
  }

  // Development-only: verify tables exist
  try {
    const { supabase } = await import("@/lib/supabase-client");
    const { error: adminError } = await supabase
      .from("admins")
      .select("id")
      .limit(1);

    if (adminError) {
      return NextResponse.json({
        status: "error",
        message: `Tables not found. Please run the migration SQL in Supabase SQL Editor first. Error: ${adminError.message}`,
      }, { status: 500 });
    }

    return NextResponse.json({
      status: "already_migrated",
      message: "Database tables exist. Run the SQL migration in Supabase SQL Editor if needed.",
    });
  } catch (e: any) {
    return NextResponse.json({
      status: "error",
      message: e.message,
    }, { status: 500 });
  }
}
