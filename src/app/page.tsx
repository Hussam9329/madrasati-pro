'use client';

import { useAppStore } from '@/lib/store';
import type { PageKey, AuthUser } from '@/types';
import LoginPage from '@/components/school/LoginPage';
import AppLayout from '@/components/school/AppLayout';
import DashboardPage from '@/components/school/DashboardPage';
import StudentsPage from '@/components/school/StudentsPage';
import TeachersPage from '@/components/school/TeachersPage';
import SubjectsPage from '@/components/school/SubjectsPage';
import AttendancePage from '@/components/school/AttendancePage';
import GradesPage from '@/components/school/GradesPage';
import ReportsPage from '@/components/school/ReportsPage';
import SettingsPage from '@/components/school/SettingsPage';
import SchedulePage from '@/components/school/SchedulePage';
import ClassesPage from '@/components/school/ClassesPage';
import ExamsPage from '@/components/school/ExamsPage';
import PaymentsPage from '@/components/school/PaymentsPage';
import StudentProfilePage from '@/components/school/StudentProfilePage';

function PageRenderer({ page }: { page: PageKey }) {
  const { selectedStudentId } = useAppStore();
  switch (page) {
    case 'dashboard':
      return <DashboardPage />;
    case 'students':
      return <StudentsPage />;
    case 'teachers':
      return <TeachersPage />;
    case 'subjects':
      return <SubjectsPage />;
    case 'attendance':
      return <AttendancePage />;
    case 'exams':
      return <ExamsPage />;
    case 'payments':
      return <PaymentsPage />;
    case 'grades':
      return <GradesPage />;
    case 'classes':
      return <ClassesPage />;
    case 'schedule':
      return <SchedulePage />;
    case 'reports':
      return <ReportsPage />;
    case 'profile':
      return <StudentProfilePage studentId={selectedStudentId ?? undefined} />;
    case 'users':
      return <SettingsPage initialTab="users" />;
    case 'settings':
      return <SettingsPage initialTab="settings" />;
    default:
      return <DashboardPage />;
  }
}

export default function Home() {
  const { auth, setAuth, activePage } = useAppStore();

  const handleLogin = (
    user: AuthUser,
    token: string
  ) => {
    setAuth({
      user,
      token,
      isAuthenticated: true,
    });
  };

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
