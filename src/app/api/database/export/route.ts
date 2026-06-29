import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api-auth";
import { exportDatabase, type ExportResult } from "@/services/database-service";

export const dynamic = "force-dynamic";

/**
 * GET /api/database/export
 *
 * Returns a single JSON snapshot of every application table. The response
 * is meant to be saved to a file (database-snapshot-<timestamp>.json) and
 * later fed to /api/database/import to migrate data into another Supabase
 * project.
 *
 * Requires admin session.
 */
export const GET = withApiAuth(async () => {
  const result = await exportDatabase();

  if (!result.ok) {
    const failure = result as Extract<ExportResult, { ok: false }>;
    return NextResponse.json(
      { ok: false, message: failure.message },
      { status: 500 },
    );
  }

  const success = result as Extract<ExportResult, { ok: true }>;

  // Suggest a filename to browsers via Content-Disposition so clicking the
  // download button saves the file with a meaningful name.
  const stamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .slice(0, 19);
  const filename = `madrasati-db-${stamp}.json`;

  return new NextResponse(JSON.stringify(success.snapshot, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
});
