"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GuardianReportError({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-amber-50 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <div className="app-card w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-100 text-amber-700">
          <AlertTriangle size={30} />
        </div>
        <h1 className="text-2xl font-extrabold text-[var(--app-text)]">تعذر عرض التقرير حاليًا</h1>
        <p className="mt-3 text-sm leading-7 text-[var(--app-text-muted)]">حدث خطأ مؤقت، يرجى المحاولة بعد قليل.</p>
        <button type="button" onClick={reset} className="btn btn-primary mt-6">
          <RefreshCw size={18} />
          إعادة المحاولة
        </button>
      </div>
    </main>
  );
}
