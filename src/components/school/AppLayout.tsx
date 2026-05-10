'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  BookOpen,
  ScanLine,
  FileText,
  BarChart3,
  Shield,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  School,
  Calendar,
  Sun,
  Moon,
  Search,
  Keyboard,
  Layers,
  Lightbulb,
  ClipboardList,
  Wallet,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { PageKey } from '@/types';
import { hasPermission } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';

// Lazy load heavy dialog components - only loaded when user opens them
const CommandPalette = dynamic(() => import('@/components/school/CommandPalette'), {
  ssr: false,
});
const KeyboardShortcutsDialog = dynamic(() => import('@/components/school/KeyboardShortcutsDialog'), {
  ssr: false,
});

interface AppLayoutProps {
  children: React.ReactNode;
}

// Page descriptions for breadcrumb context
const pageDescriptions: Record<PageKey, string> = {
  dashboard: 'نظرة عامة على أداء المدرسة والإحصائيات',
  students: 'إدارة بيانات الطلاب والتسجيل',
  teachers: 'إدارة بيانات الأساتذة والمدرسين',
  subjects: 'إدارة المواد الدراسية والمناهج',
  exams: 'إنشاء وإدارة أنواع الامتحانات',
  classes: 'إدارة الصفوف والشعب الدراسية',
  payments: 'إدارة الأقساط والدفعات المالية',
  attendance: 'تتبع حضور الطلاب بالرمز QR',
  grades: 'إدارة الدرجات والنتائج الدراسية',
  schedule: 'تنظيم جدول الحصص الأسبوعي',
  reports: 'تقارير وإحصائيات شاملة',
  users: 'إدارة المستخدمين والصلاحيات',
  settings: 'إعدادات النظام والتخصيص',
  profile: 'ملف الطالب الشخصي',
};

// Navigation groups - مدرستي School System
const navGroups: { label: string; items: { key: PageKey; label: string; icon: React.ElementType; badge?: string; permission: string }[] }[] = [
  {
    label: 'الرئيسية',
    items: [
      { key: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, permission: 'students' },
      { key: 'students', label: 'الطلاب', icon: GraduationCap, permission: 'students' },
      { key: 'teachers', label: 'الأساتذة', icon: Users, permission: 'teachers' },
      { key: 'subjects', label: 'المواد', icon: BookOpen, permission: 'subjects' },
    ],
  },
  {
    label: 'الأكاديمية',
    items: [
      { key: 'classes', label: 'الصفوف والشعب', icon: Layers, permission: 'subjects' },
      { key: 'exams', label: 'الامتحانات', icon: ClipboardList, permission: 'grades' },
      { key: 'payments', label: 'الأقساط', icon: Wallet, permission: 'payments_view' },
      { key: 'attendance', label: 'الحضور QR', icon: ScanLine, badge: 'مباشر', permission: 'attendance' },
      { key: 'grades', label: 'الدرجات', icon: FileText, permission: 'grades' },
      { key: 'schedule', label: 'جدول الحصص', icon: Calendar, permission: 'schedule' },
    ],
  },
  {
    label: 'التقارير والإعدادات',
    items: [
      { key: 'reports', label: 'التقارير', icon: BarChart3, permission: 'reports' },
      { key: 'users', label: 'المستخدمون', icon: Shield, permission: 'all' },
      { key: 'settings', label: 'الإعدادات', icon: Settings, permission: 'all' },
    ],
  },
];

// Flat nav items for backward compatibility (Ctrl+1-9)
const flatNavItems = navGroups.flatMap((g) => g.items);

export default function AppLayout({ children }: AppLayoutProps) {
  const {
    activePage,
    setActivePage,
    auth,
    logout,
    sidebarOpen,
    setSidebarOpen,
    sidebarCollapsed,
    setSidebarCollapsed,
    addRecentPage,
  } = useAppStore();
  const { theme, setTheme } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hint-banner-dismissed') === 'true';
    }
    return false;
  });

  // Load collapsed state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    if (stored === 'true') {
      setSidebarCollapsed(true);
    }
  }, [setSidebarCollapsed]);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Track page visits for recent pages
  useEffect(() => {
    addRecentPage(activePage);
  }, [activePage, addRecentPage]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.ctrlKey && !event.shiftKey && !event.altKey) {
        const num = parseInt(event.key, 10);
        if (num >= 1 && num <= 9 && num <= flatFilteredNavItems.length) {
          event.preventDefault();
          setActivePage(flatFilteredNavItems[num - 1].key);
          setSidebarOpen(false);
          return;
        }
        if (event.key === 'k' || event.key === 'K') {
          event.preventDefault();
          setCommandOpen(true);
          return;
        }
        if (event.key === '/') {
          event.preventDefault();
          setShortcutsOpen(true);
          return;
        }
        if (event.key === 'd' || event.key === 'D') {
          event.preventDefault();
          setTheme(theme === 'dark' ? 'light' : 'dark');
          return;
        }
      }
      if (event.key === 'Escape') {
        if (commandOpen) {
          setCommandOpen(false);
          return;
        }
        if (shortcutsOpen) {
          setShortcutsOpen(false);
          return;
        }
        if (sidebarOpen) {
          setSidebarOpen(false);
          return;
        }
      }
    },
    [theme, setTheme, setActivePage, setSidebarOpen, commandOpen, shortcutsOpen, sidebarOpen]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const toggleCollapse = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem('sidebar-collapsed', String(next));
  };

  const dismissHint = () => {
    setHintDismissed(true);
    localStorage.setItem('hint-banner-dismissed', 'true');
  };

  const userName = auth.user?.name || 'مستخدم';
  const userRole = auth.user?.role || '';
  const userInitials = userName.charAt(0);

  // Filter navigation by role permissions
  const filteredNavGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasPermission(userRole, item.permission)),
    }))
    .filter((group) => group.items.length > 0);

  // Flat filtered nav items for keyboard shortcuts
  const flatFilteredNavItems = filteredNavGroups.flatMap((g) => g.items);

  const roleBadgeColor: Record<string, string> = {
    'مدير': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'معاون': 'bg-teal-100 text-teal-700 border-teal-200',
    'موظف تسجيل': 'bg-cyan-100 text-cyan-700 border-cyan-200',
    'موظف بوابة': 'bg-amber-100 text-amber-700 border-amber-200',
    'مدرس': 'bg-sky-100 text-sky-700 border-sky-200',
    'مسؤول نظام': 'bg-red-100 text-red-700 border-red-200',
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ar-IQ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Current page info
  const currentPageLabel = flatFilteredNavItems.find((i) => i.key === activePage)?.label || 'لوحة التحكم';
  const currentPageDescription = pageDescriptions[activePage] || '';

  // Sidebar navigation content
  const sidebarNav = (
    <div className="flex flex-col h-full">
      {/* Logo Section */}
      <div className="p-4 pb-3 relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-l from-primary/5 to-transparent dark:from-primary/10 dark:to-transparent" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0 shadow-lg bg-primary">
            <School className="w-6 h-6 text-primary-foreground" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-base leading-tight text-primary">
                ثانوية مارينا
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] text-muted-foreground truncate">نظام إدارة المدرسة</span>
                <Badge className="text-[8px] px-1 py-0 h-3.5 bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary-foreground dark:border-primary/30 font-medium">
                  2026-2027
                </Badge>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="mr-auto md:hidden h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Date/Time display */}
      {mounted && !sidebarCollapsed && (
        <div className="px-4 py-2.5 bg-muted/30 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">{formatDate(currentTime)}</span>
            <span className="text-xs font-semibold text-primary">
              {formatTime(currentTime)}
            </span>
          </div>
        </div>
      )}

      {mounted && sidebarCollapsed && (
        <div className="px-2 py-2 text-center shrink-0">
          <span className="text-[10px] font-semibold block text-primary">
            {formatTime(currentTime)}
          </span>
        </div>
      )}

      <Separator />

      {/* Navigation - scrollable */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <div className="space-y-0.5">
          {filteredNavGroups.map((group, gIdx) => (
            <React.Fragment key={group.label}>
              {gIdx > 0 && (
                <div className="my-2 mx-2">
                  <Separator className="opacity-50" />
                </div>
              )}
              {!sidebarCollapsed && (
                <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider px-3 py-1.5">
                  {group.label}
                </p>
              )}
              {sidebarCollapsed && gIdx > 0 && <div className="h-1" />}
              {group.items.map((item) => {
                const isActive = activePage === item.key;
                const Icon = item.icon;
                return (
                  <TooltipProvider key={item.key} delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.button
                          onClick={() => {
                            setActivePage(item.key);
                            setSidebarOpen(false);
                          }}
                          className={`
                            w-full flex items-center gap-3 rounded-xl text-sm font-medium
                            transition-all duration-200 cursor-pointer relative overflow-hidden group
                            ${sidebarCollapsed ? 'px-2 py-2.5 justify-center' : 'px-3 py-2.5'}
                            ${
                              isActive
                                ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-foreground'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-primary/5 dark:hover:bg-primary/10 hover:text-primary dark:hover:text-primary-foreground'
                            }
                          `}
                          whileHover={{ x: isActive ? 0 : -2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="activeIndicator"
                              className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-l-full bg-primary"
                              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            />
                          )}
                          <div
                            className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-all duration-200 ${
                              isActive
                                ? 'bg-primary/20 dark:bg-primary/30'
                                : 'bg-transparent group-hover:bg-primary/10 dark:group-hover:bg-primary/20'
                            }`}
                          >
                            <motion.div whileHover={{ scale: 1.02 }}>
                              <Icon className="w-[18px] h-[18px]" />
                            </motion.div>
                          </div>
                          {!sidebarCollapsed && (
                            <>
                              <span className="flex-1 text-right">{item.label}</span>
                              {item.badge && (
                                <Badge
                                  className={`text-[9px] px-1.5 py-0 h-4 ${
                                    isActive
                                      ? 'bg-primary/15 text-primary dark:bg-primary/25 dark:text-primary-foreground border-primary/20 dark:border-primary/30'
                                      : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                  }`}
                                >
                                  {item.badge}
                                </Badge>
                              )}
                            </>
                          )}
                          {sidebarCollapsed && item.badge && (
                            <span className="absolute top-1 left-1 w-2 h-2 bg-emerald-500 rounded-full" />
                          )}
                        </motion.button>
                      </TooltipTrigger>
                      <TooltipContent side="left" sideOffset={8}>
                        <p>{item.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 pt-2 shrink-0">
        <Separator className="mb-3" />
        {!sidebarCollapsed ? (
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <p className="text-[10px] text-muted-foreground/70">ثانوية مارينا</p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-emerald-600 font-medium">متصل</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[8px] text-muted-foreground">متصل</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-950 dark:to-gray-900/50 relative">
      {/* Background dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-72 bg-white dark:bg-gray-900 shadow-2xl z-50 md:hidden"
            >
              {sidebarNav}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar with collapse animation */}
      <motion.aside
        className={`hidden md:flex md:flex-col md:fixed md:right-0 md:inset-y-0 bg-gradient-to-b from-white to-gray-50/80 dark:from-gray-900 dark:to-gray-900/95 border-l border-gray-200/80 dark:border-gray-700/50 shadow-sm z-20`}
        animate={{ width: sidebarCollapsed ? 64 : 260 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {sidebarNav}
        {/* Collapse toggle button */}
        <button
          onClick={toggleCollapse}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-l-md flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors z-30 shadow-sm"
          aria-label={sidebarCollapsed ? 'توسيع القائمة' : 'تصغير القائمة'}
        >
          {sidebarCollapsed ? (
            <ChevronLeft className="w-3 h-3 text-muted-foreground" />
          ) : (
            <ChevronLeft className="w-3 h-3 text-muted-foreground rotate-180" />
          )}
        </button>
      </motion.aside>

      {/* Main Content Area */}
      <motion.div
        className={`flex-1 flex flex-col min-h-screen`}
        animate={{ marginRight: sidebarCollapsed ? 64 : 260 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-b border-gray-200/60 dark:border-gray-700/50 shadow-sm">
          <div className="flex items-center justify-between h-14 px-4 md:px-6">
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>

              {/* Page title and description */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <ChevronLeft className="h-4 w-4 text-muted-foreground hidden md:block" />
                  <h1 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                    {currentPageLabel}
                  </h1>
                </div>
                {currentPageDescription && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 hidden sm:block">
                    {currentPageDescription}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Command Palette Button */}
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex items-center gap-2 h-8 px-3 text-muted-foreground hover:text-foreground bg-muted/30 border-muted hover:bg-muted/60 transition-colors"
                onClick={() => setCommandOpen(true)}
              >
                <Search className="w-3.5 h-3.5" />
                <span className="text-xs">بحث</span>
                <kbd className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-1.5 py-0 text-[10px] font-mono">
                  ⌘K
                </kbd>
              </Button>

              {/* Keyboard shortcuts button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                onClick={() => setShortcutsOpen(true)}
                aria-label="اختصارات لوحة المفاتيح"
              >
                <Keyboard className="h-[18px] w-[18px]" />
              </Button>

              {/* Theme Toggle */}
              {mounted && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-300"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  aria-label={theme === 'dark' ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}
                >
                  <motion.div
                    initial={false}
                    animate={{ rotate: theme === 'dark' ? 180 : 0, scale: theme === 'dark' ? 0 : 1 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="absolute"
                  >
                    <Moon className="h-[18px] w-[18px]" />
                  </motion.div>
                  <motion.div
                    initial={false}
                    animate={{ rotate: theme === 'dark' ? 0 : -180, scale: theme === 'dark' ? 1 : 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="absolute"
                  >
                    <Sun className="h-[18px] w-[18px]" />
                  </motion.div>
                </Button>
              )}

              <Separator orientation="vertical" className="h-8 hidden sm:block" />

              {/* User info */}
              <div className="hidden sm:flex items-center gap-2.5">
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-tight">{userName}</p>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 h-4 font-medium ${
                      roleBadgeColor[userRole] ||
                      'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {userRole}
                  </Badge>
                </div>
                <div className="relative">
                  <Avatar className="w-9 h-9 ring-2 ring-white dark:ring-gray-700 shadow-md bg-primary">
                    <AvatarFallback className="text-primary-foreground text-sm font-bold bg-transparent">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -left-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-gray-800 rounded-full" />
                </div>
              </div>

              <Separator orientation="vertical" className="h-8 hidden sm:block" />

              {/* Logout button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 gap-1.5 h-9"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">خروج</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Hint Banner */}
        <AnimatePresence>
          {mounted && !hintDismissed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="bg-primary/5 dark:bg-primary/10 border-b border-primary/10 dark:border-primary/20 px-4 md:px-6 py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Lightbulb className="w-4 h-4 text-primary shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-primary">تلميح:</span>{' '}
                      استخدم{' '}
                      <kbd className="bg-muted border border-border rounded px-1 py-0 text-[10px] font-mono">Ctrl+K</kbd>{' '}
                      للبحث السريع،{' '}
                      <kbd className="bg-muted border border-border rounded px-1 py-0 text-[10px] font-mono">Ctrl+/</kbd>{' '}
                      لاختصارات لوحة المفاتيح
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={dismissHint}
                    aria-label="إغلاق التلميح"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t border-gray-200/60 dark:border-gray-700/50 px-4 py-3 bg-white/50 dark:bg-gray-900/50 relative z-10">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">
              ثانوية مارينا © {new Date().getFullYear()} — نظام إدارة المدرسة
            </p>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-muted-foreground/50 hidden sm:inline">
                اختصارات: Ctrl+K بحث, Ctrl+/ اختصارات, Ctrl+D وضع داكن
              </span>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] text-muted-foreground">النظام يعمل</span>
              </div>
            </div>
          </div>
        </footer>
      </motion.div>

      {/* Command Palette */}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  );
}
