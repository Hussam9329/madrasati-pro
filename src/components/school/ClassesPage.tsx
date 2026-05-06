'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Layers, Plus, Trash2, Edit, Users, BookOpen, GraduationCap,
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
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'

// ─── Types ───────────────────────────────────────────────────────
interface Section {
  id: string
  name: string
  classId: string
  _count?: { students: number }
}

interface TeacherClassItem {
  id: string
  teacherId: string
  classId: string
  sectionId: string | null
  teacher: { id: string; fullName: string; notes?: string | null; phone?: string | null }
}

interface ClassItem {
  id: string
  name: string
  level: string
  stage: string
  branch: string | null
  schoolId: string
  sections: Section[]
  _count: { students: number }
  subjects?: {
    id: string
    classId: string
    subject: { id: string; name: string; code: string }
  }[]
}

interface TeacherOption {
  id: string
  fullName: string
  notes?: string | null
  subjects?: string[]
}

// ─── Constants ───────────────────────────────────────────────────
const LEVELS = ['إعدادي', 'متوسط', 'ابتدائي'] as const
const STAGES = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس'] as const
const BRANCHES = ['علمي', 'أدبي', 'أحيائي', 'تطبيقي'] as const
const SECTION_OPTIONS = ['أ', 'ب', 'ج', 'د', 'هـ'] as const

const LEVEL_COLORS: Record<string, { bg: string; border: string; dot: string; icon: string }> = {
  'إعدادي': { bg: 'bg-blue-50 border-blue-200', border: 'border-blue-200', dot: 'bg-blue-500', icon: 'text-blue-600' },
  'متوسط': { bg: 'bg-violet-50 border-violet-200', border: 'border-violet-200', dot: 'bg-violet-500', icon: 'text-violet-600' },
  'ابتدائي': { bg: 'bg-emerald-50 border-emerald-200', border: 'border-emerald-200', dot: 'bg-emerald-500', icon: 'text-emerald-600' },
}

const STAGE_BADGE: Record<string, string> = {
  'الأول': 'bg-sky-100 text-sky-700 border-sky-200',
  'الثاني': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'الثالث': 'bg-violet-100 text-violet-700 border-violet-200',
  'الرابع': 'bg-purple-100 text-purple-700 border-purple-200',
  'الخامس': 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
  'السادس': 'bg-pink-100 text-pink-700 border-pink-200',
}

const BRANCH_BADGE: Record<string, string> = {
  'علمي': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  'أدبي': 'bg-amber-100 text-amber-700 border-amber-200',
  'أحيائي': 'bg-green-100 text-green-700 border-green-200',
  'تطبيقي': 'bg-orange-100 text-orange-700 border-orange-200',
}

const SECTION_COLORS: Record<string, string> = {
  'أ': 'bg-blue-100 text-blue-700',
  'ب': 'bg-violet-100 text-violet-700',
  'ج': 'bg-emerald-100 text-emerald-700',
  'د': 'bg-amber-100 text-amber-700',
  'هـ': 'bg-rose-100 text-rose-700',
}

// ─── Component ───────────────────────────────────────────────────
export default function ClassesPage() {
  const { toast } = useToast()

  // Data
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [teachers, setTeachers] = useState<TeacherOption[]>([])
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherClassItem[]>([])
  const [schoolId, setSchoolId] = useState('')
  const [loading, setLoading] = useState(true)

  // Dialogs
  const [formOpen, setFormOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Assign teacher state
  const [assignTarget, setAssignTarget] = useState<{ classId: string; sectionId?: string } | null>(null)
  const [assignTeacherId, setAssignTeacherId] = useState('')

  // Form state
  const [form, setForm] = useState({
    name: '',
    level: 'إعدادي',
    stage: 'الأول',
    branch: '',
    selectedSections: ['أ'] as string[],
  })

  // ─── Fetchers ─────────────────────────────────────────────────
  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch('/api/classes')
      const data = await res.json()
      setClasses(data || [])
    } catch {
      toast({ title: 'خطأ', description: 'فشل في جلب بيانات الصفوف', variant: 'destructive' })
    }
  }, [toast])

  const fetchTeachers = useCallback(async () => {
    try {
      const res = await fetch('/api/teachers')
      const data = await res.json()
      setTeachers((data || []).map((t: { id: string; fullName: string; notes?: string | null; subjects?: { subject: { name: string } }[] }) => ({
        id: t.id,
        fullName: t.fullName,
        notes: t.notes,
        subjects: t.subjects?.map((s: { subject: { name: string } }) => s.subject.name) || [],
      })))
    } catch {
      // silent
    }
  }, [])

  const fetchSchool = useCallback(async () => {
    try {
      const res = await fetch('/api/school')
      const data = await res.json()
      if (data.school?.id) setSchoolId(data.school.id)
    } catch {
      // silent
    }
  }, [])

  const fetchAssignments = useCallback(async () => {
    try {
      const res = await fetch('/api/teacher-classes')
      const data = await res.json()
      setTeacherAssignments(data || [])
    } catch {
      // silent
    }
  }, [])

  // Initial load
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true)
      await Promise.all([fetchClasses(), fetchTeachers(), fetchSchool(), fetchAssignments()])
      setLoading(false)
    }
    loadAll()
  }, [])

  // ─── Helpers ───────────────────────────────────────────────────
  const getTeachersForClass = (classId: string, sectionId?: string) => {
    return teacherAssignments.filter(
      a => a.classId === classId && (!sectionId || a.sectionId === sectionId)
    )
  }

  const getLevelColor = (level: string) => LEVEL_COLORS[level] || LEVEL_COLORS['إعدادي']

  // ─── Create / Save ────────────────────────────────────────────
  const openAddForm = () => {
    setForm({
      name: '',
      level: 'إعدادي',
      stage: 'الأول',
      branch: '',
      selectedSections: ['أ'],
    })
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.name) {
      toast({ title: 'تنبيه', description: 'اسم الصف مطلوب', variant: 'destructive' })
      return
    }
    if (form.selectedSections.length === 0) {
      toast({ title: 'تنبيه', description: 'يجب اختيار شعبة واحدة على الأقل', variant: 'destructive' })
      return
    }
    if (!schoolId) {
      toast({ title: 'تنبيه', description: 'لم يتم العثور على معرف المدرسة', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          level: form.level,
          stage: form.stage,
          branch: form.branch || undefined,
          schoolId,
          sections: form.selectedSections.map(name => ({ name })),
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed')
      }
      toast({ title: 'تمت الإضافة', description: 'تم إضافة الصف بنجاح' })
      setFormOpen(false)
      fetchClasses()
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

  // ─── Delete ────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/classes/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast({ title: 'تم الحذف', description: 'تم حذف الصف بنجاح' })
      fetchClasses()
    } catch {
      toast({ title: 'خطأ', description: 'فشل في حذف الصف', variant: 'destructive' })
    } finally {
      setDeleteId(null)
    }
  }

  // ─── Assign Teacher ────────────────────────────────────────────
  const openAssignDialog = (classId: string, sectionId?: string) => {
    setAssignTarget({ classId, sectionId })
    setAssignTeacherId('')
    setAssignOpen(true)
  }

  const handleAssign = async () => {
    if (!assignTeacherId || !assignTarget) {
      toast({ title: 'تنبيه', description: 'يرجى اختيار الأستاذ', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/teacher-classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: assignTeacherId,
          classId: assignTarget.classId,
          sectionId: assignTarget.sectionId || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed')
      }
      toast({ title: 'تم التعيين', description: 'تم تعيين الأستاذ بنجاح' })
      setAssignOpen(false)
      fetchAssignments()
    } catch (err) {
      toast({
        title: 'خطأ',
        description: err instanceof Error ? err.message : 'فشل في تعيين الأستاذ',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveAssignment = async (assignmentId: string) => {
    try {
      const res = await fetch(`/api/teacher-classes?id=${assignmentId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast({ title: 'تم الإلغاء', description: 'تم إلغاء تعيين الأستاذ بنجاح' })
      fetchAssignments()
    } catch {
      toast({ title: 'خطأ', description: 'فشل في إلغاء التعيين', variant: 'destructive' })
    }
  }

  // ─── Section Toggle ────────────────────────────────────────────
  const toggleSection = (sectionName: string) => {
    setForm(prev => ({
      ...prev,
      selectedSections: prev.selectedSections.includes(sectionName)
        ? prev.selectedSections.filter(s => s !== sectionName)
        : [...prev.selectedSections, sectionName],
    }))
  }

  // ─── Stats ─────────────────────────────────────────────────────
  const totalStudents = classes.reduce((sum, c) => sum + (c._count?.students || 0), 0)
  const totalSections = classes.reduce((sum, c) => sum + c.sections.length, 0)

  // ─── Render ────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
            >
              <Layers className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold">الصفوف والشعب</h1>
          </div>
          <Button onClick={openAddForm} className="gap-2" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
            <Plus className="h-4 w-4" />
            إضافة صف جديد
          </Button>
        </div>

        {/* Stats Summary */}
        {!loading && classes.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'إجمالي الصفوف', count: classes.length, icon: Layers, color: '#2563eb', bg: 'bg-blue-50', iconBg: 'bg-blue-100', border: 'border-blue-200' },
              { label: 'إجمالي الشعب', count: totalSections, icon: BookOpen, color: '#7c3aed', bg: 'bg-violet-50', iconBg: 'bg-violet-100', border: 'border-violet-200' },
              { label: 'إجمالي الطلاب', count: totalStudents, icon: Users, color: '#059669', bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', border: 'border-emerald-200' },
              { label: 'المدرسون المعينون', count: new Set(teacherAssignments.map(a => a.teacherId)).size, icon: GraduationCap, color: '#d97706', bg: 'bg-amber-50', iconBg: 'bg-amber-100', border: 'border-amber-200' },
            ].map(stat => (
              <div key={stat.label} className={`flex items-center gap-3 p-3 rounded-xl border ${stat.border} ${stat.bg}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.iconBg}`}>
                  <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
                <div>
                  <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.count}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Classes Grid */}
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
      ) : classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Layers className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-lg font-medium">لا توجد صفوف دراسية</p>
          <p className="text-sm">قم بإضافة صفوف جديدة للبدء</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {classes.map((cls, idx) => {
              const levelColor = getLevelColor(cls.level)
              const classTeachers = getTeachersForClass(cls.id)

              return (
                <motion.div
                  key={cls.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className={`overflow-hidden hover:shadow-lg transition-all duration-300 group relative ${levelColor.bg}`}>
                    {/* Gradient header line */}
                    <div className="absolute top-0 right-0 left-0 h-1" style={{ background: 'linear-gradient(90deg, #2563eb, #1d4ed8)' }} />

                    <CardContent className="p-6 pt-5 relative">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 shrink-0 bg-white/60">
                            <Layers className={`w-4 h-4 ${levelColor.icon}`} />
                          </div>
                          <div>
                            <h3 className="font-bold text-base flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${levelColor.dot}`} />
                              {cls.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <Badge variant="outline" className={`text-xs ${STAGE_BADGE[cls.stage] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                {cls.stage}
                              </Badge>
                              <Badge variant="outline" className={`text-xs ${levelColor.bg} ${levelColor.icon} ${levelColor.border}`}>
                                {cls.level}
                              </Badge>
                              {cls.branch && (
                                <Badge variant="outline" className={`text-xs ${BRANCH_BADGE[cls.branch] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                  {cls.branch}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openAssignDialog(cls.id)}>
                            <GraduationCap className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(cls.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Students count */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <Users className="h-4 w-4" />
                        <span>عدد الطلاب:</span>
                        <span className="font-bold text-foreground">{cls._count?.students || 0}</span>
                      </div>

                      <Separator className="my-3" />

                      {/* Sections */}
                      <div className="mb-3">
                        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5" />
                          الشعب ({cls.sections.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {cls.sections.map(sec => {
                            const secTeachers = getTeachersForClass(cls.id, sec.id)
                            const studentCount = sec._count?.students || 0

                            return (
                              <div
                                key={sec.id}
                                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium ${SECTION_COLORS[sec.name] || 'bg-gray-100 text-gray-700 border-gray-200'} cursor-pointer hover:shadow-sm transition-shadow`}
                                onClick={() => openAssignDialog(cls.id, sec.id)}
                                title={`تعيين أستاذ لشعبة ${sec.name}`}
                              >
                                <span>{sec.name}</span>
                                <span className="text-[10px] opacity-70">({studentCount})</span>
                                {secTeachers.length > 0 && (
                                  <GraduationCap className="h-3 w-3 opacity-60" />
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Assigned Teachers */}
                      {classTeachers.length > 0 && (
                        <>
                          <Separator className="my-3" />
                          <div>
                            <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                              <GraduationCap className="h-3.5 w-3.5" />
                              الأساتذة المعينون
                            </p>
                            <ScrollArea className="max-h-24">
                              <div className="flex flex-wrap gap-1.5">
                                {classTeachers.map(a => (
                                  <Badge
                                    key={a.id}
                                    variant="secondary"
                                    className="text-xs gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors group/badge"
                                    onClick={() => handleRemoveAssignment(a.id)}
                                    title="انقر لإلغاء التعيين"
                                  >
                                    {a.teacher.fullName}
                                    <span className="opacity-0 group-hover/badge:opacity-100 transition-opacity text-destructive">×</span>
                                  </Badge>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>
                        </>
                      )}

                      {/* Subjects */}
                      {cls.subjects && cls.subjects.length > 0 && (
                        <>
                          <Separator className="my-3" />
                          <div>
                            <p className="text-xs text-muted-foreground mb-1.5">المواد الدراسية</p>
                            <div className="flex flex-wrap gap-1.5">
                              {cls.subjects.map(s => (
                                <Badge key={s.id} variant="outline" className="text-xs">
                                  {s.subject.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ─── Add Class Dialog ──────────────────────────────────── */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إضافة صف جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>اسم الصف *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="مثال: الأولى إعدادي"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>المستوى *</Label>
                <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEVELS.map(l => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>المرحلة *</Label>
                <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STAGES.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>الفرع (اختياري)</Label>
              <Select value={form.branch} onValueChange={(v) => setForm({ ...form, branch: v === 'بدون فرع' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="اختر الفرع" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="بدون فرع">بدون فرع</SelectItem>
                  {BRANCHES.map(b => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Sections Multi-select */}
            <div>
              <Label className="mb-3 block">الشعب *</Label>
              <div className="grid grid-cols-5 gap-2">
                {SECTION_OPTIONS.map(secName => (
                  <label
                    key={secName}
                    className={cn(
                      'flex items-center justify-center gap-1 rounded-lg border p-3 cursor-pointer transition-colors text-sm font-bold',
                      form.selectedSections.includes(secName)
                        ? `border-blue-400 bg-blue-50 text-blue-700`
                        : 'border-border hover:bg-muted/50'
                    )}
                  >
                    <Checkbox
                      checked={form.selectedSections.includes(secName)}
                      onCheckedChange={() => toggleSection(secName)}
                      className="sr-only"
                    />
                    {secName}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setFormOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={saving} style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
              {saving ? 'جاري الحفظ...' : 'إضافة'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Assign Teacher Dialog ─────────────────────────────── */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" style={{ color: '#2563eb' }} />
              تعيين أستاذ
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Target info */}
            {assignTarget && (
              <div className="rounded-lg border bg-blue-50 border-blue-200 p-3">
                <p className="text-sm font-medium text-blue-900">
                  {(() => {
                    const cls = classes.find(c => c.id === assignTarget.classId)
                    const sec = cls?.sections.find(s => s.id === assignTarget.sectionId)
                    return (
                      <>
                        الصف: <span className="font-bold">{cls?.name || '—'}</span>
                        {sec && (
                          <>
                            {' | '}الشعبة: <span className="font-bold">{sec.name}</span>
                          </>
                        )}
                      </>
                    )
                  })()}
                </p>
              </div>
            )}

            {/* Teacher selection */}
            <div>
              <Label className="mb-2 block">اختر الأستاذ</Label>
              <Select value={assignTeacherId} onValueChange={setAssignTeacherId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر أستاذ من القائمة" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      <span className="flex items-center gap-2">
                        {t.fullName}
                        {t.subjects && t.subjects.length > 0 && (
                          <span className="text-xs text-muted-foreground">({t.subjects.join(', ')})</span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {teachers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-3">لا يوجد أساتذة مسجلين</p>
              )}
            </div>

            {/* Current assignments for this class/section */}
            {assignTarget && (() => {
              const currentAssignments = getTeachersForClass(assignTarget.classId, assignTarget.sectionId)
              if (currentAssignments.length === 0) return null
              return (
                <div>
                  <Label className="mb-2 block">الأساتذة المعينون حالياً</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">الاسم</TableHead>
                        <TableHead className="text-right w-16">إلغاء</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentAssignments.map(a => (
                        <TableRow key={a.id}>
                          <TableCell className="text-sm">{a.teacher.fullName}</TableCell>
                          <TableCell>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive"
                              onClick={() => handleRemoveAssignment(a.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )
            })()}
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setAssignOpen(false)}>إلغاء</Button>
            <Button
              onClick={handleAssign}
              disabled={saving || !assignTeacherId}
              style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
            >
              {saving ? 'جاري التعيين...' : 'تعيين'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation ───────────────────────────────── */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا الصف؟ سيتم حذف جميع الشعب والطلاب المرتبطين به.
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
