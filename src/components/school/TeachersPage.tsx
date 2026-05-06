'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Plus, Edit, Trash2, Phone, Mail, BookOpen, GraduationCap,
  UserCheck, UserX, ArrowRightLeft, Users, StickyNote
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'

// Types
interface SubjectItem {
  id: string
  name: string
  code: string
}

interface Teacher {
  id: string
  fullName: string
  phone: string | null
  email: string | null
  notes: string | null
  status: string
  photo: string | null
  schoolId: string
  subjects: {
    id: string
    subjectId: string
    subject: { id: string; name: string }
  }[]
}

const STATUS_COLORS: Record<string, string> = {
  'نشط': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'إجازة': 'bg-amber-100 text-amber-700 border-amber-200',
  'منقول': 'bg-blue-100 text-blue-700 border-blue-200',
  'متقاعد': 'bg-gray-100 text-gray-700 border-gray-200',
}

export default function TeachersPage() {
  const { toast } = useToast()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [subjects, setSubjects] = useState<SubjectItem[]>([])
  const [schoolId, setSchoolId] = useState<string>('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    notes: '',
    status: 'نشط',
    selectedSubjects: [] as string[],
  })

  const fetchSchoolId = useCallback(async () => {
    try {
      const res = await fetch('/api/school')
      const data = await res.json()
      if (data.school?.id) {
        setSchoolId(data.school.id)
      }
    } catch {
      // silent
    }
  }, [])

  const fetchTeachers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterStatus !== 'all') params.set('status', filterStatus)

      const res = await fetch(`/api/teachers?${params}`)
      const data = await res.json()
      setTeachers(data || [])
    } catch {
      toast({ title: 'خطأ', description: 'فشل في جلب بيانات المدرسين', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [search, filterStatus, toast])

  const fetchSubjects = useCallback(async () => {
    try {
      const res = await fetch('/api/subjects')
      const data = await res.json()
      setSubjects(data || [])
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    fetchSchoolId()
  }, [fetchSchoolId])

  useEffect(() => {
    fetchTeachers()
  }, [fetchTeachers])

  useEffect(() => {
    fetchSubjects()
  }, [fetchSubjects])

  const openAddForm = () => {
    setEditingTeacher(null)
    setForm({
      fullName: '',
      phone: '',
      email: '',
      notes: '',
      status: 'نشط',
      selectedSubjects: [],
    })
    setFormOpen(true)
  }

  const openEditForm = (teacher: Teacher) => {
    setEditingTeacher(teacher)
    setForm({
      fullName: teacher.fullName,
      phone: teacher.phone || '',
      email: teacher.email || '',
      notes: teacher.notes || '',
      status: teacher.status,
      selectedSubjects: teacher.subjects.map(s => s.subjectId),
    })
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.fullName) {
      toast({ title: 'تنبيه', description: 'اسم المدرس مطلوب', variant: 'destructive' })
      return
    }

    if (!schoolId && !editingTeacher) {
      toast({ title: 'خطأ', description: 'لم يتم العثور على بيانات المدرسة', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      if (editingTeacher) {
        const res = await fetch(`/api/teachers/${editingTeacher.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: form.fullName,
            phone: form.phone || null,
            email: form.email || null,
            notes: form.notes || null,
            status: form.status,
            subjectIds: form.selectedSubjects,
          }),
        })
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          console.error('Update teacher error:', errorData)
          throw new Error()
        }
        toast({ title: 'تم التحديث', description: 'تم تحديث بيانات المدرس بنجاح' })
      } else {
        const res = await fetch('/api/teachers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: form.fullName,
            phone: form.phone || null,
            email: form.email || null,
            notes: form.notes || null,
            status: form.status,
            schoolId,
            subjectIds: form.selectedSubjects,
          }),
        })
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          console.error('Create teacher error:', errorData)
          throw new Error()
        }
        toast({ title: 'تمت الإضافة', description: 'تم إضافة المدرس بنجاح' })
      }
      setFormOpen(false)
      fetchTeachers()
    } catch {
      toast({ title: 'خطأ', description: 'فشل في حفظ البيانات', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/teachers/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast({ title: 'تم الحذف', description: 'تم حذف المدرس بنجاح' })
      fetchTeachers()
    } catch {
      toast({ title: 'خطأ', description: 'فشل في حذف المدرس', variant: 'destructive' })
    } finally {
      setDeleteId(null)
    }
  }

  const toggleSubject = (subjectId: string) => {
    setForm(prev => ({
      ...prev,
      selectedSubjects: prev.selectedSubjects.includes(subjectId)
        ? prev.selectedSubjects.filter(id => id !== subjectId)
        : [...prev.selectedSubjects, subjectId],
    }))
  }

  // Filter teachers by status
  const filteredTeachers = teachers.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}
            >
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold">إدارة المدرسين</h1>
          </div>
          <Button onClick={openAddForm} className="gap-2" style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}>
            <Plus className="h-4 w-4" />
            إضافة مدرس
          </Button>
        </div>

        {/* Teacher Stats Summary */}
        {!loading && teachers.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'الإجمالي', count: teachers.length, icon: Users, color: 'text-teal-700', bg: 'bg-teal-50', iconBg: 'bg-teal-100', border: 'border-teal-200' },
              { label: 'نشط', count: teachers.filter(t => t.status === 'نشط').length, icon: UserCheck, color: 'text-emerald-700', bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', border: 'border-emerald-200' },
              { label: 'إجازة', count: teachers.filter(t => t.status === 'إجازة').length, icon: UserX, color: 'text-amber-700', bg: 'bg-amber-50', iconBg: 'bg-amber-100', border: 'border-amber-200' },
              { label: 'منقول', count: teachers.filter(t => t.status === 'منقول').length, icon: ArrowRightLeft, color: 'text-blue-700', bg: 'bg-blue-50', iconBg: 'bg-blue-100', border: 'border-blue-200' },
            ].map(stat => (
              <div key={stat.label} className={`flex items-center gap-3 p-3 rounded-xl border ${stat.border} ${stat.bg}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.iconBg}`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold" style={{ color: stat.color.includes('teal') ? '#0d9488' : stat.color.includes('emerald') ? '#047857' : stat.color.includes('amber') ? '#b45309' : '#1d4ed8' }}>{stat.count}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث عن مدرس..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="نشط">نشط</SelectItem>
              <SelectItem value="إجازة">إجازة</SelectItem>
              <SelectItem value="منقول">منقول</SelectItem>
              <SelectItem value="متقاعد">متقاعد</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Teachers Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Skeleton className="h-14 w-14 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <GraduationCap className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-lg font-medium">لا يوجد مدرسين</p>
          <p className="text-sm">قم بإضافة مدرسين جدد للبدء</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredTeachers.map((teacher, idx) => (
              <motion.div
                key={teacher.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group relative">
                  {/* Gradient hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-lg" />
                  <CardContent className="p-6 relative">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-14 w-14 border-2 border-teal-200/50 shadow-sm">
                        <AvatarFallback className="bg-gradient-to-br from-teal-100 to-emerald-100 text-teal-700 text-lg font-bold">
                          {teacher.fullName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base truncate">{teacher.fullName}</h3>
                          {teacher.subjects.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700 shrink-0">
                              <BookOpen className="h-2.5 w-2.5" />
                              {teacher.subjects.length}
                            </span>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className={cn('text-xs mt-1.5', STATUS_COLORS[teacher.status] || '')}
                        >
                          {teacher.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {teacher.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          <span dir="ltr">{teacher.phone}</span>
                        </div>
                      )}
                      {teacher.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />
                          <span className="truncate">{teacher.email}</span>
                        </div>
                      )}
                      {teacher.notes && (
                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                          <StickyNote className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                          <span className="line-clamp-2">{teacher.notes}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <BookOpen className="h-3.5 w-3.5 text-teal-500" />
                        <span className="font-medium">{teacher.subjects.length} مادة</span>
                      </div>
                    </div>

                    {teacher.subjects.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {teacher.subjects.map(s => (
                          <Badge key={s.id} variant="secondary" className="text-xs bg-teal-50 text-teal-700 hover:bg-teal-100">
                            {s.subject.name}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <Separator className="my-4" />

                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openEditForm(teacher)}>
                        <Edit className="h-3.5 w-3.5" />
                        تعديل
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => setDeleteId(teacher.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                        حذف
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Teacher Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTeacher ? 'تعديل بيانات المدرس' : 'إضافة مدرس جديد'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>الاسم الرباعي *</Label>
              <Input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="أدخل الاسم الرباعي"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>الهاتف</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="رقم الهاتف"
                  dir="ltr"
                />
              </div>
              <div>
                <Label>البريد الإلكتروني</Label>
                <Input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="البريد الإلكتروني"
                  dir="ltr"
                />
              </div>
            </div>
            <div>
              <Label>الحالة</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="نشط">نشط</SelectItem>
                  <SelectItem value="إجازة">إجازة</SelectItem>
                  <SelectItem value="منقول">منقول</SelectItem>
                  <SelectItem value="متقاعد">متقاعد</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>ملاحظات</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="أضف ملاحظات عن المدرس..."
                rows={3}
              />
            </div>

            <Separator />

            <div>
              <Label className="mb-3 block">المواد الدراسية</Label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                {subjects.map(subject => (
                  <label
                    key={subject.id}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors',
                      form.selectedSubjects.includes(subject.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    )}
                  >
                    <Checkbox
                      checked={form.selectedSubjects.includes(subject.id)}
                      onCheckedChange={() => toggleSubject(subject.id)}
                    />
                    <span className="text-sm">{subject.name}</span>
                  </label>
                ))}
              </div>
              {subjects.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">لا توجد مواد مسجلة</p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setFormOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'جاري الحفظ...' : editingTeacher ? 'تحديث' : 'إضافة'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا المدرس؟ سيتم إزالة جميع الارتباطات بالمواد والصفوف.
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
