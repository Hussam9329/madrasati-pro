'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Settings, Users, Edit, Trash2, Save, Shield,
  UserPlus, AlertCircle, CheckCircle,
  School, Phone, Mail, MapPin, Clock, User as UserIcon, X, Lightbulb
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { extractApiData, fetchWithAuth } from '@/services/api'
import { EmptyState } from '@/components/ui/empty-state'
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

// ============ TYPES ============
import type { SchoolData, UserData } from '@/types'
import { ROLE_COLORS as roleColors } from '@/lib/constants'

interface SettingsPageProps {
  initialTab?: string;
}

export default function SettingsPage({ initialTab = 'settings' }: SettingsPageProps) {

  // ============ SCHOOL SETTINGS STATE ============
  const [school, setSchool] = useState<SchoolData | null>(null)
  const [loadingSchool, setLoadingSchool] = useState(true)
  const [savingSchool, setSavingSchool] = useState(false)
  // اسم المدرسة والعنوان ثابتان غير قابلين للتغيير
  const FIXED_SCHOOL_NAME = 'ثانوية مارينا'
  const FIXED_SCHOOL_ADDRESS = 'زيونة - الشارع الخدمي لدار الازياء'

  const [schoolForm, setSchoolForm] = useState({
    name: FIXED_SCHOOL_NAME, address: FIXED_SCHOOL_ADDRESS, phone: '', email: '', principalName: '',
    academicYear: '2026-2027', schoolType: 'ثانوية اعتيادية',
    shiftType: 'صباحي', startTime: '08:00', endTime: '13:30',
    lateThreshold: '10', weekendDays: '5,6',
  })

  // ============ USERS STATE ============
  const [users, setUsers] = useState<UserData[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [userForm, setUserForm] = useState({ username: '', name: '', role: 'موظف تسجيل', active: true })
  const [savingUser, setSavingUser] = useState(false)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)

  // ============ FETCH FUNCTIONS ============
  const fetchSchool = useCallback(async () => {
    setLoadingSchool(true)
    try {
      const res = await fetchWithAuth('/api/school')
      if (res.ok) {
        const data = extractApiData(await res.json())
        if (data.school) {
          setSchool(data.school)
          setSchoolForm({
            name: FIXED_SCHOOL_NAME,
            address: FIXED_SCHOOL_ADDRESS,
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
      const res = await fetchWithAuth('/api/users')
      if (res.ok) {
        const data = extractApiData(await res.json())
        setUsers(data)
      }
    } catch {
      console.error('Failed to fetch users')
    } finally {
      setLoadingUsers(false)
    }
  }, [])

  useEffect(() => {
    fetchSchool()
  }, [fetchSchool])

  // ============ SCHOOL SETTINGS HANDLERS ============
  const handleSaveSchool = async () => {
    setSavingSchool(true)
    try {
      const res = await fetchWithAuth('/api/school', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...schoolForm,
          lateThreshold: parseInt(schoolForm.lateThreshold),
        }),
      })

      if (res.ok) {
        toast.success('تم الحفظ', { description: 'تم تحديث بيانات المدرسة بنجاح' })
        fetchSchool()
      } else {
        const data = await res.json()
        toast.error('خطأ', { description: data.error || 'تعذر حفظ الإعدادات. حاول مرة أخرى.' })
      }
    } catch {
      toast.error('خطأ', { description: 'تعذر الاتصال بالخادم. حاول مرة أخرى.' })
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
        name: user.name,
        role: user.role,
        active: user.active,
      })
    } else {
      setEditingUser(null)
      setUserForm({ username: '', name: '', role: 'موظف تسجيل', active: true })
    }
    setUserDialogOpen(true)
  }

  const handleSaveUser = async () => {
    if (!userForm.username || !userForm.name) {
      toast.error('خطأ', { description: 'اسم المستخدم والاسم مطلوبان' })
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
        if (userForm.username !== editingUser.username) body.username = userForm.username

        const res = await fetchWithAuth(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        if (res.ok) {
          toast.success('تم التحديث', { description: 'تم تحديث بيانات المستخدم' })
          setUserDialogOpen(false)
          fetchUsers()
        } else {
          const data = await res.json()
          toast.error('خطأ', { description: data.error })
        }
      } else {
        // Create user
        const res = await fetchWithAuth('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userForm),
        })

        if (res.ok) {
          toast.success('تم الإنشاء', { description: 'تم إنشاء المستخدم بنجاح' })
          setUserDialogOpen(false)
          fetchUsers()
        } else {
          const data = await res.json()
          toast.error('خطأ', { description: data.error })
        }
      }
    } catch {
      toast.error('خطأ', { description: 'تعذر الاتصال بالخادم. حاول مرة أخرى.' })
    } finally {
      setSavingUser(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!deleteUserId) return
    try {
      const res = await fetchWithAuth(`/api/users/${deleteUserId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('تم الحذف', { description: 'تم حذف المستخدم بنجاح' })
        fetchUsers()
      } else {
        const data = await res.json()
        toast.error('خطأ', { description: data.error })
      }
    } catch {
      toast.error('خطأ', { description: 'تعذر حذف المستخدم. حاول مرة أخرى.' })
    } finally {
      setDeleteUserId(null)
    }
  }

  // Format date
  const formatDate = (_dateStr: string) => {
    // Using imported formatDate from @/utils/format
    // but keeping page-specific formatting with time
    try {
      return new Date(_dateStr).toLocaleDateString('ar-IQ', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    } catch {
      return _dateStr
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="hint-card p-3 flex items-start gap-3">
        <Lightbulb className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">الإعدادات</p>
          <p className="text-xs text-blue-600 dark:text-blue-400">من هنا يمكنك تعديل إعدادات المدرسة وإدارة حسابات المستخدمين والصلاحيات.</p>
        </div>
      </div>
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white"
        >
          <Settings className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold">الإعدادات</h1>
      </div>

      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-lg">
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            إعدادات المدرسة
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2" onClick={fetchUsers}>
            <Users className="h-4 w-4" />
            المستخدمون
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
              <Card className="border-0 shadow-sm overflow-hidden">
                <div className="h-1 bg-primary" />
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-teal-100">
                      <School className="h-4 w-4 text-teal-700" />
                    </div>
                    معلومات المدرسة
                  </CardTitle>
                  <CardDescription>البيانات الأساسية للمدرسة</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5 text-gray-700">
                        <School className="h-3.5 w-3.5 text-teal-600" />
                        اسم المدرسة
                        <span className="text-xs text-muted-foreground mr-1">(ثابت)</span>
                      </Label>
                      <Input
                        id="schoolName"
                        name="schoolName"
                        autoComplete="organization"
                        value={schoolForm.name}
                        disabled
                        className="border-gray-200 bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5 text-gray-700">
                        <UserIcon className="h-3.5 w-3.5 text-teal-600" />
                        اسم المدير
                      </Label>
                      <Input
                        id="principalName"
                        name="principalName"
                        autoComplete="name"
                        value={schoolForm.principalName}
                        onChange={(e) => setSchoolForm({ ...schoolForm, principalName: e.target.value })}
                        placeholder="اسم المدير"
                        className="border-gray-200 focus:border-teal-500 focus:ring-teal-500/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5 text-gray-700">
                        <MapPin className="h-3.5 w-3.5 text-teal-600" />
                        العنوان
                        <span className="text-xs text-muted-foreground mr-1">(ثابت)</span>
                      </Label>
                      <Input
                        id="address"
                        name="address"
                        autoComplete="street-address"
                        value={schoolForm.address}
                        disabled
                        className="border-gray-200 bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5 text-gray-700">
                        <Phone className="h-3.5 w-3.5 text-teal-600" />
                        الهاتف
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        autoComplete="tel"
                        value={schoolForm.phone}
                        onChange={(e) => setSchoolForm({ ...schoolForm, phone: e.target.value })}
                        placeholder="رقم الهاتف"
                        dir="ltr"
                        className="border-gray-200 focus:border-teal-500 focus:ring-teal-500/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5 text-gray-700">
                        <Mail className="h-3.5 w-3.5 text-teal-600" />
                        البريد الإلكتروني
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        autoComplete="email"
                        value={schoolForm.email}
                        onChange={(e) => setSchoolForm({ ...schoolForm, email: e.target.value })}
                        placeholder="البريد الإلكتروني"
                        dir="ltr"
                        className="border-gray-200 focus:border-teal-500 focus:ring-teal-500/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5 text-gray-700">
                        <Clock className="h-3.5 w-3.5 text-teal-600" />
                        السنة الدراسية
                      </Label>
                      <Input
                        id="academicYear"
                        name="academicYear"
                        autoComplete="off"
                        value={schoolForm.academicYear}
                        onChange={(e) => setSchoolForm({ ...schoolForm, academicYear: e.target.value })}
                        placeholder="2026-2027"
                        className="border-gray-200 focus:border-teal-500 focus:ring-teal-500/20"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* School Type & Schedule */}
              <Card className="border-0 shadow-sm overflow-hidden">
                <div className="h-1 bg-primary" />
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-100">
                      <Clock className="h-4 w-4 text-emerald-700" />
                    </div>
                    نوع الدوام والمواعيد
                  </CardTitle>
                  <CardDescription>إعدادات الدوام وأوقات الحضور والانصراف</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5 text-gray-700">
                        <School className="h-3.5 w-3.5 text-emerald-600" />
                        نوع المدرسة
                      </Label>
                      <Select value={schoolForm.schoolType} onValueChange={(v) => setSchoolForm({ ...schoolForm, schoolType: v })}>
                        <SelectTrigger id="schoolType">
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
                      <Label className="flex items-center gap-1.5 text-gray-700">
                        <Clock className="h-3.5 w-3.5 text-emerald-600" />
                        نوع الدوام
                      </Label>
                      <Select value={schoolForm.shiftType} onValueChange={(v) => setSchoolForm({ ...schoolForm, shiftType: v })}>
                        <SelectTrigger id="shiftType">
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
                      <Label className="flex items-center gap-1.5 text-gray-700">
                        <Clock className="h-3.5 w-3.5 text-emerald-600" />
                        بداية الدوام
                      </Label>
                      <Input
                        id="startTime"
                        name="startTime"
                        autoComplete="off"
                        type="time"
                        value={schoolForm.startTime}
                        onChange={(e) => setSchoolForm({ ...schoolForm, startTime: e.target.value })}
                        className="border-gray-200 focus:border-teal-500 focus:ring-teal-500/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5 text-gray-700">
                        <Clock className="h-3.5 w-3.5 text-emerald-600" />
                        نهاية الدوام
                      </Label>
                      <Input
                        id="endTime"
                        name="endTime"
                        autoComplete="off"
                        type="time"
                        value={schoolForm.endTime}
                        onChange={(e) => setSchoolForm({ ...schoolForm, endTime: e.target.value })}
                        className="border-gray-200 focus:border-teal-500 focus:ring-teal-500/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5 text-gray-700">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                        حد التأخير (بالدقائق)
                      </Label>
                      <Input
                        id="lateThreshold"
                        name="lateThreshold"
                        autoComplete="off"
                        type="number"
                        min="1"
                        max="60"
                        value={schoolForm.lateThreshold}
                        onChange={(e) => setSchoolForm({ ...schoolForm, lateThreshold: e.target.value })}
                        className="border-gray-200 focus:border-teal-500 focus:ring-teal-500/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>أيام العطلة</Label>
                      <Select
                        value={schoolForm.weekendDays}
                        onValueChange={(v) => setSchoolForm({ ...schoolForm, weekendDays: v })}
                      >
                        <SelectTrigger id="weekendDays">
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
                  className="gap-2 min-w-[160px] bg-primary text-white transition-all duration-200 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
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
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-cyan-100">
                <Users className="h-4 w-4 text-cyan-700" />
              </div>
              <h3 className="text-lg font-bold">إدارة المستخدمين</h3>
            </div>
            <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenUserDialog()} className="gap-2 bg-primary text-white">
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
                      id="userName"
                      name="userName"
                      autoComplete="name"
                      value={userForm.name}
                      onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                      placeholder="أدخل الاسم الكامل"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>اسم المستخدم</Label>
                    <Input
                      id="username"
                      name="username"
                      autoComplete="username"
                      value={userForm.username}
                      onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                      placeholder="أدخل اسم المستخدم"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>الدور</Label>
                    <Select value={userForm.role} onValueChange={(v) => setUserForm({ ...userForm, role: v })}>
                      <SelectTrigger id="userRole">
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

          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="h-1 bg-primary" />
            <CardContent className="p-0 pt-0">
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
                <EmptyState
                  icon={Users}
                  title="لا يوجد مستخدمون"
                  description="أضف مستخدم جديد للبدء في إدارة حسابات النظام والصلاحيات"
                  actionLabel="إضافة مستخدم"
                  onAction={() => handleOpenUserDialog()}
                />
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
                                onClick={() => setDeleteUserId(user.id)}
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

      </Tabs>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف المستخدم</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء وسيتم حذف حساب المستخدم نهائياً من النظام.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
