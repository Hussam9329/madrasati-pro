'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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

function PageRenderer({ page }: { page: PageKey }) {
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
      <AnimatePresence mode="wait">
        <motion.div
          key={activePage}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          <PageRenderer page={activePage} />
        </motion.div>
      </AnimatePresence>
    </AppLayout>
  );
}
