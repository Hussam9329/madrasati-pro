'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Plus, Edit, Trash2, Phone, Mail, BookOpen, GraduationCap
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
  specialty: string | null
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
  const [search, setSearch] = useState('')
  const [filterSpecialty, setFilterSpecialty] = useState('all')
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
    specialty: '',
    status: 'نشط',
    selectedSubjects: [] as string[],
  })

  const fetchTeachers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterSpecialty !== 'all') params.set('status', filterSpecialty)

      const res = await fetch(`/api/teachers?${params}`)
      const data = await res.json()
      setTeachers(data || [])
    } catch {
      toast({ title: 'خطأ', description: 'فشل في جلب بيانات المدرسين', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [search, filterSpecialty, toast])

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
      specialty: '',
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
      specialty: teacher.specialty || '',
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

    setSaving(true)
    try {
      // Get schoolId from first teacher or subject
      const schoolId = teachers[0]?.schoolId || ''

      if (editingTeacher) {
        const res = await fetch(`/api/teachers/${editingTeacher.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: form.fullName,
            phone: form.phone,
            email: form.email,
            specialty: form.specialty,
            status: form.status,
            subjectIds: form.selectedSubjects,
          }),
        })
        if (!res.ok) throw new Error()
        toast({ title: 'تم التحديث', description: 'تم تحديث بيانات المدرس بنجاح' })
      } else {
        const res = await fetch('/api/teachers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: form.fullName,
            phone: form.phone,
            email: form.email,
            specialty: form.specialty,
            status: form.status,
            schoolId,
            subjectIds: form.selectedSubjects,
          }),
        })
        if (!res.ok) throw new Error()
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

  // Get unique specialties for filter
  const specialties = [...new Set(teachers.map(t => t.specialty).filter(Boolean))]

  // Filter teachers by search
  const filteredTeachers = teachers.filter(t => {
    if (filterSpecialty !== 'all' && t.specialty !== filterSpecialty) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">إدارة المدرسين</h1>
          </div>
          <Button onClick={openAddForm} className="gap-2">
            <Plus className="h-4 w-4" />
            إضافة مدرس
          </Button>
        </div>

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
          <Select value={filterSpecialty} onValueChange={setFilterSpecialty}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="الاختصاص" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الاختصاصات</SelectItem>
              {specialties.map(s => (
                <SelectItem key={s} value={s!}>{s}</SelectItem>
              ))}
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
                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-14 w-14 border-2 border-primary/20">
                        <AvatarFallback className="bg-primary/10 text-primary text-lg">
                          {teacher.fullName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base truncate">{teacher.fullName}</h3>
                        <p className="text-sm text-muted-foreground">{teacher.specialty || 'بدون اختصاص'}</p>
                        <Badge
                          variant="outline"
                          className={cn('text-xs mt-1', STATUS_COLORS[teacher.status] || '')}
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
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>{teacher.subjects.length} مادة</span>
                      </div>
                    </div>

                    {teacher.subjects.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {teacher.subjects.map(s => (
                          <Badge key={s.id} variant="secondary" className="text-xs">
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>الاختصاص</Label>
                <Input
                  value={form.specialty}
                  onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                  placeholder="الاختصاص"
                />
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
