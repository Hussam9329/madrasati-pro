'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Calendar, Clock, XCircle, GraduationCap, Award,
  TrendingUp, Printer, Download, ArrowRight, BarChart3, PieChart as PieChartIcon,
  Users, AlertTriangle, CheckCircle, Filter, Search, FileSpreadsheet, Activity, Hash, ArrowUpRight, ArrowDownRight, Lightbulb
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
import {
  PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, ResponsiveContainer, ScatterChart, Scatter, ZAxis
} from 'recharts'
import { toast } from 'sonner'
import { extractApiData } from '@/services/api'
import { EmptyState } from '@/components/ui/empty-state'
import { exportToCSV } from '@/lib/export-utils'

// Types
import type { ClassData, AttendanceRecord, GradeRecord } from '@/types'
import { CHART_COLORS, ATTENDANCE_STATUS_COLORS } from '@/lib/constants'

// Report types - added grade-distribution
const reportTypes = [
  { id: 'daily-attendance', title: 'تقرير الحضور اليومي', icon: Calendar, color: 'bg-emerald-100 text-emerald-700 border-emerald-200', desc: 'عرض حالة حضور الطلاب لليوم' },
  { id: 'monthly-attendance', title: 'تقرير الحضور الشهري', icon: FileText, color: 'bg-teal-100 text-teal-700 border-teal-200', desc: 'ملخص الحضور خلال الشهر' },
  { id: 'lateness', title: 'تقرير التأخيرات', icon: Clock, color: 'bg-amber-100 text-amber-700 border-amber-200', desc: 'إحصائيات التأخيرات' },
  { id: 'absence', title: 'تقرير الغيابات', icon: XCircle, color: 'bg-red-100 text-red-700 border-red-200', desc: 'إحصائيات الغيابات' },
  { id: 'grades', title: 'تقرير الدرجات', icon: GraduationCap, color: 'bg-blue-100 text-blue-700 border-blue-200', desc: 'عرض درجات الطلاب' },
  { id: 'grade-distribution', title: 'توزيع الدرجات', icon: Activity, color: 'bg-pink-100 text-pink-700 border-pink-200', desc: 'توزيع الدرجات مع رسم مبعثر وهيستوغرام' },
  { id: 'pass-rate', title: 'تقرير نسب النجاح', icon: TrendingUp, color: 'bg-purple-100 text-purple-700 border-purple-200', desc: 'نسب النجاح حسب المادة والصف' },
  { id: 'top-students', title: 'تقرير الطلاب المتفوقين', icon: Award, color: 'bg-yellow-100 text-yellow-700 border-yellow-200', desc: 'أفضل الطلاب أداءً' },
  { id: 'failed-students', title: 'تقرير الطلاب الراسبين', icon: AlertTriangle, color: 'bg-orange-100 text-orange-700 border-orange-200', desc: 'الطلاب الذين لم يجتازوا' },
]

const statusColors = ATTENDANCE_STATUS_COLORS

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState<ClassData[]>([])
  const [subjects, setSubjects] = useState<{ id: string; name: string; code: string; passScore: number; maxScore: number }[]>([])

  // Filter state
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0])
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7))
  const [reportClassId, setReportClassId] = useState<string>('all')
  const [reportSubjectId, setReportSubjectId] = useState<string>('all')

  // Report data
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [gradeRecords, setGradeRecords] = useState<GradeRecord[]>([])

  // Auto-generate report when report type is selected
  useEffect(() => {
    if (selectedReport) {
      generateReport()
    }
  }, [selectedReport])

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classesRes, subjectsRes] = await Promise.all([
          fetch('/api/classes'),
          fetch('/api/subjects'),
        ])
        if (classesRes.ok) setClasses(extractApiData(await classesRes.json()))
        if (subjectsRes.ok) {
          const subs = extractApiData(await subjectsRes.json())
          setSubjects(subs.map((s: { id: string; name: string; code: string; passScore: number; maxScore: number }) => ({
            id: s.id, name: s.name, code: s.code, passScore: s.passScore, maxScore: s.maxScore,
          })))
        }
      } catch {
        console.error('Failed to fetch initial data')
      }
    }
    fetchData()
  }, [])

  // Generate report
  const generateReport = async () => {
    setLoading(true)
    try {
      if (selectedReport?.includes('attendance') || selectedReport === 'lateness' || selectedReport === 'absence') {
        const params = new URLSearchParams({ limit: '200' })
        if (selectedReport === 'daily-attendance') params.set('date', reportDate)
        else if (selectedReport === 'monthly-attendance' || selectedReport === 'lateness' || selectedReport === 'absence') {
          const startDate = `${reportMonth}-01`
          params.set('date', startDate)
        }
        if (reportClassId !== 'all') params.set('classId', reportClassId)

        const res = await fetch(`/api/attendance?${params}`)
        if (res.ok) {
          const data = extractApiData(await res.json())
          setAttendanceRecords(data.records || [])
        }
      } else if (selectedReport?.includes('grade') || selectedReport === 'pass-rate' || selectedReport === 'top-students' || selectedReport === 'failed-students') {
        const params = new URLSearchParams({ limit: '200' })
        if (reportSubjectId !== 'all') params.set('subjectId', reportSubjectId)
        if (reportClassId !== 'all') params.set('classId', reportClassId)

        const res = await fetch(`/api/grades?${params}`)
        if (res.ok) {
          const data = extractApiData(await res.json())
          setGradeRecords(data.grades || [])
        }
      }
    } catch {
      toast.error('خطأ', { description: 'تعذر تحميل بيانات التقرير. حاول مرة أخرى.' })
    } finally {
      setLoading(false)
    }
  }

  // Attendance stats
  const getAttendanceStats = () => {
    const stats = { present: 0, late: 0, absent: 0, excused: 0, earlyExit: 0 }
    attendanceRecords.forEach(r => {
      if (r.status === 'حاضر') stats.present++
      else if (r.status === 'متأخر') stats.late++
      else if (r.status === 'غائب') stats.absent++
      else if (r.status === 'مستأذن') stats.excused++
      else if (r.status === 'خروج مبكر') stats.earlyExit++
    })
    return stats
  }

  // Pie chart data for attendance
  const getAttendancePieData = () => {
    const stats = getAttendanceStats()
    return [
      { name: 'حاضر', value: stats.present, color: '#10b981' },
      { name: 'متأخر', value: stats.late, color: '#f59e0b' },
      { name: 'غائب', value: stats.absent, color: '#ef4444' },
      { name: 'مستأذن', value: stats.excused, color: '#3b82f6' },
      { name: 'خروج مبكر', value: stats.earlyExit, color: '#f97316' },
    ].filter(d => d.value > 0)
  }

  // Grade stats - uses percentage-based pass/fail
  const getGradeStats = () => {
    const validGrades = gradeRecords.filter(g => g.score !== null)
    if (validGrades.length === 0) return null

    const scores = validGrades.map(g => g.score!)
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length
    const highest = Math.max(...scores)
    const lowest = Math.min(...scores)

    // Group by subject
    const bySubject: Record<string, { name: string; scores: number[]; passScore: number; subjectMaxScore: number }> = {}
    validGrades.forEach(g => {
      if (!bySubject[g.subject.id]) {
        bySubject[g.subject.id] = { name: g.subject.name, scores: [], passScore: g.subject.passScore, subjectMaxScore: g.subject.passScore > 0 ? 100 : 100 }
      }
      bySubject[g.subject.id].scores.push(g.score!)
    })

    // Pass rate by subject (for bar chart) - percentage-based
    const passRateBySubject = Object.values(bySubject).map(s => ({
      name: s.name,
      passRate: Math.round((s.scores.filter(sc => (sc / 100) * 100 >= (s.passScore / s.subjectMaxScore) * 100).length / s.scores.length) * 100),
      avgScore: Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length),
    }))

    return {
      average: avg,
      highest,
      lowest,
      total: validGrades.length,
      passRate: Math.round((validGrades.filter(g => {
        const scorePct = (g.score! / g.examType.maxScore) * 100
        const passPct = (g.subject.passScore / 100) * 100
        return scorePct >= passPct
      }).length / validGrades.length) * 100),
      passRateBySubject,
    }
  }

  // Grade distribution data for scatter plot
  const getGradeScatterData = () => {
    return gradeRecords
      .filter(g => g.score !== null)
      .map((g, index) => {
        const scorePct = (g.score! / g.examType.maxScore) * 100
        const passPct = (g.subject.passScore / 100) * 100
        return {
          x: index + 1,
          y: g.score!,
          pass: scorePct >= passPct,
          name: g.student.fullName,
          subject: g.subject.name,
        }
      })
  }

  // Grade histogram data
  const getGradeHistogramData = () => {
    const ranges = [
      { range: '0-20', min: 0, max: 20, count: 0, color: '#ef4444' },
      { range: '21-40', min: 21, max: 40, count: 0, color: '#f97316' },
      { range: '41-60', min: 41, max: 60, count: 0, color: '#f59e0b' },
      { range: '61-80', min: 61, max: 80, count: 0, color: '#10b981' },
      { range: '81-100', min: 81, max: 100, count: 0, color: '#059669' },
    ]
    gradeRecords.forEach(g => {
      if (g.score !== null) {
        for (const r of ranges) {
          if (g.score >= r.min && g.score <= r.max) {
            r.count++
            break
          }
        }
      }
    })
    return ranges
  }

  // Quick stats pills for grade reports
  const getQuickStatPills = () => {
    const gradeStats = getGradeStats()
    const totalRecs = selectedReport?.includes('attendance') || selectedReport === 'lateness' || selectedReport === 'absence'
      ? attendanceRecords.length
      : gradeRecords.length
    return [
      { label: 'عدد السجلات', value: totalRecs, icon: Hash, bg: 'bg-teal-50 dark:bg-teal-900/20', text: 'text-teal-700 dark:text-teal-300' },
      { label: 'أعلى درجة', value: gradeStats?.highest ?? '—', icon: ArrowUpRight, bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300' },
      { label: 'أدنى درجة', value: gradeStats?.lowest ?? '—', icon: ArrowDownRight, bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300' },
      { label: 'المعدل', value: gradeStats ? gradeStats.average.toFixed(1) : '—', icon: TrendingUp, bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300' },
    ]
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportPDF = () => {
    window.print()
    toast.success('تصدير PDF', { description: 'استخدم خيار الطباعة وحفظ كـ PDF' })
  }

  const handleExportCSV = () => {
    const isAttendance = selectedReport?.includes('attendance') || selectedReport === 'lateness' || selectedReport === 'absence'
    if (isAttendance) {
      const data = attendanceRecords.map(r => ({
        'الطالب': r.student.fullName,
        'الصف': r.student.class.name,
        'الشعبة': r.student.section.name,
        'التاريخ': r.date,
        'الدخول': r.checkIn || '',
        'الخروج': r.checkOut || '',
        'الحالة': r.status,
        'مدة التأخير': r.lateMinutes ? String(r.lateMinutes) : '',
      }))
      exportToCSV(data, `تقرير-${selectedReport}-${reportDate}`)
    } else {
      const data = gradeRecords.map(g => ({
        'الطالب': g.student.fullName,
        'الصف': g.student.class.name,
        'الشعبة': g.student.section.name,
        'المادة': g.subject.name,
        'نوع الامتحان': g.examType.name,
        'الدرجة': g.score !== null ? String(g.score) : '',
        'الدرجة العظمى': String(g.examType.maxScore),
        'درجة النجاح': String(g.subject.passScore),
      }))
      exportToCSV(data, `تقرير-${selectedReport}-${reportDate}`)
    }
    toast.success('تم التصدير', { description: 'تم تصدير التقرير كملف CSV' })
  }

  // Render report content based on type
  const renderReportContent = () => {
    if (!selectedReport) return null

    const stats = getAttendanceStats()
    const gradeStats = getGradeStats()
    const totalAttendance = attendanceRecords.length

    // Daily Attendance Report
    if (selectedReport === 'daily-attendance') {
      return (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="border-emerald-200 dark:border-emerald-800 overflow-hidden">
              <div className="h-1 bg-primary" />
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-5 w-5 mx-auto text-emerald-600 mb-1" />
                <p className="text-xl font-bold text-emerald-700">{stats.present}</p>
                <p className="text-xs text-muted-foreground">حاضر ({totalAttendance ? Math.round(stats.present / totalAttendance * 100) : 0}%)</p>
              </CardContent>
            </Card>
            <Card className="border-amber-200 dark:border-amber-800 overflow-hidden">
              <div className="h-1 bg-primary" />
              <CardContent className="p-4 text-center">
                <Clock className="h-5 w-5 mx-auto text-amber-600 mb-1" />
                <p className="text-xl font-bold text-amber-700">{stats.late}</p>
                <p className="text-xs text-muted-foreground">متأخر ({totalAttendance ? Math.round(stats.late / totalAttendance * 100) : 0}%)</p>
              </CardContent>
            </Card>
            <Card className="border-red-200 dark:border-red-800 overflow-hidden">
              <div className="h-1 bg-primary" />
              <CardContent className="p-4 text-center">
                <XCircle className="h-5 w-5 mx-auto text-red-600 mb-1" />
                <p className="text-xl font-bold text-red-700">{stats.absent}</p>
                <p className="text-xs text-muted-foreground">غائب ({totalAttendance ? Math.round(stats.absent / totalAttendance * 100) : 0}%)</p>
              </CardContent>
            </Card>
            <Card className="border-sky-200 dark:border-sky-800 overflow-hidden">
              <div className="h-1 bg-primary" />
              <CardContent className="p-4 text-center">
                <Users className="h-5 w-5 mx-auto text-sky-600 mb-1" />
                <p className="text-xl font-bold text-sky-700">{stats.excused}</p>
                <p className="text-xs text-muted-foreground">مستأذن</p>
              </CardContent>
            </Card>
            <Card className="border-orange-200 dark:border-orange-800 overflow-hidden">
              <div className="h-1 bg-primary" />
              <CardContent className="p-4 text-center">
                <p className="text-xl font-bold text-orange-700">{stats.earlyExit}</p>
                <p className="text-xs text-muted-foreground">خروج مبكر</p>
              </CardContent>
            </Card>
          </div>

          {/* Pie Chart */}
          {totalAttendance > 0 && (
            <Card className="overflow-hidden dark:bg-gray-900/50 dark:border-gray-700">
              <div className="h-1.5 bg-primary" />
              <CardHeader className="pb-2">
                <CardTitle className="text-base">توزيع الحضور</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        <linearGradient id="gradPresent" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                        <linearGradient id="gradLate" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#d97706" />
                        </linearGradient>
                        <linearGradient id="gradAbsent" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#ef4444" />
                          <stop offset="100%" stopColor="#dc2626" />
                        </linearGradient>
                      </defs>
                      <Pie
                        data={getAttendancePieData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {getAttendancePieData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Table */}
          <Card className="overflow-hidden dark:bg-gray-900/50 dark:border-gray-700">
            <div className="h-1.5 bg-primary" />
            <CardContent className="p-0">
              {attendanceRecords.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="لا توجد بيانات حضور لهذا التاريخ"
                  description="جرّب تغيير التاريخ أو الصف المحدد للحصول على نتائج"
                />
              ) : (
                <ScrollArea className="max-h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الطالب</TableHead>
                        <TableHead>الصف</TableHead>
                        <TableHead>الشعبة</TableHead>
                        <TableHead>الدخول</TableHead>
                        <TableHead>الخروج</TableHead>
                        <TableHead>الحالة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceRecords.map(record => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.student.fullName}</TableCell>
                          <TableCell>{record.student.class.name}</TableCell>
                          <TableCell>{record.student.section.name}</TableCell>
                          <TableCell dir="ltr">{record.checkIn || '—'}</TableCell>
                          <TableCell dir="ltr">{record.checkOut || '—'}</TableCell>
                          <TableCell>
                            <Badge className={`${statusColors[record.status] || ''} gap-1`}>
                              {record.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    // Lateness Report
    if (selectedReport === 'lateness') {
      const lateRecords = attendanceRecords.filter(r => r.status === 'متأخر')
      return (
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="h-1.5 bg-primary" />
            <CardContent className="p-6 text-center">
              <Clock className="h-10 w-10 mx-auto text-amber-600 mb-2" />
              <p className="text-3xl font-bold text-amber-700">{lateRecords.length}</p>
              <p className="text-muted-foreground">حالة تأخير</p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden dark:bg-gray-900/50 dark:border-gray-700">
            <div className="h-1.5 bg-primary" />
            <CardContent className="p-0">
              {lateRecords.length === 0 ? (
                <EmptyState
                  icon={CheckCircle}
                  title="لا توجد حالات تأخير"
                  description="جميع الطلاب حضروا في الوقت المحدد"
                />
              ) : (
                <ScrollArea className="max-h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الطالب</TableHead>
                        <TableHead>الصف</TableHead>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>وقت الدخول</TableHead>
                        <TableHead>مدة التأخير</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lateRecords.map(record => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.student.fullName}</TableCell>
                          <TableCell>{record.student.class.name}</TableCell>
                          <TableCell>{record.date}</TableCell>
                          <TableCell dir="ltr">{record.checkIn || '—'}</TableCell>
                          <TableCell>
                            <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                              {record.lateMinutes ? `${record.lateMinutes} دقيقة` : '—'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    // Absence Report
    if (selectedReport === 'absence') {
      const absentRecords = attendanceRecords.filter(r => r.status === 'غائب')
      return (
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="h-1.5 bg-primary" />
            <CardContent className="p-6 text-center">
              <XCircle className="h-10 w-10 mx-auto text-red-600 mb-2" />
              <p className="text-3xl font-bold text-red-700">{absentRecords.length}</p>
              <p className="text-muted-foreground">حالة غياب</p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden dark:bg-gray-900/50 dark:border-gray-700">
            <div className="h-1.5 bg-primary" />
            <CardContent className="p-0">
              {absentRecords.length === 0 ? (
                <EmptyState
                  icon={CheckCircle}
                  title="لا توجد حالات غياب"
                  description="جميع الطلاب حاضرون في السجل المحدد"
                />
              ) : (
                <ScrollArea className="max-h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الطالب</TableHead>
                        <TableHead>الصف</TableHead>
                        <TableHead>الشعبة</TableHead>
                        <TableHead>التاريخ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {absentRecords.map(record => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.student.fullName}</TableCell>
                          <TableCell>{record.student.class.name}</TableCell>
                          <TableCell>{record.student.section.name}</TableCell>
                          <TableCell>{record.date}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    // Grade Distribution Report (Scatter + Histogram)
    if (selectedReport === 'grade-distribution') {
      const scatterData = getGradeScatterData()
      const histogramData = getGradeHistogramData()
      const gStats = getGradeStats()
      return (
        <div className="space-y-6">
          {gStats && (
            <div className="flex flex-wrap gap-3">
              {getQuickStatPills().map((pill, i) => (
                <motion.div
                  key={pill.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full ${pill.bg} border border-current/10`}
                >
                  <pill.icon className={`w-4 h-4 ${pill.text}`} />
                  <span className={`text-sm font-bold ${pill.text}`}>{pill.value}</span>
                  <span className="text-xs text-muted-foreground">{pill.label}</span>
                </motion.div>
              ))}
            </div>
          )}

          {/* Scatter Chart */}
          {scatterData.length > 0 && (
            <Card className="overflow-hidden dark:bg-gray-900/50 dark:border-gray-700">
              <div className="h-1.5 bg-primary" />
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-teal-600" />
                  توزيع الدرجات - رسم مبعثر
                </CardTitle>
                <CardDescription>النقاط الخضراء = ناجح، النقاط الحمراء = راسب</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis type="number" dataKey="x" name="الطالب" tick={{ fontSize: 11 }} label={{ value: 'ترتيب الطالب', position: 'insideBottom', offset: -5, style: { fontSize: 11, fill: '#9ca3af' } }} />
                      <YAxis type="number" dataKey="y" name="الدرجة" domain={[0, 100]} tick={{ fontSize: 11 }} label={{ value: 'الدرجة', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#9ca3af' } }} />
                      <ZAxis range={[40, 40]} />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value: number, name: string) => [name === 'y' ? value : value, name === 'y' ? 'الدرجة' : 'الترتيب']} />
                      <Scatter name="الدرجات" data={scatterData} fill="#0d9488">
                        {scatterData.map((entry, index) => (
                          <Cell key={`scatter-${index}`} fill={entry.pass ? '#10b981' : '#ef4444'} />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Histogram */}
          {histogramData.length > 0 && (
            <Card className="overflow-hidden dark:bg-gray-900/50 dark:border-gray-700">
              <div className="h-1.5 bg-primary" />
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-teal-600" />
                  هيستوغرام مجالات الدرجات
                </CardTitle>
                <CardDescription>عدد الطلاب في كل مجال درجات</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={histogramData}>
                      <defs>
                        <linearGradient id="histGrad0" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ef4444" />
                          <stop offset="100%" stopColor="#dc2626" />
                        </linearGradient>
                        <linearGradient id="histGrad1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f97316" />
                          <stop offset="100%" stopColor="#ea580c" />
                        </linearGradient>
                        <linearGradient id="histGrad2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#d97706" />
                        </linearGradient>
                        <linearGradient id="histGrad3" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                        <linearGradient id="histGrad4" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#059669" />
                          <stop offset="100%" stopColor="#047857" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value: number) => [`${value} طالب`, 'العدد']} />
                      <Bar dataKey="count" name="العدد" radius={[4, 4, 0, 0]}>
                        {histogramData.map((entry, index) => (
                          <Cell key={`hist-${index}`} fill={`url(#histGrad${index})`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {scatterData.length === 0 && (
            <EmptyState
              icon={BarChart3}
              title="لا توجد بيانات درجات متاحة"
              description="أدخل درجات الطلاب أولاً أو غيّر الفلتر لعرض النتائج"
            />
          )}
        </div>
      )
    }

    // Grades / Pass Rate / Top Students / Failed Students
    if (['grades', 'pass-rate', 'top-students', 'failed-students'].includes(selectedReport)) {
      if (!gradeStats) {
        return (
          <EmptyState
            icon={BarChart3}
            title="لا توجد بيانات درجات متاحة"
            description="أدخل درجات الطلاب أولاً أو غيّر الفلتر لعرض النتائج"
          />
        )
      }

      // Pass Rate Report
      if (selectedReport === 'pass-rate') {
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="overflow-hidden">
                <div className="h-1 bg-primary" />
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-5 w-5 mx-auto text-emerald-600 mb-1" />
                  <p className="text-xl font-bold text-emerald-700">{gradeStats.passRate}%</p>
                  <p className="text-xs text-muted-foreground">نسبة النجاح العامة</p>
                </CardContent>
              </Card>
              <Card className="overflow-hidden">
                <div className="h-1 bg-primary" />
                <CardContent className="p-4 text-center">
                  <p className="text-xl font-bold">{gradeStats.average.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">المعدل العام</p>
                </CardContent>
              </Card>
              <Card className="overflow-hidden">
                <div className="h-1 bg-primary" />
                <CardContent className="p-4 text-center">
                  <Award className="h-5 w-5 mx-auto text-emerald-600 mb-1" />
                  <p className="text-xl font-bold text-emerald-700">{gradeStats.highest}</p>
                  <p className="text-xs text-muted-foreground">أعلى درجة</p>
                </CardContent>
              </Card>
              <Card className="overflow-hidden">
                <div className="h-1 bg-primary" />
                <CardContent className="p-4 text-center">
                  <AlertTriangle className="h-5 w-5 mx-auto text-red-600 mb-1" />
                  <p className="text-xl font-bold text-red-700">{gradeStats.lowest}</p>
                  <p className="text-xs text-muted-foreground">أدنى درجة</p>
                </CardContent>
              </Card>
            </div>

            {/* Bar Chart */}
            {gradeStats.passRateBySubject.length > 0 && (
              <Card className="overflow-hidden dark:bg-gray-900/50 dark:border-gray-700">
                <div className="h-1.5 bg-primary" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">نسب النجاح حسب المادة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={gradeStats.passRateBySubject} layout="vertical">
                        <defs>
                          <linearGradient id="gradientBarH" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#059669" />
                            <stop offset="100%" stopColor="#10b981" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip formatter={(value: number) => `${value}%`} />
                        <Bar dataKey="passRate" name="نسبة النجاح" radius={[0, 4, 4, 0]}>
                          {gradeStats.passRateBySubject.map((_, index) => (
                            <Cell key={`cell-${index}`} fill="url(#gradientBarH)" />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            <Progress value={gradeStats.passRate} className="h-3" />
          </div>
        )
      }

      // Top Students
      if (selectedReport === 'top-students') {
        const sortedGrades = [...gradeRecords]
          .filter(g => g.score !== null)
          .sort((a, b) => b.score! - a.score!)
          .slice(0, 20)

        return (
          <div className="space-y-6">
            <Card className="overflow-hidden dark:bg-gray-900/50 dark:border-gray-700">
              <div className="h-1.5 bg-primary" />
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-600" />
                  الطلاب المتفوقين
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sortedGrades.length === 0 ? (
                  <EmptyState
                    icon={Award}
                    title="لا توجد بيانات"
                    description="لم يتم تسجيل أي درجات بعد"
                  />
                ) : (
                  <ScrollArea className="max-h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>الطالب</TableHead>
                          <TableHead>الصف</TableHead>
                          <TableHead>المادة</TableHead>
                          <TableHead>الدرجة</TableHead>
                          <TableHead>الامتحان</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedGrades.map((grade, index) => (
                          <TableRow key={grade.id}>
                            <TableCell>
                              {index < 3 ? (
                                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-bold
                                  ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'}`}
                                >
                                  {index + 1}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">{index + 1}</span>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">{grade.student.fullName}</TableCell>
                            <TableCell>{grade.student.class.name}</TableCell>
                            <TableCell>{grade.subject.name}</TableCell>
                            <TableCell>
                              <span className="font-bold text-emerald-700">{grade.score}</span>
                              <span className="text-muted-foreground text-xs"> / {grade.examType.maxScore}</span>
                            </TableCell>
                            <TableCell>{grade.examType.name}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        )
      }

      // Failed Students
      if (selectedReport === 'failed-students') {
        const failedGrades = gradeRecords.filter(g => {
          if (g.score === null) return false
          const scorePct = (g.score / g.examType.maxScore) * 100
          const passPct = (g.subject.passScore / 100) * 100
          return scorePct < passPct
        })

        return (
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <div className="h-1.5 bg-primary" />
              <CardContent className="p-6 text-center">
                <AlertTriangle className="h-10 w-10 mx-auto text-red-600 mb-2" />
                <p className="text-3xl font-bold text-red-700">{failedGrades.length}</p>
                <p className="text-muted-foreground">طالب راسب</p>
              </CardContent>
            </Card>
            <Card className="overflow-hidden dark:bg-gray-900/50 dark:border-gray-700">
              <div className="h-1.5 bg-primary" />
              <CardContent className="p-0">
                {failedGrades.length === 0 ? (
                  <EmptyState
                    icon={CheckCircle}
                    title="لا يوجد طلاب راسبون"
                    description="جميع الطلاب تجاوزوا درجة النجاح"
                  />
                ) : (
                  <ScrollArea className="max-h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>الطالب</TableHead>
                          <TableHead>الصف</TableHead>
                          <TableHead>المادة</TableHead>
                          <TableHead>الدرجة</TableHead>
                          <TableHead>درجة النجاح</TableHead>
                          <TableHead>الفرق</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {failedGrades.map(grade => (
                          <TableRow key={grade.id}>
                            <TableCell className="font-medium">{grade.student.fullName}</TableCell>
                            <TableCell>{grade.student.class.name}</TableCell>
                            <TableCell>{grade.subject.name}</TableCell>
                            <TableCell>
                              <span className="font-bold text-red-700">{grade.score}</span>
                            </TableCell>
                            <TableCell>{grade.subject.passScore}</TableCell>
                            <TableCell>
                              <Badge className="bg-red-100 text-red-800 border-red-300">
                                -{grade.subject.passScore - grade.score!}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        )
      }

      // Grades Report (default)
      return (
        <div className="space-y-6">
          {/* Quick Stats Pills */}
          <div className="flex flex-wrap gap-3">
            {getQuickStatPills().map((pill, i) => (
              <motion.div
                key={pill.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full ${pill.bg} border border-current/10`}
              >
                <pill.icon className={`w-4 h-4 ${pill.text}`} />
                <span className={`text-sm font-bold ${pill.text}`}>{pill.value}</span>
                <span className="text-xs text-muted-foreground">{pill.label}</span>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="overflow-hidden">
              <div className="h-1 bg-primary" />
              <CardContent className="p-4 text-center">
                <p className="text-xl font-bold">{gradeStats.average.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">المعدل</p>
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <div className="h-1 bg-primary" />
              <CardContent className="p-4 text-center">
                <Award className="h-5 w-5 mx-auto text-emerald-600 mb-1" />
                <p className="text-xl font-bold text-emerald-700">{gradeStats.highest}</p>
                <p className="text-xs text-muted-foreground">أعلى درجة</p>
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <div className="h-1 bg-primary" />
              <CardContent className="p-4 text-center">
                <p className="text-xl font-bold text-red-700">{gradeStats.lowest}</p>
                <p className="text-xs text-muted-foreground">أدنى درجة</p>
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <div className="h-1 bg-primary" />
              <CardContent className="p-4 text-center">
                <p className="text-xl font-bold text-emerald-700">{gradeStats.passRate}%</p>
                <p className="text-xs text-muted-foreground">نسبة النجاح</p>
              </CardContent>
            </Card>
          </div>

          {/* Bar Chart */}
          {gradeStats.passRateBySubject.length > 0 && (
            <Card className="overflow-hidden dark:bg-gray-900/50 dark:border-gray-700">
              <div className="h-1.5 bg-primary" />
              <CardHeader className="pb-2">
                <CardTitle className="text-base">متوسط الدرجات حسب المادة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gradeStats.passRateBySubject}>
                      <defs>
                        <linearGradient id="gradientBarV" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="avgScore" name="المعدل" radius={[4, 4, 0, 0]}>
                        {gradeStats.passRateBySubject.map((_, index) => (
                          <Cell key={`cell-${index}`} fill="url(#gradientBarV)" />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Table */}
          <Card className="overflow-hidden dark:bg-gray-900/50 dark:border-gray-700">
            <div className="h-1.5 bg-primary" />
            <CardContent className="p-0">
              <ScrollArea className="max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الطالب</TableHead>
                      <TableHead>الصف</TableHead>
                      <TableHead>المادة</TableHead>
                      <TableHead>الامتحان</TableHead>
                      <TableHead>الدرجة</TableHead>
                      <TableHead>الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gradeRecords.map(grade => (
                      <TableRow key={grade.id}>
                        <TableCell className="font-medium">{grade.student.fullName}</TableCell>
                        <TableCell>{grade.student.class.name}</TableCell>
                        <TableCell>{grade.subject.name}</TableCell>
                        <TableCell>{grade.examType.name}</TableCell>
                        <TableCell>
                          <span className="font-bold">{grade.score ?? '—'}</span>
                          <span className="text-muted-foreground text-xs"> / {grade.examType.maxScore}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            grade.score !== null && (() => {
                              const scorePct = (grade.score / grade.examType.maxScore) * 100
                              const passPct = (grade.subject.passScore / 100) * 100
                              return scorePct >= passPct
                            })()
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-red-100 text-red-800 border-red-300'
                          }>
                            {grade.score !== null && (() => {
                              const scorePct = (grade.score / grade.examType.maxScore) * 100
                              const passPct = (grade.subject.passScore / 100) * 100
                              return scorePct >= passPct
                            })() ? 'ناجح' : 'راسب'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )
    }

    // Monthly attendance (generic)
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'حاضر', value: stats.present, color: 'text-emerald-700', gradFrom: '#10b981', gradTo: '#059669' },
            { label: 'متأخر', value: stats.late, color: 'text-amber-700', gradFrom: '#f59e0b', gradTo: '#d97706' },
            { label: 'غائب', value: stats.absent, color: 'text-red-700', gradFrom: '#ef4444', gradTo: '#dc2626' },
            { label: 'مستأذن', value: stats.excused, color: 'text-sky-700', gradFrom: '#3b82f6', gradTo: '#2563eb' },
            { label: 'خروج مبكر', value: stats.earlyExit, color: 'text-orange-700', gradFrom: '#f97316', gradTo: '#ea580c' },
          ].map((item, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="h-1 bg-primary" />
              <CardContent className="p-4 text-center">
                <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {totalAttendance > 0 && (
          <Card className="overflow-hidden dark:bg-gray-900/50 dark:border-gray-700">
            <div className="h-1.5 bg-primary" />
            <CardHeader className="pb-2">
              <CardTitle className="text-base">توزيع الحضور الشهري</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getAttendancePieData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {getAttendancePieData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="overflow-hidden dark:bg-gray-900/50 dark:border-gray-700">
          <div className="h-1.5 bg-primary" />
          <CardContent className="p-0">
            <ScrollArea className="max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الطالب</TableHead>
                    <TableHead>الصف</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceRecords.map(record => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.student.fullName}</TableCell>
                      <TableCell>{record.student.class.name}</TableCell>
                      <TableCell>{record.date}</TableCell>
                      <TableCell>
                        <Badge className={`${statusColors[record.status] || ''}`}>{record.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="hint-card p-3 flex items-start gap-3">
        <Lightbulb className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">التقارير</p>
          <p className="text-xs text-blue-600 dark:text-blue-400">اختر نوع التقرير لعرض البيانات بشكل تفصيلي. يمكنك طباعة التقارير أو تصديرها بصيغ مختلفة.</p>
        </div>
      </div>
      {/* Header with gradient icon */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg bg-primary">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold dark:text-gray-100">التقارير</h2>
          <p className="text-sm text-muted-foreground">تقارير شاملة عن الحضور والدرجات والأداء</p>
        </div>
      </div>

      {/* Report Type Selection */}
      {!selectedReport ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {reportTypes.map((type, index) => (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card
                className="cursor-pointer hover:shadow-xl transition-all border-2 hover:border-teal-300 dark:hover:border-teal-600 overflow-hidden group relative"
                onClick={() => setSelectedReport(type.id)}
              >
                {/* Animated gradient border on hover */}
                <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-[2px] bg-primary" style={{ WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }} />
                <div className="h-1 w-0 group-hover:w-full transition-all duration-500 bg-primary" />
                <CardContent className="p-4 space-y-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${type.color.split(' ').slice(0, 1).join(' ')}`}>
                    <type.icon className={`h-6 w-6 ${type.color.split(' ')[1]}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm dark:text-gray-200">{type.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{type.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Back button & Report Title */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setSelectedReport(null)} className="gap-1">
                <ArrowRight className="h-4 w-4" />
                رجوع
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2">
                {(() => {
                  const rt = reportTypes.find(r => r.id === selectedReport)
                  if (!rt) return null
                  return (
                    <>
                      <div className={`w-8 h-8 rounded-md flex items-center justify-center ${rt.color.split(' ').slice(0, 1).join(' ')}`}>
                        <rt.icon className={`h-4 w-4 ${rt.color.split(' ')[1]}`} />
                      </div>
                      <h3 className="text-lg font-bold dark:text-gray-100">{rt.title}</h3>
                    </>
                  )
                })()}
              </div>
            </div>
            <div className="flex gap-2 no-print">
              <Button size="sm" onClick={handlePrint} className="gap-1.5 text-white shadow-md bg-primary">
                <Printer className="h-3.5 w-3.5" />
                طباعة
              </Button>
              <Button size="sm" onClick={handleExportPDF} className="gap-1.5 text-white bg-gradient-to-l from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-md">
                <Download className="h-3.5 w-3.5" />
                تصدير PDF
              </Button>
              <Button size="sm" onClick={handleExportCSV} className="gap-1.5 text-white shadow-md bg-primary">
                <FileSpreadsheet className="h-3.5 w-3.5" />
                تصدير التقرير
              </Button>
            </div>
          </div>

          {/* Quick Stats Summary */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedReport}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex gap-3 p-3 rounded-xl bg-gradient-to-l from-teal-50 to-emerald-50 dark:from-teal-900/10 dark:to-emerald-900/10 border border-teal-100 dark:border-teal-800/30">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  <span className="text-xs font-medium text-teal-700 dark:text-teal-300">
                    {selectedReport.includes('attendance') || selectedReport === 'lateness' || selectedReport === 'absence'
                      ? `سجلات الحضور: ${attendanceRecords.length}`
                      : `سجلات الدرجات: ${gradeRecords.length}`
                    }
                  </span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <span className="text-xs text-muted-foreground">
                  {reportTypes.find(r => r.id === selectedReport)?.desc}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Filters */}
          <Card className="no-print overflow-hidden dark:bg-gray-900/50 dark:border-gray-700">
            <div className="h-1.5 bg-primary" />
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-end">
                {(selectedReport.includes('attendance') || selectedReport === 'lateness' || selectedReport === 'absence') && (
                  <>
                    {selectedReport === 'daily-attendance' ? (
                      <div className="space-y-1 flex-1 min-w-[160px]">
                        <Label className="text-xs font-medium">التاريخ</Label>
                        <Input
                          id="reportDate"
                          name="reportDate"
                          autoComplete="off"
                          type="date"
                          value={reportDate}
                          onChange={(e) => setReportDate(e.target.value)}
                        />
                      </div>
                    ) : (
                      <div className="space-y-1 flex-1 min-w-[160px]">
                        <Label className="text-xs font-medium">الشهر</Label>
                        <Input
                          id="reportMonth"
                          name="reportMonth"
                          autoComplete="off"
                          type="month"
                          value={reportMonth}
                          onChange={(e) => setReportMonth(e.target.value)}
                        />
                      </div>
                    )}
                  </>
                )}
                <div className="space-y-1 flex-1 min-w-[160px]">
                  <Label className="text-xs font-medium">الصف</Label>
                  <Select value={reportClassId} onValueChange={setReportClassId}>
                    <SelectTrigger id="reportClass">
                      <SelectValue placeholder="جميع الصفوف" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الصفوف</SelectItem>
                      {classes.map(cls => (
                        <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {(selectedReport.includes('grade') || selectedReport === 'pass-rate' || selectedReport === 'top-students' || selectedReport === 'failed-students') && (
                  <div className="space-y-1 flex-1 min-w-[160px]">
                    <Label className="text-xs font-medium">المادة</Label>
                    <Select value={reportSubjectId} onValueChange={setReportSubjectId}>
                      <SelectTrigger id="reportSubject">
                        <SelectValue placeholder="جميع المواد" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع المواد</SelectItem>
                        {subjects.map(sub => (
                          <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button
                  onClick={generateReport}
                  disabled={loading}
                  className="gap-2 text-white shadow-md"
                 
                >
                  {loading ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Filter className="h-4 w-4" />
                  )}
                  إنشاء التقرير
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Report Content with animated transitions */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedReport}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {renderReportContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
