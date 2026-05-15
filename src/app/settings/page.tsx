import { Settings, Database, Globe, ShieldCheck, DollarSign } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";

export default async function SettingsPage() {
  await requireAdmin();

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-[1350px] flex-col gap-6">
        <PageHeader
          title="الإعدادات"
          description="خيارات النظام العامة والتخصيص."
          icon="settings"
        />

        <a
          href="/settings/fees"
          className="app-card app-card-hover flex items-center gap-4 p-6 transition hover:border-emerald-200"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700">
            <DollarSign size={26} />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-[var(--app-text)]">
              إعدادات الأقساط
            </h3>
            <p className="mt-1 text-sm leading-6 text-[var(--app-text-muted)]">
              حدد مبلغ القسط لكل صف دراسي حسب السنة الأكاديمية.
            </p>
          </div>
        </a>

        <section className="app-card overflow-hidden">
          <div className="border-b border-[var(--app-border-soft)] bg-gradient-to-l to-indigo-50/40 to-amber-50/20 p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700">
                <Settings size={24} />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-[var(--app-text)]">
                  معلومات النظام
                </h3>
                <p className="mt-1 text-sm leading-7 text-[var(--app-text-muted)]">
                  معلومات أساسية عن النظام وإعداداته الحالية.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-6 md:grid-cols-2">
            <div className="flex items-start gap-4 rounded-2xl border border-[var(--app-border-soft)] p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700">
                <Database size={20} />
              </div>
              <div>
                <h4 className="font-extrabold text-[var(--app-text)]">قاعدة البيانات</h4>
                <p className="mt-1 text-sm leading-6 text-[var(--app-text-muted)]">
                  PostgreSQL (Supabase) — قاعدة بيانات سحابية سريعة وموثوقة مع نسخ احتياطي تلقائي.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-[var(--app-border-soft)] p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700">
                <Globe size={20} />
              </div>
              <div>
                <h4 className="font-extrabold text-[var(--app-text)]">الواجهة</h4>
                <p className="mt-1 text-sm leading-6 text-[var(--app-text-muted)]">
                  عربية — واجهة كاملة باللغة العربية مع دعم الاتجاه من اليمين لليسار.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-[var(--app-border-soft)] p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 className="font-extrabold text-[var(--app-text)]">الصلاحيات</h4>
                <p className="mt-1 text-sm leading-6 text-[var(--app-text-muted)]">
                  محمي — تسجيل دخول المدير مطلوب للوصول إلى النظام.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-[var(--app-border-soft)] p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-amber-100 text-purple-700">
                <Settings size={20} />
              </div>
              <div>
                <h4 className="font-extrabold text-[var(--app-text)]">الإصدار</h4>
                <p className="mt-1 text-sm leading-6 text-[var(--app-text-muted)]">
                  مدرستي 2.0 — نظام إدارة ثانوية مارينا.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
