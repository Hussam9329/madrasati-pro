'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Heart, Plus, Search, Eye, Syringe, Stethoscope, AlertTriangle,
  Activity, ShieldCheck, Calendar, User, ClipboardList, Droplets,
  Ruler, Weight, Thermometer, CheckCircle2, Clock, UserCheck,
  Users, AlertCircle
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
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'

// Types
interface StudentHealthRecord {
  id: string
  studentName: string
  className: string
  bloodType: string
  height: number // cm
  weight: number // kg
  vision: string
  lastCheckup: string
  chronicCondition: string | null
}

interface VaccinationCampaign {
  id: string
  name: string
  date: string
  targetClass: string
  completedPercent: number
  totalStudents: number
  vaccinatedStudents: number
}

interface MedicalVisit {
  id: string
  studentName: string
  className: string
  date: string
  reason: string
  treatment: string
  doctorNotes: string
}

// Mock student health records
const mockHealthRecords: StudentHealthRecord[] = [
  { id: 'h1', studentName: 'أحمد محمد علي', className: 'السادس الإعدادي - علمي', bloodType: 'A+', height: 165, weight: 55, vision: '6/6', lastCheckup: '2025-01-15', chronicCondition: null },
  { id: 'h2', studentName: 'فاطمة حسين جاسم', className: 'الثالث المتوسط - أ', bloodType: 'O+', height: 155, weight: 48, vision: '6/9', lastCheckup: '2025-01-20', chronicCondition: null },
  { id: 'h3', studentName: 'عمر ياسر خلف', className: 'الخامس الإعدادي - علمي', bloodType: 'B+', height: 170, weight: 65, vision: '6/6', lastCheckup: '2025-02-01', chronicCondition: 'ربو' },
  { id: 'h4', studentName: 'زينب عبد الله', className: 'الرابع الإعدادي', bloodType: 'AB+', height: 158, weight: 52, vision: '6/12', lastCheckup: '2025-01-10', chronicCondition: null },
  { id: 'h5', studentName: 'بلال عمار حسن', className: 'السادس الإعدادي - علمي', bloodType: 'O-', height: 172, weight: 68, vision: '6/6', lastCheckup: '2025-02-05', chronicCondition: null },
  { id: 'h6', studentName: 'مريم سعيد', className: 'الثالث المتوسط - أ', bloodType: 'A-', height: 150, weight: 62, vision: '6/9', lastCheckup: '2025-01-25', chronicCondition: 'سكري' },
  { id: 'h7', studentName: 'ياسر وليد', className: 'الخامس الإعدادي - علمي', bloodType: 'B-', height: 168, weight: 58, vision: '6/6', lastCheckup: '2025-02-10', chronicCondition: null },
  { id: 'h8', studentName: 'نور الهدى كاظم', className: 'الرابع الإعدادي', bloodType: 'A+', height: 153, weight: 45, vision: '6/12', lastCheckup: '2025-01-30', chronicCondition: 'حساسية' },
  { id: 'h9', studentName: 'علي حسين جاسم', className: 'الخامس الإعدادي - علمي', bloodType: 'O+', height: 167, weight: 70, vision: '6/6', lastCheckup: '2025-02-15', chronicCondition: null },
  { id: 'h10', studentName: 'حسينة عباس', className: 'السادس الإعدادي - علمي', bloodType: 'AB-', height: 160, weight: 54, vision: '6/9', lastCheckup: '2025-01-18', chronicCondition: null },
  { id: 'h11', studentName: 'رعد قاسم', className: 'الثالث المتوسط - أ', bloodType: 'B+', height: 148, weight: 72, vision: '6/6', lastCheckup: '2025-02-08', chronicCondition: 'ربو' },
  { id: 'h12', studentName: 'سارة نبيل', className: 'الرابع الإعدادي', bloodType: 'A+', height: 156, weight: 44, vision: '6/6', lastCheckup: '2025-01-22', chronicCondition: null },
  { id: 'h13', studentName: 'ثائر وليد', className: 'الخامس الإعدادي - علمي', bloodType: 'O+', height: 174, weight: 78, vision: '6/9', lastCheckup: '2025-02-12', chronicCondition: null },
]

// Mock vaccination campaigns
const mockVaccinations: VaccinationCampaign[] = [
  { id: 'v1', name: 'لقاح الإنفلونزا الموسمية', date: '2025-01-20', targetClass: 'جميع الصفوف', completedPercent: 85, totalStudents: 300, vaccinatedStudents: 255 },
  { id: 'v2', name: 'لقاح كوفيد-19 الجرعة المعززة', date: '2025-02-01', targetClass: 'السادس الإعدادي', completedPercent: 72, totalStudents: 60, vaccinatedStudents: 43 },
  { id: 'v3', name: 'لقاح الحصبة والنكاف', date: '2025-02-15', targetClass: 'الأول المتوسط', completedPercent: 95, totalStudents: 45, vaccinatedStudents: 43 },
  { id: 'v4', name: 'لقاح شلل الأطفال', date: '2025-03-01', targetClass: 'الابتدائية', completedPercent: 40, totalStudents: 120, vaccinatedStudents: 48 },
  { id: 'v5', name: 'لقاح التهاب الكبد B', date: '2025-03-10', targetClass: 'الثالث المتوسط', completedPercent: 60, totalStudents: 50, vaccinatedStudents: 30 },
]

// Mock medical visits
const mockMedicalVisits: MedicalVisit[] = [
  { id: 'mv1', studentName: 'عمر ياسر خلف', className: 'الخامس الإعدادي - علمي', date: '2025-02-20', reason: 'نوبة ربو', treatment: 'بخاخ فنتولين', doctorNotes: 'إحالة لطبيب مختص' },
  { id: 'mv2', studentName: 'مريم سعيد', className: 'الثالث المتوسط - أ', date: '2025-02-18', reason: 'دوخة', treatment: 'قياس سكر الدم - 180', doctorNotes: 'مراقبة مستوى السكر' },
  { id: 'mv3', studentName: 'أحمد محمد علي', className: 'السادس الإعدادي - علمي', date: '2025-02-15', reason: 'إصابة رياضية', treatment: 'ضمادة وثلج', doctorNotes: 'راحة لمدة 3 أيام' },
  { id: 'mv4', studentName: 'نور الهدى كاظم', className: 'الرابع الإعدادي', date: '2025-02-12', reason: 'حساسية', treatment: 'أنتيهيستامين', doctorNotes: 'تجنب مسببات الحساسية' },
  { id: 'mv5', studentName: 'زينب عبد الله', className: 'الرابع الإعدادي', date: '2025-02-10', reason: 'صداع شديد', treatment: 'باراسيتامول', doctorNotes: 'فحص نظر - تحتاج نظارة' },
  { id: 'mv6', studentName: 'رعد قاسم', className: 'الثالث المتوسط - أ', date: '2025-02-08', reason: 'صعوبة تنفس', treatment: 'بخاخ ربو', doctorNotes: 'حالة ربو مزمنة - متابعة' },
  { id: 'mv7', studentName: 'سارة نبيل', className: 'الرابع الإعدادي', date: '2025-02-05', reason: 'ألم في البطن', treatment: 'فحص عام', doctorNotes: 'لا توجد مشالة' },
  { id: 'mv8', studentName: 'ثائر وليد', className: 'الخامس الإعدادي - علمي', date: '2025-02-01', reason: 'ارتفاع حرارة', treatment: 'خافض حرارة', doctorNotes: 'مراقبة لمدة 24 ساعة' },
]

// BMI calculation and classification
function getBMI(weight: number, heightCm: number): number {
  const heightM = heightCm / 100
  return Math.round((weight / (heightM * heightM)) * 10) / 10
}

function getBMIClass(bmi: number): { label: string; color: string; bg: string } {
  if (bmi < 18.5) return { label: 'نحيف', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' }
  if (bmi < 25) return { label: 'طبيعي', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' }
  if (bmi < 30) return { label: 'وزن زائد', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' }
  return { label: 'سمين', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' }
}

function getVisionStatus(vision: string): { label: string; color: string; icon: 'good' | 'moderate' | 'poor' } {
  if (vision === '6/6') return { label: 'ممتاز', color: 'text-emerald-600 dark:text-emerald-400', icon: 'good' }
  if (vision === '6/9') return { label: 'جيد', color: 'text-amber-600 dark:text-amber-400', icon: 'moderate' }
  return { label: 'يحتاج فحص', color: 'text-red-600 dark:text-red-400', icon: 'poor' }
}

const BLOOD_TYPE_COLORS: Record<string, string> = {
  'A+': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  'A-': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  'B+': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'B-': 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  'O+': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  'O-': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  'AB+': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  'AB-': 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
}

const CHRONIC_CONDITION_COLORS: Record<string, { color: string; bg: string; icon: string }> = {
  'سكري': { color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-100 border-amber-200 dark:bg-amber-900/30 dark:border-amber-700', icon: '🩸' },
  'ربو': { color: 'text-sky-700 dark:text-sky-300', bg: 'bg-sky-100 border-sky-200 dark:bg-sky-900/30 dark:border-sky-700', icon: '💨' },
  'حساسية': { color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-100 border-purple-200 dark:bg-purple-900/30 dark:border-purple-700', icon: '🤧' },
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

export default function HealthPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('records')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterClass, setFilterClass] = useState<string>('all')
  const [healthRecords] = useState<StudentHealthRecord[]>(mockHealthRecords)
  const [vaccinations, setVaccinations] = useState<VaccinationCampaign[]>(mockVaccinations)
  const [medicalVisits, setMedicalVisits] = useState<MedicalVisit[]>(mockMedicalVisits)
  const [addVaccinationOpen, setAddVaccinationOpen] = useState(false)
  const [addVisitOpen, setAddVisitOpen] = useState(false)

  // Vaccination form
  const [vaccinationForm, setVaccinationForm] = useState({
    name: '',
    date: '',
    targetClass: '',
    totalStudents: 30,
  })

  // Visit form
  const [visitForm, setVisitForm] = useState({
    studentName: '',
    className: '',
    date: new Date().toISOString().split('T')[0],
    reason: '',
    treatment: '',
    doctorNotes: '',
  })

  // Stats
  const totalRecords = healthRecords.length
  const vaccinatedCount = 255 // From campaigns
  const visitsThisMonth = medicalVisits.filter(v => v.date >= '2025-02-01').length
  const chronicCount = healthRecords.filter(r => r.chronicCondition).length

  // Chronic conditions
  const chronicStudents = healthRecords.filter(r => r.chronicCondition)

  // Filtered records
  const filteredRecords = healthRecords.filter(r => {
    if (filterClass !== 'all' && r.className !== filterClass) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return r.studentName.toLowerCase().includes(q)
    }
    return true
  })

  // Unique classes
  const uniqueClasses = Array.from(new Set(healthRecords.map(r => r.className)))

  const handleAddVaccination = () => {
    if (!vaccinationForm.name || !vaccinationForm.date || !vaccinationForm.targetClass) {
      toast({ title: 'تنبيه', description: 'جميع الحقول مطلوبة', variant: 'destructive' })
      return
    }
    const newCampaign: VaccinationCampaign = {
      id: `v-${Date.now()}`,
      ...vaccinationForm,
      completedPercent: 0,
      vaccinatedStudents: 0,
    }
    setVaccinations(prev => [newCampaign, ...prev])
    setAddVaccinationOpen(false)
    setVaccinationForm({ name: '', date: '', targetClass: '', totalStudents: 30 })
    toast({ title: 'تمت الإضافة', description: 'تم إضافة الحملة التلقيحية بنجاح' })
  }

  const handleAddVisit = () => {
    if (!visitForm.studentName || !visitForm.reason) {
      toast({ title: 'تنبيه', description: 'اسم الطالب والسبب مطلوبان', variant: 'destructive' })
      return
    }
    const newVisit: MedicalVisit = {
      id: `mv-${Date.now()}`,
      ...visitForm,
    }
    setMedicalVisits(prev => [newVisit, ...prev])
    setAddVisitOpen(false)
    setVisitForm({ studentName: '', className: '', date: new Date().toISOString().split('T')[0], reason: '', treatment: '', doctorNotes: '' })
    toast({ title: 'تم التسجيل', description: 'تم تسجيل الزيارة الطبية بنجاح' })
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
            <Heart className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold dark:text-gray-200">السجل الصحي</h1>
            <p className="text-sm text-muted-foreground">متابعة صحة الطلاب</p>
          </div>
        </div>
      </motion.div>

      {/* Summary Stat Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-teal-200 dark:border-gray-700 overflow-hidden relative">
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #0d9488, #059669)' }} />
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center shrink-0">
              <Users className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">سجلات الطلاب</p>
              <p className="text-2xl font-bold text-teal-700 dark:text-teal-300">{totalRecords}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 dark:border-gray-700 overflow-hidden relative">
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #059669, #10b981)' }} />
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">ملقح</p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{vaccinatedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 dark:border-gray-700 overflow-hidden relative">
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #d97706, #f59e0b)' }} />
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
              <Stethoscope className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">زيارات طبية</p>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{visitsThisMonth}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 dark:border-gray-700 overflow-hidden relative">
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #dc2626, #ef4444)' }} />
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">حالات مزمنة</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">{chronicCount}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Chronic Conditions Alert */}
      {chronicStudents.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 dark:border-amber-800 overflow-hidden">
            <div className="h-1" style={{ background: 'linear-gradient(90deg, #d97706, #f59e0b)' }} />
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <AlertCircle className="h-5 w-5" />
                طلاب بحالات مزمنة ({chronicStudents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {chronicStudents.map(record => {
                  const condition = record.chronicCondition!
                  const condColor = CHRONIC_CONDITION_COLORS[condition] || { color: 'text-gray-700 dark:text-gray-300', bg: 'bg-gray-100 border-gray-200 dark:bg-gray-900/30 dark:border-gray-700', icon: '⚕️' }
                  return (
                    <Badge key={record.id} variant="outline" className={cn('gap-1 py-1 px-2.5', condColor.bg, condColor.color)}>
                      <span>{condColor.icon}</span>
                      {record.studentName} - {condition}
                    </Badge>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="records" className="gap-1.5">
              <UserCheck className="h-4 w-4" />
              السجلات الصحية
            </TabsTrigger>
            <TabsTrigger value="vaccinations" className="gap-1.5">
              <Syringe className="h-4 w-4" />
              التلقيحات
            </TabsTrigger>
            <TabsTrigger value="visits" className="gap-1.5">
              <Stethoscope className="h-4 w-4" />
              الزيارات الطبية
            </TabsTrigger>
          </TabsList>

          {/* Student Health Records Tab */}
          <TabsContent value="records" className="space-y-4">
            {/* Filters */}
            <Card className="dark:bg-gray-900/50 dark:border-gray-700">
              <div className="h-1" style={{ background: 'linear-gradient(90deg, #0d9488, #059669)' }} />
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="بحث باسم الطالب..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pr-9 dark:bg-gray-800 dark:border-gray-600"
                      />
                    </div>
                  </div>
                  <div className="min-w-[160px]">
                    <Select value={filterClass} onValueChange={setFilterClass}>
                      <SelectTrigger className="dark:bg-gray-800 dark:border-gray-600">
                        <SelectValue placeholder="الصف" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الصفوف</SelectItem>
                        {uniqueClasses.map(cls => (
                          <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Health Records Table */}
            <Card className="overflow-hidden dark:bg-gray-900/50 dark:border-gray-700">
              <div className="h-1" style={{ background: 'linear-gradient(90deg, #0d9488, #059669)' }} />
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الطالب</TableHead>
                        <TableHead className="text-center">فصيلة الدم</TableHead>
                        <TableHead className="text-center">الطول</TableHead>
                        <TableHead className="text-center">الوزن</TableHead>
                        <TableHead className="text-center">BMI</TableHead>
                        <TableHead className="text-center">النظر</TableHead>
                        <TableHead className="text-center">آخر فحص</TableHead>
                        <TableHead className="text-center">الحالة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map((record) => {
                        const bmi = getBMI(record.weight, record.height)
                        const bmiClass = getBMIClass(bmi)
                        const visionStatus = getVisionStatus(record.vision)
                        const hasChronic = !!record.chronicCondition

                        return (
                          <TableRow key={record.id} className={cn(
                            'dark:hover:bg-gray-800/50',
                            hasChronic && 'bg-amber-50/50 dark:bg-amber-950/10'
                          )}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center shrink-0">
                                  <User className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm dark:text-gray-200">{record.studentName}</p>
                                  <p className="text-xs text-muted-foreground">{record.className}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className={cn('text-[10px] font-mono', BLOOD_TYPE_COLORS[record.bloodType] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300')}>
                                <Droplets className="h-3 w-3 ml-1" />
                                {record.bloodType}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Ruler className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm">{record.height}</span>
                                <span className="text-[10px] text-muted-foreground">سم</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Weight className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm">{record.weight}</span>
                                <span className="text-[10px] text-muted-foreground">كغ</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex flex-col items-center">
                                <span className={cn('text-sm font-medium', bmiClass.color)}>{bmi}</span>
                                <Badge className={cn('text-[9px]', bmiClass.bg, bmiClass.color, 'border-0')}>
                                  {bmiClass.label}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex flex-col items-center">
                                <div className="flex items-center gap-1">
                                  <Eye className={cn('h-3.5 w-3.5', visionStatus.color)} />
                                  <span className="text-sm" dir="ltr">{record.vision}</span>
                                </div>
                                <span className={cn('text-[9px]', visionStatus.color)}>{visionStatus.label}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center text-sm" dir="ltr">{record.lastCheckup}</TableCell>
                            <TableCell className="text-center">
                              {hasChronic ? (
                                <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700 gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  {record.chronicCondition}
                                </Badge>
                              ) : (
                                <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700 gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  سليم
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vaccination Records Tab */}
          <TabsContent value="vaccinations" className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => setAddVaccinationOpen(true)}
                className="gap-2"
                style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}
              >
                <Plus className="h-4 w-4" />
                إضافة حملة تلقيح
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vaccinations.map((campaign) => (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -2, boxShadow: '0 8px 25px -5px rgba(13, 148, 136, 0.12)' }}
                >
                  <Card className="overflow-hidden dark:bg-gray-900/50 dark:border-gray-700">
                    <div className="h-1" style={{ background: campaign.completedPercent >= 90 ? 'linear-gradient(90deg, #059669, #10b981)' : campaign.completedPercent >= 60 ? 'linear-gradient(90deg, #d97706, #f59e0b)' : 'linear-gradient(90deg, #dc2626, #ef4444)' }} />
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                            campaign.completedPercent >= 90 ? 'bg-emerald-100 dark:bg-emerald-900/40' :
                            campaign.completedPercent >= 60 ? 'bg-amber-100 dark:bg-amber-900/40' :
                            'bg-red-100 dark:bg-red-900/40'
                          )}>
                            <Syringe className={cn(
                              'h-5 w-5',
                              campaign.completedPercent >= 90 ? 'text-emerald-600 dark:text-emerald-400' :
                              campaign.completedPercent >= 60 ? 'text-amber-600 dark:text-amber-400' :
                              'text-red-600 dark:text-red-400'
                            )} />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm dark:text-gray-200">{campaign.name}</h3>
                            <p className="text-xs text-muted-foreground">{campaign.targetClass}</p>
                          </div>
                        </div>
                        <Badge className={cn(
                          'text-[10px]',
                          campaign.completedPercent >= 90 ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300' :
                          campaign.completedPercent >= 60 ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300' :
                          'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300'
                        )}>
                          {campaign.completedPercent}%
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          <span dir="ltr">{campaign.date}</span>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">التقدم</span>
                            <span className="font-medium dark:text-gray-300">{campaign.vaccinatedStudents} / {campaign.totalStudents}</span>
                          </div>
                          <Progress
                            value={campaign.completedPercent}
                            className="h-2"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Medical Visits Tab */}
          <TabsContent value="visits" className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => setAddVisitOpen(true)}
                className="gap-2"
                style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}
              >
                <Plus className="h-4 w-4" />
                تسجيل زيارة طبية
              </Button>
            </div>

            <Card className="overflow-hidden dark:bg-gray-900/50 dark:border-gray-700">
              <div className="h-1" style={{ background: 'linear-gradient(90deg, #0d9488, #059669)' }} />
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الطالب</TableHead>
                        <TableHead className="text-center">التاريخ</TableHead>
                        <TableHead>السبب</TableHead>
                        <TableHead>العلاج</TableHead>
                        <TableHead>ملاحظات الطبيب</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {medicalVisits.map((visit) => (
                        <TableRow key={visit.id} className="dark:hover:bg-gray-800/50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center shrink-0">
                                <User className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                              </div>
                              <div>
                                <p className="font-medium text-sm dark:text-gray-200">{visit.studentName}</p>
                                <p className="text-xs text-muted-foreground">{visit.className}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-sm" dir="ltr">{visit.date}</TableCell>
                          <TableCell className="text-sm dark:text-gray-300">{visit.reason}</TableCell>
                          <TableCell className="text-sm dark:text-gray-300">{visit.treatment}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{visit.doctorNotes}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Add Vaccination Campaign Dialog */}
      <Dialog open={addVaccinationOpen} onOpenChange={setAddVaccinationOpen}>
        <DialogContent className="max-w-lg dark:bg-gray-900 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 dark:text-gray-200">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}>
                <Syringe className="h-4 w-4 text-white" />
              </div>
              إضافة حملة تلقيح جديدة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="dark:text-gray-300">اسم اللقاح *</Label>
              <Input
                value={vaccinationForm.name}
                onChange={(e) => setVaccinationForm({ ...vaccinationForm, name: e.target.value })}
                placeholder="مثال: لقاح الإنفلونزا"
                className="dark:bg-gray-800 dark:border-gray-600"
              />
            </div>
            <div>
              <Label className="dark:text-gray-300">التاريخ *</Label>
              <Input
                type="date"
                value={vaccinationForm.date}
                onChange={(e) => setVaccinationForm({ ...vaccinationForm, date: e.target.value })}
                className="dark:bg-gray-800 dark:border-gray-600"
              />
            </div>
            <div>
              <Label className="dark:text-gray-300">الصف المستهدف *</Label>
              <Input
                value={vaccinationForm.targetClass}
                onChange={(e) => setVaccinationForm({ ...vaccinationForm, targetClass: e.target.value })}
                placeholder="مثال: جميع الصفوف"
                className="dark:bg-gray-800 dark:border-gray-600"
              />
            </div>
            <div>
              <Label className="dark:text-gray-300">عدد الطلاب المستهدفين</Label>
              <Input
                type="number"
                min={1}
                value={vaccinationForm.totalStudents}
                onChange={(e) => setVaccinationForm({ ...vaccinationForm, totalStudents: parseInt(e.target.value) || 1 })}
                className="dark:bg-gray-800 dark:border-gray-600"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setAddVaccinationOpen(false)}>إلغاء</Button>
            <Button onClick={handleAddVaccination} style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}>
              إضافة الحملة
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Medical Visit Dialog */}
      <Dialog open={addVisitOpen} onOpenChange={setAddVisitOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto dark:bg-gray-900 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 dark:text-gray-200">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}>
                <Stethoscope className="h-4 w-4 text-white" />
              </div>
              تسجيل زيارة طبية جديدة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="dark:text-gray-300">اسم الطالب *</Label>
              <Input
                value={visitForm.studentName}
                onChange={(e) => setVisitForm({ ...visitForm, studentName: e.target.value })}
                placeholder="أدخل اسم الطالب"
                className="dark:bg-gray-800 dark:border-gray-600"
              />
            </div>
            <div>
              <Label className="dark:text-gray-300">الصف</Label>
              <Input
                value={visitForm.className}
                onChange={(e) => setVisitForm({ ...visitForm, className: e.target.value })}
                placeholder="الصف والشعبة"
                className="dark:bg-gray-800 dark:border-gray-600"
              />
            </div>
            <div>
              <Label className="dark:text-gray-300">التاريخ</Label>
              <Input
                type="date"
                value={visitForm.date}
                onChange={(e) => setVisitForm({ ...visitForm, date: e.target.value })}
                className="dark:bg-gray-800 dark:border-gray-600"
              />
            </div>
            <div>
              <Label className="dark:text-gray-300">السبب *</Label>
              <Input
                value={visitForm.reason}
                onChange={(e) => setVisitForm({ ...visitForm, reason: e.target.value })}
                placeholder="سبب الزيارة"
                className="dark:bg-gray-800 dark:border-gray-600"
              />
            </div>
            <div>
              <Label className="dark:text-gray-300">العلاج</Label>
              <Input
                value={visitForm.treatment}
                onChange={(e) => setVisitForm({ ...visitForm, treatment: e.target.value })}
                placeholder="العلاج المقدم"
                className="dark:bg-gray-800 dark:border-gray-600"
              />
            </div>
            <div>
              <Label className="dark:text-gray-300">ملاحظات الطبيب</Label>
              <Textarea
                value={visitForm.doctorNotes}
                onChange={(e) => setVisitForm({ ...visitForm, doctorNotes: e.target.value })}
                placeholder="ملاحظات إضافية..."
                rows={2}
                className="dark:bg-gray-800 dark:border-gray-600"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setAddVisitOpen(false)}>إلغاء</Button>
            <Button onClick={handleAddVisit} style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}>
              تسجيل الزيارة
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
