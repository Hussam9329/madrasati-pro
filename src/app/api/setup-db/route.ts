import { supabase } from "@/lib/supabase-client";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Check if tables exist by querying the OpenAPI spec
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    const data = await response.json();
    const paths = data?.paths || {};
    const tables = Object.keys(paths)
      .filter((p) => p !== "/" && !p.startsWith("/rpc"))
      .map((p) => p.replace("/", ""));

    if (tables.length >= 14) {
      return NextResponse.json({
        status: "ok",
        message: "All tables exist",
        tables,
      });
    }

    return NextResponse.json({
      status: "needs_migration",
      message: "Tables need to be created. Run the migration SQL in Supabase SQL Editor.",
      existing_tables: tables,
    });
  } catch (e: any) {
    return NextResponse.json({
      status: "error",
      message: e.message,
    }, { status: 500 });
  }
}
