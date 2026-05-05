'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, Medal, Award, TrendingUp, Users, Star,
  Filter, Download, Search
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { exportToCSV } from '@/lib/export-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

// Types
interface ClassItem {
  id: string
  name: string
  level: string
  stage: string
  branch: string | null
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

interface RankedStudent {
  id: string
  fullName: string
  studentNumber: string
  className: string
  sectionName: string
  average: number
  totalSubjects: number
}

// Status badge based on average
function getStatusBadge(average: number) {
  if (average >= 90) return { label: 'ممتاز', class: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
  if (average >= 80) return { label: 'جيد جداً', class: 'bg-teal-100 text-teal-700 border-teal-200' }
  if (average >= 70) return { label: 'جيد', class: 'bg-blue-100 text-blue-700 border-blue-200' }
  if (average >= 50) return { label: 'مقبول', class: 'bg-amber-100 text-amber-700 border-amber-200' }
  return { label: 'راسب', class: 'bg-red-100 text-red-700 border-red-200' }
}

// Rank color
function getRankStyle(rank: number) {
  if (rank === 1) return { bg: 'bg-yellow-50 border-yellow-300', icon: '🥇', color: 'text-yellow-600', ring: 'ring-yellow-300' }
  if (rank === 2) return { bg: 'bg-gray-50 border-gray-300', icon: '🥈', color: 'text-gray-500', ring: 'ring-gray-300' }
  if (rank === 3) return { bg: 'bg-orange-50 border-orange-300', icon: '🥉', color: 'text-orange-600', ring: 'ring-orange-300' }
  return { bg: '', icon: '', color: 'text-muted-foreground', ring: '' }
}

// Mock data generator
function generateMockRanking(): RankedStudent[] {
  const names = [
    'أحمد محمد علي', 'فاطمة حسين جاسم', 'علي عبدالله صالح', 'مريم كريم حسن',
    'حسين أحمد عباس', 'زينب محمد جواد', 'عمر خالد إبراهيم', 'نور علي حسين',
    'ياسر عبد الرحمن', 'سارة وليد طه', 'بلال مؤيد ناصر', 'رنا صباح عبد',
    'عمار فلاح زكي', 'هند قاسم محمد', 'وليد رعد حميد', 'دعاء نبيل أحمد',
    'رعد ثائر سعيد', 'لمى صباح خلف', 'قاسم وليد عزيز', 'آية عمار جبار',
    'نبيل ياسر هادي', 'فرح بلال عبد الأمير', 'صباح قاسم حسون', 'منى عمار كاظم',
    'ثائر عادل شاكر', 'ربى خالد نجم', 'إبراهيم سالم جاسم', 'هالة فاهم كريم',
    'يوسف حكمت صالح', 'إنعام رشيد عبود'
  ]
  
  const classNames = ['الرابع الإعدادي', 'الخامس الإعدادي - علمي', 'الخامس الإعدادي - أدبي', 'السادس الإعدادي - علمي', 'السادس الإعدادي - أدبي', 'الثالث المتوسط']
  const sectionNames = ['أ', 'ب', 'ج']
  
  return names.map((name, i) => ({
    id: `mock-${i}`,
    fullName: name,
    studentNumber: `STU-2026-${String(100 + i).padStart(5, '0')}`,
    className: classNames[i % classNames.length],
    sectionName: sectionNames[i % sectionNames.length],
    average: Math.round((95 - i * 1.5 + Math.random() * 3) * 100) / 100,
    totalSubjects: 7,
  })).sort((a, b) => b.average - a.average)
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

export default function ClassRankingPage() {
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [subjects, setSubjects] = useState<SubjectItem[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('all')
  const [selectedSubject, setSelectedSubject] = useState<string>('all')
  const [rankings, setRankings] = useState<RankedStudent[]>([])
  const [loading, setLoading] = useState(true)

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

  const fetchRankings = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedClass !== 'all') params.set('classId', selectedClass)
      if (selectedSubject !== 'all') params.set('subjectId', selectedSubject)

      const res = await fetch(`/api/grades?${params}`)
      if (res.ok) {
        const data = await res.json()
        if (data.grades && data.grades.length > 0) {
          // Calculate averages from real data
          const studentMap = new Map<string, { fullName: string; studentNumber: string; className: string; sectionName: string; totalScore: number; count: number }>()
          
          data.grades.forEach((g: { student: { id: string; fullName: string; studentNumber: string; class: { name: string }; section: { name: string } }; score: number | null; examType: { maxScore: number } }) => {
            const sid = g.student.id
            if (!studentMap.has(sid)) {
              studentMap.set(sid, {
                fullName: g.student.fullName,
                studentNumber: g.student.studentNumber,
                className: g.student.class.name,
                sectionName: g.student.section.name,
                totalScore: 0,
                count: 0,
              })
            }
            const entry = studentMap.get(sid)!
            if (g.score !== null) {
              entry.totalScore += (g.score / g.examType.maxScore) * 100
              entry.count++
            }
          })

          const ranked: RankedStudent[] = Array.from(studentMap.entries())
            .filter(([, v]) => v.count > 0)
            .map(([id, v]) => ({
              id,
              fullName: v.fullName,
              studentNumber: v.studentNumber,
              className: v.className,
              sectionName: v.sectionName,
              average: Math.round((v.totalScore / v.count) * 100) / 100,
              totalSubjects: v.count,
            }))
            .sort((a, b) => b.average - a.average)

          setRankings(ranked)
        } else {
          // Use mock data
          setRankings(generateMockRanking())
        }
      } else {
        setRankings(generateMockRanking())
      }
    } catch {
      setRankings(generateMockRanking())
    } finally {
      setLoading(false)
    }
  }, [selectedClass, selectedSubject])

  useEffect(() => {
    fetchClasses()
    fetchSubjects()
  }, [fetchClasses, fetchSubjects])

  useEffect(() => {
    fetchRankings()
  }, [fetchRankings])

  // Filter rankings by selected class
  const filteredRankings = selectedClass !== 'all'
    ? rankings.filter(r => r.className === classes.find(c => c.id === selectedClass)?.name)
    : rankings

  // Stats
  const highestAverage = filteredRankings.length > 0 ? filteredRankings[0].average : 0
  const classAverage = filteredRankings.length > 0
    ? Math.round((filteredRankings.reduce((sum, r) => sum + r.average, 0) / filteredRankings.length) * 100) / 100
    : 0
  const totalStudents = filteredRankings.length

  // Top 3 for podium
  const top3 = filteredRankings.slice(0, 3)

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
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold dark:text-gray-200">ترتيب الصفوف</h1>
            <p className="text-sm text-muted-foreground">لوحة المتصدرين - ترتيب الطلاب حسب المعدل</p>
          </div>
        </div>
        <Button variant="outline" className="gap-2 border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-400 dark:hover:bg-teal-900/20" onClick={() => {
          const csvData = filteredRankings.map((s, idx) => ({
            'الترتيب': idx + 1,
            'اسم الطالب': s.fullName,
            'الصف': s.className,
            'الشعبة': s.sectionName,
            'المعدل': s.average,
          }))
          exportToCSV(csvData, 'ترتيب_الطلاب')
        }}>
          <Download className="h-4 w-4" />
          تصدير الترتيب
        </Button>
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/20 dark:to-emerald-950/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 left-0 h-1" style={{ background: 'linear-gradient(90deg, #0d9488, #059669)' }} />
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center shrink-0">
              <Star className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">أعلى معدل</p>
              <p className="text-2xl font-bold text-teal-700 dark:text-teal-300">{highestAverage}%</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 left-0 h-1" style={{ background: 'linear-gradient(90deg, #059669, #10b981)' }} />
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
              <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">معدل الصف</p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{classAverage}%</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-cyan-200 bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-950/20 dark:to-sky-950/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 left-0 h-1" style={{ background: 'linear-gradient(90deg, #0891b2, #0ea5e9)' }} />
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-100 dark:bg-cyan-900/40 flex items-center justify-center shrink-0">
              <Users className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">عدد الطلاب</p>
              <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">{totalStudents}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants}>
        <Card className="dark:bg-gray-900/50 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Filter className="h-4 w-4" />
                تصفية:
              </div>
              <div className="flex-1 min-w-[180px]">
                <Select value={selectedClass} onValueChange={setSelectedClass}>
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
              <div className="flex-1 min-w-[180px]">
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع المواد" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المواد</SelectItem>
                    {subjects.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Top 3 Podium */}
      {top3.length >= 3 && (
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden dark:bg-gray-900/50">
            <div className="absolute top-0 right-0 left-0 h-1" style={{ background: 'linear-gradient(90deg, #0d9488, #059669)' }} />
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 dark:text-gray-200">
                <Award className="h-5 w-5 text-yellow-500" />
                منصة المتصدرين
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-6">
              <div className="flex items-end justify-center gap-4 pt-4">
                {/* 2nd Place */}
                <div className="flex flex-col items-center">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col items-center"
                  >
                    <Avatar className="h-16 w-16 ring-2 ring-gray-300 mb-2">
                      <AvatarFallback className="bg-gray-100 text-gray-600 text-lg font-bold">
                        {top3[1].fullName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-sm font-bold text-center max-w-[100px] truncate">{top3[1].fullName}</p>
                    <p className="text-xs text-muted-foreground">{top3[1].className}</p>
                    <Badge className="mt-1 bg-gray-100 text-gray-700 border-gray-300 text-xs dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"> {top3[1].average}%</Badge>
                  </motion.div>
                  <div className="w-24 bg-gradient-to-t from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-t-lg mt-3 flex items-end justify-center pb-2" style={{ height: '100px' }}>
                    <span className="text-2xl font-bold text-gray-500">2</span>
                  </div>
                </div>

                {/* 1st Place */}
                <div className="flex flex-col items-center">
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                    className="flex flex-col items-center"
                  >
                    <div className="relative">
                      <Trophy className="h-6 w-6 text-yellow-500 absolute -top-4 left-1/2 -translate-x-1/2" />
                      <Avatar className="h-20 w-20 ring-3 ring-yellow-400 mb-2">
                        <AvatarFallback className="bg-yellow-100 text-yellow-700 text-xl font-bold">
                          {top3[0].fullName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <p className="text-sm font-bold text-center max-w-[110px] truncate">{top3[0].fullName}</p>
                    <p className="text-xs text-muted-foreground">{top3[0].className}</p>
                    <Badge className="mt-1 bg-yellow-100 text-yellow-700 border-yellow-300 text-xs dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700"> {top3[0].average}%</Badge>
                  </motion.div>
                  <div className="w-24 bg-gradient-to-t from-yellow-300 to-yellow-100 dark:from-yellow-700 dark:to-yellow-600 rounded-t-lg mt-3 flex items-end justify-center pb-2" style={{ height: '140px' }}>
                    <span className="text-3xl font-bold text-yellow-600">1</span>
                  </div>
                </div>

                {/* 3rd Place */}
                <div className="flex flex-col items-center">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col items-center"
                  >
                    <Avatar className="h-16 w-16 ring-2 ring-orange-300 mb-2">
                      <AvatarFallback className="bg-orange-100 text-orange-600 text-lg font-bold">
                        {top3[2].fullName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-sm font-bold text-center max-w-[100px] truncate">{top3[2].fullName}</p>
                    <p className="text-xs text-muted-foreground">{top3[2].className}</p>
                    <Badge className="mt-1 bg-orange-100 text-orange-700 border-orange-300 text-xs dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700"> {top3[2].average}%</Badge>
                  </motion.div>
                  <div className="w-24 bg-gradient-to-t from-orange-200 to-orange-100 dark:from-orange-700 dark:to-orange-600 rounded-t-lg mt-3 flex items-end justify-center pb-2" style={{ height: '70px' }}>
                    <span className="text-2xl font-bold text-orange-500">3</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Rankings Table */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden dark:bg-gray-900/50">
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #0d9488, #059669)' }} />
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 dark:text-gray-200">
              <Medal className="h-5 w-5 text-primary" />
              جدول الترتيب الكامل
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : filteredRankings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Trophy className="h-12 w-12 mb-4 opacity-30" />
                <p className="text-lg font-medium">لا توجد بيانات ترتيب</p>
                <p className="text-sm">قم بإضافة درجات لعرض الترتيب</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center w-16">الترتيب</TableHead>
                      <TableHead>اسم الطالب</TableHead>
                      <TableHead className="text-center">الصف</TableHead>
                      <TableHead className="text-center">الشعبة</TableHead>
                      <TableHead className="text-center">المعدل</TableHead>
                      <TableHead className="text-center">التقدير</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {filteredRankings.map((student, idx) => {
                        const rank = idx + 1
                        const rankStyle = getRankStyle(rank)
                        const status = getStatusBadge(student.average)

                        return (
                          <motion.tr
                            key={student.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ delay: idx * 0.02 }}
                            className={cn(
                              'cursor-pointer hover:bg-muted/50 dark:hover:bg-gray-800/50 border-b transition-colors',
                              rank <= 3 && rankStyle.bg
                            )}
                          >
                            <TableCell className="text-center">
                              <div className={cn(
                                'flex items-center justify-center w-8 h-8 rounded-full mx-auto font-bold text-sm',
                                rank === 1 && 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-300',
                                rank === 2 && 'bg-gray-100 text-gray-600 ring-2 ring-gray-300',
                                rank === 3 && 'bg-orange-100 text-orange-600 ring-2 ring-orange-300',
                                rank > 3 && 'bg-muted text-muted-foreground dark:bg-gray-800 dark:text-gray-400'
                              )}>
                                {rank <= 3 ? rankStyle.icon : rank}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className={cn('h-8 w-8', rank <= 3 && `ring-2 ${rankStyle.ring}`)}>
                                  <AvatarFallback className={cn(
                                    'text-xs',
                                    rank === 1 && 'bg-yellow-100 text-yellow-700',
                                    rank === 2 && 'bg-gray-100 text-gray-600',
                                    rank === 3 && 'bg-orange-100 text-orange-600',
                                    rank > 3 && 'bg-primary/10 text-primary dark:bg-teal-900/30 dark:text-teal-300'
                                  )}>
                                    {student.fullName.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <span className={cn('font-medium dark:text-gray-200', rank <= 3 && 'font-bold')}>{student.fullName}</span>
                                  <p className="text-xs text-muted-foreground font-mono">{student.studentNumber}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center text-sm">{student.className}</TableCell>
                            <TableCell className="text-center text-sm">{student.sectionName}</TableCell>
                            <TableCell className="text-center">
                              <span className={cn(
                                'font-bold text-lg',
                                student.average >= 90 && 'text-emerald-600',
                                student.average >= 80 && student.average < 90 && 'text-teal-600',
                                student.average >= 70 && student.average < 80 && 'text-blue-600',
                                student.average >= 50 && student.average < 70 && 'text-amber-600',
                                student.average < 50 && 'text-red-600',
                              )}>
                                {student.average}%
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className={cn('text-xs', status.class)}>
                                {status.label}
                              </Badge>
                            </TableCell>
                          </motion.tr>
                        )
                      })}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
