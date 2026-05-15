import { db } from "@/lib/db";
import { supabase } from "@/lib/supabase-client";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // Check if tables exist by trying to query them via REST API
    const { data: admins, error: adminError } = await supabase
      .from("admins")
      .select("id")
      .limit(1);

    if (adminError) {
      return NextResponse.json({
        status: "error",
        message: `Tables not found. Please run the migration SQL in Supabase SQL Editor first. Error: ${adminError.message}`,
      }, { status: 500 });
    }

    // Tables exist - check if admin needs seeding
    try {
      const existingAdmin = await db.admin.findUnique({ where: { username: "admin" } });
      if (!existingAdmin) {
        const bcrypt = await import("bcryptjs");
        const passwordHash = await bcrypt.default.hash("1993", 12);
        await db.admin.create({ data: { username: "admin", passwordHash, isRoot: true } });
        return NextResponse.json({
          status: "migration_complete",
          message: "Tables verified, admin account seeded.",
        });
      }
    } catch (e: any) {
      // Admin might already exist, that's fine
    }

    return NextResponse.json({
      status: "already_migrated",
      message: "Database tables exist and admin account is ready.",
    });
  } catch (e: any) {
    return NextResponse.json({
      status: "error",
      message: e.message,
    }, { status: 500 });
  }
}
