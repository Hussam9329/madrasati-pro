import { NextRequest, NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api-auth";
import { importDatabase, type DatabaseSnapshot, type ImportResult } from "@/services/database-service";

export const dynamic = "force-dynamic";

/**
 * POST /api/database/import
 *
 * Accepts a JSON snapshot (the same shape produced by /api/database/export)
 * and writes every table into the currently-configured Supabase project.
 * Writes use `upsert` on `id`, so the operation is idempotent — re-running
 * it on an already-imported DB produces no extra rows.
 *
 * The body can be either:
 *   - the snapshot object itself, OR
 *   - a multipart/form-data upload with a `file` field containing the .json
 *
 * Requires admin session.
 */
export const POST = withApiAuth(async (request: NextRequest) => {
  let snapshot: DatabaseSnapshot;

  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");

      if (!file || !(file instanceof File)) {
        return NextResponse.json(
          { ok: false, message: "لم يتم إيجاد ملف JSON ضمن الطلب." },
          { status: 400 },
        );
      }

      const text = await file.text();
      snapshot = JSON.parse(text) as DatabaseSnapshot;
    } else {
      const body = await request.json();
      snapshot = body as DatabaseSnapshot;
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        message: `تعذّر قراءة ملف JSON: ${error?.message ?? "ملف غير صالح"}`,
      },
      { status: 400 },
    );
  }

  const result = await importDatabase(snapshot);

  if (!result.ok) {
    const failure = result as Extract<ImportResult, { ok: false }>;
    return NextResponse.json(
      {
        ok: false,
        message: failure.message,
        partialTables: failure.partialTables,
      },
      { status: 500 },
    );
  }

  const success = result as Extract<ImportResult, { ok: true }>;

  return NextResponse.json({
    ok: true,
    imported: success.imported,
    skipped: success.skipped,
    message: "تم استيراد البيانات بنجاح.",
  });
});
