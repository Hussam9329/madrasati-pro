'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Edit, Trash2, BookOpen, Hash, Award, Target
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
import { useToast } from '@/hooks/use-toast'

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

export default function SubjectsPage() {
  const { toast } = useToast()
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
      toast({ title: 'خطأ', description: 'فشل في جلب بيانات المواد', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

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
      toast({ title: 'تنبيه', description: 'اسم المادة ورمزها مطلوبان', variant: 'destructive' })
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
        toast({ title: 'تم التحديث', description: 'تم تحديث بيانات المادة بنجاح' })
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
        toast({ title: 'تمت الإضافة', description: 'تم إضافة المادة بنجاح' })
      }
      setFormOpen(false)
      fetchSubjects()
    } catch (err) {
      toast({
        title: 'خطأ',
        description: err instanceof Error ? err.message : 'فشل في حفظ البيانات',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/subjects/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast({ title: 'تم الحذف', description: 'تم حذف المادة بنجاح' })
      fetchSubjects()
    } catch {
      toast({ title: 'خطأ', description: 'فشل في حذف المادة', variant: 'destructive' })
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
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">إدارة المواد الدراسية</h1>
        </div>
        <Button onClick={openAddForm} className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة مادة
        </Button>
      </div>

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
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <BookOpen className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-lg font-medium">لا توجد مواد دراسية</p>
          <p className="text-sm">قم بإضافة مواد جديدة للبدء</p>
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
                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-base">{subject.name}</h3>
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
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="أدخل اسم المادة"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>رمز المادة *</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="مثال: MAT"
                  dir="ltr"
                />
              </div>
              <div>
                <Label>النوع</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                  type="number"
                  value={form.maxScore}
                  onChange={(e) => setForm({ ...form, maxScore: e.target.value })}
                  placeholder="100"
                />
              </div>
              <div>
                <Label>درجة النجاح</Label>
                <Input
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
