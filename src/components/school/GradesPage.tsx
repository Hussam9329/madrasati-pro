'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap, Save, CheckCircle, XCircle, AlertTriangle,
  BookOpen, Award, BarChart3, Lock, FileCheck, Search, Users
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
import { useToast } from '@/hooks/use-toast'

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

export default function GradesPage() {
  const { toast } = useToast()

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
      toast({ title: 'خطأ', description: 'الرجاء اختيار الصف والمادة ونوع الامتحان', variant: 'destructive' })
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
      toast({ title: 'خطأ', description: 'حدث خطأ في جلب البيانات', variant: 'destructive' })
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
      toast({ title: 'تنبيه', description: `الدرجة لا يمكن أن تتجاوز ${maxScore}`, variant: 'destructive' })
      return
    }

    setGradeEntries(prev =>
      prev.map(entry =>
        entry.studentId === studentId ? { ...entry, score: numValue as string } : entry
      )
    )
  }

  // Get pass status
  const getPassStatus = (score: string): { status: string; color: string } => {
    if (score === '') return { status: 'ناقصة', color: 'bg-gray-100 text-gray-800 border-gray-300' }
    const numScore = parseFloat(score)
    const passScore = selectedSubject?.passScore || 50
    if (isNaN(numScore)) return { status: 'ناقصة', color: 'bg-gray-100 text-gray-800 border-gray-300' }
    if (numScore >= passScore) return { status: 'ناجح', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' }
    return { status: 'راسب', color: 'bg-red-100 text-red-800 border-red-300' }
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

      toast({
        title: 'تم الحفظ',
        description: `تم حفظ ${successCount} درجة${errorCount > 0 ? ` وفشل ${errorCount}` : ''}`,
        variant: errorCount > 0 ? 'destructive' : 'default',
      })

      // Refresh data
      handleShowStudents()
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ في حفظ الدرجات', variant: 'destructive' })
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
        toast({ title: 'تنبيه', description: 'لا توجد درجات للاعتماد', variant: 'destructive' })
        return
      }

      const res = await fetch('/api/grades/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gradeIds, approvedBy: 'المدير' }),
      })

      const data = await res.json()

      if (res.ok) {
        toast({ title: 'تم الاعتماد', description: data.message })
        handleShowStudents()
      } else {
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ في اعتماد الدرجات', variant: 'destructive' })
    } finally {
      setApproving(false)
    }
  }

  // Calculate stats
  const getGradesStats = () => {
    const validEntries = gradeEntries.filter(e => e.score !== '' && !isNaN(parseFloat(e.score)))
    if (validEntries.length === 0) return null

    const scores = validEntries.map(e => parseFloat(e.score))
    const passScore = selectedSubject?.passScore || 50
    const maxScore = selectedExamType?.maxScore || 100
    const passCount = scores.filter(s => s >= passScore).length

    return {
      average: scores.reduce((a, b) => a + b, 0) / scores.length,
      highest: Math.max(...scores),
      lowest: Math.min(...scores),
      passRate: (passCount / scores.length) * 100,
      total: scores.length,
      passCount,
      failCount: scores.length - passCount,
      maxScore,
    }
  }

  const stats = getGradesStats()

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <GraduationCap className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">إدارة الدرجات</h2>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">اختيار الصف والمادة</CardTitle>
          <CardDescription>حدد الصف والشعبة والمادة ونوع الامتحان لعرض الطلاب</CardDescription>
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
                  <SelectTrigger>
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
                <SelectTrigger>
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
                  <SelectTrigger>
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
              <Select value={selectedExamTypeId} onValueChange={setSelectedExamTypeId} disabled={!selectedSubjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الامتحان" />
                </SelectTrigger>
                <SelectContent>
                  {selectedSubject?.examTypes.map(exam => (
                    <SelectItem key={exam.id} value={exam.id}>{exam.name} ({exam.maxScore} درجة)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Show Students Button */}
            <Button
              onClick={handleShowStudents}
              disabled={!selectedClassId || !selectedSubjectId || !selectedExamTypeId || loadingStudents}
              className="gap-2 bg-primary hover:bg-primary/90"
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

      {/* Stats Panel */}
      <AnimatePresence>
        {showStats && stats && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-2 md:grid-cols-5 gap-4"
          >
            <Card className="border-primary/20">
              <CardContent className="p-4 text-center">
                <BarChart3 className="h-5 w-5 mx-auto text-primary mb-1" />
                <p className="text-xl font-bold">{stats.average.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">المعدل</p>
              </CardContent>
            </Card>
            <Card className="border-emerald-200">
              <CardContent className="p-4 text-center">
                <Award className="h-5 w-5 mx-auto text-emerald-600 mb-1" />
                <p className="text-xl font-bold text-emerald-700">{stats.highest}</p>
                <p className="text-xs text-muted-foreground">أعلى درجة</p>
              </CardContent>
            </Card>
            <Card className="border-red-200">
              <CardContent className="p-4 text-center">
                <AlertTriangle className="h-5 w-5 mx-auto text-red-600 mb-1" />
                <p className="text-xl font-bold text-red-700">{stats.lowest}</p>
                <p className="text-xs text-muted-foreground">أدنى درجة</p>
              </CardContent>
            </Card>
            <Card className="border-amber-200">
              <CardContent className="p-4 text-center">
                <p className="text-xl font-bold text-amber-700">{stats.passRate.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">نسبة النجاح</p>
                <Progress value={stats.passRate} className="mt-2 h-2" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">
                  ناجح: <span className="text-emerald-600">{stats.passCount}</span> | راسب: <span className="text-red-600">{stats.failCount}</span>
                </p>
              </CardContent>
            </Card>
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
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
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
                      className="gap-1 bg-emerald-600 hover:bg-emerald-700"
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
                      className="gap-1 border-primary text-primary"
                    >
                      {approving ? (
                        <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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
                    <Search className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">لا يوجد طلاب في الصف المحدد</p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>اسم الطالب</TableHead>
                          <TableHead>الشعبة</TableHead>
                          <TableHead className="w-32">الدرجة</TableHead>
                          <TableHead>الحالة</TableHead>
                          <TableHead className="w-24">إجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {gradeEntries.map((entry, index) => {
                          const passInfo = getPassStatus(entry.score)
                          const isApproved = entry.approved
                          return (
                            <TableRow key={entry.studentId} className={isApproved ? 'bg-muted/30' : ''}>
                              <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{entry.fullName}</span>
                                  {isApproved && (
                                    <Badge variant="outline" className="gap-1 text-xs bg-primary/5">
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
                                    max={selectedExamType?.maxScore || 100}
                                    value={entry.score}
                                    onChange={(e) => handleScoreChange(entry.studentId, e.target.value)}
                                    disabled={isApproved}
                                    placeholder={`من ${selectedExamType?.maxScore || 100}`}
                                    className={`text-center w-24 ${
                                      entry.score !== '' && parseFloat(entry.score) >= (selectedSubject?.passScore || 50)
                                        ? 'border-emerald-400 focus:border-emerald-500'
                                        : entry.score !== '' && parseFloat(entry.score) < (selectedSubject?.passScore || 50)
                                          ? 'border-red-400 focus:border-red-500'
                                          : ''
                                    }`}
                                  />
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={`${passInfo.color} gap-1`}>
                                  {passInfo.status === 'ناجح' && <CheckCircle className="h-3 w-3" />}
                                  {passInfo.status === 'راسب' && <XCircle className="h-3 w-3" />}
                                  {passInfo.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {entry.existingScore !== undefined && entry.existingScore !== null && (
                                  <Badge variant="outline" className="text-xs">
                                    سابقاً: {entry.existingScore}
                                  </Badge>
                                )}
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
                  <div className="mt-4 pt-4 border-t flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      إجمالي الطلاب: {gradeEntries.length} | تم الإدخال: {gradeEntries.filter(e => e.score !== '').length} | ناقص: {gradeEntries.filter(e => e.score === '').length}
                    </p>
                    <div className="flex gap-2">
                      <span className="text-xs text-emerald-600 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        ناجح: {gradeEntries.filter(e => e.score !== '' && parseFloat(e.score) >= (selectedSubject?.passScore || 50)).length}
                      </span>
                      <span className="text-xs text-red-600 flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        راسب: {gradeEntries.filter(e => e.score !== '' && parseFloat(e.score) < (selectedSubject?.passScore || 50)).length}
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
