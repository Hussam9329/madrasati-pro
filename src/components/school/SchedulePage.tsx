'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, BookOpen, Users, ChevronLeft, ChevronRight,
  GraduationCap, User, Filter, Printer,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Types
interface ScheduleCell {
  subject: string;
  teacher: string;
  room: string;
}

// Days of the week (Iraqi school week: Sunday-Thursday)
const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

// Periods
const PERIODS = [
  { num: 1, time: '08:00 - 08:45' },
  { num: 2, time: '08:45 - 09:30' },
  { num: 3, time: '09:30 - 10:15' },
  { num: 4, time: '10:15 - 11:00' },
  { num: 5, time: '11:00 - 11:45' },
  { num: 6, time: '11:45 - 12:30' },
  { num: 7, time: '12:30 - 13:15' },
];

// Classes
const CLASSES = [
  'الرابع الإعدادي - علمي',
  'الرابع الإعدادي - أدبي',
  'الخامس الإعدادي - علمي',
  'الخامس الإعدادي - أدبي',
  'السادس الإعدادي - أحيائي',
  'السادس الإعدادي - تطبيقي',
];

// Teachers
const TEACHERS = [
  'أ. أحمد كاظم',
  'أ. مصطفى جواد',
  'أ. زينب محمد',
  'أ. حيدر علي',
  'أ. سارة حسين',
  'أ. علي عباس',
  'أ. مرتضى صالح',
  'أ. نور حسام',
  'أ. حسين خالد',
  'أ. فاطمة ناصر',
  'أ. عباس جعفر',
  'أ. مريم رضا',
  'أ. كريم حمزة',
  'أ. محمد طالب',
];

const SUBJECTS = [
  'التربية الإسلامية',
  'اللغة العربية',
  'اللغة الإنجليزية',
  'الأحياء',
  'الفيزياء',
  'الكيمياء',
  'الرياضيات',
];

const ROOMS = ['قاعة 1', 'قاعة 2', 'قاعة 3', 'مختبر الفيزياء', 'مختبر الكيمياء', 'مختبر الأحياء', 'المكتبة'];

const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'التربية الإسلامية': { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-700' },
  'اللغة العربية': { bg: 'bg-teal-50 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-700' },
  'اللغة الإنجليزية': { bg: 'bg-sky-50 dark:bg-sky-900/30', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-200 dark:border-sky-700' },
  'الأحياء': { bg: 'bg-green-50 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-700' },
  'الفيزياء': { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-700' },
  'الكيمياء': { bg: 'bg-purple-50 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-700' },
  'الرياضيات': { bg: 'bg-rose-50 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-700' },
};

// Generate mock schedule data for class view
function generateClassSchedule(className: string): Record<string, Record<number, ScheduleCell>> {
  // Deterministic seed based on class name
  const seed = className.charCodeAt(0);
  const schedule: Record<string, Record<number, ScheduleCell>> = {};

  DAYS.forEach((day, dayIdx) => {
    schedule[day] = {};
    PERIODS.forEach((period, periodIdx) => {
      // Break period (4th period is sometimes break)
      if (periodIdx === 3 && dayIdx % 2 === 0) {
        schedule[day][period.num] = {
          subject: 'استراحة',
          teacher: '—',
          room: '—',
        };
        return;
      }

      const subjectIdx = (seed + dayIdx * 3 + periodIdx * 7) % SUBJECTS.length;
      const teacherIdx = (seed + dayIdx * 2 + periodIdx * 5) % TEACHERS.length;
      const roomIdx = (seed + dayIdx + periodIdx) % ROOMS.length;

      schedule[day][period.num] = {
        subject: SUBJECTS[subjectIdx],
        teacher: TEACHERS[teacherIdx],
        room: ROOMS[roomIdx],
      };
    });
  });

  return schedule;
}

// Generate mock schedule data for teacher view
function generateTeacherSchedule(teacherName: string): Record<string, Record<number, ScheduleCell>> {
  const seed = teacherName.charCodeAt(2);
  const schedule: Record<string, Record<number, ScheduleCell>> = {};

  DAYS.forEach((day, dayIdx) => {
    schedule[day] = {};
    PERIODS.forEach((period, periodIdx) => {
      // Some free periods for teachers
      const isFree = (seed + dayIdx + periodIdx) % 5 === 0;
      if (isFree) {
        schedule[day][period.num] = {
          subject: 'فراغ',
          teacher: '—',
          room: '—',
        };
        return;
      }

      const subjectIdx = (seed + dayIdx * 2 + periodIdx) % SUBJECTS.length;
      const classIdx = (seed + dayIdx * 4 + periodIdx * 3) % CLASSES.length;
      const roomIdx = (seed + dayIdx + periodIdx * 2) % ROOMS.length;

      schedule[day][period.num] = {
        subject: SUBJECTS[subjectIdx],
        teacher: CLASSES[classIdx],
        room: ROOMS[roomIdx],
      };
    });
  });

  return schedule;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 }
};

export default function SchedulePage() {
  const [viewMode, setViewMode] = useState<'class' | 'teacher'>('class');
  const [selectedClass, setSelectedClass] = useState(CLASSES[0]);
  const [selectedTeacher, setSelectedTeacher] = useState(TEACHERS[0]);

  const schedule = viewMode === 'class'
    ? generateClassSchedule(selectedClass)
    : generateTeacherSchedule(selectedTeacher);

  const isBreak = (cell: ScheduleCell) => cell.subject === 'استراحة';
  const isFree = (cell: ScheduleCell) => cell.subject === 'فراغ';

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-11 h-11 rounded-xl shadow-lg"
            style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}
          >
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold dark:text-gray-200">جدول الحصص</h1>
            <p className="text-sm text-muted-foreground">جدول الحصص الأسبوعي</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2 border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-400 dark:hover:bg-teal-900/20"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" />
            طباعة
          </Button>
        </div>
      </motion.div>

      {/* View Mode Tabs + Selector */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'class' | 'teacher')} className="w-auto">
          <TabsList className="grid grid-cols-2 w-fit">
            <TabsTrigger
              value="class"
              className="gap-2 px-4 data-[state=active]:bg-teal-600 data-[state=active]:text-white"
            >
              <GraduationCap className="h-4 w-4" />
              حسب الصف
            </TabsTrigger>
            <TabsTrigger
              value="teacher"
              className="gap-2 px-4 data-[state=active]:bg-teal-600 data-[state=active]:text-white"
            >
              <User className="h-4 w-4" />
              حسب المدرس
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {viewMode === 'class' ? (
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-full sm:w-64 dark:bg-gray-800 dark:border-gray-700">
              <SelectValue placeholder="اختر الصف" />
            </SelectTrigger>
            <SelectContent>
              {CLASSES.map((cls) => (
                <SelectItem key={cls} value={cls}>{cls}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
            <SelectTrigger className="w-full sm:w-64 dark:bg-gray-800 dark:border-gray-700">
              <SelectValue placeholder="اختر المدرس" />
            </SelectTrigger>
            <SelectContent>
              {TEACHERS.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </motion.div>

      {/* Schedule Info Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border/50 dark:bg-gray-900/50 dark:border-gray-700 overflow-hidden relative">
          <div className="absolute top-0 right-0 left-0 h-1" style={{ background: 'linear-gradient(90deg, #0d9488, #14b8a6)' }} />
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-900/40">
              <Calendar className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">أيام الدراسة</p>
              <p className="text-lg font-bold dark:text-gray-200">5</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 dark:bg-gray-900/50 dark:border-gray-700 overflow-hidden relative">
          <div className="absolute top-0 right-0 left-0 h-1" style={{ background: 'linear-gradient(90deg, #059669, #10b981)' }} />
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/40">
              <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">عدد الحصص</p>
              <p className="text-lg font-bold dark:text-gray-200">7</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 dark:bg-gray-900/50 dark:border-gray-700 overflow-hidden relative">
          <div className="absolute top-0 right-0 left-0 h-1" style={{ background: 'linear-gradient(90deg, #0891b2, #06b6d4)' }} />
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-sky-50 dark:bg-sky-900/40">
              <BookOpen className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">المواد</p>
              <p className="text-lg font-bold dark:text-gray-200">{SUBJECTS.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 dark:bg-gray-900/50 dark:border-gray-700 overflow-hidden relative">
          <div className="absolute top-0 right-0 left-0 h-1" style={{ background: 'linear-gradient(90deg, #d97706, #f59e0b)' }} />
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/40">
              <Users className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">المدرسون</p>
              <p className="text-lg font-bold dark:text-gray-200">{TEACHERS.length}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Timetable Grid */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card className="dark:bg-gray-900/50 dark:border-gray-700 overflow-hidden relative">
          <div className="absolute top-0 right-0 left-0 h-1" style={{ background: 'linear-gradient(90deg, #0d9488, #059669)' }} />
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2 dark:text-gray-200">
                {viewMode === 'class' ? (
                  <>
                    <GraduationCap className="h-4 w-4" style={{ color: '#0d9488' }} />
                    جدول حصص: {selectedClass}
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4" style={{ color: '#0d9488' }} />
                    جدول المدرس: {selectedTeacher}
                  </>
                )}
              </CardTitle>
              <Badge variant="outline" className="text-xs dark:border-gray-600">العام الدراسي 2026-2027</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 dark:bg-gray-800/50">
                    <TableHead className="text-center w-28 font-semibold">الحصة / الوقت</TableHead>
                    {DAYS.map((day) => (
                      <TableHead key={day} className="text-center font-semibold min-w-[140px] dark:text-gray-300">
                        {day}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {PERIODS.map((period, periodIdx) => (
                      <motion.tr
                        key={`${viewMode}-${selectedClass}-${selectedTeacher}-${period.num}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: periodIdx * 0.03 }}
                        className="border-b hover:bg-muted/20 dark:hover:bg-gray-800/30 transition-colors"
                      >
                        <TableCell className="text-center bg-muted/10 dark:bg-gray-800/30">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="font-bold text-sm" style={{ color: '#0d9488' }}>
                              الحصة {period.num}
                            </span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {period.time}
                            </span>
                          </div>
                        </TableCell>
                        {DAYS.map((day) => {
                          const cell = schedule[day]?.[period.num];
                          if (!cell) return <TableCell key={day} className="text-center">—</TableCell>;

                          if (isBreak(cell)) {
                            return (
                              <TableCell key={day} className="text-center bg-amber-50/50 dark:bg-amber-900/20">
                                <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 text-xs dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700">
                                  استراحة
                                </Badge>
                              </TableCell>
                            );
                          }

                          if (isFree(cell)) {
                            return (
                              <TableCell key={day} className="text-center bg-gray-50/50 dark:bg-gray-800/30">
                                <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-200 text-xs dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600">
                                  فراغ
                                </Badge>
                              </TableCell>
                            );
                          }

                          const colors = SUBJECT_COLORS[cell.subject] || { bg: 'bg-gray-50 dark:bg-gray-800/30', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-700' };

                          return (
                            <TableCell key={day} className="text-center p-2">
                              <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: periodIdx * 0.03 }}
                                className={`rounded-lg border p-2 ${colors.bg} ${colors.border} cursor-pointer hover:shadow-sm transition-shadow`}
                              >
                                <p className={`font-bold text-xs ${colors.text}`}>
                                  {cell.subject}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
                                  {viewMode === 'class' ? (
                                    <>
                                      <User className="h-2.5 w-2.5" />
                                      {cell.teacher}
                                    </>
                                  ) : (
                                    <>
                                      <GraduationCap className="h-2.5 w-2.5" />
                                      {cell.teacher}
                                    </>
                                  )}
                                </p>
                                <p className="text-[10px] text-muted-foreground/70">
                                  {cell.room}
                                </p>
                              </motion.div>
                            </TableCell>
                          );
                        })}
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Subject Color Legend */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="dark:bg-gray-900/50 dark:border-gray-700 overflow-hidden relative">
          <div className="absolute top-0 right-0 left-0 h-1" style={{ background: 'linear-gradient(90deg, #0d9488, #059669)' }} />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 dark:text-gray-200">
              <Filter className="h-4 w-4 text-muted-foreground" />
              دليل ألوان المواد
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map((subject) => {
                const colors = SUBJECT_COLORS[subject];
                return (
                  <Badge
                    key={subject}
                    variant="outline"
                    className={`${colors.bg} ${colors.text} ${colors.border} text-xs px-3 py-1`}
                  >
                    {subject}
                  </Badge>
                );
              })}
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700 text-xs px-3 py-1">
                استراحة
              </Badge>
              <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 text-xs px-3 py-1">
                فراغ
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
