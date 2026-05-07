'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Edit, Trash2, BookOpen, Hash, Award, Target, Users, Flame,
  Lightbulb,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

// Types
interface TeacherOption {
  id: string
  fullName: string
}

interface ClassOption {
  id: string
  name: string
  sections: { id: string; name: string }[]
}

interface Subject {
  id: string
  name: string
  code: string
  type: string
  maxScore: number
  passScore: number
  schoolId: string
  teachers: {
    id: string
    teacherId: string
    teacher: { id: string; fullName: string; phone?: string }
  }[]
  classes: {
    id: string
    classId: string
    class: { id: string; name: string }
  }[]
  examTypes: {
    id: string
    name: string
    maxScore: number
  }[]
}

const SUBJECT_COLORS: Record<string, { bg: string; dot: string; icon: string }> = {
  'رياضيات': { bg: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500', icon: 'text-blue-600' },
  'فيزياء': { bg: 'bg-purple-50 border-purple-200', dot: 'bg-purple-500', icon: 'text-purple-600' },
  'كيمياء': { bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', icon: 'text-emerald-600' },
  'أحياء': { bg: 'bg-green-50 border-green-200', dot: 'bg-green-500', icon: 'text-green-600' },
  'عربي': { bg: 'bg-red-50 border-red-200', dot: 'bg-red-500', icon: 'text-red-600' },
  'انكليزي': { bg: 'bg-cyan-50 border-cyan-200', dot: 'bg-cyan-500', icon: 'text-cyan-600' },
  'تربية إسلامية': { bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500', icon: 'text-amber-600' },
  'تاريخ': { bg: 'bg-orange-50 border-orange-200', dot: 'bg-orange-500', icon: 'text-orange-600' },
  'جغرافية': { bg: 'bg-teal-50 border-teal-200', dot: 'bg-teal-500', icon: 'text-teal-600' },
  'حاسوب': { bg: 'bg-indigo-50 border-indigo-200', dot: 'bg-indigo-500', icon: 'text-indigo-600' },
  'تربية رياضية': { bg: 'bg-lime-50 border-lime-200', dot: 'bg-lime-500', icon: 'text-lime-600' },
  'فنية': { bg: 'bg-pink-50 border-pink-200', dot: 'bg-pink-500', icon: 'text-pink-600' },
}

const DEFAULT_SUBJECT_COLOR = { bg: 'bg-gray-50 border-gray-200', dot: 'bg-gray-400', icon: 'text-gray-600' }

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [teachers, setTeachers] = useState<TeacherOption[]>([])
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [form, setForm] = useState({
    name: '',
    code: '',
    type: 'أساسية',
    maxScore: '100',
    passScore: '50',
    selectedTeachers: [] as string[],
    selectedClasses: [] as string[],
  })

  const fetchSubjects = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/subjects')
      const data = await res.json()
      setSubjects(data || [])
    } catch {
      toast.error('خطأ', { description: 'فشل في جلب بيانات المواد' })
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTeachers = useCallback(async () => {
    try {
      const res = await fetch('/api/teachers')
      const data = await res.json()
      setTeachers((data || []).map((t: { id: string; fullName: string }) => ({
        id: t.id,
        fullName: t.fullName,
      })))
    } catch {
      // silent
    }
  }, [])

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch('/api/classes')
      const data = await res.json()
      setClasses(data || [])
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    fetchSubjects()
  }, [fetchSubjects])

  useEffect(() => {
    fetchTeachers()
    fetchClasses()
  }, [fetchTeachers, fetchClasses])

  const openAddForm = () => {
    setEditingSubject(null)
    setForm({
      name: '',
      code: '',
      type: 'أساسية',
      maxScore: '100',
      passScore: '50',
      selectedTeachers: [],
      selectedClasses: [],
    })
    setFormOpen(true)
  }

  const openEditForm = (subject: Subject) => {
    setEditingSubject(subject)
    setForm({
      name: subject.name,
      code: subject.code,
      type: subject.type,
      maxScore: String(subject.maxScore),
      passScore: String(subject.passScore),
      selectedTeachers: subject.teachers.map(t => t.teacherId),
      selectedClasses: subject.classes.map(c => c.classId),
    })
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.code) {
      toast.error('تنبيه', { description: 'اسم المادة ورمزها مطلوبان' })
      return
    }

    setSaving(true)
    try {
      const schoolId = subjects[0]?.schoolId || ''

      if (editingSubject) {
        const res = await fetch(`/api/subjects/${editingSubject.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            code: form.code,
            type: form.type,
            maxScore: parseInt(form.maxScore) || 100,
            passScore: parseInt(form.passScore) || 50,
            teacherIds: form.selectedTeachers,
            classIds: form.selectedClasses,
          }),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Failed')
        }
        toast.success('تم التحديث', { description: 'تم تحديث بيانات المادة بنجاح' })
      } else {
        const res = await fetch('/api/subjects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            code: form.code,
            type: form.type,
            maxScore: parseInt(form.maxScore) || 100,
            passScore: parseInt(form.passScore) || 50,
            schoolId,
            teacherIds: form.selectedTeachers,
            classIds: form.selectedClasses,
          }),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Failed')
        }
        toast.success('تمت الإضافة', { description: 'تم إضافة المادة بنجاح' })
      }
      setFormOpen(false)
      fetchSubjects()
    } catch (err) {
      toast.error('خطأ', { description: err instanceof Error ? err.message : 'فشل في حفظ البيانات' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/subjects/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('تم الحذف', { description: 'تم حذف المادة بنجاح' })
      fetchSubjects()
    } catch {
      toast.error('خطأ', { description: 'فشل في حذف المادة' })
    } finally {
      setDeleteId(null)
    }
  }

  const toggleTeacher = (teacherId: string) => {
    setForm(prev => ({
      ...prev,
      selectedTeachers: prev.selectedTeachers.includes(teacherId)
        ? prev.selectedTeachers.filter(id => id !== teacherId)
        : [...prev.selectedTeachers, teacherId],
    }))
  }

  const toggleClass = (classId: string) => {
    setForm(prev => ({
      ...prev,
      selectedClasses: prev.selectedClasses.includes(classId)
        ? prev.selectedClasses.filter(id => id !== classId)
        : [...prev.selectedClasses, classId],
    }))
  }

  return (
    <div className="space-y-6">
      {/* Page Guidance Hint */}
      <div className="hint-card p-3 flex items-start gap-3">
        <Lightbulb className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">المواد الدراسية</p>
          <p className="text-xs text-blue-600 dark:text-blue-400">أضف المواد الدراسية وحدد رمز لكل مادة. المواد تظهر تلقائياً عند إدخال الدرجات وبناء الجدول.</p>
        </div>
      </div>

      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary"
          >
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold">إدارة المواد الدراسية</h1>
        </div>
        <Button onClick={openAddForm} className="gap-2 bg-primary">
          <Plus className="h-4 w-4" />
          إضافة مادة
        </Button>
      </div>

      {/* Subject Stats Summary */}
      {!loading && subjects.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'إجمالي المواد', count: subjects.length, icon: BookOpen, textClass: 'text-teal-600', bg: 'bg-teal-50', iconBg: 'bg-teal-100', border: 'border-teal-200' },
            { label: 'مواد أساسية', count: subjects.filter(s => s.type === 'أساسية').length, icon: Flame, textClass: 'text-emerald-600', bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', border: 'border-emerald-200' },
            { label: 'مواد اختيارية', count: subjects.filter(s => s.type === 'اختيارية').length, icon: Target, textClass: 'text-amber-600', bg: 'bg-amber-50', iconBg: 'bg-amber-100', border: 'border-amber-200' },
            { label: 'المدرسون المرتبطون', count: new Set(subjects.flatMap(s => s.teachers.map(t => t.teacherId))).size, icon: Users, textClass: 'text-cyan-600', bg: 'bg-cyan-50', iconBg: 'bg-cyan-100', border: 'border-cyan-200' },
          ].map(stat => (
            <div key={stat.label} className={`flex items-center gap-3 p-3 rounded-xl border ${stat.border} ${stat.bg}`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.iconBg}`}>
                <stat.icon className={`w-4 h-4 ${stat.textClass}`} />
              </div>
              <div>
                <p className={`text-xl font-bold ${stat.textClass}`}>{stat.count}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Subjects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookOpen className="h-16 w-16 mb-4 text-muted-foreground/20" />
          <h3 className="text-lg font-semibold text-muted-foreground">لا توجد مواد دراسية بعد</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">ابدأ بإضافة المواد الدراسية وتحديد رمز لكل مادة. ستظهر المواد تلقائياً عند إدخال الدرجات وبناء الجدول الدراسي.</p>
          <Button className="mt-4 gap-2 bg-primary" onClick={openAddForm}>
            <Plus className="h-4 w-4" />
            إضافة مادة جديدة
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {subjects.map((subject, idx) => (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className={`overflow-hidden hover:shadow-lg transition-all duration-300 group relative ${SUBJECT_COLORS[subject.name]?.bg || DEFAULT_SUBJECT_COLOR.bg}`}>
                  <div className="absolute top-0 right-0 left-0 h-1 rounded-t-lg bg-primary" />
                  <CardContent className="p-6 pt-5 relative">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 shrink-0 bg-white/60">
                          <BookOpen className={`w-4 h-4 ${SUBJECT_COLORS[subject.name]?.icon || DEFAULT_SUBJECT_COLOR.icon}`} />
                        </div>
                        <div>
                          <h3 className="font-bold text-base flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${SUBJECT_COLORS[subject.name]?.dot || DEFAULT_SUBJECT_COLOR.dot}`} />
                            {subject.name}
                          </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs font-mono">
                            <Hash className="h-3 w-3 ml-1" />
                            {subject.code}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs',
                              subject.type === 'أساسية'
                                ? 'bg-primary/10 text-primary border-primary/20'
                                : 'bg-amber-100 text-amber-700 border-amber-200'
                            )}
                          >
                            {subject.type}
                          </Badge>
                        </div>
                      </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditForm(subject)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(subject.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Scores */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Award className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">الدرجة الكاملة:</span>
                        <span className="font-bold">{subject.maxScore}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">درجة النجاح:</span>
                        <span className="font-bold">{subject.passScore}</span>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    {/* Teachers */}
                    {subject.teachers.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-muted-foreground mb-1.5">المدرسون:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {subject.teachers.map(t => (
                            <Badge key={t.id} variant="secondary" className="text-xs">
                              {t.teacher.fullName}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Classes */}
                    {subject.classes.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">الصفوف:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {subject.classes.map(c => (
                            <Badge key={c.id} variant="outline" className="text-xs">
                              {c.class.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Exam Types */}
                    {subject.examTypes && subject.examTypes.length > 0 && (
                      <>
                        <Separator className="my-3" />
                        <div>
                          <p className="text-xs text-muted-foreground mb-1.5">أنواع الامتحانات:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {subject.examTypes.map(et => (
                              <Badge key={et.id} variant="outline" className="text-xs bg-muted/50">
                                {et.name} ({et.maxScore})
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Subject Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSubject ? 'تعديل المادة' : 'إضافة مادة جديدة'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>اسم المادة *</Label>
              <Input
                id="subjectName"
                name="subjectName"
                autoComplete="off"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="أدخل اسم المادة"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>رمز المادة *</Label>
                <Input
                  id="subjectCode"
                  name="subjectCode"
                  autoComplete="off"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="مثال: MAT"
                  dir="ltr"
                />
              </div>
              <div>
                <Label>النوع</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger id="subjectType"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="أساسية">أساسية</SelectItem>
                    <SelectItem value="اختيارية">اختيارية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>الدرجة الكاملة</Label>
                <Input
                  id="maxScore"
                  name="maxScore"
                  autoComplete="off"
                  type="number"
                  value={form.maxScore}
                  onChange={(e) => setForm({ ...form, maxScore: e.target.value })}
                  placeholder="100"
                />
              </div>
              <div>
                <Label>درجة النجاح</Label>
                <Input
                  id="passScore"
                  name="passScore"
                  autoComplete="off"
                  type="number"
                  value={form.passScore}
                  onChange={(e) => setForm({ ...form, passScore: e.target.value })}
                  placeholder="50"
                />
              </div>
            </div>

            <Separator />

            {/* Teachers Multi-select */}
            <div>
              <Label className="mb-3 block">المدرسون</Label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                {teachers.map(teacher => (
                  <label
                    key={teacher.id}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors',
                      form.selectedTeachers.includes(teacher.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    )}
                  >
                    <Checkbox
                      checked={form.selectedTeachers.includes(teacher.id)}
                      onCheckedChange={() => toggleTeacher(teacher.id)}
                    />
                    <span className="text-sm truncate">{teacher.fullName}</span>
                  </label>
                ))}
              </div>
              {teachers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">لا يوجد مدرسين مسجلين</p>
              )}
            </div>

            <Separator />

            {/* Classes Multi-select */}
            <div>
              <Label className="mb-3 block">الصفوف</Label>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-1">
                {classes.map(cls => (
                  <label
                    key={cls.id}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors',
                      form.selectedClasses.includes(cls.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    )}
                  >
                    <Checkbox
                      checked={form.selectedClasses.includes(cls.id)}
                      onCheckedChange={() => toggleClass(cls.id)}
                    />
                    <span className="text-sm">{cls.name}</span>
                  </label>
                ))}
              </div>
              {classes.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">لا توجد صفوف مسجلة</p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setFormOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'جاري الحفظ...' : editingSubject ? 'تحديث' : 'إضافة'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذه المادة؟ سيتم حذف جميع الدرجات وأنواع الامتحانات المرتبطة بها.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
