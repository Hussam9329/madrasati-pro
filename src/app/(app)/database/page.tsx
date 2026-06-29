"use client";

import { useRef, useState } from "react";
import { Download, Upload, Database, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SmartAlert } from "@/components/shared/smart-alert";

type ImportSummary = {
  imported: Record<string, number>;
  skipped: Record<string, number>;
};

export default function DatabasePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);

  async function handleExport() {
    setError(null);
    setSuccess(null);
    setExporting(true);

    try {
      // Use a direct fetch so the browser treats the response as a download
      // (Content-Disposition: attachment is set by the server).
      const response = await fetch("/api/database/export", {
        method: "GET",
        credentials: "same-origin",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.message ?? "تعذّر تصدير قاعدة البيانات.");
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const filenameMatch = disposition.match(/filename="?([^"]+)"?/i);
      const filename = filenameMatch?.[1] ?? "madrasati-db.json";

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccess("تم تصدير قاعدة البيانات بنجاح. الملف الآن في تنزيلاتك.");
    } catch (e: any) {
      setError(e?.message ?? "تعذّر تصدير قاعدة البيانات.");
    } finally {
      setExporting(false);
    }
  }

  async function handleImport(file: File) {
    setError(null);
    setSuccess(null);
    setImportSummary(null);
    setImporting(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/database/import", {
        method: "POST",
        body: formData,
        credentials: "same-origin",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        throw new Error(data?.message ?? "تعذّر استيراد قاعدة البيانات.");
      }

      setImportSummary({
        imported: data.imported ?? {},
        skipped: data.skipped ?? {},
      });
      setSuccess("تم استيراد البيانات بنجاح. كل الجداول كُتبت بنفس الـ IDs الأصلية.");
    } catch (e: any) {
      setError(e?.message ?? "تعذّر استيراد قاعدة البيانات.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      setError("الملف يجب أن يكون بصيغة .json");
      return;
    }

    handleImport(file);
  }

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-6">
      <PageHeader
        title="النسخ الاحتياطي واستعادة قاعدة البيانات"
        description="صدّر كل بيانات المدرسة في ملف JSON واحد، أو استورد ملفًا سابقًا لاستعادة البيانات أو نقلها إلى قاعدة بيانات أخرى."
        icon="settings"
        badge="أدوات متقدمة"
      />

      {error && (
        <SmartAlert tone="warning" title="لم تكتمل العملية" description={error} />
      )}

      {success && !error && (
        <SmartAlert tone="success" title="تمت العملية بنجاح" description={success} />
      )}

      <SmartAlert
        tone="info"
        title="كيف يعمل النسخ الاحتياطي؟"
        description="التصدير يجمع كل الجداول (طلاب، شُعب، حضور، درجات، أقساط...) في ملف JSON واحد. الاستيراد يكتب البيانات بنفس معرّفاتها الأصلية حتى لا تنكسر العلاقات بين الجداول."
      />

      <section className="app-card overflow-hidden">
        <div className="border-b border-[var(--app-border-soft)] bg-gradient-to-l from-emerald-50/70 to-teal-50/30 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700">
              <Download size={24} />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-[var(--app-text)]">
                تصدير كل البيانات
              </h3>
              <p className="mt-1 text-sm leading-7 text-[var(--app-text-muted)]">
                يُنشئ ملف JSON يحتوي على كل الجداول بكل العلاقات والمعرّفات الأصلية. احتفظ بهذا الملف في مكان آمن — هو نسختك الاحتياطية الكاملة.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting || importing}
            className="btn btn-primary min-w-[180px]"
          >
            {exporting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                جارٍ التصدير...
              </>
            ) : (
              <>
                <Download size={18} />
                تصدير JSON
              </>
            )}
          </button>
        </div>
      </section>

      <section className="app-card overflow-hidden">
        <div className="border-b border-[var(--app-border-soft)] bg-gradient-to-l from-amber-50/70 to-orange-50/30 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700">
              <Upload size={24} />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-[var(--app-text)]">
                استيراد من ملف JSON
              </h3>
              <p className="mt-1 text-sm leading-7 text-[var(--app-text-muted)]">
                يكتب بيانات الملف إلى قاعدة البيانات الحالية بنفس المعرّفات الأصلية. مفيد لنقل البيانات إلى قاعدة جديدة أو استعادة نسخة احتياطية.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <SmartAlert
            tone="warning"
            title="تنبيه قبل الاستيراد"
            description="الاستيراد يكتب فوق أي صف بنفس المعرّف. إذا كانت القاعدة الحالية فيها بيانات مختلفة بنفس المعرّفات، سيتم استبدالها. تأكد من تصدير نسخة احتياطية أولًا."
          />

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleFileChange}
              disabled={importing || exporting}
              className="hidden"
              id="db-import-file"
            />
            <label
              htmlFor="db-import-file"
              className={[
                "btn btn-secondary min-w-[180px] cursor-pointer",
                importing || exporting ? "pointer-events-none opacity-50" : "",
              ].join(" ")}
            >
              {importing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  جارٍ الاستيراد...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  اختر ملف JSON
                </>
              )}
            </label>
            <span className="text-xs leading-6 text-[var(--app-text-muted)]">
              يدعم الملفات الناتجة عن زر التصدير أعلاه فقط.
            </span>
          </div>
        </div>
      </section>

      {importSummary && (
        <section className="app-card overflow-hidden">
          <div className="border-b border-[var(--app-border-soft)] p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700">
                <Database size={24} />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-[var(--app-text)]">
                  ملخص الاستيراد
                </h3>
                <p className="mt-1 text-sm leading-7 text-[var(--app-text-muted)]">
                  عدد الصفوف المكتوبة لكل جدول. الصفر يعني أن الجدول لم يكن موجودًا في الملف أو أن الملف لم يحتوِ على صفوف له.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(importSummary.imported)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([table, count]) => (
                  <div
                    key={table}
                    className="flex items-center justify-between rounded-2xl border border-[var(--app-border-soft)] bg-[var(--app-card-soft)]/60 px-4 py-3"
                  >
                    <span className="font-mono text-xs text-[var(--app-text-muted)]" dir="ltr">
                      {table}
                    </span>
                    <span className="flex items-center gap-2 text-sm font-extrabold text-[var(--app-text)]">
                      {count > 0 ? (
                        <CheckCircle2 size={14} className="text-emerald-600" />
                      ) : (
                        <AlertTriangle size={14} className="text-amber-500" />
                      )}
                      {count}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
