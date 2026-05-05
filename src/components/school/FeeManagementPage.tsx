'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Wallet, DollarSign, Plus, Search, CreditCard,
  TrendingUp, Users, CheckCircle2, Clock, AlertTriangle,
  XCircle, Receipt, Calendar, FileText, Banknote,
  ArrowUpRight, ArrowDownRight, Filter, Download
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { exportToCSV } from '@/lib/export-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
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
import { useToast } from '@/hooks/use-toast'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts'

// ─── Types ───────────────────────────────────────────────────────────────────

interface FeeType {
  id: string
  name: string
  amount: number
  frequency: 'شهري' | 'سنوي' | 'مرة واحدة'
  applicableClasses: string[]
}

interface StudentFeeRecord {
  id: string
  studentName: string
  className: string
  totalFees: number
  paid: number
  remaining: number
  status: 'مدفوع' | 'جزئي' | 'متأخر' | 'معفي'
}

interface PaymentRecord {
  id: string
  date: string
  studentName: string
  amount: number
  method: 'نقدي' | 'تحويل بنكي' | 'شيك' | 'بطاقة'
  receiptNumber: string
  notes?: string
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const FEE_TYPES: FeeType[] = [
  { id: 'ft-1', name: 'رسوم تسجيل', amount: 50000, frequency: 'مرة واحدة', applicableClasses: ['الأول الابتدائي', 'الرابع الإعدادي'] },
  { id: 'ft-2', name: 'رسوم دراسية', amount: 150000, frequency: 'سنوي', applicableClasses: ['الكل'] },
  { id: 'ft-3', name: 'رسوم نقل', amount: 30000, frequency: 'شهري', applicableClasses: ['الكل'] },
  { id: 'ft-4', name: 'رسوم زي', amount: 25000, frequency: 'مرة واحدة', applicableClasses: ['الأول الابتدائي', 'الرابع الإعدادي'] },
  { id: 'ft-5', name: 'رسوم أنشطة', amount: 15000, frequency: 'سنوي', applicableClasses: ['الكل'] },
  { id: 'ft-6', name: 'رسوم امتحانات', amount: 20000, frequency: 'سنوي', applicableClasses: ['السادس الإعدادي', 'التاسع'] },
]

const STUDENT_FEE_RECORDS: StudentFeeRecord[] = [
  { id: 'sf-1', studentName: 'أحمد محمد علي', className: 'السادس الإعدادي - علمي', totalFees: 290000, paid: 290000, remaining: 0, status: 'مدفوع' },
  { id: 'sf-2', studentName: 'فاطمة حسين جاسم', className: 'الثالث المتوسط - أ', totalFees: 270000, paid: 180000, remaining: 90000, status: 'جزئي' },
  { id: 'sf-3', studentName: 'عمر ياسر خالد', className: 'الرابع الإعدادي', totalFees: 290000, paid: 0, remaining: 290000, status: 'متأخر' },
  { id: 'sf-4', studentName: 'زينب عبدالله محمود', className: 'الخامس الإعدادي - علمي', totalFees: 270000, paid: 270000, remaining: 0, status: 'مدفوع' },
  { id: 'sf-5', studentName: 'بلال عمار صالح', className: 'الأول الابتدائي', totalFees: 255000, paid: 150000, remaining: 105000, status: 'جزئي' },
  { id: 'sf-6', studentName: 'ثائر وليد رعد', className: 'الثاني المتوسط - ب', totalFees: 270000, paid: 270000, remaining: 0, status: 'مدفوع' },
  { id: 'sf-7', studentName: 'قاسم نبيل صباح', className: 'السادس الإعدادي - أدبي', totalFees: 290000, paid: 50000, remaining: 240000, status: 'متأخر' },
  { id: 'sf-8', studentName: 'مريم كريم حسن', className: 'الرابع الإعدادي', totalFees: 290000, paid: 290000, remaining: 0, status: 'مدفوع' },
  { id: 'sf-9', studentName: 'يوسف طه إبراهيم', className: 'الخامس الإعدادي - علمي', totalFees: 270000, paid: 0, remaining: 270000, status: 'متأخر' },
  { id: 'sf-10', studentName: 'نور سعيد عبد', className: 'الثالث المتوسط - ب', totalFees: 270000, paid: 270000, remaining: 0, status: 'مدفوع' },
  { id: 'sf-11', studentName: 'حسين أحمد محمد', className: 'السادس الإعدادي - علمي', totalFees: 290000, paid: 145000, remaining: 145000, status: 'جزئي' },
  { id: 'sf-12', studentName: 'سارة علي جاسم', className: 'الأول الابتدائي', totalFees: 255000, paid: 255000, remaining: 0, status: 'مدفوع' },
  { id: 'sf-13', studentName: 'محمد عبدالرحمن', className: 'الرابع الإعدادي', totalFees: 290000, paid: 0, remaining: 290000, status: 'معفي' },
  { id: 'sf-14', studentName: 'آية وليد حسن', className: 'الخامس الإعدادي - أدبي', totalFees: 270000, paid: 100000, remaining: 170000, status: 'جزئي' },
  { id: 'sf-15', studentName: 'علي خالد محمود', className: 'الثاني المتوسط - أ', totalFees: 270000, paid: 270000, remaining: 0, status: 'مدفوع' },
  { id: 'sf-16', studentName: 'رنا فادي ناصر', className: 'السادس الإعدادي - أدبي', totalFees: 290000, paid: 60000, remaining: 230000, status: 'متأخر' },
  { id: 'sf-17', studentName: 'حسن محمد سعيد', className: 'الثالث المتوسط - أ', totalFees: 270000, paid: 270000, remaining: 0, status: 'مدفوع' },
  { id: 'sf-18', studentName: 'لينا عادل كريم', className: 'الخامس الإعدادي - علمي', totalFees: 270000, paid: 200000, remaining: 70000, status: 'جزئي' },
  { id: 'sf-19', studentName: 'عبدالله سامي يوسف', className: 'الرابع الإعدادي', totalFees: 290000, paid: 290000, remaining: 0, status: 'مدفوع' },
  { id: 'sf-20', studentName: 'دعاء حسين علي', className: 'الأول الابتدائي', totalFees: 255000, paid: 0, remaining: 255000, status: 'معفي' },
  { id: 'sf-21', studentName: 'كرار أحمد عباس', className: 'السادس الإعدادي - علمي', totalFees: 290000, paid: 250000, remaining: 40000, status: 'جزئي' },
  { id: 'sf-22', studentName: 'زهراء جعفر صادق', className: 'الثالث المتوسط - ب', totalFees: 270000, paid: 270000, remaining: 0, status: 'مدفوع' },
]

const PAYMENT_RECORDS: PaymentRecord[] = [
  { id: 'pr-1', date: '2025-01-15', studentName: 'أحمد محمد علي', amount: 150000, method: 'تحويل بنكي', receiptNumber: 'REC-2025-001', notes: 'دفعة أولى' },
  { id: 'pr-2', date: '2025-01-18', studentName: 'فاطمة حسين جاسم', amount: 90000, method: 'نقدي', receiptNumber: 'REC-2025-002' },
  { id: 'pr-3', date: '2025-01-20', studentName: 'زينب عبدالله محمود', amount: 270000, method: 'شيك', receiptNumber: 'REC-2025-003', notes: 'كامل المبلغ' },
  { id: 'pr-4', date: '2025-02-01', studentName: 'بلال عمار صالح', amount: 150000, method: 'بطاقة', receiptNumber: 'REC-2025-004' },
  { id: 'pr-5', date: '2025-02-03', studentName: 'ثائر وليد رعد', amount: 270000, method: 'تحويل بنكي', receiptNumber: 'REC-2025-005', notes: 'كامل المبلغ' },
  { id: 'pr-6', date: '2025-02-05', studentName: 'مريم كريم حسن', amount: 290000, method: 'نقدي', receiptNumber: 'REC-2025-006' },
  { id: 'pr-7', date: '2025-02-10', studentName: 'نور سعيد عبد', amount: 270000, method: 'تحويل بنكي', receiptNumber: 'REC-2025-007' },
  { id: 'pr-8', date: '2025-02-12', studentName: 'سارة علي جاسم', amount: 255000, method: 'بطاقة', receiptNumber: 'REC-2025-008' },
  { id: 'pr-9', date: '2025-02-15', studentName: 'أحمد محمد علي', amount: 140000, method: 'نقدي', receiptNumber: 'REC-2025-009', notes: 'دفعة ثانية - تكملة' },
  { id: 'pr-10', date: '2025-02-20', studentName: 'علي خالد محمود', amount: 270000, method: 'شيك', receiptNumber: 'REC-2025-010' },
  { id: 'pr-11', date: '2025-03-01', studentName: 'حسن محمد سعيد', amount: 270000, method: 'تحويل بنكي', receiptNumber: 'REC-2025-011' },
  { id: 'pr-12', date: '2025-03-03', studentName: 'عبدالله سامي يوسف', amount: 290000, method: 'نقدي', receiptNumber: 'REC-2025-012' },
  { id: 'pr-13', date: '2025-03-05', studentName: 'قاسم نبيل صباح', amount: 50000, method: 'بطاقة', receiptNumber: 'REC-2025-013', notes: 'دفعة جزئية' },
  { id: 'pr-14', date: '2025-03-08', studentName: 'زهراء جعفر صادق', amount: 270000, method: 'تحويل بنكي', receiptNumber: 'REC-2025-014' },
  { id: 'pr-15', date: '2025-03-10', studentName: 'حسين أحمد محمد', amount: 145000, method: 'نقدي', receiptNumber: 'REC-2025-015' },
  { id: 'pr-16', date: '2025-03-12', studentName: 'لينا عادل كريم', amount: 200000, method: 'شيك', receiptNumber: 'REC-2025-016' },
  { id: 'pr-17', date: '2025-03-15', studentName: 'كرار أحمد عباس', amount: 250000, method: 'تحويل بنكي', receiptNumber: 'REC-2025-017' },
  { id: 'pr-18', date: '2025-03-18', studentName: 'آية وليد حسن', amount: 100000, method: 'نقدي', receiptNumber: 'REC-2025-018' },
  { id: 'pr-19', date: '2025-03-20', studentName: 'فاطمة حسين جاسم', amount: 90000, method: 'بطاقة', receiptNumber: 'REC-2025-019', notes: 'دفعة ثانية' },
]

const MONTHLY_COLLECTION_DATA = [
  { month: 'أيلول', collection: 1850000, target: 2500000 },
  { month: 'تشرين أول', collection: 2100000, target: 2500000 },
  { month: 'تشرين ثاني', collection: 1950000, target: 2500000 },
  { month: 'كانون أول', collection: 1600000, target: 2500000 },
  { month: 'كانون ثاني', collection: 2300000, target: 2500000 },
  { month: 'شباط', collection: 2450000, target: 2500000 },
  { month: 'آذار', collection: 2200000, target: 2500000 },
]

const PAYMENT_METHOD_DATA = [
  { name: 'نقدي', value: 35, color: '#0d9488' },
  { name: 'تحويل بنكي', value: 30, color: '#059669' },
  { name: 'شيك', value: 15, color: '#f59e0b' },
  { name: 'بطاقة', value: 20, color: '#06b6d4' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatIQD(amount: number): string {
  return amount.toLocaleString('ar-IQ') + ' د.ع'
}

function formatDateAr(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ar-IQ', { year: 'numeric', month: 'short', day: 'numeric' })
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  'مدفوع': { color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700', icon: CheckCircle2 },
  'جزئي': { color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700', icon: Clock },
  'متأخر': { color: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-700', icon: AlertTriangle },
  'معفي': { color: 'text-sky-700 dark:text-sky-400', bg: 'bg-sky-100 dark:bg-sky-900/30 border-sky-200 dark:border-sky-700', icon: XCircle },
}

const FREQUENCY_COLORS: Record<string, string> = {
  'شهري': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700',
  'سنوي': 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-700',
  'مرة واحدة': 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700',
}

const METHOD_COLORS: Record<string, string> = {
  'نقدي': 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700',
  'تحويل بنكي': 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-700',
  'شيك': 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700',
  'بطاقة': 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-700',
}

// ─── Animation Variants ──────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 }
}

// ─── Custom Tooltip for BarChart ─────────────────────────────────────────────

function CollectionTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload) return null
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg text-xs">
      <p className="font-bold mb-2 text-gray-800 dark:text-gray-200">{label}</p>
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center gap-2 mb-1">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-600 dark:text-gray-400">{entry.name}:</span>
          <span className="font-semibold text-gray-800 dark:text-gray-200">{formatIQD(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

function PieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { fill: string } }> }) {
  if (!active || !payload || !payload[0]) return null
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg text-xs">
      <p className="font-semibold text-gray-800 dark:text-gray-200">{payload[0].name}</p>
      <p className="text-gray-600 dark:text-gray-400">{payload[0].value}%</p>
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function FeeManagementPage() {
  const { toast } = useToast()
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>(PAYMENT_RECORDS)
  const [addPaymentOpen, setAddPaymentOpen] = useState(false)
  const [addFeeTypeOpen, setAddFeeTypeOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [saving, setSaving] = useState(false)
  const [paymentSearchQuery, setPaymentSearchQuery] = useState('')

  // Payment form
  const [paymentForm, setPaymentForm] = useState({
    studentName: '',
    amount: '',
    method: 'نقدي' as 'نقدي' | 'تحويل بنكي' | 'شيك' | 'بطاقة',
    receiptNumber: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
  })

  // Fee type form
  const [feeTypeForm, setFeeTypeForm] = useState({
    name: '',
    amount: '',
    frequency: 'سنوي' as 'شهري' | 'سنوي' | 'مرة واحدة',
    applicableClasses: 'الكل',
  })

  // Summary calculations
  const totalFees = STUDENT_FEE_RECORDS.reduce((sum, s) => sum + s.totalFees, 0)
  const totalPaid = STUDENT_FEE_RECORDS.reduce((sum, s) => sum + s.paid, 0)
  const totalRemaining = STUDENT_FEE_RECORDS.reduce((sum, s) => sum + s.remaining, 0)
  const collectionRate = totalFees > 0 ? Math.round((totalPaid / totalFees) * 100) : 0

  // Filtered student records
  const filteredRecords = useMemo(() => {
    return STUDENT_FEE_RECORDS.filter(r => {
      if (filterStatus !== 'all' && r.status !== filterStatus) return false
      if (searchQuery && !r.studentName.includes(searchQuery) && !r.className.includes(searchQuery)) return false
      return true
    })
  }, [searchQuery, filterStatus])

  // Filtered payment records
  const filteredPaymentRecords = useMemo(() => {
    if (!paymentSearchQuery) return paymentRecords
    return paymentRecords.filter(p =>
      p.studentName.includes(paymentSearchQuery) ||
      p.receiptNumber.includes(paymentSearchQuery) ||
      (p.notes && p.notes.includes(paymentSearchQuery))
    )
  }, [paymentRecords, paymentSearchQuery])

  // Summary cards data
  const summaryCards = [
    { title: 'إجمالي الرسوم', value: formatIQD(totalFees), icon: DollarSign, gradient: 'from-teal-500 to-teal-600', bgColor: 'bg-teal-50 dark:bg-teal-950/20', borderColor: 'border-teal-200 dark:border-teal-800', iconBg: 'bg-teal-100 dark:bg-teal-900/40', iconColor: 'text-teal-600 dark:text-teal-400', valueColor: 'text-teal-700 dark:text-teal-300', stripGradient: 'linear-gradient(90deg, #0d9488, #14b8a6)' },
    { title: 'المدفوع', value: formatIQD(totalPaid), icon: CheckCircle2, gradient: 'from-emerald-500 to-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-950/20', borderColor: 'border-emerald-200 dark:border-emerald-800', iconBg: 'bg-emerald-100 dark:bg-emerald-900/40', iconColor: 'text-emerald-600 dark:text-emerald-400', valueColor: 'text-emerald-700 dark:text-emerald-300', stripGradient: 'linear-gradient(90deg, #059669, #10b981)', trend: <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" /> },
    { title: 'المتبقي', value: formatIQD(totalRemaining), icon: Clock, gradient: 'from-amber-500 to-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-950/20', borderColor: 'border-amber-200 dark:border-amber-800', iconBg: 'bg-amber-100 dark:bg-amber-900/40', iconColor: 'text-amber-600 dark:text-amber-400', valueColor: 'text-amber-700 dark:text-amber-300', stripGradient: 'linear-gradient(90deg, #d97706, #f59e0b)', trend: <ArrowDownRight className="h-3.5 w-3.5 text-amber-500" /> },
    { title: 'نسبة التحصيل', value: `${collectionRate}%`, icon: TrendingUp, gradient: 'from-cyan-500 to-cyan-600', bgColor: 'bg-cyan-50 dark:bg-cyan-950/20', borderColor: 'border-cyan-200 dark:border-cyan-800', iconBg: 'bg-cyan-100 dark:bg-cyan-900/40', iconColor: 'text-cyan-600 dark:text-cyan-400', valueColor: 'text-cyan-700 dark:text-cyan-300', stripGradient: 'linear-gradient(90deg, #06b6d4, #22d3ee)', progress: collectionRate },
  ]

  // Handle add payment
  const handleAddPayment = async () => {
    if (!paymentForm.studentName || !paymentForm.amount || !paymentForm.receiptNumber) {
      toast({ title: 'تنبيه', description: 'يرجى تعبئة جميع الحقول المطلوبة', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentForm),
      })
      if (!res.ok) throw new Error()

      const newPayment: PaymentRecord = {
        id: `pr-${Date.now()}`,
        date: paymentForm.date,
        studentName: paymentForm.studentName,
        amount: Number(paymentForm.amount),
        method: paymentForm.method,
        receiptNumber: paymentForm.receiptNumber,
        notes: paymentForm.notes || undefined,
      }
      setPaymentRecords(prev => [newPayment, ...prev])
      toast({ title: 'تمت الإضافة', description: 'تم تسجيل الدفعة بنجاح' })
      setAddPaymentOpen(false)
      setPaymentForm({
        studentName: '',
        amount: '',
        method: 'نقدي',
        receiptNumber: '',
        notes: '',
        date: new Date().toISOString().split('T')[0],
      })
    } catch {
      toast({ title: 'خطأ', description: 'فشل في تسجيل الدفعة', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // Handle add fee type
  const handleAddFeeType = () => {
    if (!feeTypeForm.name || !feeTypeForm.amount) {
      toast({ title: 'تنبيه', description: 'يرجى تعبئة اسم الرسم والمبلغ', variant: 'destructive' })
      return
    }
    toast({ title: 'تمت الإضافة', description: `تم إضافة "${feeTypeForm.name}" بنجاح` })
    setAddFeeTypeOpen(false)
    setFeeTypeForm({ name: '', amount: '', frequency: 'سنوي', applicableClasses: 'الكل' })
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
            <Wallet className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold dark:text-gray-200">الرسوم المدرسية</h1>
            <p className="text-sm text-muted-foreground">إدارة الرسوم والمدفوعات المدرسية</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-xs border-teal-200 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-900/20"
            onClick={() => {
              const csvData = filteredRecords.map(r => ({
                'الطالب': r.studentName,
                'الصف': r.className,
                'إجمالي الرسوم': r.totalFees,
                'المدفوع': r.paid,
                'المتبقي': r.remaining,
                'الحالة': r.status,
              }))
              exportToCSV(csvData, 'الرسوم_المدرسية')
            }}
          >
            <Download className="h-3.5 w-3.5" />
            تصدير التقرير
          </Button>
          <Button
            onClick={() => setAddPaymentOpen(true)}
            className="gap-2"
            style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}
          >
            <Plus className="h-4 w-4" />
            تسجيل دفعة
          </Button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.title} className={cn('overflow-hidden relative', card.bgColor, card.borderColor)}>
            <div className="absolute top-0 right-0 left-0 h-1" style={{ background: card.stripGradient }} />
            <CardContent className="p-4 flex items-center gap-4">
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', card.iconBg)}>
                <card.icon className={cn('h-6 w-6', card.iconColor)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{card.title}</p>
                <div className="flex items-center gap-1.5">
                  <p className={cn('text-lg font-bold', card.valueColor)}>{card.value}</p>
                  {'trend' in card && card.trend}
                </div>
                {'progress' in card && card.progress !== undefined && (
                  <Progress value={card.progress} className="h-1.5 mt-1.5" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Fee Types Section */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden dark:bg-gray-900/50 dark:border-gray-700">
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #0d9488, #059669)' }} />
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base dark:text-gray-200">
                <Receipt className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                أنواع الرسوم
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs border-teal-200 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-900/20 text-teal-700 dark:text-teal-400"
                onClick={() => setAddFeeTypeOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                إضافة رسم
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {FEE_TYPES.map((fee) => (
                <motion.div
                  key={fee.id}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -2, boxShadow: '0 8px 25px -5px rgba(13, 148, 136, 0.15)' }}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all bg-white dark:bg-gray-800/50 relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 left-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(90deg, #0d9488, #059669)' }} />
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                      </div>
                      <span className="font-bold text-sm dark:text-gray-200">{fee.name}</span>
                    </div>
                    <Badge variant="outline" className={cn('text-[10px]', FREQUENCY_COLORS[fee.frequency])}>
                      {fee.frequency}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={cn(
                      'w-2 h-2 rounded-full shrink-0',
                      fee.frequency === 'شهري' ? 'bg-blue-500' : fee.frequency === 'سنوي' ? 'bg-teal-500' : 'bg-purple-500'
                    )} />
                    <p className="text-lg font-bold text-teal-700 dark:text-teal-300">{formatIQD(fee.amount)}</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground dark:text-gray-400">
                    الصفوف: {fee.applicableClasses.join('، ')}
                  </p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Student Payments Tabs */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden dark:bg-gray-900/50 dark:border-gray-700">
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #0d9488, #059669)' }} />
          <CardContent className="p-0">
            <Tabs defaultValue="fees" className="w-full">
              <div className="px-4 pt-4 pb-0">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="fees" className="gap-1.5 text-xs">
                    <FileText className="h-3.5 w-3.5" />
                    الرسوم
                  </TabsTrigger>
                  <TabsTrigger value="payments" className="gap-1.5 text-xs">
                    <CreditCard className="h-3.5 w-3.5" />
                    المدفوعات
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Fees Tab */}
              <TabsContent value="fees" className="p-4 pt-3">
                {/* Filters + Export */}
                <div className="flex flex-wrap gap-3 mb-4 items-center">
                  <div className="flex-1 min-w-[200px] relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="بحث باسم الطالب أو الصف..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-9"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[160px]">
                      <Filter className="h-3.5 w-3.5 ml-2" />
                      <SelectValue placeholder="الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الحالات</SelectItem>
                      <SelectItem value="مدفوع">مدفوع</SelectItem>
                      <SelectItem value="جزئي">جزئي</SelectItem>
                      <SelectItem value="متأخر">متأخر</SelectItem>
                      <SelectItem value="معفي">معفي</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400"
                    onClick={() => {
                      const csvData = filteredRecords.map(r => ({
                        'الطالب': r.studentName,
                        'الصف': r.className,
                        'إجمالي الرسوم': r.totalFees,
                        'المدفوع': r.paid,
                        'المتبقي': r.remaining,
                        'الحالة': r.status,
                      }))
                      exportToCSV(csvData, 'رسوم_الطلاب')
                    }}
                  >
                    <Download className="h-3.5 w-3.5" />
                    تصدير
                  </Button>
                </div>

                {/* Status summary row */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {(['مدفوع', 'جزئي', 'متأخر', 'معفي'] as const).map((status) => {
                    const count = STUDENT_FEE_RECORDS.filter(s => s.status === status).length
                    const config = STATUS_CONFIG[status]
                    const Icon = config.icon
                    return (
                      <div key={status} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium', config.bg, config.color)}>
                        <Icon className="h-3 w-3" />
                        {status}: {count}
                      </div>
                    )
                  })}
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                        <TableHead>الطالب</TableHead>
                        <TableHead className="text-center">الصف</TableHead>
                        <TableHead className="text-center">إجمالي الرسوم</TableHead>
                        <TableHead className="text-center">المدفوع</TableHead>
                        <TableHead className="text-center">المتبقي</TableHead>
                        <TableHead className="text-center">الحالة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map((record, idx) => {
                        const config = STATUS_CONFIG[record.status]
                        const StatusIcon = config.icon
                        const paidPercent = record.totalFees > 0 ? Math.round((record.paid / record.totalFees) * 100) : 0
                        return (
                          <motion.tr
                            key={record.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.02 }}
                            className={cn(
                              'hover:bg-muted/50 dark:hover:bg-gray-800/50 border-b transition-colors',
                              record.status === 'متأخر' && 'bg-red-50/30 dark:bg-red-900/5'
                            )}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm',
                                  record.status === 'مدفوع' ? 'bg-emerald-500' :
                                  record.status === 'جزئي' ? 'bg-amber-500' :
                                  record.status === 'متأخر' ? 'bg-red-500' : 'bg-sky-500'
                                )}>
                                  {record.studentName.charAt(0)}
                                </div>
                                <span className="font-medium text-sm dark:text-gray-200">{record.studentName}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center text-xs text-muted-foreground dark:text-gray-400">{record.className}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <div className={cn(
                                  'w-1.5 h-1.5 rounded-full',
                                  record.status === 'مدفوع' ? 'bg-emerald-500' :
                                  record.status === 'جزئي' ? 'bg-amber-500' :
                                  record.status === 'متأخر' ? 'bg-red-500' : 'bg-sky-500'
                                )} />
                                <span className="text-sm font-semibold dark:text-gray-200">{formatIQD(record.totalFees)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div>
                                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{formatIQD(record.paid)}</span>
                                <div className="w-16 mx-auto mt-1">
                                  <Progress value={paidPercent} className="h-1" />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center text-sm font-semibold text-red-600 dark:text-red-400">{formatIQD(record.remaining)}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className={cn('text-[10px] gap-1', config.bg, config.color)}>
                                <StatusIcon className="h-3 w-3" />
                                {record.status}
                              </Badge>
                            </TableCell>
                          </motion.tr>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
                {filteredRecords.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Users className="h-10 w-10 mb-3 opacity-30" />
                    <p className="text-sm font-medium">لا توجد نتائج</p>
                    <p className="text-xs">حاول تعديل معايير البحث</p>
                  </div>
                )}
              </TabsContent>

              {/* Payments Tab */}
              <TabsContent value="payments" className="p-4 pt-3">
                {/* Search + Export */}
                <div className="flex flex-wrap gap-3 mb-4 items-center">
                  <div className="flex-1 min-w-[200px] relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="بحث في المدفوعات..."
                      value={paymentSearchQuery}
                      onChange={(e) => setPaymentSearchQuery(e.target.value)}
                      className="pr-9"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400"
                    onClick={() => {
                      const csvData = filteredPaymentRecords.map(p => ({
                        'التاريخ': p.date,
                        'الطالب': p.studentName,
                        'المبلغ': p.amount,
                        'طريقة الدفع': p.method,
                        'رقم الإيصال': p.receiptNumber,
                        'ملاحظات': p.notes || '',
                      }))
                      exportToCSV(csvData, 'المدفوعات')
                    }}
                  >
                    <Download className="h-3.5 w-3.5" />
                    تصدير
                  </Button>
                </div>
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                        <TableHead>التاريخ</TableHead>
                        <TableHead>الطالب</TableHead>
                        <TableHead className="text-center">المبلغ</TableHead>
                        <TableHead className="text-center">طريقة الدفع</TableHead>
                        <TableHead className="text-center">رقم الإيصال</TableHead>
                        <TableHead>ملاحظات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPaymentRecords.map((payment, idx) => (
                        <motion.tr
                          key={payment.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.015 }}
                          className="hover:bg-muted/50 border-b transition-colors"
                        >
                          <TableCell className="text-xs">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              {formatDateAr(payment.date)}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-medium">{payment.studentName}</TableCell>
                          <TableCell className="text-center text-sm font-semibold text-teal-700 dark:text-teal-300">{formatIQD(payment.amount)}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={cn('text-[10px] gap-1', METHOD_COLORS[payment.method])}>
                              {payment.method === 'نقدي' && <Banknote className="h-3 w-3" />}
                              {payment.method === 'تحويل بنكي' && <CreditCard className="h-3 w-3" />}
                              {payment.method === 'شيك' && <FileText className="h-3 w-3" />}
                              {payment.method === 'بطاقة' && <CreditCard className="h-3 w-3" />}
                              {payment.method}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center text-xs font-mono" dir="ltr">{payment.receiptNumber}</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">{payment.notes || '—'}</TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      {/* Payment Statistics Visual */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar Chart - Monthly Collection */}
        <Card className="lg:col-span-2 overflow-hidden dark:bg-gray-900/50 dark:border-gray-700">
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #0d9488, #059669)' }} />
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base dark:text-gray-200">
              <TrendingUp className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              التحصيل الشهري
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MONTHLY_COLLECTION_DATA} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `${(v / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip content={<CollectionTooltip />} />
                  <Legend
                    formatter={(value: string) => <span className="text-xs text-muted-foreground">{value}</span>}
                  />
                  <Bar dataKey="collection" name="المحصل" fill="#0d9488" radius={[4, 4, 0, 0]} barSize={28} />
                  <Bar dataKey="target" name="المستهدف" fill="#d1d5db" radius={[4, 4, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart - Payment Method Distribution */}
        <Card className="overflow-hidden dark:bg-gray-900/50 dark:border-gray-700">
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #06b6d4, #0d9488)' }} />
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              طرق الدفع
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={PAYMENT_METHOD_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {PAYMENT_METHOD_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {PAYMENT_METHOD_DATA.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[11px] text-muted-foreground">{item.name} ({item.value}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Add Payment Dialog */}
      <Dialog open={addPaymentOpen} onOpenChange={setAddPaymentOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              تسجيل دفعة جديدة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>اسم الطالب *</Label>
              <Select value={paymentForm.studentName} onValueChange={(v) => setPaymentForm({ ...paymentForm, studentName: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الطالب" />
                </SelectTrigger>
                <SelectContent>
                  {STUDENT_FEE_RECORDS.map(s => (
                    <SelectItem key={s.id} value={s.studentName}>{s.studentName} - {s.className}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>المبلغ (د.ع) *</Label>
              <Input
                type="number"
                placeholder="أدخل المبلغ"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              />
            </div>
            <div>
              <Label>طريقة الدفع *</Label>
              <Select value={paymentForm.method} onValueChange={(v) => setPaymentForm({ ...paymentForm, method: v as typeof paymentForm.method })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="نقدي">نقدي</SelectItem>
                  <SelectItem value="تحويل بنكي">تحويل بنكي</SelectItem>
                  <SelectItem value="شيك">شيك</SelectItem>
                  <SelectItem value="بطاقة">بطاقة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>رقم الإيصال *</Label>
              <Input
                placeholder="مثال: REC-2025-020"
                value={paymentForm.receiptNumber}
                onChange={(e) => setPaymentForm({ ...paymentForm, receiptNumber: e.target.value })}
                dir="ltr"
              />
            </div>
            <div>
              <Label>التاريخ</Label>
              <Input
                type="date"
                value={paymentForm.date}
                onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
              />
            </div>
            <div>
              <Label>ملاحظات</Label>
              <Textarea
                placeholder="ملاحظات إضافية..."
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setAddPaymentOpen(false)}>إلغاء</Button>
            <Button onClick={handleAddPayment} disabled={saving} style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}>
              {saving ? 'جاري الحفظ...' : 'تسجيل الدفعة'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Fee Type Dialog */}
      <Dialog open={addFeeTypeOpen} onOpenChange={setAddFeeTypeOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              إضافة نوع رسم جديد
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>اسم الرسم *</Label>
              <Input
                placeholder="مثال: رسوم مختبر"
                value={feeTypeForm.name}
                onChange={(e) => setFeeTypeForm({ ...feeTypeForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label>المبلغ (د.ع) *</Label>
              <Input
                type="number"
                placeholder="أدخل المبلغ"
                value={feeTypeForm.amount}
                onChange={(e) => setFeeTypeForm({ ...feeTypeForm, amount: e.target.value })}
              />
            </div>
            <div>
              <Label>التكرار</Label>
              <Select value={feeTypeForm.frequency} onValueChange={(v) => setFeeTypeForm({ ...feeTypeForm, frequency: v as typeof feeTypeForm.frequency })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="شهري">شهري</SelectItem>
                  <SelectItem value="سنوي">سنوي</SelectItem>
                  <SelectItem value="مرة واحدة">مرة واحدة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>الصفوف المطبق عليها</Label>
              <Input
                placeholder="الكل أو اسم الصف"
                value={feeTypeForm.applicableClasses}
                onChange={(e) => setFeeTypeForm({ ...feeTypeForm, applicableClasses: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setAddFeeTypeOpen(false)}>إلغاء</Button>
            <Button onClick={handleAddFeeType} style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}>
              إضافة الرسم
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
