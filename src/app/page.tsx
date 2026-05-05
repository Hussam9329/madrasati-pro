'use client';

import { useEffect, useState } from 'react';
import { useAppStore, type PageKey } from '@/lib/store';
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
import ActivityLogPage from '@/components/school/ActivityLogPage';
import ParentPortalPage from '@/components/school/ParentPortalPage';
import ClassRankingPage from '@/components/school/ClassRankingPage';
import ExamsPage from '@/components/school/ExamsPage';
import FeeManagementPage from '@/components/school/FeeManagementPage';
import MessagingPage from '@/components/school/MessagePage';
import SchoolCalendarPage from '@/components/school/SchoolCalendarPage';
import CertificatePage from '@/components/school/CertificatePage';
import StudentProfilePage from '@/components/school/StudentProfilePage';
import LibraryPage from '@/components/school/LibraryPage';
import HealthPage from '@/components/school/HealthPage';
import DataImportPage from '@/components/school/DataImportPage';

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
    case 'grades':
      return <GradesPage />;
    case 'reports':
      return <ReportsPage />;
    case 'schedule':
      return <SchedulePage />;
    case 'activity':
      return <ActivityLogPage />;
    case 'ranking':
      return <ClassRankingPage />;
    case 'exams':
      return <ExamsPage />;
    case 'fees':
      return <FeeManagementPage />;
    case 'calendar':
      return <SchoolCalendarPage />;
    case 'certificates':
      return <CertificatePage />;
    case 'profile':
      return <StudentProfilePage studentId={selectedStudentId} />;
    case 'library':
      return <LibraryPage />;
    case 'health':
      return <HealthPage />;
    case 'import':
      return <DataImportPage />;
    case 'messages':
      return <MessagingPage />;
    case 'parents':
      return <ParentPortalPage />;
    case 'notices':
      return <SettingsPage initialTab="notices" />;
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
  const [seeded, setSeeded] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Seed database on first load
  useEffect(() => {
    const seedDB = async () => {
      if (seeded || seeding) return;
      setSeeding(true);
      try {
        const res = await fetch('/api/seed', { method: 'POST' });
        if (res.ok) {
          setSeeded(true);
        }
      } catch {
        // Already seeded or error
      } finally {
        setSeeded(false);
      }
    };
    seedDB();
  }, [seeded, seeding]);

  const handleLogin = (
    user: { id: string; username: string; name: string; role: string },
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
