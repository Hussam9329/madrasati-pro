'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import QRCode from 'qrcode'
import NextImage from 'next/image'
import {
  Search, Plus, Download, Edit, Trash2, Printer,
  ChevronLeft, ChevronRight, User, X, Users, ArrowRightLeft, CheckCircle2,
  Camera, Phone, MapPin, GraduationCap, UserCircle,
  Lightbulb, CheckCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { exportToCSV } from '@/lib/export-utils'
import { useAppStore } from '@/lib/store'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { getUserMessage } from '@/utils/errors'
import { extractApiData } from '@/services/api'

// Types
import type { Student, ClassItem, SectionItem } from '@/types'
import { STUDENT_STATUS_COLORS, ATTENDANCE_STATUS_COLORS } from '@/lib/constants'

const STATUS_COLORS = STUDENT_STATUS_COLORS
const ATTENDANCE_COLORS = ATTENDANCE_STATUS_COLORS

export default function StudentsPage() {
  const { setSelectedStudentId, setActivePage } = useAppStore()
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [filterClass, setFilterClass] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [formStep, setFormStep] = useState(0)
  const [transferOpen, setTransferOpen] = useState(false)
  const [transferSaving, setTransferSaving] = useState(false)
  const [transferConfirm, setTransferConfirm] = useState(false)
  const [transferForm, setTransferForm] = useState({
    studentId: '',
    newClassId: '',
    newSectionId: '',
    reason: '',
  })
  const limit = 10

  // Form state
  const [form, setForm] = useState({
    fullName: '',
    gender: 'ذكر',
    dateOfBirth: '',
    nationalId: '',
    phone: '',
    address: '',
    classId: '',
    sectionId: '',
    guardianName: '',
    guardianPhone: '',
    guardianRelation: 'أب',
  })

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      })
      if (search) params.set('search', search)
      if (filterClass !== 'all') params.set('classId', filterClass)
      if (filterStatus !== 'all') params.set('status', filterStatus)

      const res = await fetch(`/api/students?${params}`)
      const data = extractApiData(await res.json())
      setStudents(data.students || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } catch {
      toast.error('خطأ', { description: 'تعذر تحميل بيانات الطلاب. حاول مرة أخرى.' })
    } finally {
      setLoading(false)
    }
  }, [page, search, filterClass, filterStatus])

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch('/api/classes')
      const data = extractApiData(await res.json())
      setClasses(data || [])
    } catch {
      // silent fail for classes
    }
  }, [])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

  const openProfile = async (studentId: string) => {
    try {
      const res = await fetch(`/api/students/${studentId}`)
      const data = extractApiData(await res.json())
      setSelectedStudent(data)
      setProfileOpen(true)
      if (data.qrCode) {
        const url = await QRCode.toDataURL(data.qrCode, { width: 200, margin: 2 })
        setQrCodeUrl(url)
      }
    } catch {
      toast.error('خطأ', { description: 'تعذر تحميل بيانات الطالب. حاول مرة أخرى.' })
    }
  }

  const navigateToProfile = (studentId: string) => {
    setSelectedStudentId(studentId)
    setActivePage('profile')
  }

  const openAddForm = () => {
    setEditingStudent(null)
    setFormStep(0)
    setForm({
      fullName: '',
      gender: 'ذكر',
      dateOfBirth: '',
      nationalId: '',
      phone: '',
      address: '',
      classId: '',
      sectionId: '',
      guardianName: '',
      guardianPhone: '',
      guardianRelation: 'أب',
    })
    setFormOpen(true)
  }

  const openEditForm = (student: Student) => {
    setEditingStudent(student)
    setFormStep(0)
    setForm({
      fullName: student.fullName,
      gender: student.gender,
      dateOfBirth: student.dateOfBirth || '',
      nationalId: student.nationalId || '',
      phone: student.phone || '',
      address: student.address || '',
      classId: student.classId,
      sectionId: student.sectionId,
      guardianName: student.guardianName || '',
      guardianPhone: student.guardianPhone || '',
      guardianRelation: student.guardianRelation || 'أب',
    })
    setFormOpen(true)
  }

  const validateStep = (step: number): boolean => {
    if (step === 0) {
      if (!form.fullName.trim()) {
        toast.error('تنبيه', { description: 'يرجى إدخال اسم الطالب الرباعي' })
        return false
      }
      return true
    }
    if (step === 1) {
      if (!form.classId) {
        toast.error('تنبيه', { description: 'يرجى اختيار الصف الدراسي' })
        return false
      }
      if (!form.sectionId) {
        toast.error('تنبيه', { description: 'يرجى اختيار الشعبة' })
        return false
      }
      return true
    }
    return true
  }

  const handleSave = async () => {
    if (!form.fullName || !form.classId || !form.sectionId) {
      toast.error('تنبيه', { description: 'الاسم والصف والشعبة مطلوبون' })
      return
    }

    setSaving(true)
    try {
      // Get schoolId from selected class
      const selectedClass = classes.find(c => c.id === form.classId)
      const schoolId = selectedClass?.schoolId || ''

      if (editingStudent) {
        const res = await fetch(`/api/students/${editingStudent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error()
        toast.success('تم التحديث', { description: 'تم تحديث بيانات الطالب بنجاح' })
      } else {
        const res = await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, schoolId }),
        })
        if (!res.ok) throw new Error()
        toast.success('تمت الإضافة', { description: 'تم إضافة الطالب بنجاح' })
      }
      setFormOpen(false)
      fetchStudents()
    } catch {
      toast.error('خطأ', { description: 'فشل في حفظ البيانات' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/students/${deleteId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error()
      toast.success('تم الحذف', { description: 'تم حذف الطالب بنجاح' })
      fetchStudents()
    } catch {
      toast.error('خطأ', { description: 'فشل في حذف الطالب' })
    } finally {
      setDeleteId(null)
    }
  }

  const printCard = () => {
    window.print()
  }

  const downloadCardAsImage = async () => {
    const cardEl = document.getElementById('student-card-printable')
    if (!cardEl) return
    try {
      const canvas = document.createElement('canvas')
      const scale = 2
      canvas.width = cardEl.offsetWidth * scale
      canvas.height = cardEl.offsetHeight * scale
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.scale(scale, scale)
      // Use SVG foreignObject to render HTML to canvas
      const data = new XMLSerializer().serializeToString(cardEl)
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0)
        const link = document.createElement('a')
        link.download = `بطاقة_${selectedStudent?.fullName || 'طالب'}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
      }
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${cardEl.offsetWidth}" height="${cardEl.offsetHeight}"><foreignObject width="100%" height="100%">${data}</foreignObject></svg>`)
    } catch {
      toast.error('خطأ', { description: 'فشل في تحميل البطاقة كصورة' })
    }
  }

  const handleExportCSV = async () => {
    try {
      const res = await fetch('/api/students?limit=1000')
      const data = extractApiData(await res.json())
      const allStudents: Student[] = data.students || []
      const csvData = allStudents.map(s => ({
        'الرقم': s.studentNumber,
        'الاسم': s.fullName,
        'الجنس': s.gender,
        'الصف': s.class?.name || '',
        'الشعبة': s.section?.name || '',
        'الحالة': s.status,
      }))
      exportToCSV(csvData, 'الطلاب')
      toast.success('تم التصدير', { description: 'تم تصدير بيانات الطلاب بنجاح' })
    } catch {
      toast.error('خطأ', { description: 'فشل في تصدير البيانات' })
    }
  }

  const filteredSections = form.classId
    ? classes.find(c => c.id === form.classId)?.sections || []
    : []

  return (
    <div className="space-y-6">
      {/* Page Guidance Hint */}
      <div className="hint-card p-3 flex items-start gap-3">
        <Lightbulb className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">إدارة الطلاب</p>
          <p className="text-xs text-blue-600 dark:text-blue-400">يمكنك البحث عن طالب بالاسم أو الرقم، وتصفية القائمة حسب الصف والحالة. اضغط على صف الطالب لعرض ملفه الكامل.</p>
        </div>
      </div>

      {/* Top Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg shadow-lg bg-primary">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold dark:text-gray-200">إدارة الطلاب</h1>
              <p className="text-sm text-muted-foreground">إدارة بيانات الطلاب والتسجيل</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={openAddForm} className="gap-2 bg-primary">
              <Plus className="h-4 w-4" />
              إضافة طالب
            </Button>
            <Button variant="outline" className="gap-2 border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-400 dark:hover:bg-teal-900/20" onClick={handleExportCSV}>
              <Download className="h-4 w-4" />
              تصدير
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              name="search"
              autoComplete="off"
              placeholder="البحث عن طالب..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="pr-9 dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
          <Select value={filterClass} onValueChange={(v) => { setFilterClass(v); setPage(1) }}>
            <SelectTrigger id="filterClass" className="w-full sm:w-48">
              <SelectValue placeholder="الصف" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الصفوف</SelectItem>
              {classes.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1) }}>
            <SelectTrigger id="filterStatus" className="w-full sm:w-40">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="مستمر">مستمر</SelectItem>
              <SelectItem value="منقول">منقول</SelectItem>
              <SelectItem value="تارك">تارك</SelectItem>
              <SelectItem value="مفصول">مفصول</SelectItem>
              <SelectItem value="متخرج">متخرج</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Students Table */}
      <Card className="dark:bg-gray-900/50">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : students.length === 0 ? (
            <EmptyState
              icon={Users}
              title="لم يتم تسجيل أي طالب بعد"
              description="ابدأ بإضافة الطلاب لإدارة بياناتهم وحضورهم ودرجاتهم."
              actionLabel="إضافة أول طالب"
              onAction={openAddForm}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">الرقم</TableHead>
                      <TableHead>الاسم</TableHead>
                      <TableHead className="text-center">الصف</TableHead>
                      <TableHead className="text-center">الشعبة</TableHead>
                      <TableHead className="text-center">الجنس</TableHead>
                      <TableHead className="text-center">الحالة</TableHead>
                      <TableHead className="text-center">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {students.map((student, idx) => (
                        <motion.tr
                          key={student.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: idx * 0.03 }}
                          className="cursor-pointer hover:bg-muted/50 dark:hover:bg-gray-800/50 border-b transition-colors"
                          onClick={() => navigateToProfile(student.id)}
                        >
                          <TableCell className="text-center font-mono text-sm">
                            {student.studentNumber}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs dark:bg-teal-900/30 dark:text-teal-300">
                                  {student.fullName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium dark:text-gray-200">{student.fullName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-sm">{student.class.name}</TableCell>
                          <TableCell className="text-center text-sm">{student.section.name}</TableCell>
                          <TableCell className="text-center text-sm">
                            <div className="flex items-center justify-center gap-1">
                              {student.gender === 'ذكر' ? (
                                <User className="h-3.5 w-3.5 text-blue-500" />
                              ) : (
                                <User className="h-3.5 w-3.5 text-pink-500" />
                              )}
                              <span className={student.gender === 'ذكر' ? 'text-blue-600' : 'text-pink-600'}>
                                {student.gender}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className={cn('text-xs', STATUS_COLORS[student.status] || '')}
                            >
                              {student.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost" className="h-8 w-8 text-teal-600 dark:text-teal-400" onClick={() => navigateToProfile(student.id)}>
                                    <UserCircle className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>عرض الملف</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditForm(student)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>تعديل</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(student.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>حذف</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t">
                <p className="text-sm text-muted-foreground">
                  عرض {((page - 1) * limit) + 1} - {Math.min(page * limit, total)} من {total} طالب
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium">{page} / {totalPages}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Student Dialog - 3 Step Guided Form */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-200">{editingStudent ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}</DialogTitle>
          </DialogHeader>
          
          {/* Step Indicators */}
          <div className="flex items-center gap-2 py-2">
            {[
              { num: 1, label: 'المعلومات الأساسية' },
              { num: 2, label: 'الصف والشعبة' },
              { num: 3, label: 'معلومات ولي الأمر' },
            ].map((step, idx) => (
              <div key={step.num} className="flex items-center gap-2 flex-1">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors",
                  formStep > idx ? "bg-emerald-500 text-white" :
                  formStep === idx ? "bg-primary text-white" :
                  "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                )}>
                  {formStep > idx ? <CheckCircle className="h-4 w-4" /> : step.num}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-xs font-medium truncate", formStep === idx ? "text-primary" : "text-muted-foreground")}>{step.label}</p>
                  {idx < 2 && (
                    <div className={cn("h-1 rounded mt-1", formStep > idx ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-700")} />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="py-4">
            {/* Step 1: Basic Info */}
            {formStep === 0 && (
              <div className="space-y-4">
                <div>
                  <Label>الاسم الرباعي *</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    autoComplete="name"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="أدخل الاسم الرباعي"
                    className="mt-1"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">أدخل الاسم الرباعي للطالب كما هو في الهوية</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>الجنس</Label>
                    <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                      <SelectTrigger id="gender" className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ذكر">ذكر</SelectItem>
                        <SelectItem value="أنثى">أنثى</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground mt-1">اختر جنس الطالب</p>
                  </div>
                  <div>
                    <Label>تاريخ الميلاد</Label>
                    <Input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      autoComplete="bday"
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                      className="mt-1"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">أدخل تاريخ الميلاد بالتقويم الميلادي</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>رقم الهوية</Label>
                    <Input
                      id="nationalId"
                      name="nationalId"
                      autoComplete="off"
                      value={form.nationalId}
                      onChange={(e) => setForm({ ...form, nationalId: e.target.value })}
                      placeholder="رقم الهوية الوطنية"
                      className="mt-1"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">رقم الهوية الوطنية - اختياري</p>
                  </div>
                  <div>
                    <Label>الهاتف</Label>
                    <Input
                      id="phone"
                      name="phone"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="رقم الهاتف"
                      className="mt-1"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">رقم هاتف للتواصل</p>
                  </div>
                </div>
                <div>
                  <Label>العنوان</Label>
                  <Input
                    id="address"
                    name="address"
                    autoComplete="street-address"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="العنوان"
                    className="mt-1"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">عنوان سكن الطالب - اختياري</p>
                </div>
              </div>
            )}

            {/* Step 2: Class & Section */}
            {formStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>الصف *</Label>
                    <Select value={form.classId} onValueChange={(v) => setForm({ ...form, classId: v, sectionId: '' })}>
                      <SelectTrigger id="classId" className="mt-1"><SelectValue placeholder="اختر الصف" /></SelectTrigger>
                      <SelectContent>
                        {classes.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground mt-1">اختر الصف الدراسي للطالب</p>
                  </div>
                  <div>
                    <Label>الشعبة *</Label>
                    <Select value={form.sectionId} onValueChange={(v) => setForm({ ...form, sectionId: v })}>
                      <SelectTrigger id="sectionId" className="mt-1"><SelectValue placeholder="اختر الشعبة" /></SelectTrigger>
                      <SelectContent>
                        {filteredSections.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground mt-1">الشعبة تتغير حسب الصف المختار</p>
                  </div>
                </div>
                {form.classId && filteredSections.length === 0 && (
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
                    <p className="text-xs text-amber-700 dark:text-amber-300">لا توجد شعب في هذا الصف. تأكد من إضافة شعب للصف أولاً.</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Guardian Info */}
            {formStep === 2 && (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
                  <p className="text-xs text-blue-700 dark:text-blue-300">معلومات ولي الأمر اختيارية ويمكن إضافتها أو تعديلها لاحقاً</p>
                </div>
                <div>
                  <Label>اسم ولي الأمر</Label>
                  <Input
                    id="guardianName"
                    name="guardianName"
                    autoComplete="name"
                    value={form.guardianName}
                    onChange={(e) => setForm({ ...form, guardianName: e.target.value })}
                    placeholder="اسم ولي الأمر"
                    className="mt-1"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">اسم ولي الأمر المسؤول عن الطالب</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>رقم هاتف ولي الأمر</Label>
                    <Input
                      id="guardianPhone"
                      name="guardianPhone"
                      autoComplete="tel"
                      value={form.guardianPhone}
                      onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })}
                      placeholder="رقم هاتف ولي الأمر"
                      className="mt-1"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">رقم للتواصل في الحالات الطارئة</p>
                  </div>
                  <div>
                    <Label>صلة القرابة</Label>
                    <Select value={form.guardianRelation} onValueChange={(v) => setForm({ ...form, guardianRelation: v })}>
                      <SelectTrigger id="guardianRelation" className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="أب">أب</SelectItem>
                        <SelectItem value="أم">أم</SelectItem>
                        <SelectItem value="أخ">أخ</SelectItem>
                        <SelectItem value="عم">عم</SelectItem>
                        <SelectItem value="خال">خال</SelectItem>
                        <SelectItem value="أخرى">أخرى</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground mt-1">العلاقة بين ولي الأمر والطالب</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between gap-2 pt-4 border-t">
            {formStep > 0 ? (
              <Button variant="outline" onClick={() => setFormStep(prev => prev - 1)}>السابق</Button>
            ) : (
              <Button variant="outline" onClick={() => setFormOpen(false)}>إلغاء</Button>
            )}
            <div className="flex-1" />
            {formStep < 2 ? (
              <Button onClick={() => { if (validateStep(formStep)) setFormStep(prev => prev + 1) }} className="bg-primary">
                التالي
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={saving} className="bg-primary">
                {saving ? 'جاري الحفظ...' : editingStudent ? 'تحديث' : 'إضافة'}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Student Profile Dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary dark:bg-teal-900/30 dark:text-teal-300">
                  {selectedStudent?.fullName?.charAt(0) || 'ط'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p>{selectedStudent?.fullName}</p>
                <p className="text-sm font-normal text-muted-foreground">{selectedStudent?.studentNumber}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedStudent && (
            <Tabs defaultValue="info" className="mt-4" dir="rtl">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="info">المعلومات الشخصية</TabsTrigger>
                <TabsTrigger value="attendance">الحضور</TabsTrigger>
                <TabsTrigger value="grades">الدرجات</TabsTrigger>
                <TabsTrigger value="card">البطاقة و QR</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="mt-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  <div className="sm:col-span-2 flex items-center gap-4 mb-2">
                    <Avatar className="h-20 w-20">
                      <AvatarFallback className="bg-primary/10 text-primary text-2xl dark:bg-teal-900/30 dark:text-teal-300">
                        {selectedStudent.fullName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-bold">{selectedStudent.fullName}</h3>
                      <p className="text-muted-foreground font-mono">{selectedStudent.studentNumber}</p>
                      <Badge variant="outline" className={cn('mt-1', STATUS_COLORS[selectedStudent.status])}>
                        {selectedStudent.status}
                      </Badge>
                    </div>
                  </div>

                  <InfoField label="الجنس" value={selectedStudent.gender} icon={selectedStudent.gender === 'ذكر' ? 'male' : 'female'} />
                  <InfoField label="تاريخ الميلاد" value={selectedStudent.dateOfBirth || '—'} />
                  <InfoField label="رقم الهوية" value={selectedStudent.nationalId || '—'} />
                  <InfoField label="الهاتف" value={selectedStudent.phone || '—'} />
                  <InfoField label="العنوان" value={selectedStudent.address || '—'} />
                  <InfoField label="الصف" value={selectedStudent.class?.name || '—'} />
                  <InfoField label="الشعبة" value={selectedStudent.section?.name || '—'} />
                  <InfoField label="حالة البطاقة" value={selectedStudent.cardStatus} />
                  <Separator className="sm:col-span-2" />
                  <InfoField label="اسم ولي الأمر" value={selectedStudent.guardianName || '—'} />
                  <InfoField label="رقم ولي الأمر" value={selectedStudent.guardianPhone || '—'} />
                  <InfoField label="صلة القرابة" value={selectedStudent.guardianRelation || '—'} />
                </motion.div>
              </TabsContent>

              <TabsContent value="attendance" className="mt-4">
                {selectedStudent.attendance && selectedStudent.attendance.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-center">التاريخ</TableHead>
                          <TableHead className="text-center">الدخول</TableHead>
                          <TableHead className="text-center">الخروج</TableHead>
                          <TableHead className="text-center">الحالة</TableHead>
                          <TableHead className="text-center">التأخير</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedStudent.attendance.map((rec) => (
                          <TableRow key={rec.id}>
                            <TableCell className="text-center text-sm">{rec.date}</TableCell>
                            <TableCell className="text-center text-sm">{rec.checkIn || '—'}</TableCell>
                            <TableCell className="text-center text-sm">{rec.checkOut || '—'}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className={cn('text-xs', ATTENDANCE_COLORS[rec.status] || '')}>
                                {rec.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {rec.lateMinutes ? `${rec.lateMinutes} دقيقة` : '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <EmptyState title="لا توجد سجلات حضور بعد" />
                )}
              </TabsContent>

              <TabsContent value="grades" className="mt-4">
                {selectedStudent.grades && selectedStudent.grades.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-center">المادة</TableHead>
                          <TableHead className="text-center">نوع الامتحان</TableHead>
                          <TableHead className="text-center">الدرجة</TableHead>
                          <TableHead className="text-center">الدرجة الكاملة</TableHead>
                          <TableHead className="text-center">الحالة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedStudent.grades.map((g) => (
                          <TableRow key={g.id}>
                            <TableCell className="text-center text-sm font-medium">{g.subject.name}</TableCell>
                            <TableCell className="text-center text-sm">{g.examType.name}</TableCell>
                            <TableCell className="text-center text-sm font-bold">
                              {g.score !== null ? g.score : '—'}
                            </TableCell>
                            <TableCell className="text-center text-sm">{g.examType.maxScore}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className={cn('text-xs',
                                g.status === 'مكتملة' ? 'bg-emerald-100 text-emerald-700' :
                                g.status === 'ناقصة' ? 'bg-amber-100 text-amber-700' :
                                'bg-red-100 text-red-700'
                              )}>
                                {g.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <EmptyState title="لا توجد درجات مسجلة بعد" />
                )}
              </TabsContent>

              <TabsContent value="card" className="mt-4">
                <div className="flex flex-col items-center gap-6">
                  {/* Student Card - Professional Design */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md printable-card"
                  >
                    <div
                      id="student-card-printable"
                      className="overflow-hidden rounded-xl border-2 border-teal-300 dark:border-teal-700 bg-white dark:bg-gray-800"
                    >
                      {/* Top Section: Teal gradient header */}
                      <div
                        className="p-4 text-center relative overflow-hidden bg-primary"
                      >
                        <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
                        <div className="absolute -bottom-3 -left-3 w-16 h-16 rounded-full bg-white/10" />
                        <div className="relative flex items-center justify-center gap-3 mb-1">
                          <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <GraduationCap className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-white text-lg font-bold">ثانوية مارينا</h3>
                            <p className="text-white/80 text-xs">زيونة - الشارع الخدمي لدار الازياء</p>
                          </div>
                        </div>
                        <p className="text-white/70 text-[10px] mt-1">العام الدراسي 2025-2026</p>
                      </div>

                      {/* Middle Section: Photo + Info */}
                      <div className="p-5">
                        <div className="flex items-start gap-4">
                          {/* Photo placeholder */}
                          <div className="shrink-0">
                            <div className="h-20 w-20 relative rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/30 dark:to-emerald-900/30 border-2 border-teal-200 dark:border-teal-700 flex items-center justify-center overflow-hidden">
                              {selectedStudent.photo ? (
                                <NextImage src={selectedStudent.photo} alt={selectedStudent.fullName} fill className="object-cover rounded-lg" sizes="80px" />
                              ) : (
                                <Camera className="h-6 w-6 text-teal-400" />
                              )}
                            </div>
                          </div>
                          {/* Student info */}
                          <div className="flex-1 space-y-2.5">
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">الاسم الرباعي</p>
                              <p className="font-bold text-sm dark:text-gray-200">{selectedStudent.fullName}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                              <div>
                                <p className="text-[10px] text-muted-foreground">الصف</p>
                                <p className="text-xs font-semibold dark:text-gray-300">{selectedStudent.class?.name}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-muted-foreground">الشعبة</p>
                                <p className="text-xs font-semibold dark:text-gray-300">{selectedStudent.section?.name}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground">الرقم المدرسي</p>
                              <p className="text-xs font-mono font-bold text-primary">{selectedStudent.studentNumber}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Section: QR + Contact */}
                      <div className="border-t border-teal-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 px-5 py-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span>0770-123-4567</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span>بغداد - الكرخ</span>
                            </div>
                          </div>
                          {qrCodeUrl && (
                            <NextImage src={qrCodeUrl} alt="QR Code" width={80} height={80} className="rounded-lg" unoptimized />
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 no-print">
                    <Button onClick={printCard} className="gap-2 bg-primary">
                      <Printer className="h-4 w-4" />
                      طباعة البطاقة
                    </Button>
                    <Button onClick={downloadCardAsImage} variant="outline" className="gap-2 border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-400 dark:hover:bg-teal-900/20">
                      <Download className="h-4 w-4" />
                      تحميل كصورة
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Transfer Student Dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              نقل طالب
            </DialogTitle>
          </DialogHeader>
          {!transferConfirm ? (
            <div className="space-y-4 py-4">
              <div>
                <Label>الطالب *</Label>
                <Select value={transferForm.studentId} onValueChange={(v) => setTransferForm({ ...transferForm, studentId: v })}>
                  <SelectTrigger id="transferStudent">
                    <SelectValue placeholder="اختر الطالب" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.fullName} - {s.studentNumber}</SelectItem>
                    ))}
                    {students.length === 0 && (
                      <SelectItem value="none" disabled>لا يوجد طلاب في القائمة الحالية</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              {transferForm.studentId && (() => {
                const selectedStu = students.find(s => s.id === transferForm.studentId)
                if (!selectedStu) return null
                return (
                  <Card className="bg-muted/50 border-teal-200 dark:bg-gray-800/50 dark:border-teal-800">
                    <CardContent className="p-3">
                      <p className="text-sm font-medium">الموقع الحالي:</p>
                      <p className="text-sm text-muted-foreground">الصف: {selectedStu.class.name} | الشعبة: {selectedStu.section.name}</p>
                    </CardContent>
                  </Card>
                )
              })()}
              <div>
                <Label>الصف الجديد *</Label>
                <Select value={transferForm.newClassId} onValueChange={(v) => setTransferForm({ ...transferForm, newClassId: v, newSectionId: '' })}>
                  <SelectTrigger id="transferNewClass">
                    <SelectValue placeholder="اختر الصف الجديد" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>الشعبة الجديدة *</Label>
                <Select value={transferForm.newSectionId} onValueChange={(v) => setTransferForm({ ...transferForm, newSectionId: v })}>
                  <SelectTrigger id="transferNewSection">
                    <SelectValue placeholder="اختر الشعبة" />
                  </SelectTrigger>
                  <SelectContent>
                    {transferForm.newClassId
                      ? classes.find(c => c.id === transferForm.newClassId)?.sections.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))
                      : <SelectItem value="none" disabled>اختر الصف أولاً</SelectItem>
                    }
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>سبب النقل</Label>
                <Textarea
                  id="transferReason"
                  name="transferReason"
                  autoComplete="off"
                  value={transferForm.reason}
                  onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                  placeholder="أدخل سبب النقل..."
                  rows={3}
                />
              </div>
              <div>
                <Label>تاريخ النقل</Label>
                <Input
                  id="transferDate"
                  name="transferDate"
                  autoComplete="off"
                  value={new Date().toLocaleDateString('ar-IQ')}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="flex flex-col items-center gap-3 p-6 bg-teal-50 dark:bg-teal-950/20 rounded-xl border border-teal-200">
                <CheckCircle2 className="h-12 w-12 text-teal-600" />
                <p className="text-lg font-bold text-teal-700">تأكيد نقل الطالب</p>
              </div>
              {(() => {
                const selectedStu = students.find(s => s.id === transferForm.studentId)
                const newCls = classes.find(c => c.id === transferForm.newClassId)
                const newSec = newCls?.sections.find(s => s.id === transferForm.newSectionId)
                if (!selectedStu) return null
                return (
                  <Card className="border-teal-200">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-teal-100 text-teal-700">{selectedStu.fullName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold">{selectedStu.fullName}</p>
                          <p className="text-xs text-muted-foreground font-mono">{selectedStu.studentNumber}</p>
                        </div>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">من:</p>
                          <p className="font-medium">{selectedStu.class.name} / {selectedStu.section.name}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">إلى:</p>
                          <p className="font-medium text-teal-700">{newCls?.name || '—'} / {newSec?.name || '—'}</p>
                        </div>
                      </div>
                      {transferForm.reason && (
                        <div>
                          <p className="text-muted-foreground text-sm">السبب:</p>
                          <p className="text-sm">{transferForm.reason}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })()}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setTransferOpen(false)}>إلغاء</Button>
            {!transferConfirm ? (
              <Button
                onClick={() => setTransferConfirm(true)}
                disabled={!transferForm.studentId || !transferForm.newClassId || !transferForm.newSectionId}
                className="bg-primary"
              >
                متابعة
              </Button>
            ) : (
              <Button
                onClick={async () => {
                  setTransferSaving(true)
                  try {
                    const res = await fetch('/api/students/transfer', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(transferForm),
                    })
                    if (!res.ok) throw new Error()
                    toast.success('تم النقل', { description: 'تم نقل الطالب بنجاح' })
                    setTransferOpen(false)
                    fetchStudents()
                  } catch {
                    toast.error('خطأ', { description: 'فشل في نقل الطالب' })
                  } finally {
                    setTransferSaving(false)
                  }
                }}
                disabled={transferSaving}
                className="bg-primary"
              >
                {transferSaving ? 'جاري النقل...' : 'تأكيد النقل'}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا الطالب؟ لا يمكن التراجع عن هذا الإجراء وسيتم حذف جميع السجلات المرتبطة.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function InfoField({ label, value, icon }: { label: string; value: string; icon?: 'male' | 'female' }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-1.5">
        {icon === 'male' && <User className="h-4 w-4 text-blue-500" />}
        {icon === 'female' && <User className="h-4 w-4 text-pink-500" />}
        <p className={`text-sm font-medium ${icon === 'male' ? 'text-blue-600' : icon === 'female' ? 'text-pink-600' : ''}`}>{value}</p>
      </div>
    </div>
  )
}
