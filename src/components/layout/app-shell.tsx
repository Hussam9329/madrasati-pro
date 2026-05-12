"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  GraduationCap,
  Home,
  Landmark,
  LayoutDashboard,
  Menu,
  Moon,
  Receipt,
  School,
  Search,
  Settings,
  Sparkles,
  Sun,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  navigationGroups,
  orderedNavigationItems,
  type NavigationGroup,
  type NavigationIcon,
} from "@/lib/navigation";

type AppShellProps = {
  children: React.ReactNode;
};

const iconMap: Record<NavigationIcon, React.ElementType> = {
  dashboard: LayoutDashboard,
  school: School,
  book: BookOpen,
  classes: Landmark,
  teachers: GraduationCap,
  students: Users,
  schedule: CalendarDays,
  attendance: CheckSquare,
  grades: ClipboardList,
  fees: Receipt,
  payments: Receipt,
  reports: BarChart3,
  settings: Settings,
};

const groupOrder: NavigationGroup[] = [
  "overview",
  "foundation",
  "people",
  "operations",
  "results",
  "system",
];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const currentPage = useMemo(() => {
    return (
      orderedNavigationItems.find((item) => {
        if (item.href === "/") {
          return pathname === "/";
        }

        return pathname.startsWith(item.href);
      }) ?? orderedNavigationItems[0]
    );
  }, [pathname]);

  function closeMobileSidebar() {
    setIsMobileSidebarOpen(false);
  }

  return (
    <div className="min-h-screen bg-transparent">
      <MobileSidebarBackdrop
        isOpen={isMobileSidebarOpen}
        onClose={closeMobileSidebar}
      />

      <aside
        className={[
          "fixed right-0 top-0 z-50 h-screen w-[292px] border-l border-white/[0.06] text-[var(--color-sidebar-text)] shadow-[var(--shadow-sidebar)] transition-transform duration-300",
          "bg-gradient-to-b from-[#0f1535] via-[#0c1222] to-[#080d1a]",
          isMobileSidebarOpen ? "translate-x-0" : "translate-x-full",
          "lg:translate-x-0",
        ].join(" ")}
      >
        {/* Subtle top glow */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-indigo-600/[0.08] to-transparent" />

        <SidebarContent
          pathname={pathname}
          onNavigate={closeMobileSidebar}
        />
      </aside>

      <div className="min-h-screen lg:pr-[292px]">
        <header className="sticky top-0 z-40 border-b border-indigo-100/60 glass">
          {/* Subtle gradient border at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-l from-transparent via-indigo-200/50 to-transparent" />

          <div className="flex min-h-[74px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="btn btn-secondary h-11 w-11 p-0 lg:hidden"
                aria-label="فتح القائمة"
                onClick={() => setIsMobileSidebarOpen(true)}
              >
                <Menu size={20} />
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20">
                    <Home size={17} />
                  </span>
                  <h1 className="truncate text-lg font-extrabold text-[var(--app-text)] sm:text-xl">
                    {currentPage.title}
                  </h1>
                </div>

                <p className="mt-1 hidden max-w-[720px] truncate text-sm leading-6 text-[var(--app-text-muted)] md:block">
                  {currentPage.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <TopbarSearch />

              <button
                type="button"
                className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-white/80 text-[var(--app-text-muted)] transition hover:border-indigo-200 hover:text-[var(--primary)] hover:shadow-md hover:shadow-indigo-100/50 md:inline-flex"
                aria-label="الإشعارات"
                title="الإشعارات"
              >
                <Bell size={19} />
              </button>

              <button
                type="button"
                className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-white/80 text-[var(--app-text-muted)] transition hover:border-indigo-200 hover:text-[var(--primary)] hover:shadow-md hover:shadow-indigo-100/50 md:inline-flex"
                aria-label="وضع العرض"
                title="وضع العرض"
              >
                <Sun size={18} />
                <Moon className="hidden" size={18} />
              </button>

              <div className="hidden items-center gap-3 rounded-2xl border border-[var(--app-border)] bg-white/80 px-3 py-2 lg:flex">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20">
                  <School size={18} />
                </div>

                <div className="leading-none">
                  <p className="text-sm font-extrabold text-[var(--app-text)]">
                    مدرستي برو
                  </p>
                  <p className="mt-1 text-xs font-medium text-[var(--app-text-muted)]">
                    نظام المدرسة الأساسي
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="animate-soft-in px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

type SidebarContentProps = {
  pathname: string;
  onNavigate: () => void;
};

function SidebarContent({ pathname, onNavigate }: SidebarContentProps) {
  return (
    <div className="relative flex h-full flex-col">
      <div className="relative border-b border-white/[0.06] px-5 py-5">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-2xl outline-none"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-600/30">
            <School size={24} />
          </div>

          <div className="min-w-0">
            <p className="truncate text-lg font-extrabold text-white">
              مدرستي برو
            </p>
            <p className="mt-1 truncate text-xs font-medium text-[var(--color-sidebar-muted)]">
              تجربة مدرسية أسرع وأسهل
            </p>
          </div>
        </Link>
      </div>

      <nav className="no-scrollbar flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-5">
          {groupOrder.map((group) => {
            const items = orderedNavigationItems.filter(
              (item) => item.group === group,
            );

            if (items.length === 0) {
              return null;
            }

            return (
              <div key={group}>
                <div className="mb-2 px-3">
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-[var(--color-sidebar-muted)]">
                    {navigationGroups[group].title}
                  </p>
                </div>

                <div className="space-y-1">
                  {items.map((item) => {
                    const Icon = iconMap[item.icon];
                    const isActive =
                      item.href === "/"
                        ? pathname === "/"
                        : pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onNavigate}
                        className={[
                          "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition-all duration-200",
                          isActive
                            ? "bg-gradient-to-l from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/20"
                            : "text-[var(--color-sidebar-text)] hover:bg-white/[0.06] hover:text-white",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200",
                            isActive
                              ? "bg-white/20 text-white shadow-sm"
                              : "bg-white/[0.06] text-[var(--color-sidebar-muted)] group-hover:bg-white/[0.1] group-hover:text-white",
                          ].join(" ")}
                        >
                          <Icon size={18} />
                        </span>

                        <span className="min-w-0 flex-1 truncate">
                          {item.title}
                        </span>

                        {item.isPrimary ? (
                          <span className="rounded-full bg-white/20 px-2 py-1 text-[10px] font-extrabold text-white">
                            رئيسية
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </nav>

      <div className="relative border-t border-white/[0.06] p-4">
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.04] p-4">
          {/* Shimmer border effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-l from-indigo-500/10 via-transparent to-violet-500/10 opacity-60" />

          <div className="relative">
            <div className="mb-3 flex items-center gap-2 text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/30 to-violet-500/30 text-indigo-200">
                <Sparkles size={16} />
              </span>
              <p className="text-sm font-extrabold">تلميحة ذكية</p>
            </div>

            <p className="relative text-xs leading-6 text-[var(--color-sidebar-muted)]">
              اتبع الترتيب من الأعلى للأسفل: المواد، الصفوف، المدرسون، ثم الطلاب.
              هكذا يبقى النظام مرتبًا من أول يوم.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TopbarSearch() {
  return (
    <div className="hidden min-w-[280px] items-center gap-2 rounded-2xl border border-[var(--app-border)] bg-white/80 px-3 py-2 backdrop-blur-sm xl:flex">
      <Search size={18} className="text-[var(--app-text-soft)]" />

      <input
        type="search"
        placeholder="ابحث عن طالب، صف، مدرس..."
        className="h-8 min-w-0 flex-1 border-0 bg-transparent text-sm font-medium text-[var(--app-text)] outline-none placeholder:text-[var(--app-text-soft)]"
      />

      <span className="rounded-lg border border-[var(--app-border)] bg-[var(--app-card-soft)] px-2 py-1 text-[10px] font-bold text-[var(--app-text-muted)]">
        بحث
      </span>
    </div>
  );
}

type MobileSidebarBackdropProps = {
  isOpen: boolean;
  onClose: () => void;
};

function MobileSidebarBackdrop({
  isOpen,
  onClose,
}: MobileSidebarBackdropProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden">
      <button
        type="button"
        className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-xl"
        aria-label="إغلاق القائمة"
        onClick={onClose}
      >
        <X size={20} />
      </button>
    </div>
  );
}
