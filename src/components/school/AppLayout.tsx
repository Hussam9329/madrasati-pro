'use client';

import React from 'react';
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
  GraduationCapIcon,
} from 'lucide-react';
import { useAppStore, type PageKey } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

interface AppLayoutProps {
  children: React.ReactNode;
}

const navItems: { key: PageKey; label: string; icon: React.ElementType }[] = [
  { key: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { key: 'students', label: 'الطلاب', icon: GraduationCap },
  { key: 'teachers', label: 'المدرسون', icon: Users },
  { key: 'subjects', label: 'المواد', icon: BookOpen },
  { key: 'attendance', label: 'الحضور والانصراف', icon: ScanLine },
  { key: 'grades', label: 'الدرجات', icon: FileText },
  { key: 'reports', label: 'التقارير', icon: BarChart3 },
  { key: 'notices', label: 'الإشعارات', icon: Bell },
  { key: 'users', label: 'المستخدمون', icon: Shield },
  { key: 'settings', label: 'الإعدادات', icon: Settings },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const { activePage, setActivePage, auth, logout, sidebarOpen, setSidebarOpen } = useAppStore();

  const userName = auth.user?.name || 'مستخدم';
  const userRole = auth.user?.role || '';
  const userInitials = userName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2);

  const roleBadgeColor: Record<string, string> = {
    'مدير': 'bg-emerald-100 text-emerald-700',
    'معاون': 'bg-teal-100 text-teal-700',
    'موظف تسجيل': 'bg-cyan-100 text-cyan-700',
    'موظف بوابة': 'bg-amber-100 text-amber-700',
    'مدرس': 'bg-blue-100 text-blue-700',
    'ولي أمر': 'bg-purple-100 text-purple-700',
    'طالب': 'bg-pink-100 text-pink-700',
    'مسؤول نظام': 'bg-red-100 text-red-700',
  };

  // Sidebar content shared between desktop and mobile
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Sidebar Header - Logo */}
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0"
            style={{
              background: 'linear-gradient(135deg, #0d9488, #059669)',
            }}
          >
            <GraduationCapIcon className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base" style={{ color: '#0d9488' }}>
              مدرستي Pro
            </span>
            <span className="text-xs text-muted-foreground">نظام إدارة المدرسة</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-muted-foreground px-3">
            القائمة الرئيسية
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = activePage === item.key;
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => {
                        setActivePage(item.key);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'text-white shadow-md'
                          : 'text-gray-600 hover:bg-teal-50 hover:text-teal-700'
                      }`}
                      style={
                        isActive
                          ? {
                              background: 'linear-gradient(135deg, #0d9488, #059669)',
                            }
                          : undefined
                      }
                      tooltip={item.label}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Sidebar Footer - Vision watermark */}
      <SidebarFooter className="mt-auto p-4">
        <Separator className="mb-3" />
        <div className="text-center">
          <p className="text-xs text-muted-foreground">من تطوير</p>
          <p
            className="text-sm font-bold"
            style={{ color: '#0d9488' }}
          >
            Vision
          </p>
        </div>
      </SidebarFooter>
    </div>
  );

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      <div className="md:hidden">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="right" className="w-72 p-0 bg-white">
            <SheetHeader className="sr-only">
              <SheetTitle>القائمة الجانبية</SheetTitle>
              <SheetDescription>قائمة التنقل الرئيسية</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col h-full">
              {/* Mobile header */}
              <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-lg"
                    style={{
                      background: 'linear-gradient(135deg, #0d9488, #059669)',
                    }}
                  >
                    <GraduationCapIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="font-bold text-base" style={{ color: '#0d9488' }}>
                      مدرستي Pro
                    </span>
                    <p className="text-xs text-muted-foreground">نظام إدارة المدرسة</p>
                  </div>
                </div>
              </div>

              {/* Mobile nav items */}
              <ScrollArea className="flex-1 py-2">
                <div className="px-3 space-y-1">
                  {navItems.map((item) => {
                    const isActive = activePage === item.key;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.key}
                        onClick={() => {
                          setActivePage(item.key);
                          setSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'text-white shadow-md'
                            : 'text-gray-600 hover:bg-teal-50 hover:text-teal-700'
                        }`}
                        style={
                          isActive
                            ? {
                                background: 'linear-gradient(135deg, #0d9488, #059669)',
                              }
                            : undefined
                        }
                      >
                        <Icon className="w-5 h-5 shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Mobile footer */}
              <div className="p-4 border-t">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">من تطوير</p>
                  <p className="text-sm font-bold" style={{ color: '#0d9488' }}>
                    Vision
                  </p>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:right-0 md:inset-y-0 bg-white border-l border-gray-200 shadow-sm z-20">
          {sidebarContent}
        </aside>

        {/* Main content area */}
        <div className="flex-1 md:mr-64 flex flex-col min-h-screen">
          {/* Header */}
          <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
            <div className="flex items-center justify-between h-16 px-4 md:px-6">
              <div className="flex items-center gap-3">
                {/* Mobile menu button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="w-5 h-5" />
                </Button>

                {/* Page title */}
                <div>
                  <h1 className="text-lg font-bold text-gray-800">
                    {navItems.find((i) => i.key === activePage)?.label || 'لوحة التحكم'}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* User info */}
                <div className="hidden sm:flex items-center gap-3">
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-800">{userName}</p>
                    <span
                      className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                        roleBadgeColor[userRole] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {userRole}
                    </span>
                  </div>
                  <Avatar className="w-9 h-9" style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}>
                    <AvatarFallback className="text-white text-sm font-bold bg-transparent">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Logout button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-gray-500 hover:text-red-600 hover:bg-red-50 gap-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">خروج</span>
                </Button>
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
