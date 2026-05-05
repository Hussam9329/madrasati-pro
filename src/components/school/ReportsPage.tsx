'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Calendar, Clock, XCircle, GraduationCap, Award,
  TrendingUp, Printer, Download, ArrowRight, BarChart3, PieChart as PieChartIcon,
  Users, AlertTriangle, CheckCircle, Filter, Search
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
  CartesianGrid, ResponsiveContainer
} from 'recharts'
import { useToast } from '@/hooks/use-toast'

// Types
interface ClassData {
  id: string
  name: string
  level: string
  stage: string
  branch: string | null
  sections: { id: string; name: string; _count: { students: number } }[]
}

interface AttendanceRecord {
  id: string
  studentId: string
  date: string
  checkIn: string | null
  checkOut: string | null
  status: string
  lateMinutes: number | null
  student: {
    id: string
    fullName: string
    studentNumber: string
    class: { id: string; name: string }
    section: { id: string; name: string }
  }
}

interface GradeRecord {
  id: string
  score: number | null
  status: string
  approved: boolean
  student: {
    id: string
    fullName: string
    studentNumber: string
    class: { id: string; name: string }
    section: { id: string; name: string }
  }
  subject: { id: string; name: string; passScore: number }
  examType: { id: string; name: string; maxScore: number }
}

// Report types
const reportTypes = [
  { id: 'daily-attendance', title: 'تقرير الحضور اليومي', icon: Calendar, color: 'bg-emerald-100 text-emerald-700 border-emerald-200', desc: 'عرض حالة حضور الطلاب لليوم' },
  { id: 'monthly-attendance', title: 'تقرير الحضور الشهري', icon: FileText, color: 'bg-teal-100 text-teal-700 border-teal-200', desc: 'ملخص الحضور خلال الشهر' },
  { id: 'lateness', title: 'تقرير التأخيرات', icon: Clock, color: 'bg-amber-100 text-amber-700 border-amber-200', desc: 'إحصائيات التأخيرات' },
  { id: 'absence', title: 'تقرير الغيابات', icon: XCircle, color: 'bg-red-100 text-red-700 border-red-200', desc: 'إحصائيات الغيابات' },
  { id: 'grades', title: 'تقرير الدرجات', icon: GraduationCap, color: 'bg-blue-100 text-blue-700 border-blue-200', desc: 'عرض درجات الطلاب' },
  { id: 'pass-rate', title: 'تقرير نسب النجاح', icon: TrendingUp, color: 'bg-purple-100 text-purple-700 border-purple-200', desc: 'نسب النجاح حسب المادة والصف' },
  { id: 'top-students', title: 'تقرير الطلاب المتفوقين', icon: Award, color: 'bg-yellow-100 text-yellow-700 border-yellow-200', desc: 'أفضل الطلاب أداءً' },
  { id: 'failed-students', title: 'تقرير الطلاب الراسبين', icon: AlertTriangle, color: 'bg-orange-100 text-orange-700 border-orange-200', desc: 'الطلاب الذين لم يجتازوا' },
]

const CHART_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899']

const statusColors: Record<string, string> = {
  'حاضر': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'متأخر': 'bg-amber-100 text-amber-800 border-amber-300',
  'غائب': 'bg-red-100 text-red-800 border-red-300',
  'مستأذن': 'bg-sky-100 text-sky-800 border-sky-300',
  'خروج مبكر': 'bg-orange-100 text-orange-800 border-orange-300',
}

export default function ReportsPage() {
  const { toast } = useToast()
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

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classesRes, subjectsRes] = await Promise.all([
          fetch('/api/classes'),
          fetch('/api/subjects'),
        ])
        if (classesRes.ok) setClasses(await classesRes.json())
        if (subjectsRes.ok) {
          const subs = await subjectsRes.json()
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
          const endDate = `${reportMonth}-31`
          params.set('date', startDate) // API only supports single date, so we use start
        }
        if (reportClassId !== 'all') params.set('classId', reportClassId)

        const res = await fetch(`/api/attendance?${params}`)
        if (res.ok) {
          const data = await res.json()
          setAttendanceRecords(data.records || [])
        }
      } else if (selectedReport?.includes('grade') || selectedReport === 'pass-rate' || selectedReport === 'top-students' || selectedReport === 'failed-students') {
        const params = new URLSearchParams({ limit: '200' })
        if (reportSubjectId !== 'all') params.set('subjectId', reportSubjectId)
        if (reportClassId !== 'all') params.set('classId', reportClassId)

        const res = await fetch(`/api/grades?${params}`)
        if (res.ok) {
          const data = await res.json()
          setGradeRecords(data.grades || [])
        }
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ في جلب بيانات التقرير', variant: 'destructive' })
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

  // Grade stats
  const getGradeStats = () => {
    const validGrades = gradeRecords.filter(g => g.score !== null)
    if (validGrades.length === 0) return null

    const scores = validGrades.map(g => g.score!)
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length
    const highest = Math.max(...scores)
    const lowest = Math.min(...scores)

    // Group by subject
    const bySubject: Record<string, { name: string; scores: number[]; passScore: number }> = {}
    validGrades.forEach(g => {
      if (!bySubject[g.subject.id]) {
        bySubject[g.subject.id] = { name: g.subject.name, scores: [], passScore: g.subject.passScore }
      }
      bySubject[g.subject.id].scores.push(g.score!)
    })

    // Pass rate by subject (for bar chart)
    const passRateBySubject = Object.values(bySubject).map(s => ({
      name: s.name,
      passRate: Math.round((s.scores.filter(sc => sc >= s.passScore).length / s.scores.length) * 100),
      avgScore: Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length),
    }))

    return {
      average: avg,
      highest,
      lowest,
      total: validGrades.length,
      passRate: Math.round((validGrades.filter(g => g.score! >= g.subject.passScore).length / validGrades.length) * 100),
      passRateBySubject,
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportPDF = () => {
    window.print()
    toast({ title: 'تصدير PDF', description: 'استخدم خيار الطباعة وحفظ كـ PDF' })
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
            <Card className="border-emerald-200">
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-5 w-5 mx-auto text-emerald-600 mb-1" />
                <p className="text-xl font-bold text-emerald-700">{stats.present}</p>
                <p className="text-xs text-muted-foreground">حاضر ({totalAttendance ? Math.round(stats.present / totalAttendance * 100) : 0}%)</p>
              </CardContent>
            </Card>
            <Card className="border-amber-200">
              <CardContent className="p-4 text-center">
                <Clock className="h-5 w-5 mx-auto text-amber-600 mb-1" />
                <p className="text-xl font-bold text-amber-700">{stats.late}</p>
                <p className="text-xs text-muted-foreground">متأخر ({totalAttendance ? Math.round(stats.late / totalAttendance * 100) : 0}%)</p>
              </CardContent>
            </Card>
            <Card className="border-red-200">
              <CardContent className="p-4 text-center">
                <XCircle className="h-5 w-5 mx-auto text-red-600 mb-1" />
                <p className="text-xl font-bold text-red-700">{stats.absent}</p>
                <p className="text-xs text-muted-foreground">غائب ({totalAttendance ? Math.round(stats.absent / totalAttendance * 100) : 0}%)</p>
              </CardContent>
            </Card>
            <Card className="border-sky-200">
              <CardContent className="p-4 text-center">
                <Users className="h-5 w-5 mx-auto text-sky-600 mb-1" />
                <p className="text-xl font-bold text-sky-700">{stats.excused}</p>
                <p className="text-xs text-muted-foreground">مستأذن</p>
              </CardContent>
            </Card>
            <Card className="border-orange-200">
              <CardContent className="p-4 text-center">
                <p className="text-xl font-bold text-orange-700">{stats.earlyExit}</p>
                <p className="text-xs text-muted-foreground">خروج مبكر</p>
              </CardContent>
            </Card>
          </div>

          {/* Pie Chart */}
          {totalAttendance > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">توزيع الحضور</CardTitle>
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

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              {attendanceRecords.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">لا توجد بيانات حضور لهذا التاريخ</p>
                </div>
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
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="h-10 w-10 mx-auto text-amber-600 mb-2" />
              <p className="text-3xl font-bold text-amber-700">{lateRecords.length}</p>
              <p className="text-muted-foreground">حالة تأخير</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-0">
              {lateRecords.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 mx-auto text-emerald-500 mb-3" />
                  <p className="text-muted-foreground">لا توجد حالات تأخير</p>
                </div>
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
          <Card>
            <CardContent className="p-6 text-center">
              <XCircle className="h-10 w-10 mx-auto text-red-600 mb-2" />
              <p className="text-3xl font-bold text-red-700">{absentRecords.length}</p>
              <p className="text-muted-foreground">حالة غياب</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-0">
              {absentRecords.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 mx-auto text-emerald-500 mb-3" />
                  <p className="text-muted-foreground">لا توجد حالات غياب</p>
                </div>
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

    // Grades / Pass Rate / Top Students / Failed Students
    if (['grades', 'pass-rate', 'top-students', 'failed-students'].includes(selectedReport)) {
      if (!gradeStats) {
        return (
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">لا توجد بيانات درجات متاحة</p>
          </div>
        )
      }

      // Pass Rate Report
      if (selectedReport === 'pass-rate') {
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-5 w-5 mx-auto text-emerald-600 mb-1" />
                  <p className="text-xl font-bold text-emerald-700">{gradeStats.passRate}%</p>
                  <p className="text-xs text-muted-foreground">نسبة النجاح العامة</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-xl font-bold">{gradeStats.average.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">المعدل العام</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Award className="h-5 w-5 mx-auto text-emerald-600 mb-1" />
                  <p className="text-xl font-bold text-emerald-700">{gradeStats.highest}</p>
                  <p className="text-xs text-muted-foreground">أعلى درجة</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <AlertTriangle className="h-5 w-5 mx-auto text-red-600 mb-1" />
                  <p className="text-xl font-bold text-red-700">{gradeStats.lowest}</p>
                  <p className="text-xs text-muted-foreground">أدنى درجة</p>
                </CardContent>
              </Card>
            </div>

            {/* Bar Chart */}
            {gradeStats.passRateBySubject.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">نسب النجاح حسب المادة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={gradeStats.passRateBySubject} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip formatter={(value: number) => `${value}%`} />
                        <Bar dataKey="passRate" name="نسبة النجاح" radius={[0, 4, 4, 0]}>
                          {gradeStats.passRateBySubject.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`url(#gradientBar)`} />
                          ))}
                          <defs>
                            <linearGradient id="gradientBar" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#059669" />
                              <stop offset="100%" stopColor="#10b981" />
                            </linearGradient>
                          </defs>
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
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-600" />
                  الطلاب المتفوقين
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sortedGrades.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">لا توجد بيانات</p>
                  </div>
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
        const failedGrades = gradeRecords.filter(g => g.score !== null && g.score < g.subject.passScore)

        return (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 text-center">
                <AlertTriangle className="h-10 w-10 mx-auto text-red-600 mb-2" />
                <p className="text-3xl font-bold text-red-700">{failedGrades.length}</p>
                <p className="text-muted-foreground">طالب راسب</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-0">
                {failedGrades.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 mx-auto text-emerald-500 mb-3" />
                    <p className="text-muted-foreground">لا يوجد طلاب راسبون</p>
                  </div>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xl font-bold">{gradeStats.average.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">المعدل</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Award className="h-5 w-5 mx-auto text-emerald-600 mb-1" />
                <p className="text-xl font-bold text-emerald-700">{gradeStats.highest}</p>
                <p className="text-xs text-muted-foreground">أعلى درجة</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xl font-bold text-red-700">{gradeStats.lowest}</p>
                <p className="text-xs text-muted-foreground">أدنى درجة</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xl font-bold text-emerald-700">{gradeStats.passRate}%</p>
                <p className="text-xs text-muted-foreground">نسبة النجاح</p>
              </CardContent>
            </Card>
          </div>

          {/* Bar Chart */}
          {gradeStats.passRateBySubject.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">متوسط الدرجات حسب المادة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gradeStats.passRateBySubject}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="avgScore" name="المعدل" radius={[4, 4, 0, 0]}>
                        {gradeStats.passRateBySubject.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`url(#gradientBarV)`} />
                        ))}
                        <defs>
                          <linearGradient id="gradientBarV" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#059669" />
                          </linearGradient>
                        </defs>
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Table */}
          <Card>
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
                            grade.score !== null && grade.score >= grade.subject.passScore
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-red-100 text-red-800 border-red-300'
                          }>
                            {grade.score !== null && grade.score >= grade.subject.passScore ? 'ناجح' : 'راسب'}
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
            { label: 'حاضر', value: stats.present, color: 'text-emerald-700' },
            { label: 'متأخر', value: stats.late, color: 'text-amber-700' },
            { label: 'غائب', value: stats.absent, color: 'text-red-700' },
            { label: 'مستأذن', value: stats.excused, color: 'text-sky-700' },
            { label: 'خروج مبكر', value: stats.earlyExit, color: 'text-orange-700' },
          ].map((item, i) => (
            <Card key={i}>
              <CardContent className="p-4 text-center">
                <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {totalAttendance > 0 && (
          <Card>
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

        <Card>
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
      {/* Header with gradient icon */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}>
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">التقارير</h2>
          <p className="text-sm text-muted-foreground">تقارير شاملة عن الحضور والدرجات والأداء</p>
        </div>
      </div>

      {/* Report Type Selection */}
      {!selectedReport ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportTypes.map((type, index) => (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className="cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1 border-2 hover:border-teal-300 dark:hover:border-teal-600 overflow-hidden group"
                onClick={() => setSelectedReport(type.id)}
              >
                <div className="h-1 w-full group-hover:w-full transition-all duration-300" style={{ background: 'linear-gradient(90deg, #0d9488, #059669)', width: '0%' }} />
                <CardContent className="p-4 space-y-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${type.color.split(' ').slice(0, 1).join(' ')}`}>
                    <type.icon className={`h-6 w-6 ${type.color.split(' ')[1]}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{type.title}</h3>
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
          <div className="flex items-center justify-between">
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
                      <h3 className="text-lg font-bold">{rt.title}</h3>
                    </>
                  )
                })()}
              </div>
            </div>
            <div className="flex gap-2 no-print">
              <Button size="sm" onClick={handlePrint} className="gap-1 text-white" style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}>
                <Printer className="h-3 w-3" />
                طباعة
              </Button>
              <Button size="sm" onClick={handleExportPDF} className="gap-1 text-white bg-gradient-to-l from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700">
                <Download className="h-3 w-3" />
                تصدير PDF
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
          <Card className="no-print overflow-hidden">
            <div className="h-1" style={{ background: 'linear-gradient(90deg, #0d9488, #059669)' }} />
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-end">
                {(selectedReport.includes('attendance') || selectedReport === 'lateness' || selectedReport === 'absence') && (
                  <>
                    {selectedReport === 'daily-attendance' ? (
                      <div className="space-y-1 flex-1 min-w-[160px]">
                        <Label className="text-xs font-medium">التاريخ</Label>
                        <Input
                          type="date"
                          value={reportDate}
                          onChange={(e) => setReportDate(e.target.value)}
                        />
                      </div>
                    ) : (
                      <div className="space-y-1 flex-1 min-w-[160px]">
                        <Label className="text-xs font-medium">الشهر</Label>
                        <Input
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
                    <SelectTrigger>
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
                      <SelectTrigger>
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
                  className="gap-2 bg-primary hover:bg-primary/90"
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

          {/* Report Content */}
          {renderReportContent()}
        </div>
      )}
    </div>
  )
}
