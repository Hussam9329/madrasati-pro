'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings, Users, Bell, Plus, Edit, Trash2, Save, Shield,
  UserPlus, Megaphone, AlertCircle, Info, CheckCircle,
  School, Phone, Mail, MapPin, Clock, User as UserIcon, X
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
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'

// ============ TYPES ============
interface SchoolData {
  id: string
  name: string
  logo?: string
  address?: string
  phone?: string
  email?: string
  principalName?: string
  academicYear: string
  schoolType: string
  shiftType: string
  startTime: string
  endTime: string
  lateThreshold: number
  weekendDays: string
}

interface UserData {
  id: string
  username: string
  name: string
  role: string
  active: boolean
  createdAt: string
  updatedAt: string
}

interface NoticeData {
  id: string
  title: string
  content: string
  type: string
  schoolId: string
  createdBy: string
  createdAt: string
}

const roleColors: Record<string, string> = {
  'مدير': 'bg-red-100 text-red-800 border-red-300',
  'معاون': 'bg-purple-100 text-purple-800 border-purple-300',
  'موظف تسجيل': 'bg-blue-100 text-blue-800 border-blue-300',
  'موظف بوابة': 'bg-amber-100 text-amber-800 border-amber-300',
  'مدرس': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'مسؤول نظام': 'bg-gray-100 text-gray-800 border-gray-300',
}

const noticeTypeColors: Record<string, string> = {
  'عام': 'bg-sky-100 text-sky-800 border-sky-300',
  'عاجل': 'bg-red-100 text-red-800 border-red-300',
  'أكاديمي': 'bg-purple-100 text-purple-800 border-purple-300',
}

const noticeTypeIcons: Record<string, React.ReactNode> = {
  'عام': <Info className="h-4 w-4" />,
  'عاجل': <AlertCircle className="h-4 w-4" />,
  'أكاديمي': <School className="h-4 w-4" />,
}

interface SettingsPageProps {
  initialTab?: string;
}

export default function SettingsPage({ initialTab = 'settings' }: SettingsPageProps) {
  const { toast } = useToast()

  // ============ SCHOOL SETTINGS STATE ============
  const [school, setSchool] = useState<SchoolData | null>(null)
  const [loadingSchool, setLoadingSchool] = useState(true)
  const [savingSchool, setSavingSchool] = useState(false)
  const [schoolForm, setSchoolForm] = useState({
    name: '', address: '', phone: '', email: '', principalName: '',
    academicYear: '2026-2027', schoolType: 'ثانوية اعتيادية',
    shiftType: 'صباحي', startTime: '08:00', endTime: '13:30',
    lateThreshold: '10', weekendDays: '5,6',
  })

  // ============ USERS STATE ============
  const [users, setUsers] = useState<UserData[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [userForm, setUserForm] = useState({ username: '', password: '', name: '', role: 'موظف تسجيل', active: true })
  const [savingUser, setSavingUser] = useState(false)

  // ============ NOTICES STATE ============
  const [notices, setNotices] = useState<NoticeData[]>([])
  const [loadingNotices, setLoadingNotices] = useState(false)
  const [noticeDialogOpen, setNoticeDialogOpen] = useState(false)
  const [noticeForm, setNoticeForm] = useState({ title: '', content: '', type: 'عام' })
  const [savingNotice, setSavingNotice] = useState(false)

  // ============ FETCH FUNCTIONS ============
  const fetchSchool = useCallback(async () => {
    setLoadingSchool(true)
    try {
      const res = await fetch('/api/school')
      if (res.ok) {
        const data = await res.json()
        if (data.school) {
          setSchool(data.school)
          setSchoolForm({
            name: data.school.name || '',
            address: data.school.address || '',
            phone: data.school.phone || '',
            email: data.school.email || '',
            principalName: data.school.principalName || '',
            academicYear: data.school.academicYear || '2026-2027',
            schoolType: data.school.schoolType || 'ثانوية اعتيادية',
            shiftType: data.school.shiftType || 'صباحي',
            startTime: data.school.startTime || '08:00',
            endTime: data.school.endTime || '13:30',
            lateThreshold: String(data.school.lateThreshold || 10),
            weekendDays: data.school.weekendDays || '5,6',
          })
        }
      }
    } catch {
      console.error('Failed to fetch school')
    } finally {
      setLoadingSchool(false)
    }
  }, [])

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true)
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch {
      console.error('Failed to fetch users')
    } finally {
      setLoadingUsers(false)
    }
  }, [])

  const fetchNotices = useCallback(async () => {
    setLoadingNotices(true)
    try {
      const res = await fetch('/api/notices?limit=50')
      if (res.ok) {
        const data = await res.json()
        setNotices(data.notices || [])
      }
    } catch {
      console.error('Failed to fetch notices')
    } finally {
      setLoadingNotices(false)
    }
  }, [])

  useEffect(() => {
    fetchSchool()
  }, [fetchSchool])

  // ============ SCHOOL SETTINGS HANDLERS ============
  const handleSaveSchool = async () => {
    setSavingSchool(true)
    try {
      const res = await fetch('/api/school', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...schoolForm,
          lateThreshold: parseInt(schoolForm.lateThreshold),
        }),
      })

      if (res.ok) {
        toast({ title: 'تم الحفظ', description: 'تم تحديث بيانات المدرسة بنجاح' })
        fetchSchool()
      } else {
        const data = await res.json()
        toast({ title: 'خطأ', description: data.error || 'حدث خطأ في الحفظ', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ في الاتصال', variant: 'destructive' })
    } finally {
      setSavingSchool(false)
    }
  }

  // ============ USERS HANDLERS ============
  const handleOpenUserDialog = (user?: UserData) => {
    if (user) {
      setEditingUser(user)
      setUserForm({
        username: user.username,
        password: '',
        name: user.name,
        role: user.role,
        active: user.active,
      })
    } else {
      setEditingUser(null)
      setUserForm({ username: '', password: '', name: '', role: 'موظف تسجيل', active: true })
    }
    setUserDialogOpen(true)
  }

  const handleSaveUser = async () => {
    if (!userForm.username || !userForm.name) {
      toast({ title: 'خطأ', description: 'اسم المستخدم والاسم مطلوبان', variant: 'destructive' })
      return
    }

    if (!editingUser && !userForm.password) {
      toast({ title: 'خطأ', description: 'كلمة المرور مطلوبة للمستخدم الجديد', variant: 'destructive' })
      return
    }

    setSavingUser(true)
    try {
      if (editingUser) {
        // Update user
        const body: Record<string, unknown> = {
          name: userForm.name,
          role: userForm.role,
          active: userForm.active,
        }
        if (userForm.password) body.password = userForm.password
        if (userForm.username !== editingUser.username) body.username = userForm.username

        const res = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        if (res.ok) {
          toast({ title: 'تم التحديث', description: 'تم تحديث بيانات المستخدم' })
          setUserDialogOpen(false)
          fetchUsers()
        } else {
          const data = await res.json()
          toast({ title: 'خطأ', description: data.error, variant: 'destructive' })
        }
      } else {
        // Create user
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userForm),
        })

        if (res.ok) {
          toast({ title: 'تم الإنشاء', description: 'تم إنشاء المستخدم بنجاح' })
          setUserDialogOpen(false)
          fetchUsers()
        } else {
          const data = await res.json()
          toast({ title: 'خطأ', description: data.error, variant: 'destructive' })
        }
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ في الاتصال', variant: 'destructive' })
    } finally {
      setSavingUser(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'تم الحذف', description: 'تم حذف المستخدم' })
        fetchUsers()
      } else {
        const data = await res.json()
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ في الحذف', variant: 'destructive' })
    }
  }

  // ============ NOTICES HANDLERS ============
  const handleSaveNotice = async () => {
    if (!noticeForm.title || !noticeForm.content) {
      toast({ title: 'خطأ', description: 'العنوان والمحتوى مطلوبان', variant: 'destructive' })
      return
    }

    setSavingNotice(true)
    try {
      const schoolId = school?.id || 'default'
      const res = await fetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...noticeForm,
          schoolId,
          createdBy: 'المدير',
        }),
      })

      if (res.ok) {
        toast({ title: 'تم الإنشاء', description: 'تم إنشاء الإعلان بنجاح' })
        setNoticeDialogOpen(false)
        setNoticeForm({ title: '', content: '', type: 'عام' })
        fetchNotices()
      } else {
        const data = await res.json()
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ في الاتصال', variant: 'destructive' })
    } finally {
      setSavingNotice(false)
    }
  }

  // Format date
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('ar-IQ', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            إعدادات المدرسة
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2" onClick={fetchUsers}>
            <Users className="h-4 w-4" />
            المستخدمون
          </TabsTrigger>
          <TabsTrigger value="notices" className="gap-2" onClick={fetchNotices}>
            <Bell className="h-4 w-4" />
            الإشعارات
          </TabsTrigger>
        </TabsList>

        {/* ============ SETTINGS TAB ============ */}
        <TabsContent value="settings" className="space-y-6">
          {loadingSchool ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i}>
                  <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* School Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <School className="h-5 w-5 text-primary" />
                    معلومات المدرسة
                  </CardTitle>
                  <CardDescription>البيانات الأساسية للمدرسة</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        <School className="h-3 w-3" />
                        اسم المدرسة
                      </Label>
                      <Input
                        value={schoolForm.name}
                        onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
                        placeholder="اسم المدرسة"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        <UserIcon className="h-3 w-3" />
                        اسم المدير
                      </Label>
                      <Input
                        value={schoolForm.principalName}
                        onChange={(e) => setSchoolForm({ ...schoolForm, principalName: e.target.value })}
                        placeholder="اسم المدير"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        العنوان
                      </Label>
                      <Input
                        value={schoolForm.address}
                        onChange={(e) => setSchoolForm({ ...schoolForm, address: e.target.value })}
                        placeholder="عنوان المدرسة"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        الهاتف
                      </Label>
                      <Input
                        value={schoolForm.phone}
                        onChange={(e) => setSchoolForm({ ...schoolForm, phone: e.target.value })}
                        placeholder="رقم الهاتف"
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        البريد الإلكتروني
                      </Label>
                      <Input
                        value={schoolForm.email}
                        onChange={(e) => setSchoolForm({ ...schoolForm, email: e.target.value })}
                        placeholder="البريد الإلكتروني"
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>السنة الدراسية</Label>
                      <Input
                        value={schoolForm.academicYear}
                        onChange={(e) => setSchoolForm({ ...schoolForm, academicYear: e.target.value })}
                        placeholder="2026-2027"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* School Type & Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    نوع الدوام والمواعيد
                  </CardTitle>
                  <CardDescription>إعدادات الدوام وأوقات الحضور والانصراف</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>نوع المدرسة</Label>
                      <Select value={schoolForm.schoolType} onValueChange={(v) => setSchoolForm({ ...schoolForm, schoolType: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ثانوية اعتيادية">ثانوية اعتيادية</SelectItem>
                          <SelectItem value="ثانوية مهنية">ثانوية مهنية</SelectItem>
                          <SelectItem value="متوسطة">متوسطة</SelectItem>
                          <SelectItem value="ابتدائية">ابتدائية</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>نوع الدوام</Label>
                      <Select value={schoolForm.shiftType} onValueChange={(v) => setSchoolForm({ ...schoolForm, shiftType: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="صباحي">صباحي</SelectItem>
                          <SelectItem value="مسائي">مسائي</SelectItem>
                          <SelectItem value="مزدوج">مزدوج</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        بداية الدوام
                      </Label>
                      <Input
                        type="time"
                        value={schoolForm.startTime}
                        onChange={(e) => setSchoolForm({ ...schoolForm, startTime: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        نهاية الدوام
                      </Label>
                      <Input
                        type="time"
                        value={schoolForm.endTime}
                        onChange={(e) => setSchoolForm({ ...schoolForm, endTime: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>حد التأخير (بالدقائق)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="60"
                        value={schoolForm.lateThreshold}
                        onChange={(e) => setSchoolForm({ ...schoolForm, lateThreshold: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>أيام العطلة</Label>
                      <Select
                        value={schoolForm.weekendDays}
                        onValueChange={(v) => setSchoolForm({ ...schoolForm, weekendDays: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5,6">الجمعة والسبت</SelectItem>
                          <SelectItem value="6,7">السبت والأحد</SelectItem>
                          <SelectItem value="5">الجمعة فقط</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveSchool}
                  disabled={savingSchool}
                  className="gap-2 bg-primary hover:bg-primary/90 min-w-[160px]"
                >
                  {savingSchool ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  حفظ الإعدادات
                </Button>
              </div>
            </motion.div>
          )}
        </TabsContent>

        {/* ============ USERS TAB ============ */}
        <TabsContent value="users" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">إدارة المستخدمين</h3>
            </div>
            <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenUserDialog()} className="gap-2 bg-primary hover:bg-primary/90">
                  <UserPlus className="h-4 w-4" />
                  إضافة مستخدم
                </Button>
              </DialogTrigger>
              <DialogContent dir="rtl" className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {editingUser ? <Edit className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                    {editingUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingUser ? 'تعديل بيانات المستخدم' : 'أدخل بيانات المستخدم الجديد'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>الاسم الكامل</Label>
                    <Input
                      value={userForm.name}
                      onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                      placeholder="أدخل الاسم الكامل"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>اسم المستخدم</Label>
                    <Input
                      value={userForm.username}
                      onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                      placeholder="أدخل اسم المستخدم"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{editingUser ? 'كلمة المرور الجديدة (اتركها فارغة للإبقاء)' : 'كلمة المرور'}</Label>
                    <Input
                      type="password"
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      placeholder={editingUser ? 'اتركها فارغة للإبقاء' : 'أدخل كلمة المرور'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الدور</Label>
                    <Select value={userForm.role} onValueChange={(v) => setUserForm({ ...userForm, role: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="مدير">مدير</SelectItem>
                        <SelectItem value="معاون">معاون</SelectItem>
                        <SelectItem value="موظف تسجيل">موظف تسجيل</SelectItem>
                        <SelectItem value="موظف بوابة">موظف بوابة</SelectItem>
                        <SelectItem value="مدرس">مدرس</SelectItem>
                        <SelectItem value="مسؤول نظام">مسؤول نظام</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>نشط</Label>
                    <Switch
                      checked={userForm.active}
                      onCheckedChange={(checked) => setUserForm({ ...userForm, active: checked })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setUserDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleSaveUser} disabled={savingUser} className="gap-2 bg-primary hover:bg-primary/90">
                    {savingUser ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {editingUser ? 'تحديث' : 'إنشاء'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              {loadingUsers ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 flex-1" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ))}
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">لا يوجد مستخدمون</p>
                  <p className="text-sm text-muted-foreground mt-1">أضف مستخدم جديد للبدء</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الاسم</TableHead>
                        <TableHead>اسم المستخدم</TableHead>
                        <TableHead>الدور</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map(user => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                                {user.name.charAt(0)}
                              </div>
                              <span className="font-medium">{user.name}</span>
                            </div>
                          </TableCell>
                          <TableCell dir="ltr" className="text-muted-foreground">{user.username}</TableCell>
                          <TableCell>
                            <Badge className={`${roleColors[user.role] || 'bg-gray-100 text-gray-800'} gap-1`}>
                              <Shield className="h-3 w-3" />
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={user.active
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-red-100 text-red-800 border-red-300'
                            }>
                              {user.active ? (
                                <><CheckCircle className="h-3 w-3 ml-1" />نشط</>
                              ) : (
                                <><X className="h-3 w-3 ml-1" />معطّل</>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenUserDialog(user)}
                                className="gap-1 text-primary"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteUser(user.id)}
                                className="gap-1 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
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

        {/* ============ NOTICES TAB ============ */}
        <TabsContent value="notices" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">الإشعارات والإعلانات</h3>
            </div>
            <Dialog open={noticeDialogOpen} onOpenChange={setNoticeDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setNoticeForm({ title: '', content: '', type: 'عام' }); setNoticeDialogOpen(true) }} className="gap-2 bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4" />
                  إضافة إعلان
                </Button>
              </DialogTrigger>
              <DialogContent dir="rtl" className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Megaphone className="h-5 w-5" />
                    إضافة إعلان جديد
                  </DialogTitle>
                  <DialogDescription>أدخل تفاصيل الإعلان</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>العنوان</Label>
                    <Input
                      value={noticeForm.title}
                      onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                      placeholder="عنوان الإعلان"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>المحتوى</Label>
                    <Textarea
                      value={noticeForm.content}
                      onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                      placeholder="محتوى الإعلان..."
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>النوع</Label>
                    <Select value={noticeForm.type} onValueChange={(v) => setNoticeForm({ ...noticeForm, type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="عام">عام</SelectItem>
                        <SelectItem value="عاجل">عاجل</SelectItem>
                        <SelectItem value="أكاديمي">أكاديمي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNoticeDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleSaveNotice} disabled={savingNotice} className="gap-2 bg-primary hover:bg-primary/90">
                    {savingNotice ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    نشر الإعلان
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {loadingNotices ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardContent className="p-6 space-y-3">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : notices.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                <Megaphone className="h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="text-lg font-semibold text-muted-foreground">لا توجد إعلانات</h3>
                <p className="text-sm text-muted-foreground mt-1">أضف إعلان جديد للبدء</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {notices.map((notice, index) => (
                  <motion.div
                    key={notice.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`overflow-hidden ${
                      notice.type === 'عاجل' ? 'border-red-300' :
                      notice.type === 'أكاديمي' ? 'border-purple-300' :
                      'border-border'
                    }`}>
                      {notice.type === 'عاجل' && (
                        <div className="h-1 bg-red-500" />
                      )}
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                            noticeTypeColors[notice.type]?.split(' ')[0] || 'bg-gray-100'
                          }`}>
                            {noticeTypeIcons[notice.type] || <Info className="h-5 w-5" />}
                          </div>
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold">{notice.title}</h4>
                              <Badge className={`${noticeTypeColors[notice.type] || 'bg-gray-100 text-gray-800'} text-xs`}>
                                {notice.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notice.content}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>بواسطة: {notice.createdBy}</span>
                              <span>{formatDate(notice.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
