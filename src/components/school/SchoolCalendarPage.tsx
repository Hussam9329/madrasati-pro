'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarDays, ChevronLeft, ChevronRight, Plus, MapPin,
  Clock, Calendar, Star, BookOpen, Trophy, PartyPopper,
  Users, Dumbbell, AlertCircle, Navigation
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
import { useToast } from '@/hooks/use-toast'

// Types
interface CalendarEvent {
  id: string
  title: string
  type: 'دراسي' | 'امتحان' | 'نشاط' | 'عطلة' | 'اجتماع' | 'رياضي'
  date: string
  time: string
  location: string
  description: string
}

// Event type config
const EVENT_TYPE_CONFIG: Record<string, {
  color: string
  bg: string
  dot: string
  border: string
  icon: React.ElementType
  darkBg: string
  darkText: string
  darkBorder: string
}> = {
  'دراسي': {
    color: 'text-blue-700',
    bg: 'bg-blue-100',
    dot: 'bg-blue-500',
    border: 'border-blue-200',
    icon: BookOpen,
    darkBg: 'dark:bg-blue-900/30',
    darkText: 'dark:text-blue-300',
    darkBorder: 'dark:border-blue-700',
  },
  'امتحان': {
    color: 'text-red-700',
    bg: 'bg-red-100',
    dot: 'bg-red-500',
    border: 'border-red-200',
    icon: AlertCircle,
    darkBg: 'dark:bg-red-900/30',
    darkText: 'dark:text-red-300',
    darkBorder: 'dark:border-red-700',
  },
  'نشاط': {
    color: 'text-emerald-700',
    bg: 'bg-emerald-100',
    dot: 'bg-emerald-500',
    border: 'border-emerald-200',
    icon: PartyPopper,
    darkBg: 'dark:bg-emerald-900/30',
    darkText: 'dark:text-emerald-300',
    darkBorder: 'dark:border-emerald-700',
  },
  'عطلة': {
    color: 'text-amber-700',
    bg: 'bg-amber-100',
    dot: 'bg-amber-500',
    border: 'border-amber-200',
    icon: Star,
    darkBg: 'dark:bg-amber-900/30',
    darkText: 'dark:text-amber-300',
    darkBorder: 'dark:border-amber-700',
  },
  'اجتماع': {
    color: 'text-purple-700',
    bg: 'bg-purple-100',
    dot: 'bg-purple-500',
    border: 'border-purple-200',
    icon: Users,
    darkBg: 'dark:bg-purple-900/30',
    darkText: 'dark:text-purple-300',
    darkBorder: 'dark:border-purple-700',
  },
  'رياضي': {
    color: 'text-cyan-700',
    bg: 'bg-cyan-100',
    dot: 'bg-cyan-500',
    border: 'border-cyan-200',
    icon: Dumbbell,
    darkBg: 'dark:bg-cyan-900/30',
    darkText: 'dark:text-cyan-300',
    darkBorder: 'dark:border-cyan-700',
  },
}

// Arabic month names
const ARABIC_MONTHS = [
  'كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران',
  'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'
]

// Arabic day names (Sunday-Thursday school days, Friday+Saturday weekend)
const ARABIC_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

// Mock data - 20+ events throughout the year
function generateMockEvents(): CalendarEvent[] {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  return [
    { id: 'ev-1', title: 'بدء الفصل الدراسي الأول', type: 'دراسي', date: `${year}-09-15`, time: '07:30', location: 'القاعة الكبرى', description: 'استقبال الطلاب وبداية العام الدراسي الجديد' },
    { id: 'ev-2', title: 'امتحان شهر أول - رياضيات', type: 'امتحان', date: `${year}-10-20`, time: '08:00', location: 'قاعة 1', description: 'امتحان مادة الرياضيات للصف الخامس' },
    { id: 'ev-3', title: 'يوم المعلم', type: 'نشاط', date: `${year}-10-05`, time: '09:00', location: 'الساحة المدرسية', description: 'احتفال المدرسة بيوم المعلم العربي' },
    { id: 'ev-4', title: 'عطلة يوم الجمهورية', type: 'عطلة', date: `${year}-10-14`, time: '00:00', location: '-', description: 'عطلة رسمية بمناسبة يوم الجمهورية' },
    { id: 'ev-5', title: 'اجتماع أولياء الأمور', type: 'اجتماع', date: `${year}-11-10`, time: '10:00', location: 'القاعة الكبرى', description: 'اجتماع دوري مع أولياء أمور الطلاب لمناقشة المستوى الدراسي' },
    { id: 'ev-6', title: 'بطولة كرة القدم المدرسية', type: 'رياضي', date: `${year}-11-15`, time: '12:00', location: 'الملعب الرياضي', description: 'البطولة السنوية لكرة القدم بين الصفوف' },
    { id: 'ev-7', title: 'امتحان نصف السنة - عربي', type: 'امتحان', date: `${year}-12-01`, time: '08:00', location: 'قاعة 2', description: 'امتحان نصف السنة لمادة اللغة العربية' },
    { id: 'ev-8', title: 'امتحان نصف السنة - إنكليزي', type: 'امتحان', date: `${year}-12-03`, time: '08:00', location: 'قاعة 3', description: 'امتحان نصف السنة لمادة اللغة الإنكليزية' },
    { id: 'ev-9', title: 'عطلة نصف السنة', type: 'عطلة', date: `${year}-12-15`, time: '00:00', location: '-', description: 'عطلة منتصف العام الدراسي لمدة أسبوع' },
    { id: 'ev-10', title: 'حفلة توزيع الجوائز', type: 'نشاط', date: `${year}-12-25`, time: '10:00', location: 'القاعة الكبرى', description: 'تكريم الطلاب المتفوقين في الفصل الأول' },
    { id: 'ev-11', title: 'ورشة عمل الحاسوب', type: 'دراسي', date: `${year + (month >= 0 ? 1 : 0)}-01-15`, time: '09:00', location: 'مختبر الحاسوب', description: 'ورشة عمل تدريبية على برامج الحاسوب' },
    { id: 'ev-12', title: 'يوم العلم', type: 'نشاط', date: `${year + (month >= 0 ? 1 : 0)}-01-07`, time: '08:00', location: 'الساحة المدرسية', description: 'حفل رفع العلم والنشيد الوطني' },
    { id: 'ev-13', title: 'اجتماع هيئة التدريس', type: 'اجتماع', date: `${year + (month >= 0 ? 1 : 0)}-01-20`, time: '11:00', location: 'غرفة المعلمين', description: 'اجتماع دوري لمناقشة الخطة الدراسية للفصل الثاني' },
    { id: 'ev-14', title: 'سباق ألعاب القوى', type: 'رياضي', date: `${year + (month >= 0 ? 1 : 0)}-02-10`, time: '09:00', location: 'الملعب الرياضي', description: 'المشاركة في بطولة ألعاب القوى على مستوى المحافظة' },
    { id: 'ev-15', title: 'امتحان شهر ثاني - فيزياء', type: 'امتحان', date: `${year + (month >= 0 ? 1 : 0)}-02-18`, time: '08:00', location: 'قاعة 1', description: 'امتحان مادة الفيزياء للصف السادس' },
    { id: 'ev-16', title: 'معرض العلوم المدرسي', type: 'نشاط', date: `${year + (month >= 0 ? 1 : 0)}-03-05`, time: '09:00', location: 'القاعة الكبرى', description: 'معرض سنوي لمشاريع الطلاب العلمية' },
    { id: 'ev-17', title: 'عطلة رأس السنة الميلادية', type: 'عطلة', date: `${year}-01-01`, time: '00:00', location: '-', description: 'عطلة رسمية بمناسبة رأس السنة الميلادية' },
    { id: 'ev-18', title: 'امتحان نهاية السنة - كيمياء', type: 'امتحان', date: `${year + (month >= 0 ? 1 : 0)}-04-20`, time: '08:00', location: 'قاعة 2', description: 'امتحان نهاية السنة لمادة الكيمياء' },
    { id: 'ev-19', title: 'رحلة علمية للمتحف', type: 'نشاط', date: `${year + (month >= 0 ? 1 : 0)}-03-20`, time: '08:00', location: 'متحف بغداد', description: 'رحلة علمية ترفيهية لمتحف بغداد الوطني' },
    { id: 'ev-20', title: 'مباراة كرة السلة', type: 'رياضي', date: `${year + (month >= 0 ? 1 : 0)}-04-10`, time: '11:00', location: 'الصالة الرياضية', description: 'مباراة ودية مع مدرسة النور' },
    { id: 'ev-21', title: 'ورشة تعزيز القراءة', type: 'دراسي', date: `${year + (month >= 0 ? 1 : 0)}-03-12`, time: '10:00', location: 'المكتبة المدرسية', description: 'ورشة عمل لتعزيز ثقافة القراءة لدى الطلاب' },
    { id: 'ev-22', title: 'اجتماع المجلس المدرسي', type: 'اجتماع', date: `${year + (month >= 0 ? 1 : 0)}-04-01`, time: '14:00', location: 'غرفة الإدارة', description: 'اجتماع فصلي للمجلس المدرسي' },
    { id: 'ev-23', title: 'عطلة عيد الفطر', type: 'عطلة', date: `${year}-03-30`, time: '00:00', location: '-', description: 'عطلة رسمية بمناسبة عيد الفطر المبارك' },
    { id: 'ev-24', title: 'حفل التخرج', type: 'نشاط', date: `${year}-05-25`, time: '10:00', location: 'القاعة الكبرى', description: 'حفل تخرج طلاب السادس الإعدادي' },
    { id: 'ev-25', title: 'امتحان نهاية السنة - رياضيات', type: 'امتحان', date: `${year}-05-01`, time: '08:00', location: 'قاعة 1', description: 'امتحان نهاية السنة لمادة الرياضيات' },
    // Current month events (May 2026)
    { id: 'ev-26', title: 'امتحان نهاية السنة - فيزياء', type: 'امتحان', date: `${year}-05-03`, time: '08:00', location: 'قاعة 2', description: 'امتحان نهاية السنة لمادة الفيزياء' },
    { id: 'ev-27', title: 'امتحان نهاية السنة - عربي', type: 'امتحان', date: `${year}-05-05`, time: '08:00', location: 'قاعة 1', description: 'امتحان نهاية السنة لمادة اللغة العربية' },
    { id: 'ev-28', title: 'اجتماع لجنة الامتحانات', type: 'اجتماع', date: `${year}-05-07`, time: '10:00', location: 'غرفة الإدارة', description: 'اجتماع لجنة الامتحانات لمراجعة سير الامتحانات' },
    { id: 'ev-29', title: 'يوم الرياضة المدرسية', type: 'رياضي', date: `${year}-05-10`, time: '09:00', location: 'الملعب الرياضي', description: 'يوم رياضي مفتوح لجميع الصفوف' },
    { id: 'ev-30', title: 'امتحان نهاية السنة - إنكليزي', type: 'امتحان', date: `${year}-05-12`, time: '08:00', location: 'قاعة 3', description: 'امتحان نهاية السنة لمادة اللغة الإنكليزية' },
    { id: 'ev-31', title: 'حفل تكريم المتفوقين', type: 'نشاط', date: `${year}-05-18`, time: '10:00', location: 'القاعة الكبرى', description: 'تكريم الطلاب المتفوقين في الفصل الدراسي الثاني' },
    { id: 'ev-32', title: 'ورشة عمل التصميم', type: 'دراسي', date: `${year}-05-20`, time: '09:00', location: 'مختبر الحاسوب', description: 'ورشة عمل على أساسيات التصميم الرقمي' },
    { id: 'ev-33', title: 'اجتماع أولياء الأمور النهائي', type: 'اجتماع', date: `${year}-05-22`, time: '10:00', location: 'القاعة الكبرى', description: 'اجتماع ختامي مع أولياء الأمور لمناقشة النتائج' },
    { id: 'ev-34', title: 'عطلة نهاية العام الدراسي', type: 'عطلة', date: `${year}-05-28`, time: '00:00', location: '-', description: 'بداية إجازة الصيف' },
  ]
}

// Helpers
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function formatArabicDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long', day: 'numeric' })
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

// Month slide animation variants
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? -60 : 60,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? -60 : 60,
    opacity: 0,
  }),
}

export default function SchoolCalendarPage() {
  const { toast } = useToast()
  const [currentDate, setCurrentDate] = useState(new Date())
  const events = useMemo(() => generateMockEvents(), [])
  const [formOpen, setFormOpen] = useState(false)
  const [direction, setDirection] = useState(0)
  const [form, setForm] = useState({
    title: '',
    type: 'دراسي' as CalendarEvent['type'],
    date: '',
    time: '08:00',
    location: '',
    description: '',
  })

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  // Navigation
  const prevMonth = () => {
    setDirection(-1)
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
  }
  const nextMonth = () => {
    setDirection(1)
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
  }
  const goToToday = () => {
    setDirection(0)
    setCurrentDate(new Date())
  }

  // Calendar grid
  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)

  // Events for current month
  const monthEvents = events.filter(e => {
    const d = new Date(e.date)
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth
  })

  // Events by day for quick lookup
  const eventsByDay = (() => {
    const map: Record<number, CalendarEvent[]> = {}
    monthEvents.forEach(e => {
      const day = new Date(e.date).getDate()
      if (!map[day]) map[day] = []
      map[day].push(e)
    })
    return map
  })()

  // Today's events
  const todayEvents = events.filter(e => e.date === todayStr)

  // Stats
  const thisWeekEvents = (() => {
    const now = new Date()
    const weekEnd = new Date(now)
    weekEnd.setDate(now.getDate() + 7)
    return events.filter(e => {
      const d = new Date(e.date)
      return d >= now && d <= weekEnd
    })
  })()

  const upcomingHolidays = events.filter(e => e.type === 'عطلة' && e.date >= todayStr)

  const upcomingExams = events.filter(e => e.type === 'امتحان' && e.date >= todayStr)

  // Upcoming events list (next 10)
  const upcomingEvents = events
    .filter(e => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, 10)

  // Month overview stats
  const monthExams = monthEvents.filter(e => e.type === 'امتحان').length
  const monthHolidays = monthEvents.filter(e => e.type === 'عطلة').length
  const monthActivities = monthEvents.filter(e => e.type === 'نشاط' || e.type === 'رياضي').length

  // Add event handler
  const handleAddEvent = () => {
    if (!form.title || !form.date) {
      toast({ title: 'تنبيه', description: 'العنوان والتاريخ مطلوبان', variant: 'destructive' })
      return
    }
    toast({ title: 'تمت الإضافة', description: `تم إضافة "${form.title}" إلى التقويم` })
    setFormOpen(false)
    setForm({ title: '', type: 'دراسي', date: '', time: '08:00', location: '', description: '' })
  }

  // Build calendar cells
  const calendarCells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(null)
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d)
  }

  // Month key for animation
  const monthKey = `${currentYear}-${currentMonth}`

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
            <CalendarDays className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold dark:text-gray-200">التقويم المدرسي</h1>
            <p className="text-sm text-muted-foreground">الأحداث والمناسبات المدرسية</p>
          </div>
        </div>
        <Button
          onClick={() => setFormOpen(true)}
          className="gap-2"
          style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}
        >
          <Plus className="h-4 w-4" />
          إضافة حدث
        </Button>
      </motion.div>

      {/* Today's Events Section */}
      {todayEvents.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden border-teal-200 dark:border-teal-800" style={{ background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.05), rgba(5, 150, 105, 0.05))' }}>
            <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #0d9488, #059669)' }} />
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base dark:text-gray-200">
                <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                أحداث اليوم
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {todayEvents.map((ev) => {
                  const config = EVENT_TYPE_CONFIG[ev.type]
                  const Icon = config.icon
                  return (
                    <motion.div
                      key={ev.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl border',
                        config.bg, config.border, config.darkBg, config.darkBorder
                      )}
                    >
                      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', config.bg, config.darkBg)}>
                        <Icon className={cn('h-5 w-5', config.color, config.darkText)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm font-bold truncate', config.color, config.darkText)}>{ev.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{ev.time}</span>
                          {ev.location && ev.location !== '-' && (
                            <>
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{ev.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Summary Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/20 dark:to-emerald-950/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 left-0 h-1" style={{ background: 'linear-gradient(90deg, #0d9488, #059669)' }} />
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">هذا الأسبوع</p>
              <p className="text-xl font-bold text-teal-700 dark:text-teal-300">{thisWeekEvents.length}</p>
              <p className="text-[10px] text-muted-foreground">فعاليات قادمة</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 left-0 h-1" style={{ background: 'linear-gradient(90deg, #d97706, #f59e0b)' }} />
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
              <Star className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">عُطل قادمة</p>
              <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{upcomingHolidays.length}</p>
              <p className="text-[10px] text-muted-foreground">عطلة رسمية</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 left-0 h-1" style={{ background: 'linear-gradient(90deg, #dc2626, #ef4444)' }} />
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">امتحانات قادمة</p>
              <p className="text-xl font-bold text-red-700 dark:text-red-300">{upcomingExams.length}</p>
              <p className="text-[10px] text-muted-foreground">امتحان</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 left-0 h-1" style={{ background: 'linear-gradient(90deg, #059669, #10b981)' }} />
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
              <Trophy className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">إجمالي الفعاليات</p>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{events.length}</p>
              <p className="text-[10px] text-muted-foreground">حدث مسجل</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Calendar Grid + Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="overflow-hidden dark:bg-gray-900/50 dark:border-gray-700">
            <div className="h-1" style={{ background: 'linear-gradient(90deg, #0d9488, #059669)' }} />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                      key={monthKey}
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="text-center"
                    >
                      <h2 className="text-lg font-bold dark:text-gray-200">
                        {ARABIC_MONTHS[currentMonth]} {currentYear}
                      </h2>
                    </motion.div>
                  </AnimatePresence>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1 border-teal-200 text-teal-700 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-400 dark:hover:bg-teal-900/20"
                  onClick={goToToday}
                >
                  <Calendar className="h-3 w-3" />
                  اليوم
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {/* Mini month overview stats bar */}
              <div className="flex items-center gap-4 mb-4 p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-1.5 text-xs">
                  <div className="w-2 h-2 rounded-full bg-teal-500" />
                  <span className="text-muted-foreground dark:text-gray-400">الفعاليات:</span>
                  <span className="font-bold text-teal-700 dark:text-teal-300">{monthEvents.length}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-muted-foreground dark:text-gray-400">الامتحانات:</span>
                  <span className="font-bold text-red-700 dark:text-red-300">{monthExams}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-muted-foreground dark:text-gray-400">العطل:</span>
                  <span className="font-bold text-amber-700 dark:text-amber-300">{monthHolidays}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-muted-foreground dark:text-gray-400">الأنشطة:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-300">{monthActivities}</span>
                </div>
              </div>

              {/* Day names header */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {ARABIC_DAYS.map((day, idx) => (
                  <div
                    key={day}
                    className={cn(
                      'text-center text-xs font-semibold py-2 rounded-lg',
                      idx >= 5
                        ? 'text-red-500 dark:text-red-400'
                        : 'text-muted-foreground'
                    )}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={monthKey}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="grid grid-cols-7 gap-1"
                >
                  {calendarCells.map((day, idx) => {
                    if (day === null) {
                      return <div key={`empty-${idx}`} className="aspect-square" />
                    }

                    const dayOfWeek = (firstDay + day - 1) % 7
                    const isWeekend = dayOfWeek >= 5
                    const isToday = currentYear === today.getFullYear() && currentMonth === today.getMonth() && day === today.getDate()
                    const dayEvents = eventsByDay[day] || []
                    const hasEvents = dayEvents.length > 0

                    return (
                      <motion.div
                        key={day}
                        className={cn(
                          'aspect-square rounded-xl flex flex-col items-center justify-center relative cursor-pointer transition-all',
                          hasEvents ? 'hover:bg-teal-50 dark:hover:bg-teal-900/20' : 'hover:bg-gray-100 dark:hover:bg-gray-800',
                          isWeekend && 'text-red-400 dark:text-red-500',
                          isToday && 'text-white',
                        )}
                        style={isToday ? { background: 'linear-gradient(135deg, #0d9488, #059669)' } : undefined}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {/* Today pulsing ring */}
                        {isToday && (
                          <motion.div
                            className="absolute inset-0 rounded-xl border-2 border-teal-300"
                            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                          />
                        )}

                        <span className={cn(
                          'text-sm font-medium leading-none',
                          isToday ? 'text-white' : ''
                        )}>
                          {day}
                        </span>
                        {dayEvents.length > 0 && (
                          <div className="flex gap-0.5 mt-1">
                            {dayEvents.slice(0, 3).map((ev, evIdx) => {
                              const config = EVENT_TYPE_CONFIG[ev.type]
                              return (
                                <div
                                  key={evIdx}
                                  className={cn(
                                    'w-1.5 h-1.5 rounded-full',
                                    config.dot,
                                    isToday && 'ring-1 ring-white/60'
                                  )}
                                />
                              )
                            })}
                            {dayEvents.length > 2 && (
                              <span className={cn(
                                'text-[8px] leading-none font-bold',
                                isToday ? 'text-white/90' : 'text-teal-600 dark:text-teal-400'
                              )}>
                                +{dayEvents.length - 2}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Gradient hover effect on days with events */}
                        {hasEvents && !isToday && (
                          <div className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.08), rgba(5, 150, 105, 0.08))' }} />
                        )}
                      </motion.div>
                    )
                  })}
                </motion.div>
              </AnimatePresence>

              {/* Event type legend - enhanced with larger icons and labels */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex flex-wrap gap-4 justify-center">
                  {Object.entries(EVENT_TYPE_CONFIG).map(([type, config]) => {
                    const Icon = config.icon
                    return (
                      <div key={type} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <Icon className={cn('h-4 w-4', config.color, config.darkText)} />
                        <div className={cn('w-2.5 h-2.5 rounded-full', config.dot)} />
                        <span className="text-xs font-medium text-muted-foreground dark:text-gray-300">{type}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Events for this month */}
              {monthEvents.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <h3 className="text-sm font-semibold mb-3 dark:text-gray-300">
                    فعاليات {ARABIC_MONTHS[currentMonth]}
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {monthEvents
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .map((ev) => {
                        const config = EVENT_TYPE_CONFIG[ev.type]
                        const Icon = config.icon
                        return (
                          <div
                            key={ev.id}
                            className={cn(
                              'flex items-center gap-3 p-2 rounded-lg border transition-colors hover:shadow-sm',
                              config.bg, config.border,
                              config.darkBg, config.darkBorder
                            )}
                          >
                            <Icon className={cn('h-4 w-4 shrink-0', config.color, config.darkText)} />
                            <div className="flex-1 min-w-0">
                              <p className={cn('text-xs font-medium truncate', config.color, config.darkText)}>
                                {ev.title}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {new Date(ev.date).getDate()} {ARABIC_MONTHS[currentMonth]} • {ev.time}
                              </p>
                            </div>
                            <Badge variant="outline" className={cn('text-[9px] shrink-0', config.bg, config.color, config.border, config.darkBg, config.darkText, config.darkBorder)}>
                              {ev.type}
                            </Badge>
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Events List */}
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden dark:bg-gray-900/50 dark:border-gray-700">
            <div className="h-1" style={{ background: 'linear-gradient(90deg, #0d9488, #059669)' }} />
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 dark:text-gray-200">
                <Calendar className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                الأحداث القادمة
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {upcomingEvents.map((ev) => {
                  const config = EVENT_TYPE_CONFIG[ev.type]
                  const Icon = config.icon
                  const days = daysUntil(ev.date)
                  const isToday = days === 0
                  const isTomorrow = days === 1

                  return (
                    <motion.div
                      key={ev.id}
                      className={cn(
                        'rounded-xl border p-3 transition-all hover:shadow-md',
                        config.border, config.darkBorder
                      )}
                      whileHover={{ y: -1 }}
                    >
                      <div className="flex items-start gap-3">
                        {/* Countdown days as prominent number with colored circle */}
                        <div className={cn(
                          'w-12 h-12 rounded-full flex flex-col items-center justify-center shrink-0 text-white shadow-sm',
                        )} style={{ background: isToday ? 'linear-gradient(135deg, #0d9488, #059669)' : isTomorrow ? 'linear-gradient(135deg, #d97706, #f59e0b)' : 'linear-gradient(135deg, #6b7280, #9ca3af)' }}>
                          {isToday ? (
                            <span className="text-[10px] font-bold">اليوم</span>
                          ) : isTomorrow ? (
                            <span className="text-[10px] font-bold">غداً</span>
                          ) : (
                            <>
                              <span className="text-base font-bold leading-none">{days}</span>
                              <span className="text-[8px] opacity-80">يوم</span>
                            </>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold dark:text-gray-200 truncate">{ev.title}</p>
                            <Badge variant="outline" className={cn(
                              'text-[9px] shrink-0 px-1.5',
                              config.bg, config.color, config.border,
                              config.darkBg, config.darkText, config.darkBorder
                            )}>
                              {ev.type}
                            </Badge>
                          </div>
                          <div className="mt-1.5 space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{formatArabicDate(ev.date)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{ev.time}</span>
                            </div>
                            {ev.location && ev.location !== '-' && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                <span>{ev.location}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-2">{ev.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}

                {upcomingEvents.length === 0 && (
                  <div className="flex flex-col items-center py-8 text-muted-foreground">
                    <CalendarDays className="h-10 w-10 mb-2 opacity-30" />
                    <p className="text-sm">لا توجد أحداث قادمة</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Jump to Today floating button */}
      <motion.div
        className="fixed bottom-6 left-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 200 }}
      >
        <Button
          onClick={goToToday}
          size="lg"
          className="rounded-full shadow-lg gap-2 h-12 w-12 p-0"
          style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}
          title="الانتقال إلى اليوم"
        >
          <Navigation className="h-5 w-5 text-white" />
        </Button>
      </motion.div>

      {/* Add Event Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 dark:text-gray-200">
              <Plus className="h-5 w-5 text-teal-600" />
              إضافة حدث جديد
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="dark:text-gray-300">عنوان الحدث *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="مثال: امتحان نصف السنة"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="dark:text-gray-300">نوع الحدث *</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as CalendarEvent['type'] })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EVENT_TYPE_CONFIG).map(([type, config]) => {
                    const Icon = config.icon
                    return (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          <div className={cn('w-2 h-2 rounded-full', config.dot)} />
                          <Icon className="h-3.5 w-3.5" />
                          {type}
                        </div>
                      </SelectItem>
                    )
                  })}
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
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="dark:text-gray-300">الوقت</Label>
                <Input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="dark:text-gray-300">المكان</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="مثال: القاعة الكبرى"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="dark:text-gray-300">الوصف</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="وصف مختصر للحدث..."
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setFormOpen(false)}>إلغاء</Button>
            <Button onClick={handleAddEvent} style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}>
              إضافة الحدث
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
