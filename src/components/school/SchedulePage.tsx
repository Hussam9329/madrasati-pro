'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, BookOpen, Users, ChevronLeft, Printer,
  Plus, Trash2, AlertTriangle, CheckCircle, GraduationCap, User, Layers, Lightbulb
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/empty-state';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Types
import type { SubjectBasic as Subject, TeacherBasic as Teacher, ClassItem, ScheduleSlot } from '@/types'
import { DAYS, SUBJECT_COLORS, DEFAULT_SUBJECT_COLOR as DEFAULT_COLOR } from '@/lib/constants'

// PERIODS kept inline (has time data not in shared constants)
const PERIODS = [
  { num: 1, time: '08:00 - 08:45' },
  { num: 2, time: '08:45 - 09:30' },
  { num: 3, time: '09:30 - 10:15' },
  { num: 4, time: '10:15 - 11:00' },
  { num: 5, time: '11:00 - 11:45' },
  { num: 6, time: '11:45 - 12:30' },
  { num: 7, time: '12:30 - 13:15' },
];

export default function SchedulePage() {
  const [viewMode, setViewMode] = useState<'class' | 'teacher'>('class');
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schoolId, setSchoolId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteSlotId, setDeleteSlotId] = useState<string | null>(null);
  const [newSlot, setNewSlot] = useState({ day: 'الأحد', period: 1, subjectId: '', teacherId: '', classId: '', room: '' });

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [schoolRes, classesRes, teachersRes, subjectsRes] = await Promise.all([
          fetch('/api/school'),
          fetch('/api/classes'),
          fetch('/api/teachers'),
          fetch('/api/subjects'),
        ]);
        if (schoolRes.ok) {
          const sData = await schoolRes.json();
          if (sData.school) {
            setSchoolId(sData.school.id);
            setSelectedClassId(sData.school.id ? '' : '');
          }
        }
        if (classesRes.ok) {
          const cData = await classesRes.json();
          setClasses(cData);
          if (cData.length > 0) setSelectedClassId(cData[0].id);
        }
        if (teachersRes.ok) {
          setTeachers(await teachersRes.json());
          const tData = await teachersRes.json();
          if (tData.length > 0) setSelectedTeacherId(tData[0].id);
        }
        if (subjectsRes.ok) setSubjects(await subjectsRes.json());
      } catch (err) {
        console.error('Failed to fetch data', err);
      }
    };
    fetchData();
  }, []);

  // Fetch schedule based on view mode
  useEffect(() => {
    if (!schoolId) return;
    const fetchSchedule = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ schoolId });
        if (viewMode === 'class' && selectedClassId) params.set('classId', selectedClassId);
        if (viewMode === 'teacher' && selectedTeacherId) params.set('teacherId', selectedTeacherId);

        const res = await fetch(`/api/schedule?${params}`);
        if (res.ok) {
          setSlots(await res.json());
        }
      } catch (err) {
        console.error('Failed to fetch schedule', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, [viewMode, selectedClassId, selectedTeacherId, schoolId]);

  // Build schedule grid from slots
  const scheduleGrid: Record<string, Record<number, ScheduleSlot>> = {};
  DAYS.forEach(day => { scheduleGrid[day] = {}; });
  slots.forEach(slot => {
    if (scheduleGrid[slot.day]) {
      scheduleGrid[slot.day][slot.period] = slot;
    }
  });

  // Add new slot
  const handleAddSlot = async () => {
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newSlot, schoolId }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.conflictType) {
          toast.error('تضارب في الجدول!', { description: data.error });
        } else {
          toast.error('خطأ', { description: data.error });
        }
        return;
      }
      toast.success('تمت الإضافة', { description: 'تمت إضافة الحصة بنجاح' });
      setAddDialogOpen(false);
      setNewSlot({ day: 'الأحد', period: 1, subjectId: '', teacherId: '', classId: '', room: '' });
      // Refresh schedule
      const params = new URLSearchParams({ schoolId });
      if (viewMode === 'class' && selectedClassId) params.set('classId', selectedClassId);
      if (viewMode === 'teacher' && selectedTeacherId) params.set('teacherId', selectedTeacherId);
      const refreshRes = await fetch(`/api/schedule?${params}`);
      if (refreshRes.ok) setSlots(await refreshRes.json());
    } catch {
      toast.error('خطأ', { description: 'تعذر إضافة الحصة. حاول مرة أخرى.' });
    }
  };

  // Delete slot
  const handleDeleteSlot = async () => {
    if (!deleteSlotId) return;
    try {
      const res = await fetch(`/api/schedule?id=${deleteSlotId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('تم الحذف', { description: 'تم حذف الحصة بنجاح' });
        setSlots(prev => prev.filter(s => s.id !== deleteSlotId));
      } else {
        toast.error('خطأ', { description: 'تعذر حذف الحصة. حاول مرة أخرى.' });
      }
    } catch {
      toast.error('خطأ', { description: 'تعذر حذف الحصة. حاول مرة أخرى.' });
    } finally {
      setDeleteSlotId(null);
    }
  };

  const selectedClassName = classes.find(c => c.id === selectedClassId)?.name || '';
  const selectedTeacherName = teachers.find(t => t.id === selectedTeacherId)?.fullName || '';

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="hint-card p-3 flex items-start gap-3">
        <Lightbulb className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">جدول الحصص</p>
          <p className="text-xs text-blue-600 dark:text-blue-400">أنشئ جدول الحصص لكل صف. النظام يكتشف التضاربات تلقائياً بين الحصص والمدرسين والقاعات.</p>
        </div>
      </div>
      {/* Header */}
      <motion.div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-11 h-11 rounded-xl shadow-lg bg-primary text-white"
          >
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold dark:text-gray-200">جدول الحصص</h1>
            <p className="text-sm text-muted-foreground">تنظيم جدول المدرسين بدون تضاربات</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="gap-2 bg-primary text-white"
              >
                <Plus className="h-4 w-4" />
                إضافة حصة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" />
                  إضافة حصة جديدة
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>اليوم</Label>
                    <Select value={newSlot.day} onValueChange={v => setNewSlot(p => ({ ...p, day: v }))}>
                      <SelectTrigger id="scheduleDay"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>الحصة</Label>
                    <Select value={String(newSlot.period)} onValueChange={v => setNewSlot(p => ({ ...p, period: parseInt(v) }))}>
                      <SelectTrigger id="schedulePeriod"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PERIODS.map(p => <SelectItem key={p.num} value={String(p.num)}>الحصة {p.num}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>المادة</Label>
                  <Select value={newSlot.subjectId} onValueChange={v => setNewSlot(p => ({ ...p, subjectId: v }))}>
                    <SelectTrigger id="scheduleSubject"><SelectValue placeholder="اختر المادة" /></SelectTrigger>
                    <SelectContent>
                      {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>الأستاذ</Label>
                  <Select value={newSlot.teacherId} onValueChange={v => setNewSlot(p => ({ ...p, teacherId: v }))}>
                    <SelectTrigger id="scheduleTeacher"><SelectValue placeholder="اختر الأستاذ" /></SelectTrigger>
                    <SelectContent>
                      {teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.fullName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>الصف</Label>
                  <Select value={newSlot.classId} onValueChange={v => setNewSlot(p => ({ ...p, classId: v }))}>
                    <SelectTrigger id="scheduleClass"><SelectValue placeholder="اختر الصف" /></SelectTrigger>
                    <SelectContent>
                      {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>القاعة (اختياري)</Label>
                  <Input id="room" name="room" autoComplete="off" value={newSlot.room} onChange={e => setNewSlot(p => ({ ...p, room: e.target.value }))} placeholder="مثال: قاعة 1" />
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">سيتم التحقق من عدم وجود تضارب في أوقات الأستاذ والصف</p>
                </div>
                <Button
                  onClick={handleAddSlot}
                  className="w-full bg-primary text-white"
                  disabled={!newSlot.subjectId || !newSlot.teacherId || !newSlot.classId}
                >
                  إضافة الحصة
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" />
            طباعة
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border/50 dark:bg-gray-900/50 dark:border-gray-700 overflow-hidden relative">
          <div className="absolute top-0 right-0 left-0 h-1 bg-primary" />
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/40">
              <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">أيام الدراسة</p>
              <p className="text-lg font-bold dark:text-gray-200">5</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 dark:bg-gray-900/50 dark:border-gray-700 overflow-hidden relative">
          <div className="absolute top-0 right-0 left-0 h-1 bg-primary" />
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/40">
              <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">عدد الحصص</p>
              <p className="text-lg font-bold dark:text-gray-200">7</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 dark:bg-gray-900/50 dark:border-gray-700 overflow-hidden relative">
          <div className="absolute top-0 right-0 left-0 h-1 bg-primary" />
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-sky-50 dark:bg-sky-900/40">
              <BookOpen className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">الحصص المسجلة</p>
              <p className="text-lg font-bold dark:text-gray-200">{slots.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 dark:bg-gray-900/50 dark:border-gray-700 overflow-hidden relative">
          <div className="absolute top-0 right-0 left-0 h-1 bg-primary" />
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/40">
              <Users className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">المدرسون</p>
              <p className="text-lg font-bold dark:text-gray-200">{teachers.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Mode Tabs + Selector */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <Tabs value={viewMode} onValueChange={v => setViewMode(v as 'class' | 'teacher')} className="w-auto">
          <TabsList className="grid grid-cols-2 w-fit">
            <TabsTrigger value="class" className="gap-2 px-4 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <GraduationCap className="h-4 w-4" />
              حسب الصف
            </TabsTrigger>
            <TabsTrigger value="teacher" className="gap-2 px-4 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <User className="h-4 w-4" />
              حسب الأستاذ
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {viewMode === 'class' ? (
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger id="viewClass" className="w-full sm:w-64 dark:bg-gray-800 dark:border-gray-700">
              <SelectValue placeholder="اختر الصف" />
            </SelectTrigger>
            <SelectContent>
              {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        ) : (
          <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
            <SelectTrigger id="viewTeacher" className="w-full sm:w-64 dark:bg-gray-800 dark:border-gray-700">
              <SelectValue placeholder="اختر الأستاذ" />
            </SelectTrigger>
            <SelectContent>
              {teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.fullName}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Timetable Grid */}
      <Card className="dark:bg-gray-900/50 dark:border-gray-700 overflow-hidden relative">
        <div className="absolute top-0 right-0 left-0 h-1 bg-primary" />
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2 dark:text-gray-200">
              {viewMode === 'class' ? (
                <><GraduationCap className="h-4 w-4 text-primary" />جدول حصص: {selectedClassName}</>
              ) : (
                <><User className="h-4 w-4 text-primary" />جدول الأستاذ: {selectedTeacherName}</>
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
                  {DAYS.map(day => (
                    <TableHead key={day} className="text-center font-semibold min-w-[140px] dark:text-gray-300">{day}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {PERIODS.map((period, periodIdx) => (
                  <TableRow key={period.num} className="border-b hover:bg-muted/20 dark:hover:bg-gray-800/30 transition-colors">
                    <TableCell className="text-center bg-muted/10 dark:bg-gray-800/30">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="font-bold text-sm text-primary">الحصة {period.num}</span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />{period.time}
                        </span>
                      </div>
                    </TableCell>
                    {DAYS.map(day => {
                      const slot = scheduleGrid[day]?.[period.num];
                      if (!slot) {
                        return (
                          <TableCell key={day} className="text-center p-2">
                            <div className="rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 p-3 opacity-40 hover:opacity-70 transition-opacity cursor-pointer"
                              onClick={() => {
                                setNewSlot(p => ({ ...p, day, period: period.num }));
                                setAddDialogOpen(true);
                              }}
                            >
                              <Plus className="h-4 w-4 mx-auto text-muted-foreground" />
                            </div>
                          </TableCell>
                        );
                      }

                      const colors = SUBJECT_COLORS[slot.subject.name] || DEFAULT_COLOR;

                      return (
                        <TableCell key={day} className="text-center p-2">
                          <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={`rounded-lg border p-2 ${colors.bg} ${colors.border} relative group cursor-pointer hover:shadow-sm transition-shadow`}
                          >
                            <p className={`font-bold text-xs ${colors.text}`}>{slot.subject.name}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
                              {viewMode === 'class' ? (
                                <><User className="h-2.5 w-2.5" />{slot.teacher.fullName}</>
                              ) : (
                                <><GraduationCap className="h-2.5 w-2.5" />{slot.class.name}</>
                              )}
                            </p>
                            {slot.room && <p className="text-[10px] text-muted-foreground/70">{slot.room}</p>}
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteSlotId(slot.id); }}
                              className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </motion.div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Empty state */}
      {slots.length === 0 && !loading && (
        <EmptyState
          icon={Calendar}
          title="الجدول فارغ"
          description="لم يتم إضافة أي حصص بعد. ابدأ ببناء جدول الحصص للمدرسة."
          actionLabel="إضافة حصة أولى"
          onAction={() => setAddDialogOpen(true)}
        />
      )}
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteSlotId} onOpenChange={() => setDeleteSlotId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف الحصة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذه الحصة؟ لا يمكن التراجع عن هذا الإجراء وسيتم إزالة الحصة من الجدول نهائياً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSlot} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
