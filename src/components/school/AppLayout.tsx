'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useAppStore, type PageKey } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';

interface AppLayoutProps {
  children: React.ReactNode;
}

const navItems: { key: PageKey; label: string; icon: React.ElementType; badge?: string }[] = [
  { key: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { key: 'students', label: 'الطلاب', icon: GraduationCap },
  { key: 'teachers', label: 'المدرسون', icon: Users },
  { key: 'subjects', label: 'المواد', icon: BookOpen },
  { key: 'attendance', label: 'الحضور QR', icon: ScanLine, badge: 'مباشر' },
  { key: 'grades', label: 'الدرجات', icon: FileText },
  { key: 'schedule', label: 'جدول الحصص', icon: Calendar },
  { key: 'activity', label: 'سجل النشاط', icon: Activity },
  { key: 'reports', label: 'التقارير', icon: BarChart3 },
  { key: 'notices', label: 'الإشعارات', icon: Bell },
  { key: 'users', label: 'المستخدمون', icon: Shield },
  { key: 'settings', label: 'الإعدادات', icon: Settings },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const { activePage, setActivePage, auth, logout, sidebarOpen, setSidebarOpen } = useAppStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Request animation frame to avoid synchronous setState in effect
    requestAnimationFrame(() => setMounted(true));
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

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
      <div className="p-4 pb-3">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0 shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #0d9488, #059669)',
            }}
          >
            <School className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-base leading-tight" style={{ color: '#0d9488' }}>
              مدرستي Pro
            </span>
            <span className="text-[11px] text-muted-foreground truncate">نظام إدارة المدرسة</span>
          </div>
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
      {mounted && (
        <div className="px-4 py-2.5 bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">{formatDate(currentTime)}</span>
            <span className="text-xs font-semibold" style={{ color: '#0d9488' }}>{formatTime(currentTime)}</span>
          </div>
        </div>
      )}

      <Separator />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-2">
        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider px-3 py-2">
            القائمة الرئيسية
          </p>
          {navItems.map((item) => {
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
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200 cursor-pointer relative overflow-hidden group
                  ${isActive
                    ? 'text-white shadow-md'
                    : 'text-gray-600 hover:bg-teal-50/80 hover:text-teal-700'
                  }
                `}
                style={
                  isActive
                    ? { background: 'linear-gradient(135deg, #0d9488, #059669)' }
                    : undefined
                }
                whileHover={{ x: isActive ? 0 : -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-colors ${
                  isActive ? 'bg-white/20' : 'bg-transparent group-hover:bg-teal-100'
                }`}>
                  <Icon className="w-[18px] h-[18px]" />
                </div>
                <span className="flex-1 text-right">{item.label}</span>
                {item.badge && (
                  <Badge
                    className={`text-[9px] px-1.5 py-0 h-4 ${
                      isActive
                        ? 'bg-white/25 text-white border-white/30'
                        : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {item.badge}
                  </Badge>
                )}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 pt-2">
        <Separator className="mb-3" />
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
      </div>
    </div>
  );

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50">
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
              className="fixed top-0 right-0 h-full w-72 bg-white shadow-2xl z-50 md:hidden"
            >
              {sidebarNav}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-[260px] md:flex-col md:fixed md:right-0 md:inset-y-0 bg-white border-l border-gray-200/80 shadow-sm z-20">
        {sidebarNav}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:mr-[260px] flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-lg border-b border-gray-200/60 shadow-sm">
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
                <h1 className="text-lg font-bold text-gray-800">
                  {navItems.find((i) => i.key === activePage)?.label || 'لوحة التحكم'}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* User info */}
              <div className="hidden sm:flex items-center gap-2.5">
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-800 leading-tight">{userName}</p>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 h-4 font-medium ${roleBadgeColor[userRole] || 'bg-gray-100 text-gray-700 border-gray-200'}`}
                  >
                    {userRole}
                  </Badge>
                </div>
                <Avatar
                  className="w-9 h-9 ring-2 ring-white shadow-md"
                  style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}
                >
                  <AvatarFallback className="text-white text-sm font-bold bg-transparent">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </div>

              <Separator orientation="vertical" className="h-8 hidden sm:block" />

              {/* Logout button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-gray-500 hover:text-red-600 hover:bg-red-50 gap-1.5 h-9"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">خروج</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t border-gray-200/60 px-4 py-3 bg-white/50">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">
              مدرستي Pro © {new Date().getFullYear()} — من تطوير Vision
            </p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] text-muted-foreground">النظام يعمل</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
