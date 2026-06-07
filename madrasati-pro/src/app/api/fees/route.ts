import { NextResponse } from "next/server";
import { ensureDatabase } from "@/lib/db";

export async function GET() {
  await ensureDatabase();
  return NextResponse.json({ message: "Use /api/payments instead" });
}
