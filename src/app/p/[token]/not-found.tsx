import { LinkIcon } from "lucide-react";

// noindex / no-referrer for this segment come from the page metadata and the
// /p/ headers set in middleware.

export default function GuardianLinkNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-amber-50 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <div className="app-card w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-100 text-indigo-700">
          <LinkIcon size={30} />
        </div>
        <h1 className="text-2xl font-extrabold text-[var(--app-text)]">الرابط غير صالح</h1>
        <p className="mt-3 text-sm leading-7 text-[var(--app-text-muted)]">
          قد يكون الرابط ناقصًا أو تم استبداله برابط جديد. يرجى التواصل مع إدارة المدرسة للحصول على الرابط الصحيح.
        </p>
      </div>
    </main>
  );
}
