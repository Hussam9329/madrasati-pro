'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Award, Plus, Download, Printer, Eye, FileText,
  GraduationCap, Star, Clock, BookOpen, MapPin, QrCode,
  Stamp, CheckCircle2, Search, BarChart3
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
import { useToast } from '@/hooks/use-toast'

// Types
interface CertificateType {
  id: string
  name: string
  description: string
  color: string
  bg: string
  border: string
  darkBg: string
  darkText: string
  darkBorder: string
  icon: React.ElementType
}

interface Certificate {
  id: string
  studentName: string
  studentClass: string
  studentSection: string
  certificateType: string
  date: string
  status: 'صادرة' | 'معلقة' | 'مطبوعة'
  notes?: string
}

// Certificate types
const CERTIFICATE_TYPES: CertificateType[] = [
  {
    id: 'appreciation',
    name: 'شهادة تقدير',
    description: 'شهادة تقدير للطلاب المتميزين في السلوك والمواظبة',
    color: 'text-teal-700',
    bg: 'bg-teal-100',
    border: 'border-teal-200',
    darkBg: 'dark:bg-teal-900/30',
    darkText: 'dark:text-teal-300',
    darkBorder: 'dark:border-teal-700',
    icon: Award,
  },
  {
    id: 'excellence',
    name: 'شهادة تفوق',
    description: 'شهادة تفوق دراسي للطلاب الحاصلين على المراتب الأولى',
    color: 'text-amber-700',
    bg: 'bg-amber-100',
    border: 'border-amber-200',
    darkBg: 'dark:bg-amber-900/30',
    darkText: 'dark:text-amber-300',
    darkBorder: 'dark:border-amber-700',
    icon: Star,
  },
  {
    id: 'attendance',
    name: 'شهادة حضور',
    description: 'شهادة حضور للطلاب المواظبين على الحضور اليومي',
    color: 'text-emerald-700',
    bg: 'bg-emerald-100',
    border: 'border-emerald-200',
    darkBg: 'dark:bg-emerald-900/30',
    darkText: 'dark:text-emerald-300',
    darkBorder: 'dark:border-emerald-700',
    icon: CheckCircle2,
  },
  {
    id: 'transfer',
    name: 'شهادة نقل',
    description: 'شهادة نقل لتحويل الطالب إلى مدرسة أخرى',
    color: 'text-blue-700',
    bg: 'bg-blue-100',
    border: 'border-blue-200',
    darkBg: 'dark:bg-blue-900/30',
    darkText: 'dark:text-blue-300',
    darkBorder: 'dark:border-blue-700',
    icon: MapPin,
  },
  {
    id: 'study',
    name: 'إفادة دراسية',
    description: 'إفادة دراسية تثبت قيد الطالب في المدرسة',
    color: 'text-purple-700',
    bg: 'bg-purple-100',
    border: 'border-purple-200',
    darkBg: 'dark:bg-purple-900/30',
    darkText: 'dark:text-purple-300',
    darkBorder: 'dark:border-purple-700',
    icon: BookOpen,
  },
  {
    id: 'transcript',
    name: 'كشف درجات',
    description: 'كشف درجات شامل لجميع المواد الدراسية',
    color: 'text-orange-700',
    bg: 'bg-orange-100',
    border: 'border-orange-200',
    darkBg: 'dark:bg-orange-900/30',
    darkText: 'dark:text-orange-300',
    darkBorder: 'dark:border-orange-700',
    icon: FileText,
  },
]

// Mock students
const MOCK_STUDENTS = [
  { id: 's1', name: 'أحمد محمد علي', class: 'الخامس الإعدادي', section: 'علمي' },
  { id: 's2', name: 'فاطمة حسين جاسم', class: 'الثالث المتوسط', section: 'أ' },
  { id: 's3', name: 'عمر عبدالله خليل', class: 'السادس الإعدادي', section: 'أدبي' },
  { id: 's4', name: 'زينب كريم محمد', class: 'الرابع المتوسط', section: 'ب' },
  { id: 's5', name: 'ياسر أحمد سالم', class: 'الخامس الإعدادي', section: 'أدبي' },
  { id: 's6', name: 'مريم صالح إبراهيم', class: 'الثالث المتوسط', section: 'ب' },
  { id: 's7', name: 'بلال ناصر حسن', class: 'السادس الإعدادي', section: 'علمي' },
  { id: 's8', name: 'نور الهدى عبد الأمير', class: 'الرابع المتوسط', section: 'أ' },
]

// Mock certificates
function generateMockCertificates(): Certificate[] {
  const statuses: Certificate['status'][] = ['صادرة', 'معلقة', 'مطبوعة']
  const types = CERTIFICATE_TYPES.map(t => t.name)

  return [
    { id: 'cert-1', studentName: 'أحمد محمد علي', studentClass: 'الخامس الإعدادي', studentSection: 'علمي', certificateType: 'شهادة تفوق', date: '2025-01-15', status: 'صادرة', notes: 'المركز الأول على الصف' },
    { id: 'cert-2', studentName: 'فاطمة حسين جاسم', studentClass: 'الثالث المتوسط', studentSection: 'أ', certificateType: 'شهادة تقدير', date: '2025-01-10', status: 'مطبوعة', notes: 'أفضل سلوك' },
    { id: 'cert-3', studentName: 'عمر عبدالله خليل', studentClass: 'السادس الإعدادي', studentSection: 'أدبي', certificateType: 'إفادة دراسية', date: '2025-02-01', status: 'صادرة' },
    { id: 'cert-4', studentName: 'زينب كريم محمد', studentClass: 'الرابع المتوسط', studentSection: 'ب', certificateType: 'شهادة حضور', date: '2025-01-20', status: 'معلقة' },
    { id: 'cert-5', studentName: 'ياسر أحمد سالم', studentClass: 'الخامس الإعدادي', studentSection: 'أدبي', certificateType: 'كشف درجات', date: '2025-02-05', status: 'صادرة' },
    { id: 'cert-6', studentName: 'مريم صالح إبراهيم', studentClass: 'الثالث المتوسط', studentSection: 'ب', certificateType: 'شهادة نقل', date: '2025-01-25', status: 'مطبوعة', notes: 'نقل إلى مدرسة النور' },
    { id: 'cert-7', studentName: 'بلال ناصر حسن', studentClass: 'السادس الإعدادي', studentSection: 'علمي', certificateType: 'شهادة تفوق', date: '2025-02-10', status: 'صادرة', notes: 'المركز الثاني على الصف' },
    { id: 'cert-8', studentName: 'نور الهدى عبد الأمير', studentClass: 'الرابع المتوسط', studentSection: 'أ', certificateType: 'شهادة تقدير', date: '2025-02-08', status: 'معلقة' },
    { id: 'cert-9', studentName: 'أحمد محمد علي', studentClass: 'الخامس الإعدادي', studentSection: 'علمي', certificateType: 'إفادة دراسية', date: '2025-02-12', status: 'صادرة' },
    { id: 'cert-10', studentName: 'فاطمة حسين جاسم', studentClass: 'الثالث المتوسط', studentSection: 'أ', certificateType: 'كشف درجات', date: '2025-02-15', status: 'صادرة' },
    { id: 'cert-11', studentName: 'عمر عبدالله خليل', studentClass: 'السادس الإعدادي', studentSection: 'أدبي', certificateType: 'شهادة حضور', date: '2025-02-18', status: 'مطبوعة' },
    { id: 'cert-12', studentName: 'مريم صالح إبراهيم', studentClass: 'الثالث المتوسط', studentSection: 'ب', certificateType: 'شهادة تقدير', date: '2025-02-20', status: 'معلقة' },
  ]
}

// Status colors
const STATUS_COLORS: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  'صادرة': { bg: 'bg-emerald-100', text: 'text-emerald-700', darkBg: 'dark:bg-emerald-900/30', darkText: 'dark:text-emerald-300' },
  'معلقة': { bg: 'bg-amber-100', text: 'text-amber-700', darkBg: 'dark:bg-amber-900/30', darkText: 'dark:text-amber-300' },
  'مطبوعة': { bg: 'bg-blue-100', text: 'text-blue-700', darkBg: 'dark:bg-blue-900/30', darkText: 'dark:text-blue-300' },
}

// Animated counter hook
function useAnimatedCounter(target: number, duration = 1200) {
  const [count, setCount] = useState(0)
  const prevTarget = useRef(0)

  useEffect(() => {
    const start = prevTarget.current
    const diff = target - start
    const startTime = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(start + diff * eased))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
    prevTarget.current = target
  }, [target, duration])

  return count
}

// Animation variants
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

export default function CertificatePage() {
  const { toast } = useToast()
  const certificates = useMemo(() => generateMockCertificates(), [])
  const [formOpen, setFormOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewCert, setPreviewCert] = useState<Certificate | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Form state
  const [form, setForm] = useState({
    studentId: '',
    certificateType: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  // Stats
  const issued = certificates.filter(c => c.status === 'صادرة').length
  const pending = certificates.filter(c => c.status === 'معلقة').length
  const printed = certificates.filter(c => c.status === 'مطبوعة').length
  const templates = CERTIFICATE_TYPES.length

  // Animated counters
  const animatedIssued = useAnimatedCounter(issued)
  const animatedPending = useAnimatedCounter(pending)
  const animatedPrinted = useAnimatedCounter(printed)
  const animatedTemplates = useAnimatedCounter(templates)

  // Certificate type distribution for mini chart
  const typeDistribution = useMemo(() => {
    const dist: Record<string, number> = {}
    certificates.forEach(c => {
      dist[c.certificateType] = (dist[c.certificateType] || 0) + 1
    })
    return Object.entries(dist).map(([name, count]) => ({
      name,
      count,
      certType: CERTIFICATE_TYPES.find(t => t.name === name),
    }))
  }, [certificates])

  const maxTypeCount = Math.max(...typeDistribution.map(t => t.count))

  // Filter certificates
  const filteredCertificates = certificates.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return c.studentName.includes(q) || c.certificateType.includes(q)
    }
    return true
  })

  // Preview certificate
  const handlePreview = (cert: Certificate) => {
    setPreviewCert(cert)
    setPreviewOpen(true)
  }

  // Print certificate
  const handlePrint = (cert: Certificate) => {
    setPreviewCert(cert)
    setPreviewOpen(true)
    setTimeout(() => {
      window.print()
    }, 300)
  }

  // Generate certificate
  const handleGenerate = () => {
    if (!form.studentId || !form.certificateType) {
      toast({ title: 'تنبيه', description: 'الطالب ونوع الشهادة مطلوبان', variant: 'destructive' })
      return
    }
    const student = MOCK_STUDENTS.find(s => s.id === form.studentId)
    const certType = CERTIFICATE_TYPES.find(t => t.id === form.certificateType)
    toast({
      title: 'تم إصدار الشهادة',
      description: `تم إصدار ${certType?.name || 'شهادة'} للطالب ${student?.name || ''}`,
    })
    setFormOpen(false)
    setForm({ studentId: '', certificateType: '', date: new Date().toISOString().split('T')[0], notes: '' })
  }

  // Selected student info for preview in form
  const selectedStudent = MOCK_STUDENTS.find(s => s.id === form.studentId)
  const selectedCertType = CERTIFICATE_TYPES.find(t => t.id === form.certificateType)

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
            <Award className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold dark:text-gray-200">الشهادات والوثائق</h1>
            <p className="text-sm text-muted-foreground">إصدار الشهادات والوثائق المدرسية</p>
          </div>
        </div>
        <Button
          onClick={() => setFormOpen(true)}
          className="gap-2"
          style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}
        >
          <Plus className="h-4 w-4" />
          إصدار شهادة
        </Button>
      </motion.div>

      {/* Summary Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 left-0 h-1" style={{ background: 'linear-gradient(90deg, #059669, #10b981)' }} />
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">شهادات صادرة</p>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{animatedIssued}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 left-0 h-1" style={{ background: 'linear-gradient(90deg, #d97706, #f59e0b)' }} />
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)' }}>
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">معلقة</p>
              <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{animatedPending}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 left-0 h-1" style={{ background: 'linear-gradient(90deg, #0d9488, #059669)' }} />
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}>
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">قوالب متاحة</p>
              <p className="text-xl font-bold text-teal-700 dark:text-teal-300">{animatedTemplates}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/20 dark:to-sky-950/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 left-0 h-1" style={{ background: 'linear-gradient(90deg, #2563eb, #3b82f6)' }} />
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
              <Printer className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">مطبوعة</p>
              <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{animatedPrinted}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Certificate Type Distribution Mini Chart */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden dark:bg-gray-900/50 dark:border-gray-700">
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #0d9488, #059669)' }} />
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 dark:text-gray-200">
              <BarChart3 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              إحصائيات الشهادات
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {typeDistribution.map((td) => {
                const Icon = td.certType?.icon || FileText
                const barPercent = maxTypeCount > 0 ? (td.count / maxTypeCount) * 100 : 0
                return (
                  <div key={td.name} className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <Icon className={cn('h-4 w-4', td.certType?.color || 'text-gray-500', td.certType?.darkText || '')} />
                    <span className="text-[10px] text-muted-foreground text-center leading-tight">{td.name}</span>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg, #0d9488, #059669)' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${barPercent}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                    <span className="text-xs font-bold text-teal-700 dark:text-teal-300">{td.count}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Certificate Types */}
      <motion.div variants={itemVariants}>
        <h2 className="text-lg font-bold mb-4 dark:text-gray-200">أنواع الشهادات</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CERTIFICATE_TYPES.map((type) => {
            const Icon = type.icon
            return (
              <motion.div
                key={type.id}
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className={cn(
                  'overflow-hidden cursor-pointer transition-all hover:shadow-lg border relative group',
                  type.border, type.darkBorder
                )}>
                  {/* Gradient hover overlay */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.08), rgba(5, 150, 105, 0.08))' }} />
                  <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #0d9488, #059669)' }} />
                  <CardContent className="p-4 relative z-10">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                        type.bg, type.darkBg
                      )}>
                        <Icon className={cn('h-6 w-6', type.color, type.darkText)} />
                      </div>
                      <div className="flex-1">
                        <h3 className={cn('font-bold text-sm', type.color, type.darkText)}>{type.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Recent Certificates Table */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden dark:bg-gray-900/50 dark:border-gray-700">
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #0d9488, #059669)' }} />
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <CardTitle className="text-base flex items-center gap-2 dark:text-gray-200">
                <FileText className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                الشهادات الأخيرة
              </CardTitle>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="بحث..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 text-xs pr-8 w-full sm:w-[180px]"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-8 text-xs w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="صادرة">صادرة</SelectItem>
                    <SelectItem value="معلقة">معلقة</SelectItem>
                    <SelectItem value="مطبوعة">مطبوعة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                    <TableHead>اسم الطالب</TableHead>
                    <TableHead className="text-center">نوع الشهادة</TableHead>
                    <TableHead className="text-center">الصف</TableHead>
                    <TableHead className="text-center">التاريخ</TableHead>
                    <TableHead className="text-center">الحالة</TableHead>
                    <TableHead className="text-center">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filteredCertificates.map((cert, idx) => {
                      const statusColor = STATUS_COLORS[cert.status]
                      const certType = CERTIFICATE_TYPES.find(t => t.name === cert.certificateType)
                      const isEven = idx % 2 === 0

                      return (
                        <motion.tr
                          key={cert.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.02 }}
                          className={cn(
                            'hover:bg-muted/50 dark:hover:bg-gray-800/50 border-b transition-colors',
                            isEven ? 'bg-gray-50/50 dark:bg-gray-800/20' : 'bg-white dark:bg-transparent'
                          )}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                                style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}
                              >
                                {cert.studentName.charAt(0)}
                              </div>
                              <span className="text-sm font-medium dark:text-gray-200">{cert.studentName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={cn(
                              'text-[10px]',
                              certType ? `${certType.bg} ${certType.color} ${certType.border} ${certType.darkBg} ${certType.darkText} ${certType.darkBorder}` : ''
                            )}>
                              {cert.certificateType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center text-sm">{cert.studentClass}</TableCell>
                          <TableCell className="text-center text-sm">
                            {new Date(cert.date).toLocaleDateString('ar-IQ')}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={cn(
                              'text-[10px] border-0',
                              statusColor.bg, statusColor.text, statusColor.darkBg, statusColor.darkText
                            )}>
                              {cert.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-900/20"
                                onClick={() => handlePreview(cert)}
                                title="معاينة"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                                onClick={() => handlePrint(cert)}
                                title="طباعة"
                              >
                                <Printer className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                                onClick={() => toast({ title: 'جاري التحميل', description: `جاري تحميل ${cert.certificateType}` })}
                                title="تحميل"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
            {filteredCertificates.length === 0 && (
              <div className="flex flex-col items-center py-12 text-muted-foreground">
                <FileText className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">لا توجد شهادات مطابقة للبحث</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Certificate Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 dark:text-gray-200">
              <Eye className="h-5 w-5 text-teal-600" />
              معاينة الشهادة
            </DialogTitle>
          </DialogHeader>
          {previewCert && (
            <motion.div
              className="space-y-4"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {/* Certificate Preview */}
              <div id="certificate-preview" className="bg-white border-2 border-teal-200 rounded-xl overflow-hidden shadow-lg relative print:border-0 print:shadow-none print:rounded-none">
                {/* Watermark overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                  <GraduationCap className="h-48 w-48 text-teal-100 dark:text-teal-900/30 opacity-40" />
                </div>

                {/* Decorative corner patterns (Islamic geometric-inspired) */}
                <div className="absolute top-0 right-0 w-20 h-20 pointer-events-none z-0">
                  <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-teal-300/50 rounded-tr-sm" />
                  <div className="absolute top-5 right-5 w-6 h-6 border-t border-r border-teal-200/30 rounded-tr-sm" />
                  <div className="absolute top-3 right-8 w-2 h-2 border-t border-r border-teal-200/40 rounded-tr-sm" />
                </div>
                <div className="absolute top-0 left-0 w-20 h-20 pointer-events-none z-0">
                  <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-teal-300/50 rounded-tl-sm" />
                  <div className="absolute top-5 left-5 w-6 h-6 border-t border-l border-teal-200/30 rounded-tl-sm" />
                  <div className="absolute top-3 left-8 w-2 h-2 border-t border-l border-teal-200/40 rounded-tl-sm" />
                </div>
                <div className="absolute bottom-0 right-0 w-20 h-20 pointer-events-none z-0">
                  <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-teal-300/50 rounded-br-sm" />
                  <div className="absolute bottom-5 right-5 w-6 h-6 border-b border-r border-teal-200/30 rounded-br-sm" />
                </div>
                <div className="absolute bottom-0 left-0 w-20 h-20 pointer-events-none z-0">
                  <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-teal-300/50 rounded-bl-sm" />
                  <div className="absolute bottom-5 left-5 w-6 h-6 border-b border-l border-teal-200/30 rounded-bl-sm" />
                </div>

                {/* Header with gradient */}
                <div className="text-center py-4 px-6 relative z-10" style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}>
                  <p className="text-white/90 text-sm font-medium">جمهورية العراق</p>
                  <p className="text-white/90 text-sm font-medium">وزارة التربية</p>
                  <p className="text-white text-lg font-bold mt-1">مدرسة الحكمة المتوسطة</p>
                </div>

                {/* Certificate body */}
                <div className="p-6 sm:p-8 text-center relative z-10">
                  {/* Decorative top */}
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="w-16 h-0.5 bg-teal-200" />
                    <GraduationCap className="h-6 w-6 text-teal-600" />
                    <div className="w-16 h-0.5 bg-teal-200" />
                  </div>

                  {/* Certificate type */}
                  <h2 className="text-2xl font-bold text-teal-800 mb-1">{previewCert.certificateType}</h2>
                  <p className="text-sm text-gray-500 mb-6">تتشرف إدارة المدرسة بمنح هذا المستند</p>

                  {/* Student info */}
                  <div className="bg-teal-50 rounded-xl p-6 mb-6 border border-teal-100">
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-4">
                        <span className="text-gray-600 text-sm">الطالب/ة:</span>
                        <span className="text-xl font-bold text-teal-800">{previewCert.studentName}</span>
                      </div>
                      <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
                        <span>الصف: <strong className="text-teal-700">{previewCert.studentClass}</strong></span>
                        <span>الشعبة: <strong className="text-teal-700">{previewCert.studentSection}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Description based on type */}
                  <p className="text-gray-700 leading-relaxed mb-6 text-sm">
                    {previewCert.certificateType === 'شهادة تقدير' && 'تقديراً لجهوده المتميزة وسلوكه الحسن ومواظبته على الدروس خلال العام الدراسي'}
                    {previewCert.certificateType === 'شهادة تفوق' && 'تفوقاً دراسياً ملموساً وحصوله على مرتبة متقدمة بين زملائه في الصف'}
                    {previewCert.certificateType === 'شهادة حضور' && 'لمواظبته على الحضور اليومي وعدم تغيبه عن الدروس طوال الفصل الدراسي'}
                    {previewCert.certificateType === 'شهادة نقل' && 'بناءً على طلب ولي الأمر وبعد استيفاء جميع المتطلبات والوثائق المطلوبة'}
                    {previewCert.certificateType === 'إفادة دراسية' && 'نفيد بأن الطالب المذكور أعلاه مقيد في هذه المدرسة للعام الدراسي الحالي'}
                    {previewCert.certificateType === 'كشف درجات' && 'هذا كشف درجات شامل لجميع المواد الدراسية للطالب المذكور أعلاه'}
                  </p>

                  {/* Notes */}
                  {previewCert.notes && (
                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-6">
                      <p className="text-xs text-amber-800">ملاحظات: {previewCert.notes}</p>
                    </div>
                  )}

                  {/* Signature areas */}
                  <div className="grid grid-cols-3 gap-4 mt-8">
                    <div className="text-center">
                      <div className="border-t-2 border-gray-300 pt-2 mt-8">
                        <p className="text-xs text-gray-600">المدير العام</p>
                        <p className="text-[10px] text-gray-400">التوقيع</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="border-t-2 border-gray-300 pt-2 mt-8">
                        <p className="text-xs text-gray-600">مدير المدرسة</p>
                        <p className="text-[10px] text-gray-400">التوقيع</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="border-t-2 border-gray-300 pt-2 mt-8">
                        <p className="text-xs text-gray-600">الختم الرسمي</p>
                        <div className="flex items-center justify-center mt-1">
                          {/* Animated rotating seal */}
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                          >
                            <Stamp className="h-8 w-8 text-red-300/60" />
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-gray-50 rounded-md border border-gray-200">
                        <QrCode className="h-7 w-7 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400">رمز التحقق</p>
                        <p className="text-[9px] text-gray-500 font-mono font-semibold">CERT-{previewCert.id.toUpperCase()}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-gray-500">
                        التاريخ: {new Date(previewCert.date).toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                      <p className="text-[10px] text-gray-400">السنة الدراسية 2025-2026</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 no-print">
                <Button variant="outline" onClick={() => setPreviewOpen(false)}>إغلاق</Button>
                <Button
                  className="gap-2"
                  onClick={() => window.print()}
                  style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}
                >
                  <Printer className="h-4 w-4" />
                  طباعة
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 border-teal-200 text-teal-700 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-400 dark:hover:bg-teal-900/20"
                  onClick={() => toast({ title: 'جاري التحميل', description: 'جاري تحميل الشهادة كملف PDF' })}
                >
                  <Download className="h-4 w-4" />
                  تحميل PDF
                </Button>
              </div>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>

      {/* Generate Certificate Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 dark:text-gray-200">
              <Plus className="h-5 w-5 text-teal-600" />
              إصدار شهادة جديدة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="dark:text-gray-300">الطالب/ة *</Label>
              <Select value={form.studentId} onValueChange={(v) => setForm({ ...form, studentId: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="اختر الطالب" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_STUDENTS.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} - {s.class} ({s.section})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="dark:text-gray-300">نوع الشهادة *</Label>
              <Select value={form.certificateType} onValueChange={(v) => setForm({ ...form, certificateType: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="اختر نوع الشهادة" />
                </SelectTrigger>
                <SelectContent>
                  {CERTIFICATE_TYPES.map(t => {
                    const Icon = t.icon
                    return (
                      <SelectItem key={t.id} value={t.id}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5" />
                          {t.name}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="dark:text-gray-300">التاريخ</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="dark:text-gray-300">ملاحظات إضافية</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="ملاحظات إضافية (اختياري)..."
                rows={3}
                className="mt-1"
              />
            </div>

            {/* Preview summary */}
            {selectedStudent && selectedCertType && (
              <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700 rounded-xl p-4 mt-2">
                <p className="text-xs font-semibold text-teal-700 dark:text-teal-300 mb-2">ملخص الشهادة</p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">الطالب:</span>
                    <span className="font-medium dark:text-gray-200">{selectedStudent.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">الصف:</span>
                    <span className="font-medium dark:text-gray-200">{selectedStudent.class} - {selectedStudent.section}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">النوع:</span>
                    <span className="font-medium text-teal-700 dark:text-teal-300">{selectedCertType.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">التاريخ:</span>
                    <span className="font-medium dark:text-gray-200">{new Date(form.date).toLocaleDateString('ar-IQ')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setFormOpen(false)}>إلغاء</Button>
            <Button onClick={handleGenerate} style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}>
              إصدار الشهادة
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
