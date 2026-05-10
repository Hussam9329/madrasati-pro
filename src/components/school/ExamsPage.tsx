'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Edit, Trash2, ClipboardList, BookOpen, Award, Target,
  Lightbulb, CheckCircle, ChevronLeft, AlertTriangle, FileText, Info
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { extractApiData } from '@/services/api'
import { EmptyState } from '@/components/ui/empty-state'

// Types
import type { Subject as SubjectData, ExamTypeData } from '@/types'

// Common exam type templates for quick add
const EXAM_TEMPLATES = [
  { name: 'مذاكرة أولى', scorePercent: 10 },
  { name: 'مذاكرة ثانية', scorePercent: 10 },
  { name: 'امتحان شهري أول', scorePercent: 15 },
  { name: 'امتحان شهري ثاني', scorePercent: 15 },
  { name: 'امتحان نصفي', scorePercent: 25 },
  { name: 'امتحان نهائي', scorePercent: 25 },
  { name: 'واجب منزلي', scorePercent: 5 },
  { name: 'تقرير', scorePercent: 5 },
]

export default function ExamsPage() {
  const [subjects, setSubjects] = useState<SubjectData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingExam, setEditingExam] = useState<ExamTypeData | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Form
  const [formName, setFormName] = useState('')
  const [formMaxScore, setFormMaxScore] = useState('')
  const [formSubjectId, setFormSubjectId] = useState('')

  // Selected subject
  const selectedSubject = subjects.find(s => s.id === selectedSubjectId)
  const examTypes = selectedSubject?.examTypes || []

  // Fetch subjects with exam types
  const fetchSubjects = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/subjects')
      const data = extractApiData(await res.json())
      setSubjects(data || [])
      // Auto-select first subject if none selected
      if (data && data.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(data[0].id)
      }
    } catch {
      toast.error('خطأ', { description: 'تعذر تحميل بيانات المواد. حاول مرة أخرى.' })
    } finally {
      setLoading(false)
    }
  }, [selectedSubjectId])

  useEffect(() => {
    fetchSubjects()
  }, [fetchSubjects])

  // Open add form
  const openAddForm = () => {
    setEditingExam(null)
    setFormName('')
    setFormMaxScore('')
    setFormSubjectId(selectedSubjectId || (subjects[0]?.id ?? ''))
    setFormOpen(true)
  }

  // Open edit form
  const openEditForm = (exam: ExamTypeData | { id: string; name: string; maxScore: number }) => {
    setEditingExam({ ...exam, subjectId: (exam as ExamTypeData).subjectId || formSubjectId } as ExamTypeData)
    setFormName(exam.name)
    setFormMaxScore(String(exam.maxScore))
    setFormSubjectId((exam as ExamTypeData).subjectId || formSubjectId)
    setFormOpen(true)
  }

  // Quick add from template
  const handleQuickAdd = (template: { name: string; scorePercent: number }) => {
    const targetSubject = selectedSubject || subjects[0]
    if (!targetSubject) {
      toast.error('تنبيه', { description: 'يرجى إضافة مادة أولاً' })
      return
    }
    const calculatedScore = Math.round(targetSubject.maxScore * template.scorePercent / 100)
    setEditingExam(null)
    setFormName(template.name)
    setFormMaxScore(String(calculatedScore))
    setFormSubjectId(targetSubject.id)
    setFormOpen(true)
  }

  // Save exam type
  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error('تنبيه', { description: 'يرجى إدخال اسم نوع الامتحان' })
      return
    }
    if (!formMaxScore || parseInt(formMaxScore) <= 0) {
      toast.error('تنبيه', { description: 'يرجى إدخال درجة كاملة صحيحة' })
      return
    }
    if (!formSubjectId) {
      toast.error('تنبيه', { description: 'يرجى اختيار المادة' })
      return
    }

    setSaving(true)
    try {
      if (editingExam) {
        const res = await fetch(`/api/exam-types/${editingExam.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName,
            maxScore: parseInt(formMaxScore),
          }),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'فشل التحديث')
        }
        toast.success('تم التحديث', { description: 'تم تحديث نوع الامتحان بنجاح' })
      } else {
        const res = await fetch('/api/exam-types', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName,
            maxScore: parseInt(formMaxScore),
            subjectId: formSubjectId,
          }),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'فشل الإضافة')
        }
        toast.success('تمت الإضافة', { description: 'تم إضافة نوع الامتحان بنجاح' })
      }
      setFormOpen(false)
      fetchSubjects()
    } catch (err) {
      toast.error('خطأ', { description: err instanceof Error ? err.message : 'تعذر حفظ البيانات. حاول مرة أخرى.' })
    } finally {
      setSaving(false)
    }
  }

  // Delete exam type
  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/exam-types/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'فشل الحذف')
      }
      toast.success('تم الحذف', { description: 'تم حذف نوع الامتحان بنجاح' })
      fetchSubjects()
    } catch (err) {
      toast.error('خطأ', { description: err instanceof Error ? err.message : 'تعذر حذف نوع الامتحان. حاول مرة أخرى.' })
    } finally {
      setDeleteId(null)
    }
  }

  // Calculate total allocated score
  const totalAllocated = examTypes.reduce((sum, et) => sum + et.maxScore, 0)
  const maxScore = selectedSubject?.maxScore || 100
  const isOverBudget = totalAllocated > maxScore

  return (
    <div className="space-y-6" dir="rtl">
      {/* Guidance Hint */}
      <div className="hint-card p-3 flex items-start gap-3">
        <Lightbulb className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">الامتحانات وأنواعها</p>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            يجب إنشاء أنواع الامتحانات (مذاكرة، امتحان شهري، نهائي...) قبل إدخال الدرجات.
            اختر المادة ثم أضف أنواع الامتحانات لها. مجموع درجات الامتحانات يجب ألا يتجاوز الدرجة الكاملة للمادة.
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg bg-primary">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">إدارة الامتحانات</h2>
            <p className="text-sm text-muted-foreground">إنشاء وإدارة أنواع الامتحانات لكل مادة</p>
          </div>
        </div>
        <Button onClick={openAddForm} className="gap-2 bg-primary" disabled={subjects.length === 0}>
          <Plus className="h-4 w-4" />
          إضافة امتحان
        </Button>
      </div>

      {/* No Subjects Warning */}
      {!loading && subjects.length === 0 && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-3" />
            <h3 className="text-lg font-semibold text-amber-700 dark:text-amber-400 mb-2">لا توجد مواد دراسية بعد</h3>
            <p className="text-sm text-muted-foreground mb-4">
              يجب إضافة المواد الدراسية أولاً قبل إنشاء أنواع الامتحانات.
              اذهب إلى صفحة المواد وأضف مادة واحدة على الأقل.
            </p>
            <p className="text-xs text-muted-foreground">
              المسار الصحيح: المواد ← الامتحانات ← الدرجات
            </p>
          </CardContent>
        </Card>
      )}

      {/* Subject Selector + Exam Types */}
      {subjects.length > 0 && (
        <Card className="overflow-hidden">
          <div className="h-1 bg-primary" />
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-teal-600" />
              اختر المادة لإدارة امتحاناتها
            </CardTitle>
            <CardDescription>اختر مادة لعرض وإدارة أنواع الامتحانات الخاصة بها</CardDescription>

            {/* Step Indicators */}
            <div className="flex items-center gap-2 mt-3">
              {[
                { num: 1, label: 'اختر المادة', done: !!selectedSubjectId },
                { num: 2, label: 'أضف الامتحانات', done: examTypes.length > 0 },
                { num: 3, label: 'أدخل الدرجات', done: false },
              ].map((step, idx) => (
                <div key={step.num} className="flex items-center gap-1.5">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors",
                    step.done ? "bg-emerald-500 text-white" :
                    (idx === 0 && !selectedSubjectId) || (idx === 1 && selectedSubjectId && examTypes.length === 0) || (idx === 2 && examTypes.length > 0) ? "bg-primary text-white" :
                    "bg-gray-200 dark:bg-gray-700 text-gray-500"
                  )}>
                    {step.done ? <CheckCircle className="h-3 w-3" /> : step.num}
                  </div>
                  <span className={cn("text-[11px] font-medium", step.done ? "text-emerald-600" : "text-muted-foreground")}>{step.label}</span>
                  {idx < 2 && <ChevronLeft className="h-3 w-3 text-muted-foreground mx-1" />}
                </div>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {/* Subject Select */}
            <div className="space-y-1 mb-4 max-w-md">
              <Label className="text-xs font-medium">المادة</Label>
              {loading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المادة" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(sub => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.name} ({sub.code}) — {sub?.examTypes?.length ?? 0} امتحان
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Subject Info */}
            {selectedSubject && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 p-3 bg-muted/30 rounded-lg">
                <div className="text-center">
                  <p className="text-lg font-bold text-primary">{selectedSubject.maxScore}</p>
                  <p className="text-xs text-muted-foreground">الدرجة الكاملة</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-emerald-600">{selectedSubject.passScore}</p>
                  <p className="text-xs text-muted-foreground">درجة النجاح</p>
                </div>
                <div className="text-center">
                  <p className={cn("text-lg font-bold", isOverBudget ? "text-red-600" : "text-teal-600")}>
                    {totalAllocated}
                  </p>
                  <p className="text-xs text-muted-foreground">مخصصة للامتحانات</p>
                </div>
                <div className="text-center">
                  <p className={cn("text-lg font-bold", maxScore - totalAllocated < 0 ? "text-red-600" : "text-amber-600")}>
                    {maxScore - totalAllocated}
                  </p>
                  <p className="text-xs text-muted-foreground">متبقي</p>
                </div>
              </div>
            )}

            {/* Over budget warning */}
            {isOverBudget && (
              <div className="p-3 mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 dark:text-red-300">
                  مجموع درجات الامتحانات ({totalAllocated}) يتجاوز الدرجة الكاملة للمادة ({maxScore}).
                  يرجى تعديل درجات الامتحانات.
                </p>
              </div>
            )}

            {/* Quick Add Templates */}
            {selectedSubject && examTypes.length === 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-blue-500" />
                  إضافة سريعة — اختر قالب امتحان جاهز:
                </p>
                <div className="flex flex-wrap gap-2">
                  {EXAM_TEMPLATES.map(template => (
                    <Button
                      key={template.name}
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => handleQuickAdd(template)}
                    >
                      <Plus className="h-3 w-3" />
                      {template.name} ({template.scorePercent}%)
                    </Button>
                  ))}
                </div>
                <Separator className="my-3" />
              </div>
            )}

            {/* Exam Types List */}
            {selectedSubject && (
              <>
                {examTypes.length === 0 ? (
                  <EmptyState
                    icon={ClipboardList}
                    title="لا توجد أنواع امتحانات لهذه المادة"
                    description="أضف أنواع الامتحانات (مثل: امتحان نصفي، نهائي، مذاكرة...) حتى يمكنك إدخال الدرجات لاحقاً"
                    actionLabel="إضافة امتحان جديد"
                    onAction={openAddForm}
                  />
                ) : (
                  <div className="space-y-2">
                    {examTypes.map((exam, idx) => (
                      <motion.div
                        key={exam.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary font-bold text-sm shrink-0">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{exam.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className="text-xs">
                                <Award className="h-3 w-3 ml-1" />
                                {exam.maxScore} درجة
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {((exam.maxScore / maxScore) * 100).toFixed(0)}% من المادة
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditForm(exam)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(exam.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}

                    {/* Score Distribution Bar */}
                    <div className="mt-4 p-3 bg-muted/20 rounded-lg">
                      <p className="text-xs font-medium text-muted-foreground mb-2">توزيع الدرجات</p>
                      <div className="flex h-6 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                        {examTypes.map((exam, idx) => {
                          const colors = [
                            'bg-blue-500', 'bg-purple-500', 'bg-emerald-500',
                            'bg-amber-500', 'bg-red-500', 'bg-cyan-500',
                            'bg-pink-500', 'bg-indigo-500'
                          ]
                          const pct = Math.max((exam.maxScore / maxScore) * 100, 2)
                          return (
                            <div
                              key={exam.id}
                              className={cn("flex items-center justify-center text-white text-[9px] font-bold", colors[idx % colors.length])}
                              style={{ width: `${pct}%` }}
                              title={`${exam.name}: ${exam.maxScore} (${pct.toFixed(0)}%)`}
                            >
                              {pct >= 8 ? `${pct.toFixed(0)}%` : ''}
                            </div>
                          )
                        })}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                        {examTypes.map((exam, idx) => {
                          const colors = [
                            'bg-blue-500', 'bg-purple-500', 'bg-emerald-500',
                            'bg-amber-500', 'bg-red-500', 'bg-cyan-500',
                            'bg-pink-500', 'bg-indigo-500'
                          ]
                          return (
                            <span key={exam.id} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <span className={cn("w-2 h-2 rounded-full", colors[idx % colors.length])} />
                              {exam.name}
                            </span>
                          )
                        })}
                      </div>
                    </div>

                    {/* Add more button */}
                    <div className="flex justify-center pt-2">
                      <Button variant="outline" size="sm" onClick={openAddForm} className="gap-1.5">
                        <Plus className="h-3.5 w-3.5" />
                        إضافة امتحان آخر
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* All Subjects Summary - shows which subjects have exams */}
      {subjects.length > 1 && (
        <Card className="overflow-hidden">
          <div className="h-1 bg-emerald-500" />
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-600" />
              ملخص الامتحانات حسب المادة
            </CardTitle>
            <CardDescription>نظرة سريعة على حالة الامتحانات لجميع المواد</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {subjects.map(subject => {
                const subjectTotal = subject?.examTypes?.reduce((sum, et) => sum + et.maxScore, 0) ?? 0
                const isComplete = subjectTotal === subject.maxScore
                const isPartial = subjectTotal > 0 && subjectTotal < subject.maxScore
                const isOver = subjectTotal > subject.maxScore

                return (
                  <div
                    key={subject.id}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md",
                      selectedSubjectId === subject.id ? "border-primary bg-primary/5" :
                      isOver ? "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10" :
                      isComplete ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/10" :
                      isPartial ? "border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/10" :
                      "border-border"
                    )}
                    onClick={() => setSelectedSubjectId(subject.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm">{subject.name}</p>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          isComplete ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                          isOver ? "bg-red-100 text-red-700 border-red-200" :
                          isPartial ? "bg-amber-100 text-amber-700 border-amber-200" :
                          "bg-gray-100 text-gray-700 border-gray-200"
                        )}
                      >
                        {isComplete ? 'مكتمل' : isOver ? 'تجاوز' : isPartial ? 'جزئي' : 'فارغ'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{subject?.examTypes?.length} امتحان</span>
                      <span>{subjectTotal} / {subject.maxScore}</span>
                    </div>
                    {/* Mini progress bar */}
                    <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          isOver ? "bg-red-500" : isComplete ? "bg-emerald-500" : "bg-primary"
                        )}
                        style={{ width: `${Math.min(((subjectTotal ?? 0) / subject.maxScore) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Exam Type Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingExam ? 'تعديل نوع الامتحان' : 'إضافة نوع امتحان جديد'}</DialogTitle>
            <DialogDescription>
              {editingExam
                ? 'قم بتعديل بيانات نوع الامتحان'
                : 'أضف نوع امتحان للمادة المحددة. هذا النوع سيظهر في صفحة الدرجات.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Subject (only when creating) */}
            {!editingExam && (
              <div className="space-y-1.5">
                <Label className="text-sm">المادة *</Label>
                <Select value={formSubjectId} onValueChange={setFormSubjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المادة" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(sub => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.name} ({sub.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">اختر المادة التي ينتمي إليها هذا الامتحان</p>
              </div>
            )}

            {/* Exam Name */}
            <div className="space-y-1.5">
              <Label className="text-sm">اسم نوع الامتحان *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="مثال: امتحان نصفي، مذاكرة أولى..."
              />
              <p className="text-[11px] text-muted-foreground">
                أدخل اسم يدل على نوع الامتحان، مثل: امتحان شهري أول، امتحان نهائي، مذاكرة
              </p>
            </div>

            {/* Max Score */}
            <div className="space-y-1.5">
              <Label className="text-sm">الدرجة الكاملة *</Label>
              <Input
                type="number"
                min="1"
                value={formMaxScore}
                onChange={(e) => setFormMaxScore(e.target.value)}
                placeholder="مثال: 25"
              />
              <p className="text-[11px] text-muted-foreground">
                الدرجة العظمى لهذا الامتحان. يجب ألا يتجاوز مجموع درجات جميع الامتحانات الدرجة الكاملة للمادة
                ({subjects.find(s => s.id === (editingExam?.subjectId || formSubjectId))?.maxScore || 100})
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setFormOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-primary">
              {saving ? 'جاري الحفظ...' : editingExam ? 'تحديث' : 'إضافة'}
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
              هل أنت متأكد من حذف هذا النوع من الامتحان؟ سيتم حذف جميع الدرجات المرتبطة به.
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
