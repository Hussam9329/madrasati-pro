'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/lib/store';
import type { PageKey } from '@/types';
import { hasPermission } from '@/lib/auth';
import AppLayout from '@/components/school/AppLayout';

// Lazy load page components - only loaded when the user navigates to them
// This reduces initial bundle size significantly by not loading all pages upfront
const DashboardPage = dynamic(() => import('@/components/school/DashboardPage'), {
  loading: () => <PageSkeleton />,
});
const StudentsPage = dynamic(() => import('@/components/school/StudentsPage'), {
  loading: () => <PageSkeleton />,
});
const TeachersPage = dynamic(() => import('@/components/school/TeachersPage'), {
  loading: () => <PageSkeleton />,
});
const SubjectsPage = dynamic(() => import('@/components/school/SubjectsPage'), {
  loading: () => <PageSkeleton />,
});
const AttendancePage = dynamic(() => import('@/components/school/AttendancePage'), {
  loading: () => <PageSkeleton />,
});
const GradesPage = dynamic(() => import('@/components/school/GradesPage'), {
  loading: () => <PageSkeleton />,
});
const ReportsPage = dynamic(() => import('@/components/school/ReportsPage'), {
  loading: () => <PageSkeleton />,
});
const SettingsPage = dynamic(() => import('@/components/school/SettingsPage'), {
  loading: () => <PageSkeleton />,
});
const SchedulePage = dynamic(() => import('@/components/school/SchedulePage'), {
  loading: () => <PageSkeleton />,
});
const ClassesPage = dynamic(() => import('@/components/school/ClassesPage'), {
  loading: () => <PageSkeleton />,
});
const ExamsPage = dynamic(() => import('@/components/school/ExamsPage'), {
  loading: () => <PageSkeleton />,
});
const PaymentsPage = dynamic(() => import('@/components/school/PaymentsPage'), {
  loading: () => <PageSkeleton />,
});
const StudentProfilePage = dynamic(() => import('@/components/school/StudentProfilePage'), {
  loading: () => <PageSkeleton />,
});

// Lightweight skeleton shown while lazy-loaded pages are being fetched
function PageSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in" role="status" aria-label="جاري التحميل">
      <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-muted animate-pulse" />
    </div>
  );
}

// Map page keys to lazy-loaded components
const pageComponents: Record<PageKey, React.ComponentType> = {
  dashboard: DashboardPage,
  students: StudentsPage,
  teachers: TeachersPage,
  subjects: SubjectsPage,
  attendance: AttendancePage,
  exams: ExamsPage,
  payments: PaymentsPage,
  grades: GradesPage,
  classes: ClassesPage,
  schedule: SchedulePage,
  reports: ReportsPage,
  users: SettingsPage,
  settings: SettingsPage,
  profile: StudentProfilePage,
};

// Map page keys to required permissions
const pagePermissions: Record<PageKey, string> = {
  dashboard: 'students',
  students: 'students',
  teachers: 'teachers',
  subjects: 'subjects',
  attendance: 'attendance',
  exams: 'grades',
  payments: 'payments_view',
  grades: 'grades',
  classes: 'subjects',
  schedule: 'schedule',
  reports: 'reports',
  users: 'all',
  settings: 'all',
  profile: 'self_view',
};

function PageRenderer({ page }: { page: PageKey }) {
  const { selectedStudentId } = useAppStore();
  const PageComponent = pageComponents[page] || DashboardPage;

  // Only pass studentId for profile page to avoid unnecessary re-renders
  if (page === 'profile') {
    return <StudentProfilePage studentId={selectedStudentId ?? undefined} />;
  }
  if (page === 'users') {
    return <SettingsPage initialTab="users" />;
  }
  if (page === 'settings') {
    return <SettingsPage initialTab="settings" />;
  }

  return <PageComponent />;
}

// Default admin user for open access (no login required)
const DEFAULT_USER = {
  id: 'default-admin',
  username: 'admin',
  name: 'مدير النظام',
  role: 'مدير' as const,
};

export default function Home() {
  const { auth, setAuth, activePage, setActivePage } = useAppStore();

  // Auto-authenticate as admin if not already authenticated
  useEffect(() => {
    if (!auth.isAuthenticated) {
      setAuth({
        user: DEFAULT_USER,
        token: 'open-access',
        isAuthenticated: true,
      });
    }
  }, [auth.isAuthenticated, setAuth]);

  // Redirect to dashboard if user tries to access a page they don't have permission for
  useEffect(() => {
    if (auth.isAuthenticated && auth.user?.role) {
      const requiredPermission = pagePermissions[activePage];
      if (requiredPermission && !hasPermission(auth.user.role, requiredPermission)) {
        // Find the first page the user has access to
        const firstAllowedPage = (Object.entries(pagePermissions) as [PageKey, string][])
          .find(([, perm]) => hasPermission(auth.user!.role, perm));
        setActivePage(firstAllowedPage?.[0] || 'dashboard');
      }
    }
  }, [auth.isAuthenticated, auth.user?.role, activePage, setActivePage]);

  // Show main app directly (no login page)
  return (
    <AppLayout>
      <PageRenderer page={activePage} />
    </AppLayout>
  );
}
