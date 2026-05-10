'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/lib/store';
import type { PageKey, AuthUser } from '@/types';
import LoginPage from '@/components/school/LoginPage';
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

export default function Home() {
  const { auth, setAuth, activePage } = useAppStore();

  const handleLogin = useMemo(
    () => (user: AuthUser, token: string) => {
      setAuth({
        user,
        token,
        isAuthenticated: true,
      });
    },
    [setAuth]
  );

  // Show login page if not authenticated
  if (!auth.isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Show main app
  return (
    <AppLayout>
      <PageRenderer page={activePage} />
    </AppLayout>
  );
}
