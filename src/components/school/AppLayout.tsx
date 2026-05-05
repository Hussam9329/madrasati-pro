'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  BookOpen,
  ScanLine,
  FileText,
  BarChart3,
  Bell,
  Shield,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  School,
  Calendar,
  Activity,
  Sun,
  Moon,
  CheckCircle2,
  Info,
  AlertTriangle,
  UserPlus,
  ClipboardCheck,
  Heart,
  Trophy,
  ClipboardList,
  Wallet,
  MessageSquare,
  CalendarDays,
  Award,
  PanelRightClose,
  PanelRightOpen,
  Search,
  Keyboard,
  Upload,
} from 'lucide-react';
import { useAppStore, type PageKey } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import CommandPalette from '@/components/school/CommandPalette';
import KeyboardShortcutsDialog from '@/components/school/KeyboardShortcutsDialog';

interface AppLayoutProps {
  children: React.ReactNode;
}

// Navigation groups with separators
const navGroups: { label: string; items: { key: PageKey; label: string; icon: React.ElementType; badge?: string }[] }[] = [
  {
    label: 'الرئيسية',
    items: [
      { key: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
      { key: 'students', label: 'الطلاب', icon: GraduationCap },
      { key: 'teachers', label: 'المدرسون', icon: Users },
      { key: 'subjects', label: 'المواد', icon: BookOpen },
    ],
  },
  {
    label: 'الأكاديمية',
    items: [
      { key: 'attendance', label: 'الحضور QR', icon: ScanLine, badge: 'مباشر' },
      { key: 'grades', label: 'الدرجات', icon: FileText },
      { key: 'ranking', label: 'ترتيب الصفوف', icon: Trophy },
      { key: 'exams', label: 'الامتحانات', icon: ClipboardList },
      { key: 'library', label: 'إدارة المكتبة', icon: BookOpen },
      { key: 'health', label: 'السجل الصحي', icon: Heart },
      { key: 'import', label: 'استيراد البيانات', icon: Upload },
    ],
  },
  {
    label: 'المالية والفعاليات',
    items: [
      { key: 'fees', label: 'الرسوم المدرسية', icon: Wallet },
      { key: 'calendar', label: 'التقويم المدرسي', icon: CalendarDays },
      { key: 'certificates', label: 'الشهادات والوثائق', icon: Award },
    ],
  },
  {
    label: 'التواصل',
    items: [
      { key: 'messages', label: 'التواصل والرسائل', icon: MessageSquare },
      { key: 'schedule', label: 'جدول الحصص', icon: Calendar },
      { key: 'activity', label: 'سجل النشاط', icon: Activity },
    ],
  },
  {
    label: 'التقارير والإعدادات',
    items: [
      { key: 'reports', label: 'التقارير', icon: BarChart3 },
      { key: 'notices', label: 'الإشعارات', icon: Bell },
      { key: 'parents', label: 'بوابة ولي الأمر', icon: GraduationCap },
      { key: 'users', label: 'المستخدمون', icon: Shield },
      { key: 'settings', label: 'الإعدادات', icon: Settings },
    ],
  },
];

// Flat nav items for backward compatibility (Ctrl+1-9)
const flatNavItems = navGroups.flatMap((g) => g.items);

// Mock notification data
const mockNotifications = [
  { id: 1, type: 'student' as const, message: 'تم تسجيل الطالب أحمد محمد في الصف السادس', time: 'منذ 5 دقائق', read: false },
  { id: 2, type: 'attendance' as const, message: 'تم تسجيل حضور الصف الرابع بنسبة 95%', time: 'منذ 15 دقيقة', read: false },
  { id: 3, type: 'grade' as const, message: 'تم رفع درجات مادة الرياضيات للصف الخامس', time: 'منذ 30 دقيقة', read: false },
  { id: 4, type: 'alert' as const, message: 'تنبيه: 3 طلاب لم يسجلوا حضورهم اليوم', time: 'منذ ساعة', read: true },
  { id: 5, type: 'info' as const, message: 'تم تحديث جدول الحصص للأسبوع القادم', time: 'منذ ساعتين', read: true },
  { id: 6, type: 'success' as const, message: 'تم تصدير تقرير الدرجات بنجاح', time: 'منذ 3 ساعات', read: true },
];

const notificationConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  student: { icon: UserPlus, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  attendance: { icon: ClipboardCheck, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  grade: { icon: FileText, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  alert: { icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
  info: { icon: Info, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-100 dark:bg-sky-900/30' },
  success: { icon: CheckCircle2, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-900/30' },
};

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
  const unreadCount = mockNotifications.filter((n) => !n.read).length;

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
      // Ctrl+1 through Ctrl+9 → navigate to first 9 pages
      if (event.ctrlKey && !event.shiftKey && !event.altKey) {
        const num = parseInt(event.key, 10);
        if (num >= 1 && num <= 9 && num <= flatNavItems.length) {
          event.preventDefault();
          setActivePage(flatNavItems[num - 1].key);
          setSidebarOpen(false);
          return;
        }
        // Ctrl+K → open command palette
        if (event.key === 'k' || event.key === 'K') {
          event.preventDefault();
          setCommandOpen(true);
          return;
        }
        // Ctrl+/ → show keyboard shortcuts
        if (event.key === '/') {
          event.preventDefault();
          setShortcutsOpen(true);
          return;
        }
        // Ctrl+D → toggle dark mode
        if (event.key === 'd' || event.key === 'D') {
          event.preventDefault();
          setTheme(theme === 'dark' ? 'light' : 'dark');
          return;
        }
      }
      // Escape → close any open dialog/panel
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

  const userName = auth.user?.name || 'مستخدم';
  const userRole = auth.user?.role || '';
  const userInitials = userName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2);

  const roleBadgeColor: Record<string, string> = {
    'مدير': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'معاون': 'bg-teal-100 text-teal-700 border-teal-200',
    'موظف تسجيل': 'bg-cyan-100 text-cyan-700 border-cyan-200',
    'موظف بوابة': 'bg-amber-100 text-amber-700 border-amber-200',
    'مدرس': 'bg-sky-100 text-sky-700 border-sky-200',
    'ولي أمر': 'bg-purple-100 text-purple-700 border-purple-200',
    'طالب': 'bg-pink-100 text-pink-700 border-pink-200',
    'مسؤول نظام': 'bg-red-100 text-red-700 border-red-200',
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ar-IQ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Sidebar navigation content
  const sidebarNav = (
    <div className="flex flex-col h-full">
      {/* Logo Section */}
      <div className="p-4 pb-3 relative overflow-hidden shrink-0">
        {/* Subtle gradient background for sidebar header */}
        <div className="absolute inset-0 bg-gradient-to-l from-teal-50/50 to-transparent dark:from-teal-900/10 dark:to-transparent" />
        <div className="flex items-center gap-3 relative z-10">
          <div
            className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0 shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #0d9488, #059669)',
            }}
          >
            <School className="w-6 h-6 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-base leading-tight" style={{ color: '#0d9488' }}>
                مدرستي Pro
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] text-muted-foreground truncate">نظام إدارة المدرسة</span>
                <Badge className="text-[8px] px-1 py-0 h-3.5 bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-700 font-medium">
                  2025-2026
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
            <span className="text-xs font-semibold" style={{ color: '#0d9488' }}>
              {formatTime(currentTime)}
            </span>
          </div>
        </div>
      )}

      {mounted && sidebarCollapsed && (
        <div className="px-2 py-2 text-center shrink-0">
          <span className="text-[10px] font-semibold block" style={{ color: '#0d9488' }}>
            {formatTime(currentTime)}
          </span>
        </div>
      )}

      <Separator />

      {/* Navigation - scrollable */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <div className="space-y-0.5">
          {navGroups.map((group, gIdx) => (
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
                  <motion.button
                    key={item.key}
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
                          ? 'bg-teal-600/10 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gradient-to-l hover:from-teal-500/5 hover:to-emerald-500/5 dark:hover:bg-teal-900/20 hover:text-teal-700 dark:hover:text-teal-400'
                      }
                    `}
                    whileHover={{ x: isActive ? 0 : -2 }}
                    whileTap={{ scale: 0.98 }}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    {/* Right border strip for active item */}
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-l-full"
                        style={{ background: 'linear-gradient(to bottom, #0d9488, #059669)' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-all duration-200 ${
                        isActive
                          ? 'bg-teal-600/20 dark:bg-teal-500/30'
                          : 'bg-transparent group-hover:bg-teal-100 dark:group-hover:bg-teal-900/30'
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
                                ? 'bg-teal-600/15 text-teal-700 dark:bg-teal-500/25 dark:text-teal-300 border-teal-600/20 dark:border-teal-500/30'
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
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Footer - always visible with shrink-0 */}
      <div className="p-4 pt-2 shrink-0">
        <Separator className="mb-3" />
        {!sidebarCollapsed ? (
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <p className="text-[10px] text-muted-foreground/70">من تطوير</p>
              <p className="text-sm font-bold tracking-wide" style={{ color: '#0d9488' }}>
                Vision
              </p>
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

  const sidebarWidth = sidebarCollapsed ? 'w-16' : 'w-[260px]';
  const mainMargin = sidebarCollapsed ? 'md:mr-16' : 'md:mr-[260px]';

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-950 dark:to-gray-900/50 relative">
      {/* Background dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #0d9488 1px, transparent 1px)',
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
            <PanelRightOpen className="w-3 h-3 text-muted-foreground" />
          ) : (
            <PanelRightClose className="w-3 h-3 text-muted-foreground" />
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

              {/* Page title with breadcrumb */}
              <div className="flex items-center gap-2">
                <ChevronLeft className="h-4 w-4 text-muted-foreground hidden md:block" />
                <h1 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  {flatNavItems.find((i) => i.key === activePage)?.label || 'لوحة التحكم'}
                </h1>
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

              {/* Notification Bell */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted relative"
                    aria-label="الإشعارات"
                  >
                    <motion.div
                      animate={unreadCount > 0 ? { rotate: [0, -10, 10, -10, 0] } : {}}
                      transition={{ duration: 0.5, repeat: 2, repeatDelay: 3 }}
                    >
                      <Bell className="h-[18px] w-[18px]" />
                    </motion.div>
                    {unreadCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-0.5 -left-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full shadow-sm"
                      >
                        {unreadCount}
                      </motion.span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
                  <div className="p-3 border-b border-border">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm text-foreground">الإشعارات</h3>
                      {unreadCount > 0 && (
                        <Badge className="text-[10px] px-1.5 py-0 h-5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0">
                          {unreadCount} جديد
                        </Badge>
                      )}
                    </div>
                  </div>
                  <ScrollArea className="max-h-80">
                    <div className="divide-y divide-border">
                      {mockNotifications.map((notification) => {
                        const config = notificationConfig[notification.type];
                        const Icon = config.icon;
                        return (
                          <div
                            key={notification.id}
                            className={`flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors cursor-pointer ${
                              !notification.read ? 'bg-muted/30' : ''
                            }`}
                          >
                            <div className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${config.bg}`}>
                              <Icon className={`w-4 h-4 ${config.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-xs leading-relaxed ${
                                  !notification.read ? 'text-foreground font-medium' : 'text-muted-foreground'
                                }`}
                              >
                                {notification.message}
                              </p>
                              <p className="text-[10px] text-muted-foreground/70 mt-1">{notification.time}</p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 rounded-full bg-teal-500 shrink-0 mt-1.5" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                  <div className="p-2 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/20"
                      onClick={() => setActivePage('notices')}
                    >
                      عرض الكل
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

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
                  <Avatar
                    className="w-9 h-9 ring-2 ring-white dark:ring-gray-700 shadow-md"
                    style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}
                  >
                    <AvatarFallback className="text-white text-sm font-bold bg-transparent">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  {/* Online status indicator */}
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
              مدرستي Pro © {new Date().getFullYear()} — من تطوير Vision
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
