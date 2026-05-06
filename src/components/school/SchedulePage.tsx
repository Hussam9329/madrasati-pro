'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, BookOpen, Users, ChevronLeft, Printer,
  Plus, Trash2, AlertTriangle, CheckCircle, GraduationCap, User, Layers
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
import { useToast } from '@/hooks/use-toast';

interface Subject { id: string; name: string; code: string; type: string }
interface Teacher { id: string; fullName: string; phone: string | null; specialty: string | null }
interface ClassItem { id: string; name: string; level: string; stage: string; branch: string | null; sections: { id: string; name: string }[] }
interface ScheduleSlot {
  id: string; day: string; period: number; room: string | null;
  subject: { id: string; name: string; code: string; type: string };
  teacher: { id: string; fullName: string; phone: string | null };
  class: { id: string; name: string; level: string; stage: string; branch: string | null };
}

const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
const PERIODS = [
  { num: 1, time: '08:00 - 08:45' },
  { num: 2, time: '08:45 - 09:30' },
  { num: 3, time: '09:30 - 10:15' },
  { num: 4, time: '10:15 - 11:00' },
  { num: 5, time: '11:00 - 11:45' },
  { num: 6, time: '11:45 - 12:30' },
  { num: 7, time: '12:30 - 13:15' },
];

const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'التربية الإسلامية': { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-700' },
  'اللغة العربية': { bg: 'bg-teal-50 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-700' },
  'اللغة الإنجليزية': { bg: 'bg-sky-50 dark:bg-sky-900/30', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-200 dark:border-sky-700' },
  'الأحياء': { bg: 'bg-green-50 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-700' },
  'الفيزياء': { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-700' },
  'الكيمياء': { bg: 'bg-purple-50 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-700' },
  'الرياضيات': { bg: 'bg-rose-50 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-700' },
};
const DEFAULT_COLOR = { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-700' };

export default function SchedulePage() {
  const { toast } = useToast();
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
          toast({
            title: 'تضارب في الجدول!',
            description: data.error,
            variant: 'destructive',
          });
        } else {
          toast({ title: 'خطأ', description: data.error, variant: 'destructive' });
        }
        return;
      }
      toast({ title: 'تمت الإضافة', description: 'تمت إضافة الحصة بنجاح' });
      setAddDialogOpen(false);
      setNewSlot({ day: 'الأحد', period: 1, subjectId: '', teacherId: '', classId: '', room: '' });
      // Refresh schedule
      const params = new URLSearchParams({ schoolId });
      if (viewMode === 'class' && selectedClassId) params.set('classId', selectedClassId);
      if (viewMode === 'teacher' && selectedTeacherId) params.set('teacherId', selectedTeacherId);
      const refreshRes = await fetch(`/api/schedule?${params}`);
      if (refreshRes.ok) setSlots(await refreshRes.json());
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ في إضافة الحصة', variant: 'destructive' });
    }
  };

  // Delete slot
  const handleDeleteSlot = async (id: string) => {
    try {
      const res = await fetch(`/api/schedule?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'تم الحذف', description: 'تم حذف الحصة بنجاح' });
        setSlots(prev => prev.filter(s => s.id !== id));
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ في حذف الحصة', variant: 'destructive' });
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
      {/* Header */}
      <motion.div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-11 h-11 rounded-xl shadow-lg"
            style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
          >
            <Calendar className="h-5 w-5 text-white" />
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
                className="gap-2"
                style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
              >
                <Plus className="h-4 w-4" />
                إضافة حصة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" style={{ color: '#2563eb' }} />
                  إضافة حصة جديدة
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>اليوم</Label>
                    <Select value={newSlot.day} onValueChange={v => setNewSlot(p => ({ ...p, day: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>الحصة</Label>
                    <Select value={String(newSlot.period)} onValueChange={v => setNewSlot(p => ({ ...p, period: parseInt(v) }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PERIODS.map(p => <SelectItem key={p.num} value={String(p.num)}>الحصة {p.num}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>المادة</Label>
                  <Select value={newSlot.subjectId} onValueChange={v => setNewSlot(p => ({ ...p, subjectId: v }))}>
                    <SelectTrigger><SelectValue placeholder="اختر المادة" /></SelectTrigger>
                    <SelectContent>
                      {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>الأستاذ</Label>
                  <Select value={newSlot.teacherId} onValueChange={v => setNewSlot(p => ({ ...p, teacherId: v }))}>
                    <SelectTrigger><SelectValue placeholder="اختر الأستاذ" /></SelectTrigger>
                    <SelectContent>
                      {teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.fullName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>الصف</Label>
                  <Select value={newSlot.classId} onValueChange={v => setNewSlot(p => ({ ...p, classId: v }))}>
                    <SelectTrigger><SelectValue placeholder="اختر الصف" /></SelectTrigger>
                    <SelectContent>
                      {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>القاعة (اختياري)</Label>
                  <Input value={newSlot.room} onChange={e => setNewSlot(p => ({ ...p, room: e.target.value }))} placeholder="مثال: قاعة 1" />
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">سيتم التحقق من عدم وجود تضارب في أوقات الأستاذ والصف</p>
                </div>
                <Button
                  onClick={handleAddSlot}
                  className="w-full"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
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
          <div className="absolute top-0 right-0 left-0 h-1" style={{ background: 'linear-gradient(90deg, #2563eb, #3b82f6)' }} />
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
          <div className="absolute top-0 right-0 left-0 h-1" style={{ background: 'linear-gradient(90deg, #1d4ed8, #2563eb)' }} />
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
          <div className="absolute top-0 right-0 left-0 h-1" style={{ background: 'linear-gradient(90deg, #2563eb, #3b82f6)' }} />
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
          <div className="absolute top-0 right-0 left-0 h-1" style={{ background: 'linear-gradient(90deg, #1d4ed8, #2563eb)' }} />
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
            <SelectTrigger className="w-full sm:w-64 dark:bg-gray-800 dark:border-gray-700">
              <SelectValue placeholder="اختر الصف" />
            </SelectTrigger>
            <SelectContent>
              {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        ) : (
          <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
            <SelectTrigger className="w-full sm:w-64 dark:bg-gray-800 dark:border-gray-700">
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
        <div className="absolute top-0 right-0 left-0 h-1" style={{ background: 'linear-gradient(90deg, #2563eb, #1d4ed8)' }} />
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2 dark:text-gray-200">
              {viewMode === 'class' ? (
                <><GraduationCap className="h-4 w-4" style={{ color: '#2563eb' }} />جدول حصص: {selectedClassName}</>
              ) : (
                <><User className="h-4 w-4" style={{ color: '#2563eb' }} />جدول الأستاذ: {selectedTeacherName}</>
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
                        <span className="font-bold text-sm" style={{ color: '#2563eb' }}>الحصة {period.num}</span>
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
                              onClick={(e) => { e.stopPropagation(); handleDeleteSlot(slot.id); }}
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
        <Card className="dark:bg-gray-900/50 dark:border-gray-700">
          <CardContent className="text-center py-12">
            <Calendar className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">الجدول فارغ</h3>
            <p className="text-sm text-muted-foreground mb-4">ابدأ بإضافة الحصص لبناء جدول المدرسة</p>
            <Button
              onClick={() => setAddDialogOpen(true)}
              className="gap-2"
              style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
            >
              <Plus className="h-4 w-4" />
              إضافة حصة أولى
            </Button>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
