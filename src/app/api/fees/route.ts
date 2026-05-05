import { NextResponse } from 'next/server'

// ─── Mock Data ───────────────────────────────────────────────────────────────

interface FeeType {
  id: string
  name: string
  amount: number
  frequency: 'شهري' | 'سنوي' | 'مرة واحدة'
  applicableClasses: string[]
}

interface StudentFeeSummary {
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
  method: string
  receiptNumber: string
  notes?: string
}

const feeTypes: FeeType[] = [
  { id: 'ft-1', name: 'رسوم تسجيل', amount: 50000, frequency: 'مرة واحدة', applicableClasses: ['الأول الابتدائي', 'الرابع الإعدادي'] },
  { id: 'ft-2', name: 'رسوم دراسية', amount: 150000, frequency: 'سنوي', applicableClasses: ['الكل'] },
  { id: 'ft-3', name: 'رسوم نقل', amount: 30000, frequency: 'شهري', applicableClasses: ['الكل'] },
  { id: 'ft-4', name: 'رسوم زي', amount: 25000, frequency: 'مرة واحدة', applicableClasses: ['الأول الابتدائي', 'الرابع الإعدادي'] },
  { id: 'ft-5', name: 'رسوم أنشطة', amount: 15000, frequency: 'سنوي', applicableClasses: ['الكل'] },
  { id: 'ft-6', name: 'رسوم امتحانات', amount: 20000, frequency: 'سنوي', applicableClasses: ['السادس الإعدادي', 'التاسع'] },
]

const studentFeeSummaries: StudentFeeSummary[] = [
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

const payments: PaymentRecord[] = [
  { id: 'pr-1', date: '2025-01-15', studentName: 'أحمد محمد علي', amount: 150000, method: 'تحويل بنكي', receiptNumber: 'REC-2025-001', notes: 'دفعة أولى' },
  { id: 'pr-2', date: '2025-01-18', studentName: 'فاطمة حسين جاسم', amount: 90000, method: 'نقدي', receiptNumber: 'REC-2025-002' },
  { id: 'pr-3', date: '2025-01-20', studentName: 'زينب عبدالله محمود', amount: 270000, method: 'شيك', receiptNumber: 'REC-2025-003', notes: 'كامل المبلغ' },
  { id: 'pr-4', date: '2025-02-01', studentName: 'بلال عمار صالح', amount: 150000, method: 'بطاقة', receiptNumber: 'REC-2025-004' },
  { id: 'pr-5', date: '2025-02-03', studentName: 'ثائر وليد رعد', amount: 270000, method: 'تحويل بنكي', receiptNumber: 'REC-2025-005', notes: 'كامل المبلغ' },
]

let paymentCounter = 6

// ─── GET Handler ─────────────────────────────────────────────────────────────

export async function GET() {
  const totalFees = studentFeeSummaries.reduce((sum, s) => sum + s.totalFees, 0)
  const totalPaid = studentFeeSummaries.reduce((sum, s) => sum + s.paid, 0)
  const totalRemaining = studentFeeSummaries.reduce((sum, s) => sum + s.remaining, 0)
  const collectionRate = totalFees > 0 ? Math.round((totalPaid / totalFees) * 100) : 0

  return NextResponse.json({
    feeTypes,
    studentFeeSummaries,
    payments,
    summary: {
      totalFees,
      totalPaid,
      totalRemaining,
      collectionRate,
    },
  })
}

// ─── POST Handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { studentName, amount, method, receiptNumber, notes, date } = body

    if (!studentName || !amount || !receiptNumber) {
      return NextResponse.json(
        { error: 'اسم الطالب والمبلغ ورقم الإيصال مطلوبون' },
        { status: 400 }
      )
    }

    const newPayment: PaymentRecord = {
      id: `pr-${paymentCounter++}`,
      date: date || new Date().toISOString().split('T')[0],
      studentName,
      amount: Number(amount),
      method: method || 'نقدي',
      receiptNumber,
      notes: notes || undefined,
    }

    payments.unshift(newPayment)

    return NextResponse.json({ success: true, payment: newPayment }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 })
  }
}
