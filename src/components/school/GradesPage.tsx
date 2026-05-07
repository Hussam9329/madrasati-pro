'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap, Save, CheckCircle, XCircle, AlertTriangle,
  BookOpen, Award, BarChart3, Lock, FileCheck, Search, Users, TrendingUp, Target, Lightbulb, Info, ChevronLeft, ClipboardList
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'

// Types
interface ClassData {
  id: string
  name: string
  level: string
  stage: string
  branch: string | null
  sections: { id: string; name: string; _count: { students: number } }[]
  subjects: { subject: { id: string; name: string; code: string } }[]
}

interface StudentData {
  id: string
  fullName: string
  studentNumber: string
  classId: string
  sectionId: string
  class: { id: string; name: string }
  section: { id: string; name: string }
}

interface SubjectData {
  id: string
  name: string
  code: string
  type: string
  maxScore: number
  passScore: number
  examTypes: ExamTypeData[]
}

interface ExamTypeData {
  id: string
  name: string
  maxScore: number
  subjectId: string
}

interface GradeData {
  id: string
  studentId: string
  subjectId: string
  examTypeId: string
  score: number | null
  status: string
  approved: boolean
  approvedBy: string | null
  student: {
    id: string
    fullName: string
    studentNumber: string
    class: { id: string; name: string }
    section: { id: string; name: string }
  }
  subject: { id: string; name: string; code: string; maxScore: number; passScore: number }
  examType: { id: string; name: string; maxScore: number }
  modifications: { id: string; oldScore: number; newScore: number; reason: string; modifiedBy: string; createdAt: string }[]
}

interface GradeEntry {
  studentId: string
  fullName: string
  studentNumber: string
  sectionName: string
  score: string
  existingGradeId?: string
  existingScore?: number | null
  approved: boolean
  status: string
}

// Score color helper
function getScoreColor(score: number, maxScore: number): { bg: string; text: string; border: string; barBg: string } {
  const pct = (score / maxScore) * 100
  if (pct >= 80) return { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-700', barBg: 'bg-emerald-500' }
  if (pct >= 50) return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-700', barBg: 'bg-amber-500' }
  return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', border: 'border-red-300 dark:border-red-700', barBg: 'bg-red-500' }
}

export default function GradesPage() {
  const { setActivePage } = useAppStore()

  // Filter state
  const [classes, setClasses] = useState<ClassData[]>([])
  const [subjects, setSubjects] = useState<SubjectData[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [selectedSectionId, setSelectedSectionId] = useState<string>('')
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')
  const [selectedExamTypeId, setSelectedExamTypeId] = useState<string>('')

  // Data state
  const [students, setStudents] = useState<StudentData[]>([])
  const [gradeEntries, setGradeEntries] = useState<GradeEntry[]>([])
  const [existingGrades, setExistingGrades] = useState<GradeData[]>([])
  const [isShowingStudents, setIsShowingStudents] = useState(false)

  // Loading states
  const [loadingClasses, setLoadingClasses] = useState(true)
  const [loadingSubjects, setLoadingSubjects] = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [saving, setSaving] = useState(false)
  const [approving, setApproving] = useState(false)

  // Stats
  const [showStats, setShowStats] = useState(false)

  // Derived values
  const selectedClass = classes.find(c => c.id === selectedClassId)
  const selectedSubject = subjects.find(s => s.id === selectedSubjectId)
  const selectedExamType = selectedSubject?.examTypes.find(e => e.id === selectedExamTypeId)

  // Fetch classes and subjects on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoadingClasses(true)
      setLoadingSubjects(true)
      try {
        const [classesRes, subjectsRes] = await Promise.all([
          fetch('/api/classes'),
          fetch('/api/subjects'),
        ])
        if (classesRes.ok) setClasses(await classesRes.json())
        if (subjectsRes.ok) setSubjects(await subjectsRes.json())
      } catch {
        console.error('Failed to fetch initial data')
      } finally {
        setLoadingClasses(false)
        setLoadingSubjects(false)
      }
    }
    fetchData()
  }, [])

  // Reset section when class changes
  useEffect(() => {
    setSelectedSectionId('')
    setIsShowingStudents(false)
    setGradeEntries([])
  }, [selectedClassId])

  // Reset exam type when subject changes
  useEffect(() => {
    setSelectedExamTypeId('')
    setIsShowingStudents(false)
    setGradeEntries([])
  }, [selectedSubjectId])

  // Show students - fetch students and existing grades
  const handleShowStudents = async () => {
    if (!selectedClassId || !selectedSubjectId || !selectedExamTypeId) {
      toast.error('خطأ', { description: 'الرجاء اختيار الصف والمادة ونوع الامتحان' })
      return
    }

    setLoadingStudents(true)
    try {
      // Fetch students
      const studentsParams = new URLSearchParams({ limit: '100' })
      if (selectedClassId) studentsParams.set('classId', selectedClassId)
      if (selectedSectionId && selectedSectionId !== 'all') studentsParams.set('sectionId', selectedSectionId)

      const studentsRes = await fetch(`/api/students?${studentsParams}`)
      const studentsData = await studentsRes.json()

      // Fetch existing grades
      const gradesParams = new URLSearchParams({
        subjectId: selectedSubjectId,
        examTypeId: selectedExamTypeId,
        limit: '100',
      })
      if (selectedClassId) gradesParams.set('classId', selectedClassId)

      const gradesRes = await fetch(`/api/grades?${gradesParams}`)
      const gradesData = await gradesRes.json()

      const fetchedStudents: StudentData[] = studentsData.students || []
      const fetchedGrades: GradeData[] = gradesData.grades || []

      setStudents(fetchedStudents)
      setExistingGrades(fetchedGrades)

      // Build grade entries
      const entries: GradeEntry[] = fetchedStudents.map(student => {
        const existingGrade = fetchedGrades.find(g => g.studentId === student.id)
        return {
          studentId: student.id,
          fullName: student.fullName,
          studentNumber: student.studentNumber,
          sectionName: student.section?.name || '—',
          score: existingGrade?.score !== null && existingGrade?.score !== undefined
            ? String(existingGrade.score)
            : '',
          existingGradeId: existingGrade?.id,
          existingScore: existingGrade?.score,
          approved: existingGrade?.approved || false,
          status: existingGrade?.status || 'ناقصة',
        }
      })

      setGradeEntries(entries)
      setIsShowingStudents(true)
      setShowStats(false)
    } catch {
      toast.error('خطأ', { description: 'حدث خطأ في جلب البيانات' })
    } finally {
      setLoadingStudents(false)
    }
  }

  // Update score
  const handleScoreChange = (studentId: string, value: string) => {
    const maxScore = selectedExamType?.maxScore || 100
    const numValue = value === '' ? '' : value

    // Validate max score
    if (numValue !== '' && parseFloat(numValue) > maxScore) {
      toast.error('تنبيه', { description: `الدرجة لا يمكن أن تتجاوز ${maxScore}` })
      return
    }

    setGradeEntries(prev =>
      prev.map(entry =>
        entry.studentId === studentId ? { ...entry, score: numValue as string } : entry
      )
    )
  }

  // Get pass status - uses percentage-based comparison
  const getPassStatus = (score: string): { status: string; color: string; label: string } => {
    if (score === '') return { status: 'ناقصة', color: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600', label: 'ناقصة' }
    const numScore = parseFloat(score)
    if (isNaN(numScore)) return { status: 'ناقصة', color: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600', label: 'ناقصة' }
    // Calculate percentage relative to exam max score
    const examMaxScore = selectedExamType?.maxScore || 100
    const subjectMaxScore = selectedSubject?.maxScore || 100
    const passScorePercent = (selectedSubject?.passScore || 50) / subjectMaxScore * 100
    const scorePercent = (numScore / examMaxScore) * 100
    if (scorePercent >= 80) return { status: 'ناجح', color: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700', label: 'ممتاز' }
    if (scorePercent >= passScorePercent) return { status: 'ناجح', color: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-700', label: 'ناجح' }
    return { status: 'راسب', color: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700', label: 'راسب' }
  }

  // Save grades
  const handleSaveGrades = async () => {
    setSaving(true)
    try {
      const gradesToSave = gradeEntries
        .filter(entry => entry.score !== '')
        .map(entry => ({
          studentId: entry.studentId,
          subjectId: selectedSubjectId,
          examTypeId: selectedExamTypeId,
          schoolId: 'default', // Will be set by the server
          score: parseFloat(entry.score),
          status: getPassStatus(entry.score).status === 'ناجح' ? 'مكتملة' : 'مكتملة',
        }))

      let successCount = 0
      let errorCount = 0

      for (const grade of gradesToSave) {
        try {
          const res = await fetch('/api/grades', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(grade),
          })
          if (res.ok) successCount++
          else errorCount++
        } catch {
          errorCount++
        }
      }

      if (errorCount > 0) {
        toast.error('تم الحفظ جزئياً', { description: `تم حفظ ${successCount} درجة وفشل ${errorCount}` })
      } else {
        toast.success('تم الحفظ', { description: `تم حفظ ${successCount} درجة بنجاح` })
      }

      // Refresh data
      handleShowStudents()
    } catch {
      toast.error('خطأ', { description: 'حدث خطأ في حفظ الدرجات' })
    } finally {
      setSaving(false)
    }
  }

  // Approve grades
  const handleApproveGrades = async () => {
    setApproving(true)
    try {
      const gradeIds = existingGrades
        .filter(g => !g.approved && g.score !== null)
        .map(g => g.id)

      if (gradeIds.length === 0) {
        toast.error('تنبيه', { description: 'لا توجد درجات للاعتماد' })
        return
      }

      const res = await fetch('/api/grades/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gradeIds, approvedBy: 'المدير' }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('تم الاعتماد', { description: data.message })
        handleShowStudents()
      } else {
        toast.error('خطأ', { description: data.error })
      }
    } catch {
      toast.error('خطأ', { description: 'حدث خطأ في اعتماد الدرجات' })
    } finally {
      setApproving(false)
    }
  }

  // Calculate stats - uses percentage-based comparison
  const getGradesStats = () => {
    const validEntries = gradeEntries.filter(e => e.score !== '' && !isNaN(parseFloat(e.score)))
    if (validEntries.length === 0) return null

    const scores = validEntries.map(e => parseFloat(e.score))
    const subjectMaxScore = selectedSubject?.maxScore || 100
    const examMaxScore = selectedExamType?.maxScore || 100
    const passScorePercent = (selectedSubject?.passScore || 50) / subjectMaxScore * 100
    const maxScore = examMaxScore
    const passCount = scores.filter(s => (s / examMaxScore) * 100 >= passScorePercent).length

    // Grade distribution for visual
    const excellent = scores.filter(s => (s / maxScore) * 100 >= 80).length
    const good = scores.filter(s => { const p = (s / maxScore) * 100; return p >= 50 && p < 80 }).length
    const fail = scores.filter(s => (s / maxScore) * 100 < 50).length

    return {
      average: scores.reduce((a, b) => a + b, 0) / scores.length,
      highest: Math.max(...scores),
      lowest: Math.min(...scores),
      passRate: (passCount / scores.length) * 100,
      total: scores.length,
      passCount,
      failCount: scores.length - passCount,
      maxScore,
      excellent,
      good,
      fail,
    }
  }

  const stats = getGradesStats()

  return (
    <div className="space-y-6" dir="rtl">
      <div className="hint-card p-3 flex items-start gap-3">
        <Lightbulb className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">نظام الدرجات</p>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            المسار الصحيح: أولاً أنشئ أنواع الامتحانات من صفحة الامتحانات ← ثم اختر الصف والمادة ونوع الامتحان هنا ← أدخل الدرجات.
            يمكنك حفظ الدرجات كمسودة ثم اعتمادها لاحقاً.
          </p>
        </div>
      </div>
      {/* Header with gradient icon */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg bg-primary">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">إدارة الدرجات</h2>
          <p className="text-sm text-muted-foreground">إدخال ومعاينة واعتماد الدرجات</p>
        </div>
      </div>



      {/* Filters */}
      <Card className="overflow-hidden">
        <div className="h-1 bg-primary" />
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-teal-600" />
            اختيار الصف والمادة
          </CardTitle>
          <CardDescription>حدد الصف والشعبة والمادة ونوع الامتحان لعرض الطلاب</CardDescription>
          {/* Step Indicators */}
          <div className="flex items-center gap-2 mt-3">
            {[
              { num: 1, label: 'اختر الصف', done: !!selectedClassId },
              { num: 2, label: 'اختر المادة والامتحان', done: !!selectedExamTypeId },
              { num: 3, label: 'أدخل الدرجات', done: isShowingStudents },
            ].map((step, idx) => (
              <div key={step.num} className="flex items-center gap-1.5">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors",
                  step.done ? "bg-emerald-500 text-white" :
                  (idx === 0 && !selectedClassId) || (idx === 1 && selectedClassId && !selectedExamTypeId) || (idx === 2 && selectedExamTypeId) ? "bg-primary text-white" :
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
          <div className="flex flex-wrap gap-4 items-end">
            {/* Class */}
            <div className="space-y-1 flex-1 min-w-[160px]">
              <Label className="text-xs font-medium">الصف *</Label>
              {loadingClasses ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger id="gradeClass">
                    <SelectValue placeholder="اختر الصف" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Section */}
            <div className="space-y-1 flex-1 min-w-[140px]">
              <Label className="text-xs font-medium">الشعبة</Label>
              <Select value={selectedSectionId} onValueChange={setSelectedSectionId} disabled={!selectedClassId}>
                <SelectTrigger id="gradeSection">
                  <SelectValue placeholder="جميع الشعب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الشعب</SelectItem>
                  {selectedClass?.sections.map(sec => (
                    <SelectItem key={sec.id} value={sec.id}>{sec.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div className="space-y-1 flex-1 min-w-[160px]">
              <Label className="text-xs font-medium">المادة *</Label>
              {loadingSubjects ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                  <SelectTrigger id="gradeSubject">
                    <SelectValue placeholder="اختر المادة" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(sub => (
                      <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Exam Type */}
            <div className="space-y-1 flex-1 min-w-[160px]">
              <Label className="text-xs font-medium">نوع الامتحان *</Label>
              {selectedSubjectId && selectedSubject && selectedSubject.examTypes.length === 0 ? (
                <div className="p-2 rounded-md border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/10">
                  <p className="text-xs text-amber-700 dark:text-amber-300 font-medium mb-1">لا توجد امتحانات لهذه المادة</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs h-7 border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                    onClick={() => setActivePage('exams')}
                  >
                    <ClipboardList className="h-3 w-3" />
                    إضافة امتحانات
                  </Button>
                </div>
              ) : (
                <Select value={selectedExamTypeId} onValueChange={setSelectedExamTypeId} disabled={!selectedSubjectId}>
                  <SelectTrigger id="gradeExamType">
                    <SelectValue placeholder="اختر نوع الامتحان" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedSubject?.examTypes.map(exam => (
                      <SelectItem key={exam.id} value={exam.id}>{exam.name} ({exam.maxScore} درجة)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Show Students Button */}
            <Button
              onClick={handleShowStudents}
              disabled={!selectedClassId || !selectedSubjectId || !selectedExamTypeId || loadingStudents}
              className="gap-2 bg-primary text-white"
            >
              {loadingStudents ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Users className="h-4 w-4" />
              )}
              عرض الطلاب
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Panel - Enhanced with grade distribution visual */}
      <AnimatePresence>
        {showStats && stats && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            {/* Summary stats bar */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card className="border-teal-200 dark:border-teal-800 overflow-hidden">
                <div className="h-1 bg-gradient-to-l from-teal-400 to-teal-600" />
                <CardContent className="p-4 text-center">
                  <BarChart3 className="h-5 w-5 mx-auto text-teal-600 dark:text-teal-400 mb-1" />
                  <p className="text-xl font-bold text-teal-700 dark:text-teal-400">{stats.average.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">المعدل</p>
                </CardContent>
              </Card>
              <Card className="border-emerald-200 dark:border-emerald-800 overflow-hidden">
                <div className="h-1 bg-gradient-to-l from-emerald-400 to-emerald-600" />
                <CardContent className="p-4 text-center">
                  <Award className="h-5 w-5 mx-auto text-emerald-600 dark:text-emerald-400 mb-1" />
                  <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{stats.highest}</p>
                  <p className="text-xs text-muted-foreground">أعلى درجة</p>
                </CardContent>
              </Card>
              <Card className="border-red-200 dark:border-red-800 overflow-hidden">
                <div className="h-1 bg-gradient-to-l from-red-400 to-red-600" />
                <CardContent className="p-4 text-center">
                  <AlertTriangle className="h-5 w-5 mx-auto text-red-600 dark:text-red-400 mb-1" />
                  <p className="text-xl font-bold text-red-700 dark:text-red-400">{stats.lowest}</p>
                  <p className="text-xs text-muted-foreground">أدنى درجة</p>
                </CardContent>
              </Card>
              <Card className="border-amber-200 dark:border-amber-800 overflow-hidden">
                <div className="h-1 bg-gradient-to-l from-amber-400 to-amber-600" />
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-5 w-5 mx-auto text-amber-600 dark:text-amber-400 mb-1" />
                  <p className="text-xl font-bold text-amber-700 dark:text-amber-400">{stats.passRate.toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground">نسبة النجاح</p>
                  <Progress value={stats.passRate} className="mt-2 h-2" />
                </CardContent>
              </Card>
              <Card className="overflow-hidden">
                <div className="h-1 bg-primary" />
                <CardContent className="p-4 text-center">
                  <p className="text-xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">
                    ناجح: <span className="text-emerald-600 dark:text-emerald-400">{stats.passCount}</span> | راسب: <span className="text-red-600 dark:text-red-400">{stats.failCount}</span>
                  </p>
                </CardContent>
              </Card>
            </div>


          </motion.div>
        )}
      </AnimatePresence>

      {/* Grade Entry Table */}
      <AnimatePresence>
        {isShowingStudents && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="overflow-hidden">
              <div className="h-1 bg-primary" />
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-teal-600" />
                      جدول الدرجات
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {selectedClass?.name} {selectedSectionId && selectedSectionId !== 'all'
                        ? `/ ${selectedClass?.sections.find(s => s.id === selectedSectionId)?.name || ''}`
                        : ''
                      } — {selectedSubject?.name} — {selectedExamType?.name}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowStats(!showStats)}
                      className="gap-1"
                    >
                      <BarChart3 className="h-3 w-3" />
                      {showStats ? 'إخفاء الإحصائيات' : 'الإحصائيات'}
                    </Button>
                    <Button
                      onClick={handleSaveGrades}
                      disabled={saving}
                      size="sm"
                      className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {saving ? (
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      حفظ الدرجات
                    </Button>
                    <Button
                      onClick={handleApproveGrades}
                      disabled={approving}
                      variant="outline"
                      size="sm"
                      className="gap-1 border-teal-500 text-teal-600 dark:border-teal-400 dark:text-teal-400"
                    >
                      {approving ? (
                        <div className="h-4 w-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <FileCheck className="h-4 w-4" />
                      )}
                      اعتماد الدرجات
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingStudents ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-4 w-8" />
                        <Skeleton className="h-4 flex-1" />
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                    ))}
                  </div>
                ) : gradeEntries.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-lg font-medium text-muted-foreground mb-1">لا يوجد طلاب في الصف المحدد</p>
                    <p className="text-sm text-muted-foreground mb-4">تأكد من اتباع الخطوات: 1) اختر الصف 2) اختر المادة 3) اختر نوع الامتحان 4) اضغط عرض الطلاب</p>
                    <Button variant="outline" size="sm" onClick={() => setIsShowingStudents(false)} className="gap-2">
                      <Search className="h-4 w-4" />
                      تعديل الفلتر
                    </Button>
                  </div>
                ) : (
                  <ScrollArea className="max-h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>اسم الطالب</TableHead>
                          <TableHead>الشعبة</TableHead>
                          <TableHead className="w-40">الدرجة</TableHead>
                          <TableHead>الحالة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {gradeEntries.map((entry, index) => {
                          const passInfo = getPassStatus(entry.score)
                          const isApproved = entry.approved
                          const maxScore = selectedExamType?.maxScore || 100
                          const scoreNum = entry.score !== '' ? parseFloat(entry.score) : null
                          const scoreColor = scoreNum !== null ? getScoreColor(scoreNum, maxScore) : null
                          const scorePct = scoreNum !== null ? Math.round((scoreNum / maxScore) * 100) : 0
                          const examMaxScore = selectedExamType?.maxScore || 100
                          const subjectMaxScore = selectedSubject?.maxScore || 100
                          const passScoreScaled = Math.round((selectedSubject?.passScore || 50) / subjectMaxScore * examMaxScore)
                          return (
                            <TableRow key={entry.studentId} className={`${isApproved ? 'bg-muted/30 dark:bg-muted/10' : ''} ${scoreNum !== null && scorePct < 50 ? 'bg-red-50/30 dark:bg-red-900/5' : ''}`}>
                              <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{entry.fullName}</span>
                                  {isApproved && (
                                    <Badge variant="outline" className="gap-1 text-xs bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-700">
                                      <Lock className="h-3 w-3" />
                                      مقفلة
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">{entry.studentNumber}</span>
                              </TableCell>
                              <TableCell>{entry.sectionName}</TableCell>
                              <TableCell>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    min="0"
                                    max={maxScore}
                                    autoComplete="off"
                                    value={entry.score}
                                    onChange={(e) => handleScoreChange(entry.studentId, e.target.value)}
                                    disabled={isApproved}
                                    placeholder={`من ${maxScore}`}
                                    className={`text-center w-24 font-semibold ${
                                      entry.score !== '' && parseFloat(entry.score) >= (selectedSubject?.passScore || 50)
                                        ? 'border-emerald-400 dark:border-emerald-600 focus:border-emerald-500 focus:ring-emerald-500/20'
                                        : entry.score !== '' && parseFloat(entry.score) < (selectedSubject?.passScore || 50)
                                          ? 'border-red-400 dark:border-red-600 focus:border-red-500 focus:ring-red-500/20'
                                          : 'dark:bg-gray-800/50'
                                    }`}
                                  />
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={`${passInfo.color} gap-1`}>
                                  {passInfo.status === 'ناجح' && <CheckCircle className="h-3 w-3" />}
                                  {passInfo.status === 'راسب' && <XCircle className="h-3 w-3" />}
                                  {passInfo.label}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}

                {/* Summary Footer */}
                {gradeEntries.length > 0 && (
                  <div className="mt-4 pt-4 border-t dark:border-gray-700 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      إجمالي الطلاب: {gradeEntries.length} | تم الإدخال: {gradeEntries.filter(e => e.score !== '').length} | ناقص: {gradeEntries.filter(e => e.score === '').length}
                    </p>
                    <div className="flex gap-3">
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">
                        <CheckCircle className="h-3 w-3" />
                        ناجح: {gradeEntries.filter(e => {
                        if (e.score === '') return false
                        const num = parseFloat(e.score)
                        const examMax = selectedExamType?.maxScore || 100
                        const subMax = selectedSubject?.maxScore || 100
                        const passPct = (selectedSubject?.passScore || 50) / subMax * 100
                        return (num / examMax) * 100 >= passPct
                      }).length}
                      </span>
                      <span className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full">
                        <XCircle className="h-3 w-3" />
                        راسب: {gradeEntries.filter(e => {
                        if (e.score === '') return false
                        const num = parseFloat(e.score)
                        const examMax = selectedExamType?.maxScore || 100
                        const subMax = selectedSubject?.maxScore || 100
                        const passPct = (selectedSubject?.passScore || 50) / subMax * 100
                        return (num / examMax) * 100 < passPct
                      }).length}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
