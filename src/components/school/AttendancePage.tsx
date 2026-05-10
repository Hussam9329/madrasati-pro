'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  QrCode, ScanLine, LogIn, LogOut, Search, Download, Filter,
  CheckCircle, Clock, AlertTriangle, XCircle, User, Calendar,
  RefreshCw, ArrowLeft, ArrowRight, Radio, Users, Save,
  Lightbulb,
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
import { toast } from 'sonner'

// Types
import type { AttendanceRecord, ScanResult, ClassData } from '@/types'
import { ATTENDANCE_STATUS_COLORS } from '@/lib/constants'

// Enhanced status config with chip styling
const statusConfig: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode; dotColor: string; darkBg: string; darkText: string }> = {
  'حاضر': { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', icon: <CheckCircle className="h-3.5 w-3.5" />, dotColor: 'bg-emerald-500', darkBg: 'dark:bg-emerald-900/30', darkText: 'dark:text-emerald-300' },
  'متأخر': { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', icon: <Clock className="h-3.5 w-3.5" />, dotColor: 'bg-amber-500', darkBg: 'dark:bg-amber-900/30', darkText: 'dark:text-amber-300' },
  'غائب': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', icon: <XCircle className="h-3.5 w-3.5" />, dotColor: 'bg-red-500', darkBg: 'dark:bg-red-900/30', darkText: 'dark:text-red-300' },
  'مستأذن': { bg: 'bg-sky-100', text: 'text-sky-800', border: 'border-sky-300', icon: <AlertTriangle className="h-3.5 w-3.5" />, dotColor: 'bg-sky-500', darkBg: 'dark:bg-sky-900/30', darkText: 'dark:text-sky-300' },
  'خروج مبكر': { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', icon: <LogOut className="h-3.5 w-3.5" />, dotColor: 'bg-orange-500', darkBg: 'dark:bg-orange-900/30', darkText: 'dark:text-orange-300' },
  'حضور ناقص': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300', icon: <XCircle className="h-3.5 w-3.5" />, dotColor: 'bg-purple-500', darkBg: 'dark:bg-purple-900/30', darkText: 'dark:text-purple-300' },
  'مكرر دخول': { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', icon: <AlertTriangle className="h-3.5 w-3.5" />, dotColor: 'bg-orange-500', darkBg: 'dark:bg-orange-900/30', darkText: 'dark:text-orange-300' },
  'مكرر خروج': { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', icon: <AlertTriangle className="h-3.5 w-3.5" />, dotColor: 'bg-orange-500', darkBg: 'dark:bg-orange-900/30', darkText: 'dark:text-orange-300' },
}

// Legacy mapping for backward compatibility
const statusColors = ATTENDANCE_STATUS_COLORS

const statusIcons: Record<string, React.ReactNode> = {
  'حاضر': <CheckCircle className="h-4 w-4" />,
  'متأخر': <Clock className="h-4 w-4" />,
  'غائب': <XCircle className="h-4 w-4" />,
  'مستأذن': <AlertTriangle className="h-4 w-4" />,
  'خروج مبكر': <LogOut className="h-4 w-4" />,
  'مكرر دخول': <AlertTriangle className="h-4 w-4" />,
  'مكرر خروج': <AlertTriangle className="h-4 w-4" />,
}

// Status chip component
function StatusChip({ status }: { status: string }) {
  const config = statusConfig[status]
  if (!config) return <Badge>{status}</Badge>
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border} ${config.darkBg} ${config.darkText}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
      {config.icon}
      {status}
    </div>
  )
}

export default function AttendancePage() {
  const [scanMode, setScanMode] = useState<'checkIn' | 'checkOut'>('checkIn')
  const [qrInput, setQrInput] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const [recentScans, setRecentScans] = useState<AttendanceRecord[]>([])
  const [loadingRecent, setLoadingRecent] = useState(false)
  const [liveTime, setLiveTime] = useState(new Date())

  // Records tab state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [filterClassId, setFilterClassId] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [classes, setClasses] = useState<ClassData[]>([])

  // Bulk attendance state
  const [bulkDate, setBulkDate] = useState(new Date().toISOString().split('T')[0])
  const [bulkClassId, setBulkClassId] = useState<string>('all')
  const [bulkStudents, setBulkStudents] = useState<Array<{ id: string; fullName: string; studentNumber: string; schoolId: string; status: string }>>([])
  const [bulkSaving, setBulkSaving] = useState(false)

  // Live clock - updates every second
  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

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
      toast.error('خطأ', { description: 'الرجاء إدخال رمز QR' })
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
        // Handle duplicate check-in/check-out (409 status)
        if (res.status === 409 && (data.action === 'duplicateCheckIn' || data.action === 'duplicateCheckOut')) {
          const isCheckIn = data.action === 'duplicateCheckIn'
          setScanError(data.error || (isCheckIn ? 'تم تسجيل الحضور مسبقاً' : 'تم تسجيل الخروج مسبقاً'))
          if (data.student) {
            setScanResult({
              ...data,
              action: data.action,
              status: isCheckIn ? 'مكرر دخول' : 'مكرر خروج',
              record: {
                id: data.existingRecord?.id || '',
                checkIn: data.existingRecord?.checkIn || null,
                checkOut: data.existingRecord?.checkOut || null,
                status: data.existingRecord?.status || 'خطأ',
              },
            })
          }
          toast.error(isCheckIn ? 'تكرار تسجيل الدخول' : 'تكرار تسجيل الخروج', { description: data.error })
          return
        }
        setScanError(data.error || 'حدث خطأ في المسح')
        if (data.student) {
          setScanResult({ ...data, action: 'error', status: data.student.cardStatus || 'خطأ', record: { id: '', checkIn: null, checkOut: null, status: 'خطأ' } })
        }
        return
      }

      setScanResult(data)
      toast.success(data.message, {
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

  // Format live clock
  const formatLiveTime = (date: Date) => {
    return date.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }
  const formatLiveDate = (date: Date) => {
    return date.toLocaleDateString('ar-IQ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Page Guidance Hint */}
      <div className="hint-card p-3 flex items-start gap-3">
        <Lightbulb className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">نظام الحضور</p>
          <p className="text-xs text-blue-600 dark:text-blue-400">يمكنك تسجيل حضور الطلاب عبر مسح رمز QR أو الإدخال اليدوي. اختر الصف والشعبة ثم سجل حالة كل طالب.</p>
        </div>
      </div>

      {/* Live Clock Display */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-l from-teal-600 via-emerald-600 to-teal-700 text-white shadow-lg"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm">
            <motion.div
              className="w-2 h-2 rounded-full bg-emerald-300"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-xs font-medium">مباشر</span>
          </div>
          <span className="text-sm font-medium opacity-90">{formatLiveDate(liveTime)}</span>
        </div>
        <div className="font-mono text-2xl font-bold tracking-wider" dir="ltr">
          {formatLiveTime(liveTime)}
        </div>
      </motion.div>

      <Tabs defaultValue="scanner" className="w-full" dir="rtl">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="scanner" className="gap-2">
            <ScanLine className="h-4 w-4" />
            مسح QR
          </TabsTrigger>
          <TabsTrigger value="records" className="gap-2">
            <Calendar className="h-4 w-4" />
            سجل الحضور
          </TabsTrigger>
          <TabsTrigger value="bulk" className="gap-2">
            <Users className="h-4 w-4" />
            حضور جماعي
          </TabsTrigger>
        </TabsList>

        {/* ============ TAB 1: QR SCANNER ============ */}
        <TabsContent value="scanner" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Scanner Area */}
            <div className="space-y-4">
              {/* Mode Toggle with pulsing live indicator */}
              <Card className="overflow-hidden">
                <div className={`h-1 ${scanMode === 'checkIn' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <CardContent className="p-4">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setScanMode('checkIn')}
                      variant={scanMode === 'checkIn' ? 'default' : 'outline'}
                      className={`flex-1 gap-2 ${scanMode === 'checkIn' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                    >
                      <LogIn className="h-4 w-4" />
                      تسجيل دخول
                      {scanMode === 'checkIn' && (
                        <span className="relative flex h-2 w-2 mr-1">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                        </span>
                      )}
                    </Button>
                    <Button
                      onClick={() => setScanMode('checkOut')}
                      variant={scanMode === 'checkOut' ? 'default' : 'outline'}
                      className={`flex-1 gap-2 ${scanMode === 'checkOut' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                    >
                      <LogOut className="h-4 w-4" />
                      تسجيل خروج
                      {scanMode === 'checkOut' && (
                        <span className="relative flex h-2 w-2 mr-1">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                        </span>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Scanner Card with animated border pulse */}
              <Card className="overflow-hidden relative">
                {/* Animated border pulse effect */}
                <motion.div
                  className="absolute inset-0 rounded-lg pointer-events-none"
                  animate={{
                    boxShadow: scanMode === 'checkIn'
                      ? ['0 0 0 0 rgba(16,185,129,0.4)', '0 0 0 8px rgba(16,185,129,0)', '0 0 0 0 rgba(16,185,129,0.4)']
                      : ['0 0 0 0 rgba(239,68,68,0.4)', '0 0 0 8px rgba(239,68,68,0)', '0 0 0 0 rgba(239,68,68,0.4)']
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Radio className={`h-4 w-4 ${scanMode === 'checkIn' ? 'text-emerald-500' : 'text-red-500'} animate-pulse`} />
                      <QrCode className="h-5 w-5 text-primary" />
                    </div>
                    {scanMode === 'checkIn' ? 'مسح دخول' : 'مسح خروج'}
                  </CardTitle>
                  <CardDescription>
                    وجّه الكاميرا نحو بطاقة الطالب أو أدخل رقم QR يدوياً
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Enhanced Scanner Area with animated border */}
                  <div className="relative">
                    <div className={`w-full aspect-square max-w-[280px] mx-auto rounded-2xl border-4 flex items-center justify-center relative overflow-hidden
                      ${scanMode === 'checkIn'
                        ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                        : 'border-red-400 bg-red-50/50 dark:bg-red-950/20'
                      }`}
                    >
                      {/* Animated scanning border effect */}
                      <motion.div
                        className="absolute inset-0"
                        style={{
                          border: `3px solid ${scanMode === 'checkIn' ? '#10b981' : '#ef4444'}`,
                          borderRadius: '12px',
                        }}
                        animate={{
                          opacity: [0.3, 0.8, 0.3],
                          scale: [0.97, 1, 0.97],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                      {/* Scanning line animation */}
                      <motion.div
                        className={`absolute left-4 right-4 h-0.5 ${scanMode === 'checkIn' ? 'bg-emerald-500/60' : 'bg-red-500/60'}`}
                        animate={{ top: ['10%', '90%', '10%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
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
                        id="qrInput"
                        name="qrInput"
                        autoComplete="off"
                        value={qrInput}
                        onChange={(e) => setQrInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                        placeholder="أدخل رمز QR أو رقم الطالب..."
                        className="flex-1 text-center dark:bg-gray-800/50"
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
                            className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg
                              ${scanMode === 'checkIn' ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' : 'bg-gradient-to-br from-red-400 to-red-600'}`}
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
                            <StatusChip status={scanResult.status} />
                          </div>
                        </div>

                        {/* Late Minutes */}
                        {scanResult.lateMinutes && scanResult.lateMinutes > 0 && (
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                          >
                            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            <span className="text-amber-800 dark:text-amber-300 font-medium">
                              تأخير: {scanResult.lateMinutes} دقيقة
                            </span>
                          </motion.div>
                        )}

                        {/* Success Message */}
                        <motion.div
                          className={`flex items-center gap-2 p-3 rounded-lg ${
                            scanMode === 'checkIn'
                              ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                          }`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          <CheckCircle className={`h-5 w-5 ${
                            scanMode === 'checkIn' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
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
                    <Card className={`border-2 overflow-hidden ${
                      scanResult?.action === 'duplicateCheckIn' || scanResult?.action === 'duplicateCheckOut'
                        ? 'border-orange-400'
                        : 'border-red-400'
                    }`}>
                      <div className={`h-2 ${
                        scanResult?.action === 'duplicateCheckIn' || scanResult?.action === 'duplicateCheckOut'
                          ? 'bg-orange-500'
                          : 'bg-red-500'
                      }`} />
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                            scanResult?.action === 'duplicateCheckIn' || scanResult?.action === 'duplicateCheckOut'
                              ? 'bg-orange-100 dark:bg-orange-900/30'
                              : 'bg-red-100 dark:bg-red-900/30'
                          }`}>
                            {scanResult?.action === 'duplicateCheckIn' || scanResult?.action === 'duplicateCheckOut' ? (
                              <AlertTriangle className="h-8 w-8 text-orange-500" />
                            ) : (
                              <XCircle className="h-8 w-8 text-red-500" />
                            )}
                          </div>
                          <div>
                            <h3 className={`text-lg font-bold ${
                              scanResult?.action === 'duplicateCheckIn' || scanResult?.action === 'duplicateCheckOut'
                                ? 'text-orange-700 dark:text-orange-400'
                                : 'text-red-700 dark:text-red-400'
                            }`}>
                              {scanResult?.action === 'duplicateCheckIn'
                                ? 'تكرار تسجيل الدخول'
                                : scanResult?.action === 'duplicateCheckOut'
                                ? 'تكرار تسجيل الخروج'
                                : 'فشل المسح'
                              }
                            </h3>
                            <p className={`${
                              scanResult?.action === 'duplicateCheckIn' || scanResult?.action === 'duplicateCheckOut'
                                ? 'text-orange-600 dark:text-orange-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>{scanError}</p>
                          </div>
                        </div>
                        {scanResult?.student && (
                          <div className={`p-3 rounded-lg border ${
                            scanResult?.action === 'duplicateCheckIn' || scanResult?.action === 'duplicateCheckOut'
                              ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                          }`}>
                            <p className="font-medium">{scanResult.student.fullName}</p>
                            <p className="text-sm text-muted-foreground">{scanResult.student.studentNumber}</p>
                          </div>
                        )}
                        {(scanResult?.action === 'duplicateCheckIn' || scanResult?.action === 'duplicateCheckOut') && scanResult?.record && (
                          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                              {scanResult.action === 'duplicateCheckIn'
                                ? `تم تسجيل الدخول مسبقاً في: ${scanResult.record.checkIn || '—'}`
                                : `تم تسجيل الخروج مسبقاً في: ${scanResult.record.checkOut || '—'}`
                              }
                            </p>
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                              الحالة: {scanResult.record.status}
                            </p>
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
                        <div className="w-24 h-24 rounded-full bg-muted/50 dark:bg-muted/20 flex items-center justify-center">
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
          <Card className="overflow-hidden">
            <div className="h-1 bg-primary" />
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
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Calendar className="h-16 w-16 mb-4 text-muted-foreground/20" />
                  <h3 className="text-lg font-semibold text-muted-foreground">لا توجد عمليات مسح اليوم</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">ابدأ بمسح بطاقة الطالب أو إدخال رقم QR يدوياً لتسجيل الحضور والانصراف.</p>
                  <Button variant="outline" className="mt-4 gap-2" onClick={() => { const input = document.getElementById('qrInput') as HTMLInputElement; input?.focus() }}>
                    <ScanLine className="h-4 w-4" />
                    مسح الآن
                  </Button>
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
                            <StatusChip status={record.status} />
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
          {/* Enhanced Status Summary Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
              <Card className="border-emerald-200 dark:border-emerald-800 overflow-hidden">
                <div className="h-1 bg-gradient-to-l from-emerald-400 to-emerald-600" />
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{stats.present}</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-500">حاضر</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <Card className="border-amber-200 dark:border-amber-800 overflow-hidden">
                <div className="h-1 bg-gradient-to-l from-amber-400 to-amber-600" />
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{stats.late}</p>
                      <p className="text-xs text-amber-600 dark:text-amber-500">متأخر</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="border-red-200 dark:border-red-800 overflow-hidden">
                <div className="h-1 bg-gradient-to-l from-red-400 to-red-600" />
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.absent}</p>
                      <p className="text-xs text-red-600 dark:text-red-500">غائب</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card className="border-sky-200 dark:border-sky-800 overflow-hidden">
                <div className="h-1 bg-gradient-to-l from-sky-400 to-sky-600" />
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-sky-700 dark:text-sky-400">{stats.excused}</p>
                      <p className="text-xs text-sky-600 dark:text-sky-500">مستأذن</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Filters */}
          <Card className="overflow-hidden">
            <div className="h-1 bg-primary" />
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-1 flex-1 min-w-[160px]">
                  <Label className="text-xs font-medium">التاريخ</Label>
                  <Input
                    id="selectedDate"
                    name="selectedDate"
                    autoComplete="off"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="text-sm dark:bg-gray-800/50"
                  />
                </div>
                <div className="space-y-1 flex-1 min-w-[160px]">
                  <Label className="text-xs font-medium">الصف</Label>
                  <Select value={filterClassId} onValueChange={setFilterClassId}>
                    <SelectTrigger id="filterClass">
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
                    <SelectTrigger id="filterStatus">
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
                <Button size="sm" className="gap-1 text-white bg-primary" onClick={() => window.print()}>
                  <Download className="h-3 w-3" />
                  تصدير
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Records Table */}
          <Card className="overflow-hidden">
            <div className="h-1 bg-primary" />
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
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Search className="h-16 w-16 mb-4 text-muted-foreground/20" />
                  <h3 className="text-lg font-semibold text-muted-foreground">لا توجد سجلات حضور للتاريخ المحدد</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">جرّب تغيير التاريخ أو الفلاتر للبحث عن سجلات حضور سابقة. يمكنك أيضاً تسجيل حضور جديد من تبويب مسح QR.</p>
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
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                                record.status === 'حاضر' ? 'bg-emerald-500' :
                                record.status === 'متأخر' ? 'bg-amber-500' :
                                record.status === 'غائب' ? 'bg-red-500' :
                                'bg-sky-500'
                              }`}>
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
                            <StatusChip status={record.status} />
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
        {/* ============ TAB 3: BULK ATTENDANCE ============ */}
        <TabsContent value="bulk" className="space-y-6">
          {/* Header with selectors */}
          <Card className="overflow-hidden">
            <div className="h-1 bg-primary" />
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-1 flex-1 min-w-[160px]">
                  <Label className="text-xs font-medium">التاريخ</Label>
                  <Input
                    id="bulkDate"
                    name="bulkDate"
                    autoComplete="off"
                    type="date"
                    value={bulkDate}
                    onChange={(e) => setBulkDate(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1 flex-1 min-w-[160px]">
                  <Label className="text-xs font-medium">الصف</Label>
                  <Select value={bulkClassId} onValueChange={async (v) => {
                    setBulkClassId(v)
                    if (v && v !== 'all') {
                      try {
                        const res = await fetch(`/api/students?classId=${v}&limit=100`)
                        if (res.ok) {
                          const data = await res.json()
                          setBulkStudents((data.students || []).map((s: { id: string; fullName: string; studentNumber: string; schoolId: string }) => ({
                            id: s.id,
                            fullName: s.fullName,
                            studentNumber: s.studentNumber,
                            schoolId: s.schoolId,
                            status: 'حاضر',
                          })))
                        }
                      } catch {
                        setBulkStudents([])
                      }
                    } else {
                      setBulkStudents([])
                    }
                  }}>
                    <SelectTrigger id="bulkClass">
                      <SelectValue placeholder="اختر الصف" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">اختر صف لتسجيل الحضور</SelectItem>
                      {classes.map(cls => (
                        <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    setBulkStudents(prev => prev.map(s => ({ ...s, status: 'حاضر' })))
                  }}
                  disabled={bulkStudents.length === 0}
                >
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  تحديد الكل حاضر
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          {bulkStudents.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-emerald-200 bg-emerald-50/50">
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-700">{bulkStudents.filter(s => s.status === 'حاضر').length}</p>
                  <p className="text-xs text-emerald-600">حاضر</p>
                </CardContent>
              </Card>
              <Card className="border-amber-200 bg-amber-50/50">
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-amber-700">{bulkStudents.filter(s => s.status === 'متأخر').length}</p>
                  <p className="text-xs text-amber-600">متأخر</p>
                </CardContent>
              </Card>
              <Card className="border-red-200 bg-red-50/50">
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-red-700">{bulkStudents.filter(s => s.status === 'غائب').length}</p>
                  <p className="text-xs text-red-600">غائب</p>
                </CardContent>
              </Card>
              <Card className="border-sky-200 bg-sky-50/50">
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-sky-700">{bulkStudents.filter(s => s.status === 'مستأذن').length}</p>
                  <p className="text-xs text-sky-600">مستأذن</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Student List */}
          <Card className="overflow-hidden">
            <div className="h-1 bg-primary" />
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  تسجيل حضور جماعي
                </CardTitle>
                {bulkStudents.length > 0 && (
                  <span className="text-sm text-muted-foreground">{bulkStudents.length} طالب</span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {bulkClassId === 'all' ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Users className="h-16 w-16 mb-4 text-muted-foreground/20" />
                  <h3 className="text-lg font-semibold text-muted-foreground">اختر صفاً لتسجيل الحضور</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">اختر الصف والشعبة من القائمة أعلاه لعرض قائمة الطلاب وتسجيل حالة حضورهم.</p>
                </div>
              ) : bulkStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <User className="h-16 w-16 mb-4 text-muted-foreground/20" />
                  <h3 className="text-lg font-semibold text-muted-foreground">لا يوجد طلاب في هذا الصف</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">لم يتم تسجيل أي طالب في هذا الصف بعد. تأكد من إضافة الطلاب أولاً من صفحة الطلاب.</p>
                </div>
              ) : (
                <>
                  <ScrollArea className="max-h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>الطالب</TableHead>
                          <TableHead>الرقم</TableHead>
                          <TableHead className="text-center">الحالة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bulkStudents.map((student, idx) => (
                          <motion.tr
                            key={student.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.02 }}
                            className="border-b hover:bg-muted/30"
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                                  student.status === 'حاضر' ? 'bg-emerald-500' :
                                  student.status === 'متأخر' ? 'bg-amber-500' :
                                  student.status === 'غائب' ? 'bg-red-500' :
                                  'bg-sky-500'
                                }`}>
                                  {student.fullName.charAt(0)}
                                </div>
                                <span className="font-medium">{student.fullName}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm font-mono text-muted-foreground">{student.studentNumber}</TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-1.5">
                                {['حاضر', 'متأخر', 'غائب', 'مستأذن'].map((st) => (
                                  <Button
                                    key={st}
                                    size="sm"
                                    variant={student.status === st ? 'default' : 'outline'}
                                    className={`h-7 text-xs px-2.5 ${
                                      student.status === st
                                        ? st === 'حاضر' ? 'bg-emerald-600 hover:bg-emerald-700' :
                                          st === 'متأخر' ? 'bg-amber-600 hover:bg-amber-700' :
                                          st === 'غائب' ? 'bg-red-600 hover:bg-red-700' :
                                          'bg-sky-600 hover:bg-sky-700'
                                        : ''
                                    }`}
                                    onClick={() => {
                                      setBulkStudents(prev => prev.map(s => s.id === student.id ? { ...s, status: st } : s))
                                    }}
                                  >
                                    {st}
                                  </Button>
                                ))}
                              </div>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      جاهز لحفظ {bulkStudents.length} سجل حضور
                    </p>
                    <Button
                      className="gap-2 text-white bg-primary"
                      disabled={bulkSaving || bulkStudents.length === 0}
                      onClick={async () => {
                        setBulkSaving(true)
                        try {
                          const res = await fetch('/api/attendance/bulk', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              records: bulkStudents.map(s => ({
                                studentId: s.id,
                                schoolId: s.schoolId,
                                date: bulkDate,
                                status: s.status,
                              })),
                            }),
                          })
                          if (!res.ok) throw new Error()
                          const data = await res.json()
                          toast.success('تم الحفظ', { description: data.message || `تم حفظ ${bulkStudents.length} سجل حضور`, })
                          fetchRecords()
                          fetchRecentScans()
                        } catch {
                          toast.error('خطأ', { description: 'فشل في حفظ الحضور الجماعي' })
                        } finally {
                          setBulkSaving(false)
                        }
                      }}
                    >
                      <Save className="h-4 w-4" />
                      {bulkSaving ? 'جاري الحفظ...' : 'حفظ الكل'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  )
}
