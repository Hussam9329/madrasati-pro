'use client';

import React, { useEffect, useState } from 'react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
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
  Calendar,
  Activity,
  Heart,
  Trophy,
  ClipboardList,
  Wallet,
  MessageSquare,
  CalendarDays,
  Award,
  UserPlus,
  ClipboardCheck,
  FileBadge,
  Send,
  Moon,
  Search,
} from 'lucide-react';
import { useAppStore, type PageKey } from '@/lib/store';
import { useTheme } from 'next-themes';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const pageItems: { key: PageKey; label: string; icon: React.ElementType; group: string }[] = [
  { key: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, group: 'الرئيسية' },
  { key: 'students', label: 'الطلاب', icon: GraduationCap, group: 'الرئيسية' },
  { key: 'teachers', label: 'المدرسون', icon: Users, group: 'الرئيسية' },
  { key: 'subjects', label: 'المواد', icon: BookOpen, group: 'الرئيسية' },
  { key: 'attendance', label: 'الحضور QR', icon: ScanLine, group: 'الأكاديمية' },
  { key: 'grades', label: 'الدرجات', icon: FileText, group: 'الأكاديمية' },
  { key: 'ranking', label: 'ترتيب الصفوف', icon: Trophy, group: 'الأكاديمية' },
  { key: 'exams', label: 'الامتحانات', icon: ClipboardList, group: 'الأكاديمية' },
  { key: 'fees', label: 'الرسوم المدرسية', icon: Wallet, group: 'المالية والفعاليات' },
  { key: 'calendar', label: 'التقويم المدرسي', icon: CalendarDays, group: 'المالية والفعاليات' },
  { key: 'certificates', label: 'الشهادات والوثائق', icon: Award, group: 'المالية والفعاليات' },
  { key: 'messages', label: 'التواصل والرسائل', icon: MessageSquare, group: 'التواصل' },
  { key: 'schedule', label: 'جدول الحصص', icon: Calendar, group: 'التواصل' },
  { key: 'activity', label: 'سجل النشاط', icon: Activity, group: 'التواصل' },
  { key: 'reports', label: 'التقارير', icon: BarChart3, group: 'التقارير والإعدادات' },
  { key: 'notices', label: 'الإشعارات', icon: Bell, group: 'التقارير والإعدادات' },
  { key: 'parents', label: 'بوابة ولي الأمر', icon: Heart, group: 'التقارير والإعدادات' },
  { key: 'users', label: 'المستخدمون', icon: Shield, group: 'التقارير والإعدادات' },
  { key: 'settings', label: 'الإعدادات', icon: Settings, group: 'التقارير والإعدادات' },
];

const quickActions = [
  { id: 'add-student', label: 'إضافة طالب', icon: UserPlus, page: 'students' as PageKey },
  { id: 'record-attendance', label: 'تسجيل حضور', icon: ClipboardCheck, page: 'attendance' as PageKey },
  { id: 'issue-certificate', label: 'إصدار شهادة', icon: FileBadge, page: 'certificates' as PageKey },
  { id: 'send-message', label: 'إرسال رسالة', icon: Send, page: 'messages' as PageKey },
  { id: 'toggle-dark', label: 'تبديل الوضع الداكن', icon: Moon, page: null },
];

export default function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const { setActivePage, setSidebarOpen, recentPages, addRecentPage } = useAppStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  const handleSelect = (pageKey: PageKey | null, action?: string) => {
    if (action === 'toggle-dark') {
      setTheme(theme === 'dark' ? 'light' : 'dark');
      onOpenChange(false);
      return;
    }
    if (pageKey) {
      addRecentPage(pageKey);
      setActivePage(pageKey);
      setSidebarOpen(false);
    }
    onOpenChange(false);
  };

  if (!mounted) return null;

  const recentItems = recentPages
    .slice(0, 3)
    .map((p) => pageItems.find((item) => item.key === p))
    .filter(Boolean) as typeof pageItems;

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="لوحة الأوامر"
      description="ابحث عن صفحة أو إجراء..."
      className="sm:max-w-lg"
    >
      <CommandInput placeholder="ابحث عن صفحة أو إجراء..." />
      <CommandList>
        <CommandEmpty>لا توجد نتائج</CommandEmpty>

        {/* Recent Pages */}
        {recentItems.length > 0 && (
          <>
            <CommandGroup heading="المواقع الأخيرة" className="text-teal-700 dark:text-teal-300">
              {recentItems.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={`recent-${item.key}`}
                    onSelect={() => handleSelect(item.key)}
                    className="cursor-pointer"
                  >
                    <Icon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>{item.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Quick Actions */}
        <CommandGroup heading="إجراءات سريعة" className="text-emerald-700 dark:text-emerald-300">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <CommandItem
                key={action.id}
                onSelect={() => handleSelect(action.page, action.id === 'toggle-dark' ? 'toggle-dark' : undefined)}
                className="cursor-pointer"
              >
                <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{action.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        {/* Pages grouped */}
        {['الرئيسية', 'الأكاديمية', 'المالية والفعاليات', 'التواصل', 'التقارير والإعدادات'].map((groupName) => {
          const groupItems = pageItems.filter((item) => item.group === groupName);
          if (groupItems.length === 0) return null;
          return (
            <CommandGroup key={groupName} heading={groupName} className="text-muted-foreground">
              {groupItems.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.key}
                    onSelect={() => handleSelect(item.key)}
                    className="cursor-pointer"
                  >
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span>{item.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}
