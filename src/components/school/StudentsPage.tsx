'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import QRCode from 'qrcode'
import {
  Search, Plus, Download, Eye, Edit, Trash2, Printer,
  ChevronLeft, ChevronRight, User, X, Users
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
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

// Types
interface ClassItem {
  id: string
  name: string
  level: string
  stage: string
  branch: string | null
  schoolId: string
  sections: SectionItem[]
}

interface SectionItem {
  id: string
  name: string
  classId: string
}

interface Student {
  id: string
  studentNumber: string
  fullName: string
  gender: string
  dateOfBirth: string | null
  nationalId: string | null
  phone: string | null
  address: string | null
  photo: string | null
  status: string
  qrCode: string | null
  cardStatus: string
  classId: string
  sectionId: string
  schoolId: string
  guardianName: string | null
  guardianPhone: string | null
  guardianRelation: string | null
  class: { id: string; name: string }
  section: { id: string; name: string }
  grades?: {
    id: string
    score: number | null
    status: string
    subject: { id: string; name: string }
    examType: { id: string; name: string; maxScore: number }
  }[]
  attendance?: {
    id: string
    date: string
    checkIn: string | null
    checkOut: string | null
    status: string
    lateMinutes: number | null
  }[]
}

const STATUS_COLORS: Record<string, string> = {
  'مستمر': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'منقول': 'bg-amber-100 text-amber-700 border-amber-200',
  'تارك': 'bg-red-100 text-red-700 border-red-200',
  'مفصول': 'bg-rose-100 text-rose-700 border-rose-200',
  'متخرج': 'bg-teal-100 text-teal-700 border-teal-200',
}

const ATTENDANCE_COLORS: Record<string, string> = {
  'حاضر': 'bg-emerald-100 text-emerald-700',
  'متأخر': 'bg-amber-100 text-amber-700',
  'غائب': 'bg-red-100 text-red-700',
  'مستأذن': 'bg-blue-100 text-blue-700',
  'خروج مبكر': 'bg-orange-100 text-orange-700',
  'حضور ناقص': 'bg-yellow-100 text-yellow-700',
  'إجازة مرضية': 'bg-purple-100 text-purple-700',
  'إجازة رسمية': 'bg-sky-100 text-sky-700',
}

export default function StudentsPage() {
  const { toast } = useToast()
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
      const data = await res.json()
      setStudents(data.students || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } catch {
      toast({ title: 'خطأ', description: 'فشل في جلب بيانات الطلاب', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [page, search, filterClass, filterStatus, toast])

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch('/api/classes')
      const data = await res.json()
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
      const data = await res.json()
      setSelectedStudent(data)
      setProfileOpen(true)
      if (data.qrCode) {
        const url = await QRCode.toDataURL(data.qrCode, { width: 200, margin: 2 })
        setQrCodeUrl(url)
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل في جلب بيانات الطالب', variant: 'destructive' })
    }
  }

  const openAddForm = () => {
    setEditingStudent(null)
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

  const handleSave = async () => {
    if (!form.fullName || !form.classId || !form.sectionId) {
      toast({ title: 'تنبيه', description: 'الاسم والصف والشعبة مطلوبون', variant: 'destructive' })
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
        toast({ title: 'تم التحديث', description: 'تم تحديث بيانات الطالب بنجاح' })
      } else {
        const res = await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, schoolId }),
        })
        if (!res.ok) throw new Error()
        toast({ title: 'تمت الإضافة', description: 'تم إضافة الطالب بنجاح' })
      }
      setFormOpen(false)
      fetchStudents()
    } catch {
      toast({ title: 'خطأ', description: 'فشل في حفظ البيانات', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/students/${deleteId}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer dummy-token' },
      })
      if (!res.ok) throw new Error()
      toast({ title: 'تم الحذف', description: 'تم حذف الطالب بنجاح' })
      fetchStudents()
    } catch {
      toast({ title: 'خطأ', description: 'فشل في حذف الطالب', variant: 'destructive' })
    } finally {
      setDeleteId(null)
    }
  }

  const printCard = () => {
    window.print()
  }

  const filteredSections = form.classId
    ? classes.find(c => c.id === form.classId)?.sections || []
    : []

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">إدارة الطلاب</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={openAddForm} className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة طالب
            </Button>
            <Button variant="secondary" className="gap-2">
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
              placeholder="البحث عن طالب..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="pr-9"
            />
          </div>
          <Select value={filterClass} onValueChange={(v) => { setFilterClass(v); setPage(1) }}>
            <SelectTrigger className="w-full sm:w-48">
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
            <SelectTrigger className="w-full sm:w-40">
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
      <Card>
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
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Users className="h-12 w-12 mb-4 opacity-30" />
              <p className="text-lg font-medium">لا يوجد طلاب</p>
              <p className="text-sm">قم بإضافة طلاب جدد للبدء</p>
            </div>
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
                          className="cursor-pointer hover:bg-muted/50 border-b transition-colors"
                          onClick={() => openProfile(student.id)}
                        >
                          <TableCell className="text-center font-mono text-sm">
                            {student.studentNumber}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {student.fullName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{student.fullName}</span>
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
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openProfile(student.id)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditForm(student)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(student.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openProfile(student.id)}>
                                <Printer className="h-4 w-4" />
                              </Button>
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

      {/* Add/Edit Student Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStudent ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div className="sm:col-span-2">
              <Label>الاسم الرباعي *</Label>
              <Input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="أدخل الاسم الرباعي"
              />
            </div>
            <div>
              <Label>الجنس</Label>
              <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ذكر">ذكر</SelectItem>
                  <SelectItem value="أنثى">أنثى</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>تاريخ الميلاد</Label>
              <Input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
              />
            </div>
            <div>
              <Label>رقم الهوية</Label>
              <Input
                value={form.nationalId}
                onChange={(e) => setForm({ ...form, nationalId: e.target.value })}
                placeholder="رقم الهوية الوطنية"
              />
            </div>
            <div>
              <Label>الهاتف</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="رقم الهاتف"
              />
            </div>
            <div>
              <Label>الصف *</Label>
              <Select value={form.classId} onValueChange={(v) => setForm({ ...form, classId: v, sectionId: '' })}>
                <SelectTrigger><SelectValue placeholder="اختر الصف" /></SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>الشعبة *</Label>
              <Select value={form.sectionId} onValueChange={(v) => setForm({ ...form, sectionId: v })}>
                <SelectTrigger><SelectValue placeholder="اختر الشعبة" /></SelectTrigger>
                <SelectContent>
                  {filteredSections.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>العنوان</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="العنوان"
              />
            </div>
            <Separator className="sm:col-span-2" />
            <div className="sm:col-span-2">
              <h3 className="font-semibold text-sm mb-2">معلومات ولي الأمر</h3>
            </div>
            <div>
              <Label>اسم ولي الأمر</Label>
              <Input
                value={form.guardianName}
                onChange={(e) => setForm({ ...form, guardianName: e.target.value })}
                placeholder="اسم ولي الأمر"
              />
            </div>
            <div>
              <Label>رقم ولي الأمر</Label>
              <Input
                value={form.guardianPhone}
                onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })}
                placeholder="رقم هاتف ولي الأمر"
              />
            </div>
            <div>
              <Label>صلة القرابة</Label>
              <Select value={form.guardianRelation} onValueChange={(v) => setForm({ ...form, guardianRelation: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="أب">أب</SelectItem>
                  <SelectItem value="أم">أم</SelectItem>
                  <SelectItem value="أخ">أخ</SelectItem>
                  <SelectItem value="عم">عم</SelectItem>
                  <SelectItem value="خال">خال</SelectItem>
                  <SelectItem value="أخرى">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setFormOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'جاري الحفظ...' : editingStudent ? 'تحديث' : 'إضافة'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Student Profile Dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary">
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
                      <AvatarFallback className="bg-primary/10 text-primary text-2xl">
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
                  <EmptyState message="لا توجد سجلات حضور بعد" />
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
                  <EmptyState message="لا توجد درجات مسجلة بعد" />
                )}
              </TabsContent>

              <TabsContent value="card" className="mt-4">
                <div className="flex flex-col items-center gap-6">
                  {/* Student Card */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md"
                  >
                    <Card className="overflow-hidden border-2 border-primary/20">
                      <CardHeader className="bg-primary p-4">
                        <CardTitle className="text-primary-foreground text-center text-lg">
                          مدرستي Pro
                        </CardTitle>
                        <p className="text-primary-foreground/80 text-center text-xs">
                          ثانوية الحسين للبنين
                        </p>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-20 w-20 border-2 border-primary/20">
                            <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                              {selectedStudent.fullName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <div>
                              <p className="text-xs text-muted-foreground">الاسم</p>
                              <p className="font-bold">{selectedStudent.fullName}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <p className="text-xs text-muted-foreground">الصف</p>
                                <p className="text-sm font-medium">{selectedStudent.class?.name}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">الشعبة</p>
                                <p className="text-sm font-medium">{selectedStudent.section?.name}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">الرقم</p>
                              <p className="text-sm font-mono">{selectedStudent.studentNumber}</p>
                            </div>
                          </div>
                        </div>
                        {qrCodeUrl && (
                          <div className="flex justify-center mt-4">
                            <img src={qrCodeUrl} alt="QR Code" className="w-32 h-32" />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>

                  <Button onClick={printCard} className="gap-2">
                    <Printer className="h-4 w-4" />
                    طباعة البطاقة
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}
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

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <p className="text-sm">{message}</p>
    </div>
  )
}
