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
  'التربية الإسلامية': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'اللغة العربية': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  'اللغة الإنجليزية': { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  'الأحياء': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  'الفيزياء': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'الكيمياء': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'الرياضيات': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-11 h-11 rounded-xl shadow-lg"
            style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}
          >
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">جدول الحصص</h1>
            <p className="text-sm text-muted-foreground">الأسبوع الدراسي - الأحد إلى الخميس</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Printer className="h-4 w-4" />
            طباعة
          </Button>
        </div>
      </div>

      {/* View Mode Tabs + Selector */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'class' | 'teacher')} className="w-auto">
          <TabsList className="grid grid-cols-2 w-fit">
            <TabsTrigger value="class" className="gap-2 px-4">
              <GraduationCap className="h-4 w-4" />
              حسب الصف
            </TabsTrigger>
            <TabsTrigger value="teacher" className="gap-2 px-4">
              <User className="h-4 w-4" />
              حسب المدرس
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {viewMode === 'class' ? (
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-full sm:w-64">
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
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="اختر المدرس" />
            </SelectTrigger>
            <SelectContent>
              {TEACHERS.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Schedule Info Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-teal-50">
                <Calendar className="h-4 w-4 text-teal-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">أيام الدراسة</p>
                <p className="text-lg font-bold">5</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-50">
                <Clock className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">عدد الحصص</p>
                <p className="text-lg font-bold">7</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-sky-50">
                <BookOpen className="h-4 w-4 text-sky-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">المواد</p>
                <p className="text-lg font-bold">{SUBJECTS.length}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-50">
                <Users className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">المدرسون</p>
                <p className="text-lg font-bold">{TEACHERS.length}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Timetable Grid */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
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
              <Badge variant="outline" className="text-xs">العام الدراسي 2026-2027</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-center w-28 font-semibold">الحصة / الوقت</TableHead>
                    {DAYS.map((day) => (
                      <TableHead key={day} className="text-center font-semibold min-w-[140px]">
                        {day}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="wait">
                    {PERIODS.map((period, periodIdx) => (
                      <motion.tr
                        key={`${viewMode}-${selectedClass}-${selectedTeacher}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: periodIdx * 0.03 }}
                        className="border-b hover:bg-muted/20 transition-colors"
                      >
                        <TableCell className="text-center bg-muted/10">
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
                              <TableCell key={day} className="text-center bg-amber-50/50">
                                <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                                  استراحة
                                </Badge>
                              </TableCell>
                            );
                          }

                          if (isFree(cell)) {
                            return (
                              <TableCell key={day} className="text-center bg-gray-50/50">
                                <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-200 text-xs">
                                  فراغ
                                </Badge>
                              </TableCell>
                            );
                          }

                          const colors = SUBJECT_COLORS[cell.subject] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };

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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
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
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs px-3 py-1">
                استراحة
              </Badge>
              <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 text-xs px-3 py-1">
                فراغ
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
