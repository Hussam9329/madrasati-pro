'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, DollarSign, CreditCard, CheckCircle, XCircle, AlertTriangle,
  Lightbulb, Info, ChevronLeft, Receipt, Wallet, TrendingUp, Users, Search, Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { EmptyState } from '@/components/ui/empty-state'

// Types
import type { ClassData, FeePlanData, InstallmentData, PaymentData, StudentMinimal as StudentData } from '@/types'

// Status helpers
function getStatusConfig(status: string) {
  switch (status) {
    case 'مدفوع بالكامل': return { color: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300', icon: CheckCircle, label: 'مدفوع' }
    case 'مدفوع جزئياً': return { color: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300', icon: TrendingUp, label: 'جزئي' }
    default: return { color: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300', icon: XCircle, label: 'غير مدفوع' }
  }
}

export default function PaymentsPage() {
  const [classes, setClasses] = useState<ClassData[]>([])
  const [feePlans, setFeePlans] = useState<FeePlanData[]>([])
  const [installments, setInstallments] = useState<InstallmentData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClassId, setSelectedClassId] = useState<string>('')

  // Fee Plan Form
  const [feePlanFormOpen, setFeePlanFormOpen] = useState(false)
  const [feePlanForm, setFeePlanForm] = useState({ name: '', amount: '', dueDate: '', description: '', sortOrder: '0' })
  const [savingFeePlan, setSavingFeePlan] = useState(false)

  // Assign Installments Form
  const [assignFormOpen, setAssignFormOpen] = useState(false)
  const [students, setStudents] = useState<StudentData[]>([])
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [assignDiscountType, setAssignDiscountType] = useState('none')
  const [assignDiscountValue, setAssignDiscountValue] = useState('0')
  const [assignFeePlanId, setAssignFeePlanId] = useState<string>('')
  const [savingAssign, setSavingAssign] = useState(false)

  // Payment Form
  const [paymentFormOpen, setPaymentFormOpen] = useState(false)
  const [paymentInstallment, setPaymentInstallment] = useState<InstallmentData | null>(null)
  const [paymentForm, setPaymentForm] = useState({ amount: '', paymentDate: new Date().toISOString().split('T')[0], paymentMethod: 'نقدي', receiptNumber: '', notes: '' })
  const [savingPayment, setSavingPayment] = useState(false)

  // Delete payment
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null)

  // Filtered data
  const filteredFeePlans = selectedClassId ? feePlans.filter(fp => fp.classId === selectedClassId) : feePlans
  const filteredInstallments = selectedClassId ? installments.filter(i => i.classId === selectedClassId) : installments

  // Summary stats
  const totalExpected = filteredInstallments.reduce((sum, i) => sum + i.totalAmount, 0)
  const totalPaid = filteredInstallments.reduce((sum, i) => sum + i.paidAmount, 0)
  const totalRemaining = filteredInstallments.reduce((sum, i) => sum + i.remainingAmount, 0)
  const paidCount = filteredInstallments.filter(i => i.status === 'مدفوع بالكامل').length
  const partialCount = filteredInstallments.filter(i => i.status === 'مدفوع جزئياً').length
  const unpaidCount = filteredInstallments.filter(i => i.status === 'غير مدفوع').length

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [classesRes, feePlansRes, installmentsRes] = await Promise.all([
        fetch('/api/classes'),
        fetch('/api/fee-plans'),
        fetch('/api/installments'),
      ])
      if (classesRes.ok) setClasses(await classesRes.json())
      if (feePlansRes.ok) setFeePlans(await feePlansRes.json())
      if (installmentsRes.ok) setInstallments(await installmentsRes.json())
    } catch {
      toast.error('خطأ', { description: 'تعذر تحميل البيانات. حاول مرة أخرى.' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Save Fee Plan
  const handleSaveFeePlan = async () => {
    if (!feePlanForm.name.trim()) { toast.error('تنبيه', { description: 'يرجى إدخال اسم القسط' }); return }
    if (!feePlanForm.amount || parseInt(feePlanForm.amount) <= 0) { toast.error('تنبيه', { description: 'يرجى إدخال مبلغ صحيح' }); return }
    if (!selectedClassId) { toast.error('تنبيه', { description: 'يرجى اختيار الصف أولاً' }); return }

    setSavingFeePlan(true)
    try {
      const res = await fetch('/api/fee-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: feePlanForm.name,
          amount: parseInt(feePlanForm.amount),
          classId: selectedClassId,
          dueDate: feePlanForm.dueDate || null,
          description: feePlanForm.description || null,
          sortOrder: parseInt(feePlanForm.sortOrder) || 0,
        }),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error) }
      toast.success('تمت الإضافة', { description: 'تم إضافة خطة الرسوم بنجاح' })
      setFeePlanFormOpen(false)
      setFeePlanForm({ name: '', amount: '', dueDate: '', description: '', sortOrder: '0' })
      fetchData()
    } catch (err) {
      toast.error('خطأ', { description: err instanceof Error ? err.message : 'تعذر الحفظ. حاول مرة أخرى.' })
    } finally { setSavingFeePlan(false) }
  }

  // Open Assign Form
  const openAssignForm = async (feePlanId: string) => {
    setAssignFeePlanId(feePlanId)
    setSelectedStudents([])
    setAssignDiscountType('none')
    setAssignDiscountValue('0')
    // Fetch students for the selected class
    try {
      const params = new URLSearchParams({ limit: '200' })
      if (selectedClassId) params.set('classId', selectedClassId)
      const res = await fetch(`/api/students?${params}`)
      const data = await res.json()
      setStudents(data.students || [])
    } catch { setStudents([]) }
    setAssignFormOpen(true)
  }

  // Assign Installments to Students
  const handleAssignInstallments = async () => {
    if (selectedStudents.length === 0) { toast.error('تنبيه', { description: 'يرجى اختيار طالب واحد على الأقل' }); return }
    if (!assignFeePlanId) { toast.error('تنبيه', { description: 'خطة الرسوم غير محددة' }); return }

    setSavingAssign(true)
    let successCount = 0
    let skipCount = 0
    try {
      for (const studentId of selectedStudents) {
        const res = await fetch('/api/installments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId,
            feePlanId: assignFeePlanId,
            discountType: assignDiscountType,
            discountValue: parseInt(assignDiscountValue) || 0,
          }),
        })
        if (res.ok) successCount++
        else skipCount++
      }
      if (successCount > 0) toast.success('تم التسجيل', { description: `تم تسجيل القسط لـ ${successCount} طالب${skipCount > 0 ? ` (${skipCount} مسجل مسبقاً)` : ''}` })
      else toast.error('تنبيه', { description: 'لم يتم تسجيل أي قسط جديد' })
      setAssignFormOpen(false)
      fetchData()
    } catch {
      toast.error('خطأ', { description: 'تعذر تسجيل الأقساط. حاول مرة أخرى.' })
    } finally { setSavingAssign(false) }
  }

  // Open Payment Form
  const openPaymentForm = (installment: InstallmentData) => {
    setPaymentInstallment(installment)
    setPaymentForm({ amount: String(installment.remainingAmount), paymentDate: new Date().toISOString().split('T')[0], paymentMethod: 'نقدي', receiptNumber: '', notes: '' })
    setPaymentFormOpen(true)
  }

  // Save Payment
  const handleSavePayment = async () => {
    if (!paymentInstallment) return
    if (!paymentForm.amount || parseInt(paymentForm.amount) <= 0) { toast.error('تنبيه', { description: 'يرجى إدخال مبلغ صحيح' }); return }
    if (parseInt(paymentForm.amount) > (paymentInstallment.remainingAmount)) { toast.error('تنبيه', { description: 'المبلغ يتجاوز المتبقي' }); return }
    if (!paymentForm.paymentDate) { toast.error('تنبيه', { description: 'يرجى تحديد تاريخ الدفع' }); return }

    setSavingPayment(true)
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          installmentId: paymentInstallment.id,
          studentId: paymentInstallment.studentId,
          amount: parseInt(paymentForm.amount),
          paymentDate: paymentForm.paymentDate,
          paymentMethod: paymentForm.paymentMethod,
          receiptNumber: paymentForm.receiptNumber || null,
          notes: paymentForm.notes || null,
        }),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error) }
      toast.success('تم التسجيل', { description: `تم تسجيل دفعة بمبلغ ${parseInt(paymentForm.amount).toLocaleString('ar-IQ')} د.ع` })
      setPaymentFormOpen(false)
      fetchData()
    } catch (err) {
      toast.error('خطأ', { description: err instanceof Error ? err.message : 'تعذر تسجيل الدفعة. حاول مرة أخرى.' })
    } finally { setSavingPayment(false) }
  }

  // Delete Payment
  const handleDeletePayment = async () => {
    if (!deletePaymentId) return
    try {
      const res = await fetch(`/api/payments?id=${deletePaymentId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('تم الحذف', { description: 'تم حذف الدفعة بنجاح' })
      fetchData()
    } catch { toast.error('خطأ', { description: 'تعذر حذف الدفعة. حاول مرة أخرى.' }) }
    finally { setDeletePaymentId(null) }
  }

  // Toggle student selection
  const toggleStudent = (id: string) => {
    setSelectedStudents(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Guidance */}
      <div className="hint-card p-3 flex items-start gap-3">
        <Lightbulb className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">نظام الأقساط والدفعات</p>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            المسار: 1) اختر الصف ← 2) أنشئ خطط الرسوم (القسط الأول، الثاني...) ← 3) وزّع الأقساط على الطلاب ← 4) سجّل الدفعات.
            يمكنك تطبيق خصومات فردية لكل طالب.
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg bg-primary">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">الأقساط والدفعات</h2>
            <p className="text-sm text-muted-foreground">إدارة الرسوم والأقساط والدفعات المالية</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setFeePlanFormOpen(true)} className="gap-2 bg-primary" disabled={!selectedClassId}>
            <Plus className="h-4 w-4" />
            إضافة قسط
          </Button>
        </div>
      </div>

      {/* Stats */}
      {!loading && filteredInstallments.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="overflow-hidden border-blue-200 dark:border-blue-800"><div className="h-1 bg-blue-500" />
            <CardContent className="p-3 text-center"><DollarSign className="h-4 w-4 mx-auto text-blue-600 mb-1" /><p className="text-lg font-bold text-blue-700 dark:text-blue-400">{totalExpected.toLocaleString('ar-IQ')}</p><p className="text-xs text-muted-foreground">المطلوب (د.ع)</p></CardContent>
          </Card>
          <Card className="overflow-hidden border-emerald-200 dark:border-emerald-800"><div className="h-1 bg-emerald-500" />
            <CardContent className="p-3 text-center"><CheckCircle className="h-4 w-4 mx-auto text-emerald-600 mb-1" /><p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{totalPaid.toLocaleString('ar-IQ')}</p><p className="text-xs text-muted-foreground">المدفوع (د.ع)</p></CardContent>
          </Card>
          <Card className="overflow-hidden border-red-200 dark:border-red-800"><div className="h-1 bg-red-500" />
            <CardContent className="p-3 text-center"><AlertTriangle className="h-4 w-4 mx-auto text-red-600 mb-1" /><p className="text-lg font-bold text-red-700 dark:text-red-400">{totalRemaining.toLocaleString('ar-IQ')}</p><p className="text-xs text-muted-foreground">المتبقي (د.ع)</p></CardContent>
          </Card>
          <Card className="overflow-hidden border-amber-200 dark:border-amber-800"><div className="h-1 bg-amber-500" />
            <CardContent className="p-3 text-center"><TrendingUp className="h-4 w-4 mx-auto text-amber-600 mb-1" /><p className="text-lg font-bold text-amber-700 dark:text-amber-400">{totalExpected > 0 ? Math.round(totalPaid / totalExpected * 100) : 0}%</p><p className="text-xs text-muted-foreground">نسبة التحصيل</p><Progress value={totalExpected > 0 ? (totalPaid / totalExpected) * 100 : 0} className="mt-1 h-1.5" /></CardContent>
          </Card>
          <Card className="overflow-hidden"><div className="h-1 bg-primary" />
            <CardContent className="p-3 text-center"><Users className="h-4 w-4 mx-auto text-primary mb-1" /><div className="flex justify-center gap-2 mt-1"><Badge className="text-[10px] bg-emerald-100 text-emerald-700">{paidCount} مدفوع</Badge><Badge className="text-[10px] bg-amber-100 text-amber-700">{partialCount} جزئي</Badge><Badge className="text-[10px] bg-red-100 text-red-700">{unpaidCount} غير مدفوع</Badge></div></CardContent>
          </Card>
        </div>
      )}

      {/* Class Selector + Fee Plans */}
      <Card className="overflow-hidden">
        <div className="h-1 bg-primary" />
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-teal-600" />
            خطط الرسوم حسب الصف
          </CardTitle>
          <CardDescription>اختر الصف لعرض وإدارة خطط الرسوم والأقساط</CardDescription>

          {/* Steps */}
          <div className="flex items-center gap-2 mt-3">
            {[
              { num: 1, label: 'اختر الصف', done: !!selectedClassId },
              { num: 2, label: 'أنشئ الأقساط', done: filteredFeePlans.length > 0 },
              { num: 3, label: 'وزّع على الطلاب', done: filteredInstallments.length > 0 },
              { num: 4, label: 'سجّل الدفعات', done: totalPaid > 0 },
            ].map((step, idx) => (
              <div key={step.num} className="flex items-center gap-1.5">
                <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors",
                  step.done ? "bg-emerald-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-500")}>
                  {step.done ? <CheckCircle className="h-3 w-3" /> : step.num}
                </div>
                <span className={cn("text-[10px] font-medium", step.done ? "text-emerald-600" : "text-muted-foreground")}>{step.label}</span>
                {idx < 3 && <ChevronLeft className="h-3 w-3 text-muted-foreground mx-0.5" />}
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {/* Class Select */}
          <div className="space-y-1 mb-4 max-w-md">
            <Label className="text-xs font-medium">الصف</Label>
            {loading ? <Skeleton className="h-10 w-full" /> : (
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger><SelectValue placeholder="اختر الصف" /></SelectTrigger>
                <SelectContent>
                  {classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.name} — {cls.level} {cls.stage}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {!selectedClassId ? (
            <EmptyState
              icon={CreditCard}
              title="اختر صفّاً لعرض وإدارة الأقساط"
            />
          ) : filteredFeePlans.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="لا توجد خطط رسوم لهذا الصف بعد"
              actionLabel="إضافة قسط جديد"
              onAction={() => setFeePlanFormOpen(true)}
            />
          ) : (
            <>
              {/* Fee Plans */}
              <div className="space-y-2 mb-6">
                <p className="text-sm font-medium">خطط الرسوم:</p>
                {filteredFeePlans.map(fp => (
                  <div key={fp.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary font-bold text-sm">{fp.sortOrder + 1}</div>
                      <div>
                        <p className="font-medium text-sm">{fp.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-xs"><DollarSign className="h-3 w-3 ml-1" />{fp.amount.toLocaleString('ar-IQ')} د.ع</Badge>
                          {fp.dueDate && <span className="text-xs text-muted-foreground">استحقاق: {fp.dueDate}</span>}
                          <span className="text-xs text-muted-foreground">{fp._count?.installments || 0} طالب</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => openAssignForm(fp.id)} className="gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      توزيع على الطلاب
                    </Button>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Installments Table */}
              <div>
                <p className="text-sm font-medium mb-3">أقساط الطلاب:</p>
                {filteredInstallments.length === 0 ? (
                  <div className="text-center py-6"><p className="text-sm text-muted-foreground">لم يتم توزيع أقساط بعد. اضغط "توزيع على الطلاب" أعلاه.</p></div>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {filteredInstallments.map(inst => {
                      const statusConfig = getStatusConfig(inst.status)
                      const payPct = inst.totalAmount > 0 ? Math.round(inst.paidAmount / inst.totalAmount * 100) : 0
                      return (
                        <motion.div key={inst.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-lg border hover:shadow-sm transition-all">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{inst.student.fullName}</span>
                              <span className="text-xs text-muted-foreground">({inst.student.studentNumber})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={`${statusConfig.color} gap-1 text-xs`}>
                                <statusConfig.icon className="h-3 w-3" />{statusConfig.label}
                              </Badge>
                              {inst.discountType !== 'none' && (
                                <Badge variant="outline" className="text-xs bg-purple-50 dark:bg-purple-900/10 text-purple-700 dark:text-purple-300">
                                  خصم {inst.discountType === 'percentage' ? `${inst.discountValue}%` : inst.discountType === 'fixed' ? `${inst.discountValue.toLocaleString('ar-IQ')} د.ع` : 'مجاني'}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                            <span>القسط: {inst.feePlan.name}</span>
                            <span>المطلوب: {inst.totalAmount.toLocaleString('ar-IQ')} د.ع</span>
                            <span className="text-emerald-600">المدفوع: {inst.paidAmount.toLocaleString('ar-IQ')}</span>
                            <span className="text-red-600">المتبقي: {inst.remainingAmount.toLocaleString('ar-IQ')}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Progress value={payPct} className="flex-1 h-2" />
                            <span className="text-xs font-medium">{payPct}%</span>
                            {inst.remainingAmount > 0 && (
                              <Button size="sm" variant="outline" className="gap-1 h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50" onClick={() => openPaymentForm(inst)}>
                                <DollarSign className="h-3 w-3" />تسجيل دفعة
                              </Button>
                            )}
                          </div>
                          {/* Show payments */}
                          {inst.payments && inst.payments.length > 0 && (
                            <div className="mt-2 pt-2 border-t space-y-1">
                              <p className="text-[10px] text-muted-foreground">المدفوعات:</p>
                              {inst.payments.map(p => (
                                <div key={p.id} className="flex items-center justify-between text-xs bg-muted/30 px-2 py-1 rounded">
                                  <span>{p.paymentDate} — {p.amount.toLocaleString('ar-IQ')} د.ع ({p.paymentMethod})</span>
                                  <Button size="icon" variant="ghost" className="h-5 w-5 text-destructive" onClick={() => setDeletePaymentId(p.id)}><Trash2 className="h-3 w-3" /></Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Fee Plan Dialog */}
      <Dialog open={feePlanFormOpen} onOpenChange={setFeePlanFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة خطة رسوم جديدة</DialogTitle>
            <DialogDescription>أنشئ قسطاً جديداً (مثل: القسط الأول، القسط الثاني) للصف المحدد</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>اسم القسط *</Label>
              <Input value={feePlanForm.name} onChange={e => setFeePlanForm({ ...feePlanForm, name: e.target.value })} placeholder="مثال: القسط الأول" />
              <p className="text-[11px] text-muted-foreground">أدخل اسم القسط، مثل: القسط الأول، القسط الثاني، دفع كامل</p>
            </div>
            <div className="space-y-1.5">
              <Label>المبلغ (د.ع) *</Label>
              <Input type="number" value={feePlanForm.amount} onChange={e => setFeePlanForm({ ...feePlanForm, amount: e.target.value })} placeholder="مثال: 250000" />
              <p className="text-[11px] text-muted-foreground">المبلغ بالدينار العراقي</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>تاريخ الاستحقاق</Label>
                <Input type="date" value={feePlanForm.dueDate} onChange={e => setFeePlanForm({ ...feePlanForm, dueDate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>الترتيب</Label>
                <Input type="number" value={feePlanForm.sortOrder} onChange={e => setFeePlanForm({ ...feePlanForm, sortOrder: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>وصف (اختياري)</Label>
              <Input value={feePlanForm.description} onChange={e => setFeePlanForm({ ...feePlanForm, description: e.target.value })} placeholder="ملاحظات إضافية" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setFeePlanFormOpen(false)}>إلغاء</Button>
            <Button onClick={handleSaveFeePlan} disabled={savingFeePlan} className="bg-primary">{savingFeePlan ? 'جاري الحفظ...' : 'إضافة'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Installments Dialog */}
      <Dialog open={assignFormOpen} onOpenChange={setAssignFormOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>توزيع القسط على الطلاب</DialogTitle>
            <DialogDescription>اختر الطلاب لتسجيل هذا القسط لهم. يمكنك تطبيق خصم موحد.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Discount */}
            <div className="p-3 rounded-lg bg-muted/30">
              <Label className="text-sm font-medium mb-2 block">الخصم (اختياري)</Label>
              <div className="grid grid-cols-2 gap-3">
                <Select value={assignDiscountType} onValueChange={setAssignDiscountType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون خصم</SelectItem>
                    <SelectItem value="percentage">نسبة مئوية %</SelectItem>
                    <SelectItem value="fixed">مبلغ ثابت</SelectItem>
                    <SelectItem value="free">مجاني</SelectItem>
                  </SelectContent>
                </Select>
                {assignDiscountType !== 'none' && assignDiscountType !== 'free' && (
                  <Input type="number" value={assignDiscountValue} onChange={e => setAssignDiscountValue(e.target.value)} placeholder={assignDiscountType === 'percentage' ? 'النسبة %' : 'المبلغ'} />
                )}
              </div>
            </div>

            {/* Select All */}
            <div className="flex items-center justify-between">
              <Label className="text-sm">اختر الطلاب ({selectedStudents.length} من {students.length})</Label>
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => {
                if (selectedStudents.length === students.length) setSelectedStudents([])
                else setSelectedStudents(students.map(s => s.id))
              }}>
                {selectedStudents.length === students.length ? 'إلغاء الكل' : 'اختيار الكل'}
              </Button>
            </div>

            {/* Students List */}
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {students.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">لا يوجد طلاب في هذا الصف</p>
              ) : (
                students.map(student => (
                  <label key={student.id} className={cn(
                    'flex items-center gap-2 rounded-lg border p-2.5 cursor-pointer transition-colors',
                    selectedStudents.includes(student.id) ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                  )}>
                    <input type="checkbox" checked={selectedStudents.includes(student.id)} onChange={() => toggleStudent(student.id)} className="rounded" />
                    <span className="text-sm">{student.fullName}</span>
                    <span className="text-xs text-muted-foreground mr-auto">{student.studentNumber}</span>
                  </label>
                ))
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setAssignFormOpen(false)}>إلغاء</Button>
            <Button onClick={handleAssignInstallments} disabled={savingAssign} className="bg-primary">
              {savingAssign ? 'جاري التسجيل...' : `تسجيل القسط لـ ${selectedStudents.length} طالب`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentFormOpen} onOpenChange={setPaymentFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تسجيل دفعة</DialogTitle>
            <DialogDescription>
              {paymentInstallment && `تسجيل دفعة لـ ${paymentInstallment.student.fullName} — ${paymentInstallment.feePlan.name}`}
            </DialogDescription>
          </DialogHeader>
          {paymentInstallment && (
            <>
              <div className="p-3 rounded-lg bg-muted/30 text-xs space-y-1">
                <div className="flex justify-between"><span>المطلوب:</span><span className="font-bold">{paymentInstallment.totalAmount.toLocaleString('ar-IQ')} د.ع</span></div>
                <div className="flex justify-between"><span>المدفوع:</span><span className="font-bold text-emerald-600">{paymentInstallment.paidAmount.toLocaleString('ar-IQ')} د.ع</span></div>
                <div className="flex justify-between"><span>المتبقي:</span><span className="font-bold text-red-600">{paymentInstallment.remainingAmount.toLocaleString('ar-IQ')} د.ع</span></div>
              </div>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>مبلغ الدفعة (د.ع) *</Label>
                  <Input type="number" value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} max={paymentInstallment.remainingAmount} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>تاريخ الدفع *</Label>
                    <Input type="date" value={paymentForm.paymentDate} onChange={e => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>طريقة الدفع</Label>
                    <Select value={paymentForm.paymentMethod} onValueChange={v => setPaymentForm({ ...paymentForm, paymentMethod: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="نقدي">نقدي</SelectItem>
                        <SelectItem value="تحويل">تحويل بنكي</SelectItem>
                        <SelectItem value="شيك">شيك</SelectItem>
                        <SelectItem value="أخرى">أخرى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>رقم الوصل (اختياري)</Label>
                  <Input value={paymentForm.receiptNumber} onChange={e => setPaymentForm({ ...paymentForm, receiptNumber: e.target.value })} placeholder="رقم الإيصال" />
                </div>
                <div className="space-y-1.5">
                  <Label>ملاحظات</Label>
                  <Input value={paymentForm.notes} onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })} placeholder="ملاحظات اختيارية" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setPaymentFormOpen(false)}>إلغاء</Button>
                <Button onClick={handleSavePayment} disabled={savingPayment} className="bg-emerald-600 hover:bg-emerald-700 text-white">{savingPayment ? 'جاري التسجيل...' : 'تسجيل الدفعة'}</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Payment Confirmation */}
      <AlertDialog open={!!deletePaymentId} onOpenChange={() => setDeletePaymentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>تأكيد حذف الدفعة</AlertDialogTitle><AlertDialogDescription>هل أنت متأكد؟ سيتم تحديث رصيد القسط تلقائياً.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePayment} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
