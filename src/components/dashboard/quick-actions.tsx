import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  GraduationCap,
  Landmark,
  Receipt,
  Users,
} from "lucide-react";
import {
  primaryQuickActions,
  type NavigationIcon,
} from "@/lib/navigation";

const quickActionIcons: Partial<Record<NavigationIcon, React.ElementType>> = {
  book: BookOpen,
  classes: Landmark,
  teachers: GraduationCap,
  students: Users,
  attendance: CalendarCheck,
  grades: ClipboardList,
  fees: Receipt,
  reports: BarChart3,
};

export function QuickActions() {
  return (
    <div className="app-card p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-extrabold text-[var(--app-text)]">
            الانتقال السريع
          </h3>

          <p className="mt-1 text-sm leading-6 text-[var(--app-text-muted)]">
            أهم الأعمال اليومية في مكان واحد حتى لا يضيع المستخدم بين الصفحات.
          </p>
        </div>

        <span className="badge badge-success w-fit">اختصارات</span>
      </div>

      <div className="quick-grid">
        {primaryQuickActions.map((action) => {
          const Icon = quickActionIcons[action.icon] ?? BookOpen;

          return (
            <Link
              key={action.title}
              href={action.href}
              className="group rounded-3xl border border-[var(--app-border-soft)] bg-white p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-[var(--shadow-soft)]"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)] transition group-hover:bg-[var(--primary)] group-hover:text-white">
                  <Icon size={22} />
                </div>

                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-extrabold text-slate-500 transition group-hover:bg-white group-hover:text-blue-600">
                  فتح
                </span>
              </div>

              <h4 className="font-extrabold text-[var(--app-text)]">
                {action.title}
              </h4>

              <p className="mt-2 text-sm leading-7 text-[var(--app-text-muted)]">
                {action.hint}
              </p>
            </Link>
          );
        })}
      </div>

      <div className="mt-5 rounded-3xl border border-blue-100 bg-blue-50/70 p-4">
        <p className="text-sm font-extrabold text-blue-800">
          نصيحة لتجربة أفضل
        </p>

        <p className="mt-2 text-sm leading-7 text-blue-700">
          استخدم الاختصارات حسب الترتيب: مادة، صف، مدرس، طالب. بعدها يصبح
          تسجيل الحضور والدرجات أسهل بكثير.
        </p>
      </div>
    </div>
  );
}
