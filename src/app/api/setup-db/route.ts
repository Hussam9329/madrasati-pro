import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await db.$queryRaw`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    ` as { table_name: string }[];
    
    const tables = result.map(r => r.table_name);
    
    if (tables.length >= 14) {
      return NextResponse.json({ 
        status: "ok", 
        message: "All tables exist",
        tables 
      });
    }
    
    return NextResponse.json({ 
      status: "needs_migration", 
      message: "Tables need to be created. Run the migration SQL in Supabase SQL Editor.",
      existing_tables: tables 
    });
  } catch (e: any) {
    return NextResponse.json({ 
      status: "error", 
      message: e.message 
    }, { status: 500 });
  }
}
