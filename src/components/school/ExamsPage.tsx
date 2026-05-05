'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ClipboardList, Plus, Calendar, Clock, MapPin, BookOpen,
  Grid, List, Filter, Download, Search, ChevronLeft, ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'

// Types
interface ClassItem {
  id: string
  name: string
  sections: SectionItem[]
}

interface SectionItem {
  id: string
  name: string
  classId: string
}

interface SubjectItem {
  id: string
  name: string
}

interface ExamItem {
  id: string
  subjectId: string
  subjectName: string
  examType: string
  date: string
  time: string
  classId: string
  className: string
  room: string
  notes?: string
}

// Subject color mapping (same as SubjectsPage)
const SUBJECT_COLORS: Record<string, { bg: string; dot: string; text: string }> = {
  'رياضيات': { bg: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500', text: 'text-blue-700' },
  'فيزياء': { bg: 'bg-purple-50 border-purple-200', dot: 'bg-purple-500', text: 'text-purple-700' },
  'كيمياء': { bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', text: 'text-emerald-700' },
  'أحياء': { bg: 'bg-green-50 border-green-200', dot: 'bg-green-500', text: 'text-green-700' },
  'عربي': { bg: 'bg-red-50 border-red-200', dot: 'bg-red-500', text: 'text-red-700' },
  'انكليزي': { bg: 'bg-cyan-50 border-cyan-200', dot: 'bg-cyan-500', text: 'text-cyan-700' },
  'تربية إسلامية': { bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500', text: 'text-amber-700' },
  'تاريخ': { bg: 'bg-orange-50 border-orange-200', dot: 'bg-orange-500', text: 'text-orange-700' },
  'جغرافية': { bg: 'bg-teal-50 border-teal-200', dot: 'bg-teal-500', text: 'text-teal-700' },
  'حاسوب': { bg: 'bg-indigo-50 border-indigo-200', dot: 'bg-indigo-500', text: 'text-indigo-700' },
  'تربية رياضية': { bg: 'bg-lime-50 border-lime-200', dot: 'bg-lime-500', text: 'text-lime-700' },
  'فنية': { bg: 'bg-pink-50 border-pink-200', dot: 'bg-pink-500', text: 'text-pink-700' },
}
const DEFAULT_COLOR = { bg: 'bg-gray-50 border-gray-200', dot: 'bg-gray-400', text: 'text-gray-700' }

const EXAM_TYPE_COLORS: Record<string, string> = {
  'شهر أول': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
  'شهر ثاني': 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700',
  'نصف سنة': 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
  'نهاية سنة': 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
  'تقويم مستمر': 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-700',
}

// Mock exam data
function generateMockExams(): ExamItem[] {
  const examTypes = ['شهر أول', 'شهر ثاني', 'نصف سنة', 'نهاية سنة']
  const subjectNames = ['رياضيات', 'فيزياء', 'كيمياء', 'أحياء', 'عربي', 'انكليزي', 'تربية إسلامية']
  const classNames = ['الرابع الإعدادي', 'الخامس الإعدادي - علمي', 'السادس الإعدادي - علمي', 'الثالث المتوسط']
  const rooms = ['قاعة 1', 'قاعة 2', 'قاعة 3', 'المختبر', 'القاعة الكبرى']
  const times = ['08:00', '09:00', '10:00', '11:00', '12:00']

  const exams: ExamItem[] = []
  const today = new Date()
  
  let idCounter = 1
  for (let i = 0; i < 20; i++) {
    const examDate = new Date(today)
    examDate.setDate(today.getDate() + Math.floor(Math.random() * 30) - 5)
    
    exams.push({
      id: `exam-${idCounter++}`,
      subjectId: `sub-${i % subjectNames.length}`,
      subjectName: subjectNames[i % subjectNames.length],
      examType: examTypes[i % examTypes.length],
      date: examDate.toISOString().split('T')[0],
      time: times[i % times.length],
      classId: `cls-${i % classNames.length}`,
      className: classNames[i % classNames.length],
      room: rooms[i % rooms.length],
      notes: i % 3 === 0 ? 'يرجى الحضور قبل 15 دقيقة' : undefined,
    })
  }
  
  return exams.sort((a, b) => a.date.localeCompare(b.date))
}

// Arabic day name
function getArabicDay(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ar-IQ', { weekday: 'long' })
}

// Format date
function formatArabicDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long', day: 'numeric' })
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 }
}

export default function ExamsPage() {
  const { toast } = useToast()
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [subjects, setSubjects] = useState<SubjectItem[]>([])
  const [exams, setExams] = useState<ExamItem[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filterClass, setFilterClass] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')

  // Form state
  const [form, setForm] = useState({
    subjectId: '',
    examType: 'شهر أول',
    date: '',
    time: '08:00',
    classId: '',
    room: '',
    notes: '',
  })

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch('/api/classes')
      if (res.ok) {
        const data = await res.json()
        setClasses(data || [])
      }
    } catch {
      // silent
    }
  }, [])

  const fetchSubjects = useCallback(async () => {
    try {
      const res = await fetch('/api/subjects')
      if (res.ok) {
        const data = await res.json()
        setSubjects((data || []).map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })))
      }
    } catch {
      // silent
    }
  }, [])

  const fetchExams = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/exams')
      if (res.ok) {
        const data = await res.json()
        if (data.exams && data.exams.length > 0) {
          setExams(data.exams)
        } else {
          setExams(generateMockExams())
        }
      } else {
        setExams(generateMockExams())
      }
    } catch {
      setExams(generateMockExams())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClasses()
    fetchSubjects()
    fetchExams()
  }, [fetchClasses, fetchSubjects, fetchExams])

  // Filter exams
  const filteredExams = exams.filter(e => {
    if (filterClass !== 'all' && e.className !== classes.find(c => c.id === filterClass)?.name) return false
    if (filterType !== 'all' && e.examType !== filterType) return false
    return true
  })

  // Stats
  const today = new Date().toISOString().split('T')[0]
  const upcomingExams = filteredExams.filter(e => e.date >= today)
  const thisWeekExams = (() => {
    const now = new Date()
    const weekEnd = new Date(now)
    weekEnd.setDate(now.getDate() + 7)
    return filteredExams.filter(e => {
      const d = new Date(e.date)
      return d >= now && d <= weekEnd
    })
  })()
  const todayExams = filteredExams.filter(e => e.date === today)

  // Group exams by date for grid view
  const examsByDate = filteredExams.reduce<Record<string, ExamItem[]>>((acc, e) => {
    if (!acc[e.date]) acc[e.date] = []
    acc[e.date].push(e)
    return acc
  }, {})

  const handleSave = async () => {
    if (!form.subjectId || !form.date || !form.classId) {
      toast({ title: 'تنبيه', description: 'المادة والتاريخ والصف مطلوبون', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const selectedSubject = subjects.find(s => s.id === form.subjectId)
      const selectedClass = classes.find(c => c.id === form.classId)

      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          subjectName: selectedSubject?.name || '',
          className: selectedClass?.name || '',
        }),
      })

      if (!res.ok) throw new Error()

      toast({ title: 'تمت الإضافة', description: 'تم إضافة الامتحان بنجاح' })
      setFormOpen(false)
      setForm({
        subjectId: '',
        examType: 'شهر أول',
        date: '',
        time: '08:00',
        classId: '',
        room: '',
        notes: '',
      })
      fetchExams()
    } catch {
      toast({ title: 'خطأ', description: 'فشل في إضافة الامتحان', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

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
            className="flex h-11 w-11 items-center justify-center rounded-xl shadow-lg"
            style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}
          >
            <ClipboardList className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold dark:text-gray-200">الامتحانات</h1>
            <p className="text-sm text-muted-foreground">إدارة جداول الامتحانات والمواعيد</p>
          </div>
        </div>
        <Button
          onClick={() => setFormOpen(true)}
          className="gap-2"
          style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}
        >
          <Plus className="h-4 w-4" />
          إضافة امتحان
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/20 dark:to-emerald-950/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 left-0 h-1" style={{ background: 'linear-gradient(90deg, #0d9488, #059669)' }} />
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center shrink-0">
              <Calendar className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">امتحانات قادمة</p>
              <p className="text-2xl font-bold text-teal-700 dark:text-teal-300">{upcomingExams.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 left-0 h-1" style={{ background: 'linear-gradient(90deg, #d97706, #f59e0b)' }} />
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
              <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">هذا الأسبوع</p>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{thisWeekExams.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 left-0 h-1" style={{ background: 'linear-gradient(90deg, #dc2626, #ef4444)' }} />
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
              <BookOpen className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">اليوم</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">{todayExams.length}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters & View Toggle */}
      <motion.div variants={itemVariants}>
        <Card className="dark:bg-gray-900/50 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Filter className="h-4 w-4" />
                تصفية:
              </div>
              <div className="flex-1 min-w-[160px]">
                <Select value={filterClass} onValueChange={setFilterClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الصفوف" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الصفوف</SelectItem>
                    {classes.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[160px]">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="نوع الامتحان" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأنواع</SelectItem>
                    <SelectItem value="شهر أول">شهر أول</SelectItem>
                    <SelectItem value="شهر ثاني">شهر ثاني</SelectItem>
                    <SelectItem value="نصف سنة">نصف سنة</SelectItem>
                    <SelectItem value="نهاية سنة">نهاية سنة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1 mr-auto">
                <Button
                  size="icon"
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  className="h-8 w-8"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  className="h-8 w-8"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Exam Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredExams.length === 0 ? (
        <Card className="dark:bg-gray-900/50 dark:border-gray-700">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <ClipboardList className="h-12 w-12 mb-4 opacity-30" />
            <p className="text-lg font-medium">لا توجد امتحانات</p>
            <p className="text-sm">قم بإضافة امتحانات جديدة</p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        /* Grid View - Grouped by Date */
        <motion.div variants={itemVariants} className="space-y-6">
          {Object.entries(examsByDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, dateExams]) => {
            const isToday = date === today
            const isPast = date < today

            return (
              <Card key={date} className={cn(
                'overflow-hidden dark:bg-gray-900/50 dark:border-gray-700',
                isToday && 'border-teal-300 ring-1 ring-teal-200 dark:ring-teal-700',
                isPast && 'opacity-60'
              )}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-3 dark:text-gray-200">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold shrink-0',
                      isToday ? 'bg-teal-500' : isPast ? 'bg-gray-400' : 'bg-primary'
                    )}>
                      {new Date(date).getDate()}
                    </div>
                    <div>
                      <span>{formatArabicDate(date)}</span>
                      <p className="text-xs font-normal text-muted-foreground">{getArabicDay(date)}</p>
                    </div>
                    {isToday && (
                      <Badge className="bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-700 text-xs mr-auto">اليوم</Badge>
                    )}
                    <Badge variant="outline" className="text-xs mr-auto">
                      {dateExams.length} امتحان
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {dateExams.map((exam) => {
                      const color = SUBJECT_COLORS[exam.subjectName] || DEFAULT_COLOR
                      return (
                        <motion.div
                          key={exam.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ y: -2, boxShadow: '0 8px 25px -5px rgba(13, 148, 136, 0.12)' }}
                          className={cn(
                            'rounded-xl border p-4 transition-all hover:shadow-lg relative overflow-hidden',
                            color.bg,
                            isPast && 'opacity-50 dark:opacity-40'
                          )}
                        >
                          {/* Gradient top strip based on exam type */}
                          <div className="absolute top-0 right-0 left-0 h-0.5" style={{
                            background: exam.examType === 'نهاية سنة' ? 'linear-gradient(90deg, #dc2626, #ef4444)' :
                              exam.examType === 'نصف سنة' ? 'linear-gradient(90deg, #d97706, #f59e0b)' :
                              exam.examType === 'شهر أول' ? 'linear-gradient(90deg, #2563eb, #3b82f6)' :
                              exam.examType === 'شهر ثاني' ? 'linear-gradient(90deg, #0891b2, #06b6d4)' :
                              'linear-gradient(90deg, #0d9488, #14b8a6)'
                          }} />
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={cn('w-3 h-3 rounded-full', color.dot)} />
                              <span className={cn('font-bold text-sm', color.text, 'dark:text-gray-200')}>{exam.subjectName}</span>
                            </div>
                            <Badge variant="outline" className={cn('text-[10px]', EXAM_TYPE_COLORS[exam.examType] || '')}>
                              {exam.examType}
                            </Badge>
                          </div>
                          <div className="space-y-1.5 text-xs text-muted-foreground dark:text-gray-400">
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3 w-3" />
                              <span>{exam.time}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <BookOpen className="h-3 w-3" />
                              <span>{exam.className}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3 w-3" />
                              <span>{exam.room}</span>
                            </div>
                          </div>
                          {/* Countdown for upcoming exams */}
                          {!isPast && !isToday && (() => {
                            const daysUntil = Math.ceil((new Date(exam.date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24))
                            return daysUntil > 0 && daysUntil <= 7 ? (
                              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 rounded-full px-2 py-0.5 w-fit">
                                <Clock className="h-2.5 w-2.5" />
                                بعد {daysUntil} {daysUntil === 1 ? 'يوم' : 'أيام'}
                              </div>
                            ) : null
                          })()}
                          {isToday && (
                            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-full px-2 py-0.5 w-fit">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                              اليوم
                            </div>
                          )}
                          {exam.notes && (
                            <p className="text-xs text-muted-foreground dark:text-gray-500 mt-2 italic">{exam.notes}</p>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </motion.div>
      ) : (
        /* List View - Table */
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden dark:bg-gray-900/50">
            <div className="h-1" style={{ background: 'linear-gradient(90deg, #0d9488, #059669)' }} />
            <CardContent className="p-0 dark:bg-gray-900/50">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المادة</TableHead>
                      <TableHead className="text-center">نوع الامتحان</TableHead>
                      <TableHead className="text-center">التاريخ</TableHead>
                      <TableHead className="text-center">الوقت</TableHead>
                      <TableHead className="text-center">الصف</TableHead>
                      <TableHead className="text-center">القاعة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {filteredExams.map((exam, idx) => {
                        const color = SUBJECT_COLORS[exam.subjectName] || DEFAULT_COLOR
                        const isToday = exam.date === today
                        const isPast = exam.date < today

                        return (
                          <motion.tr
                            key={exam.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.02 }}
                          className={cn(
                              'hover:bg-muted/50 dark:hover:bg-gray-800/50 border-b transition-colors',
                              isToday && 'bg-teal-50/50',
                              isPast && 'opacity-50'
                            )}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className={cn('w-3 h-3 rounded-full shrink-0', color.dot)} />
                                <span className={cn('font-medium', color.text)}>{exam.subjectName}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className={cn('text-xs', EXAM_TYPE_COLORS[exam.examType] || '')}>
                                {exam.examType}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex flex-col items-center">
                                <span className="text-sm">{formatArabicDate(exam.date)}</span>
                                <span className="text-xs text-muted-foreground">{getArabicDay(exam.date)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center text-sm font-mono" dir="ltr">{exam.time}</TableCell>
                            <TableCell className="text-center text-sm">{exam.className}</TableCell>
                            <TableCell className="text-center text-sm">{exam.room}</TableCell>
                          </motion.tr>
                        )
                      })}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Add Exam Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto dark:bg-gray-900 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 dark:text-gray-200">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}>
                <ClipboardList className="h-4 w-4 text-white" />
              </div>
              إضافة امتحان جديد
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="dark:text-gray-300">المادة *</Label>
              <Select value={form.subjectId} onValueChange={(v) => setForm({ ...form, subjectId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المادة" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="dark:text-gray-300">نوع الامتحان *</Label>
              <Select value={form.examType} onValueChange={(v) => setForm({ ...form, examType: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="شهر أول">شهر أول</SelectItem>
                  <SelectItem value="شهر ثاني">شهر ثاني</SelectItem>
                  <SelectItem value="نصف سنة">نصف سنة</SelectItem>
                  <SelectItem value="نهاية سنة">نهاية سنة</SelectItem>
                  <SelectItem value="تقويم مستمر">تقويم مستمر</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="dark:text-gray-300">التاريخ *</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div>
                <Label className="dark:text-gray-300">الوقت</Label>
                <Input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label className="dark:text-gray-300">الصف *</Label>
              <Select value={form.classId} onValueChange={(v) => setForm({ ...form, classId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الصف" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="dark:text-gray-300">القاعة</Label>
              <Input
                value={form.room}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
                placeholder="مثال: قاعة 1"
              />
            </div>
            <div>
              <Label className="dark:text-gray-300">ملاحظات</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="ملاحظات إضافية..."
                rows={2}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setFormOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={saving} style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}>
              {saving ? 'جاري الحفظ...' : 'إضافة الامتحان'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
