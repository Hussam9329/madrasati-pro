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
  Shield,
  Settings,
  Calendar,
  UserPlus,
  ClipboardCheck,
  ClipboardList,
  Moon,
  Layers,
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
  { key: 'teachers', label: 'الأساتذة', icon: Users, group: 'الرئيسية' },
  { key: 'subjects', label: 'المواد', icon: BookOpen, group: 'الرئيسية' },
  { key: 'exams', label: 'الامتحانات', icon: ClipboardList, group: 'الأكاديمية' },
  { key: 'classes', label: 'الصفوف والشعب', icon: Layers, group: 'الأكاديمية' },
  { key: 'attendance', label: 'الحضور QR', icon: ScanLine, group: 'الأكاديمية' },
  { key: 'grades', label: 'الدرجات', icon: FileText, group: 'الأكاديمية' },
  { key: 'schedule', label: 'جدول الحصص', icon: Calendar, group: 'الأكاديمية' },
  { key: 'reports', label: 'التقارير', icon: BarChart3, group: 'التقارير والإعدادات' },
  { key: 'users', label: 'المستخدمون', icon: Shield, group: 'التقارير والإعدادات' },
  { key: 'settings', label: 'الإعدادات', icon: Settings, group: 'التقارير والإعدادات' },
];

const quickActions = [
  { id: 'add-student', label: 'إضافة طالب', icon: UserPlus, page: 'students' as PageKey },
  { id: 'add-exam', label: 'إضافة امتحان', icon: ClipboardList, page: 'exams' as PageKey },
  { id: 'record-attendance', label: 'تسجيل حضور', icon: ClipboardCheck, page: 'attendance' as PageKey },
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
            <CommandGroup heading="المواقع الأخيرة" className="text-blue-700 dark:text-blue-300">
              {recentItems.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={`recent-${item.key}`}
                    onSelect={() => handleSelect(item.key)}
                    className="cursor-pointer"
                  >
                    <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>{item.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Quick Actions */}
        <CommandGroup heading="إجراءات سريعة" className="text-blue-700 dark:text-blue-300">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <CommandItem
                key={action.id}
                onSelect={() => handleSelect(action.page, action.id === 'toggle-dark' ? 'toggle-dark' : undefined)}
                className="cursor-pointer"
              >
                <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{action.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        {/* Pages grouped */}
        {['الرئيسية', 'الأكاديمية', 'التقارير والإعدادات'].map((groupName) => {
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
