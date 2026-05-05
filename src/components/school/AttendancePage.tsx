'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  QrCode, ScanLine, LogIn, LogOut, Search, Download, Filter,
  CheckCircle, Clock, AlertTriangle, XCircle, User, Calendar,
  RefreshCw, ArrowLeft, ArrowRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'

// Types
interface Student {
  id: string
  fullName: string
  studentNumber: string
  class: { id: string; name: string }
  section: { id: string; name: string }
}

interface AttendanceRecord {
  id: string
  studentId: string
  date: string
  checkIn: string | null
  checkOut: string | null
  status: string
  lateMinutes: number | null
  createdAt: string
  student: Student
}

interface ScanResult {
  message: string
  action: string
  status: string
  lateMinutes?: number | null
  isEarlyExit?: boolean
  record: {
    id: string
    checkIn: string | null
    checkOut: string | null
    status: string
  }
  student: {
    id: string
    fullName: string
    studentNumber: string
    class: string
    section: string
  }
}

interface ClassData {
  id: string
  name: string
  level: string
  stage: string
  branch: string | null
  sections: { id: string; name: string; _count: { students: number } }[]
}

const statusColors: Record<string, string> = {
  'حاضر': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'متأخر': 'bg-amber-100 text-amber-800 border-amber-300',
  'غائب': 'bg-red-100 text-red-800 border-red-300',
  'مستأذن': 'bg-sky-100 text-sky-800 border-sky-300',
  'خروج مبكر': 'bg-orange-100 text-orange-800 border-orange-300',
  'حضور ناقص': 'bg-purple-100 text-purple-800 border-purple-300',
}

const statusIcons: Record<string, React.ReactNode> = {
  'حاضر': <CheckCircle className="h-4 w-4" />,
  'متأخر': <Clock className="h-4 w-4" />,
  'غائب': <XCircle className="h-4 w-4" />,
  'مستأذن': <AlertTriangle className="h-4 w-4" />,
  'خروج مبكر': <LogOut className="h-4 w-4" />,
}

export default function AttendancePage() {
  const { toast } = useToast()
  const [scanMode, setScanMode] = useState<'checkIn' | 'checkOut'>('checkIn')
  const [qrInput, setQrInput] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const [recentScans, setRecentScans] = useState<AttendanceRecord[]>([])
  const [loadingRecent, setLoadingRecent] = useState(false)

  // Records tab state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [filterClassId, setFilterClassId] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [classes, setClasses] = useState<ClassData[]>([])

  // Fetch classes for filters
  useEffect(() => {
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/classes')
      if (res.ok) {
        const data = await res.json()
        setClasses(data)
      }
    } catch {
      console.error('Failed to fetch classes')
    }
  }

  // Fetch recent scans for today
  const fetchRecentScans = useCallback(async () => {
    setLoadingRecent(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const res = await fetch(`/api/attendance?date=${today}&limit=10`)
      if (res.ok) {
        const data = await res.json()
        setRecentScans(data.records || [])
      }
    } catch {
      console.error('Failed to fetch recent scans')
    } finally {
      setLoadingRecent(false)
    }
  }, [])

  // Fetch attendance records
  const fetchRecords = useCallback(async () => {
    setLoadingRecords(true)
    try {
      const params = new URLSearchParams({ date: selectedDate, limit: '100' })
      if (filterClassId && filterClassId !== 'all') params.set('classId', filterClassId)
      if (filterStatus && filterStatus !== 'all') params.set('status', filterStatus)

      const res = await fetch(`/api/attendance?${params}`)
      if (res.ok) {
        const data = await res.json()
        setRecords(data.records || [])
      }
    } catch {
      console.error('Failed to fetch records')
    } finally {
      setLoadingRecords(false)
    }
  }, [selectedDate, filterClassId, filterStatus])

  useEffect(() => {
    fetchRecentScans()
  }, [fetchRecentScans])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  // Handle QR scan
  const handleScan = async () => {
    if (!qrInput.trim()) {
      toast({ title: 'خطأ', description: 'الرجاء إدخال رمز QR', variant: 'destructive' })
      return
    }

    setIsScanning(true)
    setScanError(null)
    setScanResult(null)

    try {
      const res = await fetch('/api/attendance/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode: qrInput.trim(), type: scanMode }),
      })

      const data = await res.json()

      if (!res.ok) {
        setScanError(data.error || 'حدث خطأ في المسح')
        if (data.student) {
          setScanResult({ ...data, action: 'error', status: data.student.cardStatus || 'خطأ', record: { id: '', checkIn: null, checkOut: null, status: 'خطأ' } })
        }
        return
      }

      setScanResult(data)
      toast({
        title: data.message,
        description: `${data.student.fullName} - ${data.student.class} / ${data.student.section}`,
      })

      // Refresh recent scans
      fetchRecentScans()
    } catch {
      setScanError('حدث خطأ في الاتصال بالخادم')
    } finally {
      setIsScanning(false)
      setQrInput('')
    }
  }

  // Calculate stats from records
  const getStats = () => {
    const stats = { present: 0, late: 0, absent: 0, excused: 0 }
    records.forEach(r => {
      if (r.status === 'حاضر') stats.present++
      else if (r.status === 'متأخر') stats.late++
      else if (r.status === 'غائب') stats.absent++
      else if (r.status === 'مستأذن') stats.excused++
    })
    return stats
  }

  const stats = getStats()

  return (
    <div className="space-y-6">
      <Tabs defaultValue="scanner" className="w-full" dir="rtl">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="scanner" className="gap-2">
            <ScanLine className="h-4 w-4" />
            مسح QR
          </TabsTrigger>
          <TabsTrigger value="records" className="gap-2">
            <Calendar className="h-4 w-4" />
            سجل الحضور
          </TabsTrigger>
        </TabsList>

        {/* ============ TAB 1: QR SCANNER ============ */}
        <TabsContent value="scanner" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Scanner Area */}
            <div className="space-y-4">
              {/* Mode Toggle */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setScanMode('checkIn')}
                      variant={scanMode === 'checkIn' ? 'default' : 'outline'}
                      className={`flex-1 gap-2 ${scanMode === 'checkIn' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                    >
                      <LogIn className="h-4 w-4" />
                      تسجيل دخول
                    </Button>
                    <Button
                      onClick={() => setScanMode('checkOut')}
                      variant={scanMode === 'checkOut' ? 'default' : 'outline'}
                      className={`flex-1 gap-2 ${scanMode === 'checkOut' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                    >
                      <LogOut className="h-4 w-4" />
                      تسجيل خروج
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Scanner Card */}
              <Card className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-primary" />
                    {scanMode === 'checkIn' ? 'مسح دخول' : 'مسح خروج'}
                  </CardTitle>
                  <CardDescription>
                    وجّه الكاميرا نحو بطاقة الطالب أو أدخل رقم QR يدوياً
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Simulated Scanner Area */}
                  <div className="relative">
                    <div className={`w-full aspect-square max-w-[280px] mx-auto rounded-2xl border-4 border-dashed flex items-center justify-center
                      ${scanMode === 'checkIn'
                        ? 'border-emerald-400 bg-emerald-50/50'
                        : 'border-red-400 bg-red-50/50'
                      }`}
                    >
                      {/* Pulsing animation */}
                      <motion.div
                        className={`absolute inset-4 rounded-xl border-2 ${scanMode === 'checkIn' ? 'border-emerald-500' : 'border-red-500'}`}
                        animate={{
                          opacity: [0.3, 1, 0.3],
                          scale: [0.98, 1, 0.98],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                      <div className="text-center z-10 space-y-3">
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <ScanLine className={`h-16 w-16 mx-auto ${scanMode === 'checkIn' ? 'text-emerald-500' : 'text-red-500'}`} />
                        </motion.div>
                        <p className="text-sm text-muted-foreground font-medium">
                          في انتظار المسح...
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Manual Input */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">إدخال QR يدوياً</Label>
                    <div className="flex gap-2">
                      <Input
                        value={qrInput}
                        onChange={(e) => setQrInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                        placeholder="أدخل رمز QR أو رقم الطالب..."
                        className="flex-1 text-center"
                        disabled={isScanning}
                      />
                      <Button
                        onClick={handleScan}
                        disabled={isScanning || !qrInput.trim()}
                        className={scanMode === 'checkIn'
                          ? 'bg-emerald-600 hover:bg-emerald-700'
                          : 'bg-red-600 hover:bg-red-700'
                        }
                      >
                        {isScanning ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          'تسجيل'
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Scan Result */}
            <div className="space-y-4">
              <AnimatePresence mode="wait">
                {scanResult && !scanError ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
                  >
                    <Card className={`overflow-hidden border-2 ${
                      scanMode === 'checkIn' ? 'border-emerald-400' : 'border-red-400'
                    }`}>
                      <div className={`h-2 ${
                        scanMode === 'checkIn' ? 'bg-emerald-500' : 'bg-red-500'
                      }`} />
                      <CardContent className="p-6 space-y-4">
                        {/* Student Photo & Name */}
                        <div className="flex items-center gap-4">
                          <motion.div
                            className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold
                              ${scanMode === 'checkIn' ? 'bg-emerald-500' : 'bg-red-500'}`}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                          >
                            {scanResult.student.fullName.charAt(0)}
                          </motion.div>
                          <div className="space-y-1 flex-1">
                            <h3 className="text-xl font-bold">{scanResult.student.fullName}</h3>
                            <p className="text-muted-foreground">{scanResult.student.studentNumber}</p>
                          </div>
                        </div>

                        <Separator />

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">الصف</p>
                            <p className="font-medium">{scanResult.student.class}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">الشعبة</p>
                            <p className="font-medium">{scanResult.student.section}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">
                              {scanMode === 'checkIn' ? 'وقت الدخول' : 'وقت الخروج'}
                            </p>
                            <p className="font-medium">
                              {scanMode === 'checkIn'
                                ? scanResult.record.checkIn || '—'
                                : scanResult.record.checkOut || '—'
                              }
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">الحالة</p>
                            <Badge className={`${statusColors[scanResult.status] || 'bg-gray-100 text-gray-800'} gap-1`}>
                              {statusIcons[scanResult.status]}
                              {scanResult.status}
                            </Badge>
                          </div>
                        </div>

                        {/* Late Minutes */}
                        {scanResult.lateMinutes && scanResult.lateMinutes > 0 && (
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200"
                          >
                            <Clock className="h-5 w-5 text-amber-600" />
                            <span className="text-amber-800 font-medium">
                              تأخير: {scanResult.lateMinutes} دقيقة
                            </span>
                          </motion.div>
                        )}

                        {/* Success Message */}
                        <motion.div
                          className={`flex items-center gap-2 p-3 rounded-lg ${
                            scanMode === 'checkIn'
                              ? 'bg-emerald-50 border border-emerald-200'
                              : 'bg-red-50 border border-red-200'
                          }`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          <CheckCircle className={`h-5 w-5 ${
                            scanMode === 'checkIn' ? 'text-emerald-600' : 'text-red-600'
                          }`} />
                          <span className="font-medium">{scanResult.message}</span>
                        </motion.div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : scanError ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="border-2 border-red-400 overflow-hidden">
                      <div className="h-2 bg-red-500" />
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                            <XCircle className="h-8 w-8 text-red-500" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-red-700">فشل المسح</h3>
                            <p className="text-red-600">{scanError}</p>
                          </div>
                        </div>
                        {scanResult?.student && (
                          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                            <p className="font-medium">{scanResult.student.fullName}</p>
                            <p className="text-sm text-muted-foreground">{scanResult.student.studentNumber}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Card className="border-dashed">
                      <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-muted-foreground">في انتظار المسح</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            امسح بطاقة الطالب أو أدخل رقم QR يدوياً لعرض النتيجة
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Recent Scans Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-primary" />
                  عمليات المسح اليوم
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={fetchRecentScans} className="gap-1">
                  <RefreshCw className="h-3 w-3" />
                  تحديث
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingRecent ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ))}
                </div>
              ) : recentScans.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">لا توجد عمليات مسح اليوم</p>
                </div>
              ) : (
                <ScrollArea className="max-h-72">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الطالب</TableHead>
                        <TableHead>الصف</TableHead>
                        <TableHead>الدخول</TableHead>
                        <TableHead>الخروج</TableHead>
                        <TableHead>الحالة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentScans.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.student.fullName}</TableCell>
                          <TableCell>{record.student.class.name}</TableCell>
                          <TableCell>{record.checkIn || '—'}</TableCell>
                          <TableCell>{record.checkOut || '—'}</TableCell>
                          <TableCell>
                            <Badge className={`${statusColors[record.status] || ''} gap-1`}>
                              {statusIcons[record.status]}
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
        </TabsContent>

        {/* ============ TAB 2: ATTENDANCE RECORDS ============ */}
        <TabsContent value="records" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
              <Card className="border-emerald-200 bg-emerald-50/50">
                <CardContent className="p-4 text-center">
                  <CheckCircle className="h-6 w-6 mx-auto text-emerald-600 mb-1" />
                  <p className="text-2xl font-bold text-emerald-700">{stats.present}</p>
                  <p className="text-xs text-emerald-600">حاضر</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <Card className="border-amber-200 bg-amber-50/50">
                <CardContent className="p-4 text-center">
                  <Clock className="h-6 w-6 mx-auto text-amber-600 mb-1" />
                  <p className="text-2xl font-bold text-amber-700">{stats.late}</p>
                  <p className="text-xs text-amber-600">متأخر</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="border-red-200 bg-red-50/50">
                <CardContent className="p-4 text-center">
                  <XCircle className="h-6 w-6 mx-auto text-red-600 mb-1" />
                  <p className="text-2xl font-bold text-red-700">{stats.absent}</p>
                  <p className="text-xs text-red-600">غائب</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card className="border-sky-200 bg-sky-50/50">
                <CardContent className="p-4 text-center">
                  <AlertTriangle className="h-6 w-6 mx-auto text-sky-600 mb-1" />
                  <p className="text-2xl font-bold text-sky-700">{stats.excused}</p>
                  <p className="text-xs text-sky-600">مستأذن</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-1 flex-1 min-w-[160px]">
                  <Label className="text-xs font-medium">التاريخ</Label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1 flex-1 min-w-[160px]">
                  <Label className="text-xs font-medium">الصف</Label>
                  <Select value={filterClassId} onValueChange={setFilterClassId}>
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
                <div className="space-y-1 flex-1 min-w-[160px]">
                  <Label className="text-xs font-medium">الحالة</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="جميع الحالات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الحالات</SelectItem>
                      <SelectItem value="حاضر">حاضر</SelectItem>
                      <SelectItem value="متأخر">متأخر</SelectItem>
                      <SelectItem value="غائب">غائب</SelectItem>
                      <SelectItem value="مستأذن">مستأذن</SelectItem>
                      <SelectItem value="خروج مبكر">خروج مبكر</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="sm" onClick={fetchRecords} className="gap-1">
                  <Filter className="h-3 w-3" />
                  تصفية
                </Button>
                <Button variant="outline" size="sm" className="gap-1" onClick={() => window.print()}>
                  <Download className="h-3 w-3" />
                  تصدير
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Records Table */}
          <Card>
            <CardContent className="p-0">
              {loadingRecords ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 flex-1" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))}
                </div>
              ) : records.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">لا توجد سجلات حضور للتاريخ المحدد</p>
                  <p className="text-sm text-muted-foreground mt-1">جرّب تغيير التاريخ أو الفلاتر</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الطالب</TableHead>
                        <TableHead>الصف</TableHead>
                        <TableHead>الشعبة</TableHead>
                        <TableHead>وقت الدخول</TableHead>
                        <TableHead>وقت الخروج</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>ملاحظات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                                {record.student.fullName.charAt(0)}
                              </div>
                              {record.student.fullName}
                            </div>
                          </TableCell>
                          <TableCell>{record.student.class.name}</TableCell>
                          <TableCell>{record.student.section.name}</TableCell>
                          <TableCell dir="ltr">{record.checkIn || '—'}</TableCell>
                          <TableCell dir="ltr">{record.checkOut || '—'}</TableCell>
                          <TableCell>
                            <Badge className={`${statusColors[record.status] || ''} gap-1`}>
                              {statusIcons[record.status]}
                              {record.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {record.lateMinutes
                              ? `تأخير ${record.lateMinutes} دقيقة`
                              : record.status === 'خروج مبكر'
                                ? 'خروج مبكر'
                                : '—'
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
