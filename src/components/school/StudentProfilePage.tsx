'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';
import {
  Printer,
  Download,
  MessageSquare,
  ArrowRightLeft,
  Edit,
  User,
  Calendar,
  Phone,
  MapPin,
  CreditCard,
  BookOpen,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Shield,
  GraduationCap,
  TrendingUp,
  Wallet,
  Activity,
  ChevronLeft,
  UserCircle,
  Star,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';

interface StudentProfile {
  id: string;
  studentNumber: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  nationalId: string;
  phone: string;
  address: string;
  status: string;
  qrCode: string;
  classId: string;
  sectionId: string;
  className: string;
  sectionName: string;
  guardianName: string;
  guardianPhone: string;
  guardianRelation: string;
  attendance: {
    present: number;
    absent: number;
    late: number;
    excused: number;
    total: number;
    percentage: number;
    monthly: Array<{ month: string; percentage: number }>;
  };
  grades: {
    average: number;
    rank: number;
    totalStudents: number;
    passCount: number;
    failCount: number;
    subjects: Array<{ name: string; score: number; maxScore: number; grade: string }>;
  };
  payment: {
    totalFees: number;
    paid: number;
    remaining: number;
    status: string;
    lastPaymentDate: string;
    lastPaymentAmount: number;
  };
  activities: Array<{ id: string; type: string; message: string; date: string; icon: string }>;
}

interface StudentProfilePageProps {
  studentId?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// Circular Progress Ring SVG component
function CircularProgressRing({
  percentage,
  size = 120,
  strokeWidth = 10,
  color = '#0d9488',
  label,
  sublabel,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label: string;
  sublabel?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-2xl font-bold" style={{ color }}>{percentage}%</span>
        {sublabel && <span className="text-[10px] text-muted-foreground">{sublabel}</span>}
      </div>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

// Subject grade bar component
function SubjectGradeBar({ name, score, maxScore, grade }: { name: string; score: number; maxScore: number; grade: string }) {
  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
  const barColor =
    percentage >= 80 ? 'from-teal-400 to-emerald-500' :
    percentage >= 60 ? 'from-amber-400 to-amber-500' :
    'from-red-400 to-red-500';
  const textColor =
    percentage >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
    percentage >= 60 ? 'text-amber-600 dark:text-amber-400' :
    'text-red-600 dark:text-red-400';

  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-sm font-medium w-32 truncate dark:text-gray-300">{name}</span>
      <div className="flex-1 h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={cn('h-full rounded-full bg-gradient-to-l', barColor)}
        />
      </div>
      <span className={cn('text-sm font-bold w-12 text-left', textColor)}>{score}</span>
      <Badge variant="outline" className={cn(
        'text-[10px] h-5 border-0',
        percentage >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
        percentage >= 60 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      )}>
        {grade}
      </Badge>
    </div>
  );
}

// Activity timeline item component
function ActivityItem({ activity, index }: { activity: StudentProfile['activities'][0]; index: number }) {
  const iconMap: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    check: { icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    grade: { icon: FileText, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    clock: { icon: Clock, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' },
    wallet: { icon: Wallet, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-900/30' },
    alert: { icon: AlertCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
  };
  const config = iconMap[activity.icon] || iconMap.check;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex gap-3 relative"
    >
      {index < 4 && (
        <div className="absolute right-[15px] top-9 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
      )}
      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10', config.bg)}>
        <Icon className={cn('w-4 h-4', config.color)} />
      </div>
      <div className="flex-1 pb-4">
        <p className="text-sm dark:text-gray-200">{activity.message}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{activity.date}</p>
      </div>
    </motion.div>
  );
}

export default function StudentProfilePage({ studentId }: StudentProfilePageProps) {
  const { setActivePage, setSelectedStudentId } = useAppStore();
  const { toast } = useToast();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch student data from API
  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    const fetchStudentProfile = async () => {
      try {
        setLoading(true);
        // Fetch basic student info
        const studentRes = await fetch(`/api/students/${studentId}`);
        if (!studentRes.ok) throw new Error('فشل جلب بيانات الطالب');
        const studentData = await studentRes.json();

        // Fetch attendance for this student
        const attendanceRes = await fetch(`/api/attendance?studentId=${studentId}&limit=999`);
        const attendanceData = attendanceRes.ok ? await attendanceRes.json() : { records: [] };
        const records = attendanceData.records || attendanceData || [];

        // Calculate attendance stats
        const presentCount = records.filter((r: any) => r.status === 'حاضر').length;
        const absentCount = records.filter((r: any) => r.status === 'غائب').length;
        const lateCount = records.filter((r: any) => r.status === 'متأخر').length;
        const excusedCount = records.filter((r: any) => r.status === 'مستأذن').length;
        const totalCount = records.length;
        const attPercentage = totalCount > 0 ? Math.round(((presentCount + lateCount) / totalCount) * 100) : 0;

        // Calculate monthly attendance (last 3 months)
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const monthlyAttendance: Array<{ month: string; percentage: number }> = [];
        for (let m = 2; m >= 0; m--) {
          const d = new Date();
          d.setMonth(d.getMonth() - m);
          const monthStr = d.toISOString().slice(0, 7); // YYYY-MM
          const monthRecords = records.filter((r: any) => r.date && r.date.startsWith(monthStr));
          const mPresent = monthRecords.filter((r: any) => r.status === 'حاضر' || r.status === 'متأخر').length;
          const mTotal = monthRecords.length;
          monthlyAttendance.push({
            month: monthNames[d.getMonth()],
            percentage: mTotal > 0 ? Math.round((mPresent / mTotal) * 100) : 0,
          });
        }

        // Fetch grades for this student
        const gradesRes = await fetch(`/api/grades?studentId=${studentId}`);
        const gradesData = gradesRes.ok ? await gradesRes.json() : [];
        const studentGrades = Array.isArray(gradesData) ? gradesData : (gradesData.grades || []);

        // Calculate grade stats
        const validGrades = studentGrades.filter((g: any) => g.score !== null && g.score !== undefined);
        const totalScore = validGrades.reduce((sum: number, g: any) => sum + (g.score || 0), 0);
        const totalMax = validGrades.reduce((sum: number, g: any) => sum + (g.maxScore || 100), 0);
        const avgGrade = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

        // Group grades by subject
        const subjectMap = new Map<string, { name: string; score: number; maxScore: number }>();
        for (const g of validGrades) {
          const subjectName = g.subject?.name || g.subjectName || 'غير محدد';
          const existing = subjectMap.get(subjectName);
          if (existing) {
            existing.score += g.score || 0;
            existing.maxScore += g.maxScore || 100;
          } else {
            subjectMap.set(subjectName, { name: subjectName, score: g.score || 0, maxScore: g.maxScore || 100 });
          }
        }

        const gradeLabel = (pct: number) =>
          pct >= 90 ? 'ممتاز' : pct >= 80 ? 'جيد جداً' : pct >= 70 ? 'جيد' : pct >= 50 ? 'مقبول' : 'راسب';

        const subjectsList = Array.from(subjectMap.values()).map(s => ({
          name: s.name,
          score: s.score,
          maxScore: s.maxScore,
          grade: gradeLabel(s.maxScore > 0 ? (s.score / s.maxScore) * 100 : 0),
        }));

        // Fetch payment/installment info
        const installRes = await fetch(`/api/installments?studentId=${studentId}`);
        const installData = installRes.ok ? await installRes.json() : [];
        const installments = Array.isArray(installData) ? installData : (installData.installments || []);

        const totalFees = installments.reduce((sum: number, i: any) => sum + (i.totalAmount || 0), 0);
        const paidAmount = installments.reduce((sum: number, i: any) => sum + (i.paidAmount || 0), 0);
        const remainingAmount = installments.reduce((sum: number, i: any) => sum + (i.remainingAmount || 0), 0);
        const paymentStatus = totalFees === 0 ? 'غير محدد' :
          remainingAmount <= 0 ? 'مدفوع' :
          paidAmount > 0 ? 'جزئي' : 'غير مدفوع';

        // Get last payment
        const payRes = await fetch(`/api/payments?studentId=${studentId}&limit=1`);
        const payData = payRes.ok ? await payRes.json() : [];
        const payments = Array.isArray(payData) ? payData : (payData.payments || []);
        const lastPayment = payments.length > 0 ? payments[0] : null;

        // Build activities timeline from recent records
        const activities: Array<{ id: string; type: string; message: string; date: string; icon: string }> = [];

        // Recent attendance records
        const recentAtt = records.slice(0, 5);
        for (const r of recentAtt) {
          const statusMap: Record<string, { msg: string; icon: string }> = {
            'حاضر': { msg: 'تم تسجيل حضور الطالب', icon: 'check' },
            'غائب': { msg: 'الطالب غائب', icon: 'alert' },
            'متأخر': { msg: `تأخر ${r.lateMinutes || ''} دقيقة`, icon: 'clock' },
            'مستأذن': { msg: 'الطالب مستأذن', icon: 'check' },
            'خروج مبكر': { msg: 'خروج مبكر', icon: 'clock' },
          };
          const info = statusMap[r.status] || { msg: r.status, icon: 'check' };
          activities.push({
            id: `att-${r.id}`,
            type: 'attendance',
            message: info.msg,
            date: `${r.date} ${r.checkIn || ''}`,
            icon: info.icon,
          });
        }

        // Recent grades
        for (const g of validGrades.slice(0, 3)) {
          activities.push({
            id: `grade-${g.id}`,
            type: 'grade',
            message: `تم رفع درجة ${g.subject?.name || g.subjectName || ''} - ${g.score}/${g.maxScore}`,
            date: new Date(g.createdAt).toLocaleString('ar-IQ'),
            icon: 'grade',
          });
        }

        // Recent payments
        for (const p of payments.slice(0, 2)) {
          activities.push({
            id: `pay-${p.id}`,
            type: 'payment',
            message: `تم استلام دفعة - ${new Intl.NumberFormat('ar-IQ').format(p.amount)} د.ع`,
            date: p.paymentDate || '',
            icon: 'wallet',
          });
        }

        // Sort activities by date (most recent first)
        activities.sort((a, b) => b.date.localeCompare(a.date));

        setStudent({
          id: studentData.id,
          studentNumber: studentData.studentNumber || '',
          fullName: studentData.fullName || '',
          gender: studentData.gender || 'ذكر',
          dateOfBirth: studentData.dateOfBirth || '',
          nationalId: studentData.nationalId || '',
          phone: studentData.phone || '',
          address: studentData.address || '',
          status: studentData.status || 'مستمر',
          qrCode: studentData.qrCode || studentData.studentNumber || '',
          classId: studentData.classId || '',
          sectionId: studentData.sectionId || '',
          className: studentData.class?.name || '',
          sectionName: studentData.section?.name || '',
          guardianName: studentData.guardianName || '',
          guardianPhone: studentData.guardianPhone || '',
          guardianRelation: studentData.guardianRelation || '',
          attendance: {
            present: presentCount,
            absent: absentCount,
            late: lateCount,
            excused: excusedCount,
            total: totalCount,
            percentage: attPercentage,
            monthly: monthlyAttendance,
          },
          grades: {
            average: avgGrade,
            rank: 0,
            totalStudents: 0,
            passCount: 0,
            failCount: 0,
            subjects: subjectsList,
          },
          payment: {
            totalFees,
            paid: paidAmount,
            remaining: remainingAmount,
            status: paymentStatus,
            lastPaymentDate: lastPayment?.paymentDate || '',
            lastPaymentAmount: lastPayment?.amount || 0,
          },
          activities: activities.slice(0, 10),
        });
      } catch (error) {
        console.error('Error loading student profile:', error);
        toast({ title: 'خطأ', description: 'فشل في تحميل بيانات الطالب', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    fetchStudentProfile();
  }, [studentId]);

  // Generate QR code
  useEffect(() => {
    if (!student) return;
    const generateQR = async () => {
      try {
        const url = await QRCode.toDataURL(student.qrCode || student.studentNumber, {
          width: 120,
          margin: 2,
          color: { dark: '#0d9488', light: '#ffffff' },
        });
        setQrCodeUrl(url);
      } catch {
        // QR generation failed
      }
    };
    generateQR();
  }, [student?.qrCode, student?.studentNumber]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-IQ').format(amount) + ' د.ع';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('ar-IQ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const statusColors: Record<string, string> = {
    'مستمر': 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700',
    'منقول': 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700',
    'تارك': 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700',
    'مفصول': 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-700',
    'متخرج': 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-700',
  };

  const paymentStatusColors: Record<string, string> = {
    'مدفوع': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'جزئي': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'غير مدفوع': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'غير محدد': 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
          <p className="text-muted-foreground">جاري تحميل بيانات الطالب...</p>
        </div>
      </div>
    );
  }

  // No student selected
  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <User className="w-16 h-16 text-muted-foreground/30" />
          <p className="text-muted-foreground">لم يتم تحديد طالب</p>
          <Button variant="outline" onClick={() => setActivePage('students')}>العودة لقائمة الطلاب</Button>
        </div>
      </div>
    );
  }

  const attendanceColor = student.attendance.percentage >= 90 ? '#059669' :
    student.attendance.percentage >= 75 ? '#f59e0b' : '#ef4444';

  const gradeAvgColor = student.grades.average >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
    student.grades.average >= 60 ? 'text-amber-600 dark:text-amber-400' :
    'text-red-600 dark:text-red-400';

  const initials = student.fullName.charAt(0);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Back Button */}
      <motion.div variants={itemVariants}>
        <Button
          variant="ghost"
          className="gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => {
            setSelectedStudentId(null);
            setActivePage('students');
          }}
        >
          <ChevronLeft className="h-4 w-4" />
          العودة لقائمة الطلاب
        </Button>
      </motion.div>

      {/* Student Header Card */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden dark:bg-gray-900/50">
          <div
            className="relative p-6 text-white overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0d9488 0%, #059669 60%, #047857 100%)' }}
          >
            <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-white/10" />
            <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
            <div className="absolute top-4 left-1/3 w-16 h-16 rounded-full bg-white/5" />

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 shadow-xl">
                  <span className="text-3xl font-bold text-white">{initials}</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-400 border-2 border-white rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-right">
                <h1 className="text-2xl font-bold">{student.fullName}</h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2">
                  <span className="text-white/80 text-sm font-mono">{student.studentNumber}</span>
                  <span className="text-white/40">|</span>
                  <span className="text-white/80 text-sm">{student.className} {student.sectionName && `- ${student.sectionName}`}</span>
                  <Badge className={cn('text-xs', statusColors[student.status] || 'bg-white/20 text-white border-white/30')}>
                    {student.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                  <User className="w-4 h-4 text-white/60" />
                  <span className="text-white/70 text-sm">{student.gender}</span>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center gap-2">
                {qrCodeUrl && (
                  <div className="bg-white p-2 rounded-lg shadow-lg">
                    <img src={qrCodeUrl} alt="QR Code" className="w-20 h-20" />
                  </div>
                )}
                <span className="text-white/60 text-[10px]">رمز QR</span>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Action Buttons */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
        <Button className="gap-2" style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }} onClick={() => toast({ title: 'طباعة', description: 'يتم تجهيز البطاقة للطباعة...' })}>
          <Printer className="h-4 w-4" />
          طباعة البطاقة
        </Button>
        <Button variant="outline" className="gap-2 border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-400 dark:hover:bg-teal-900/20" onClick={() => toast({ title: 'تصدير', description: 'يتم تصدير الدرجات كملف CSV' })}>
          <Download className="h-4 w-4" />
          تصدير الدرجات
        </Button>
        <Button variant="outline" className="gap-2 border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-400 dark:hover:bg-teal-900/20" onClick={() => toast({ title: 'رسالة', description: 'سيتم إرسال رسالة لولي الأمر' })}>
          <MessageSquare className="h-4 w-4" />
          رسالة لولي الأمر
        </Button>
        <Button variant="outline" className="gap-2 border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-400 dark:hover:bg-teal-900/20" onClick={() => toast({ title: 'نقل', description: 'سيتم فتح نموذج نقل الطالب' })}>
          <ArrowRightLeft className="h-4 w-4" />
          نقل الطالب
        </Button>
        <Button variant="outline" className="gap-2 border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-400 dark:hover:bg-teal-900/20" onClick={() => toast({ title: 'تعديل', description: 'سيتم فتح نموذج تعديل بيانات الطالب' })}>
          <Edit className="h-4 w-4" />
          تعديل
        </Button>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Personal Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Personal Information Card */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden dark:bg-gray-900/50">
              <div className="h-1" style={{ background: 'linear-gradient(to left, #0d9488, #059669)' }} />
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                    <User className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  </div>
                  المعلومات الشخصية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow icon={Calendar} label="تاريخ الميلاد" value={formatDate(student.dateOfBirth)} />
                <InfoRow icon={User} label="الجنس" value={student.gender} />
                <InfoRow icon={CreditCard} label="رقم الهوية" value={student.nationalId} />
                <InfoRow icon={Phone} label="الهاتف" value={student.phone} />
                <InfoRow icon={MapPin} label="العنوان" value={student.address} />
                <Separator className="dark:bg-gray-700" />
                <p className="text-xs font-semibold text-muted-foreground mt-2">معلومات ولي الأمر</p>
                <InfoRow icon={Shield} label="اسم ولي الأمر" value={student.guardianName} />
                <InfoRow icon={Phone} label="رقم ولي الأمر" value={student.guardianPhone} />
                <InfoRow icon={UserCircle} label="صلة القرابة" value={student.guardianRelation} />
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment Status Card */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden dark:bg-gray-900/50">
              <div className="h-1" style={{ background: 'linear-gradient(to left, #f59e0b, #ef4444)' }} />
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  حالة الدفع
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">الحالة</span>
                  <Badge className={cn('text-xs border-0', paymentStatusColors[student.payment.status] || '')}>
                    {student.payment.status}
                  </Badge>
                </div>

                {student.payment.totalFees > 0 ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">المبلغ المدفوع</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(student.payment.paid)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">المبلغ المتبقي</span>
                        <span className="font-semibold text-red-600 dark:text-red-400">{formatCurrency(student.payment.remaining)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">إجمالي الرسوم</span>
                        <span className="font-bold dark:text-gray-200">{formatCurrency(student.payment.totalFees)}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>نسبة السداد</span>
                        <span>{Math.round((student.payment.paid / student.payment.totalFees) * 100)}%</span>
                      </div>
                      <Progress
                        value={(student.payment.paid / student.payment.totalFees) * 100}
                        className="h-2.5"
                      />
                    </div>

                    {student.payment.lastPaymentDate && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-xs">
                        <p className="text-muted-foreground">آخر دفعة</p>
                        <p className="font-semibold mt-0.5 dark:text-gray-200">{formatDate(student.payment.lastPaymentDate)}</p>
                        <p className="text-emerald-600 dark:text-emerald-400 font-medium">{formatCurrency(student.payment.lastPaymentAmount)}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    لا توجد بيانات أقساط مسجلة
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Middle + Right Columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Attendance + Grades Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Attendance Summary Card */}
            <motion.div variants={itemVariants}>
              <Card className="overflow-hidden dark:bg-gray-900/50 h-full">
                <div className="h-1" style={{ background: 'linear-gradient(to left, #0d9488, #059669)' }} />
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    </div>
                    ملخص الحضور
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {student.attendance.total > 0 ? (
                    <>
                      <div className="flex justify-center relative">
                        <CircularProgressRing
                          percentage={student.attendance.percentage}
                          size={120}
                          strokeWidth={10}
                          color={attendanceColor}
                          label="نسبة الحضور"
                          sublabel={`${student.attendance.present} من ${student.attendance.total}`}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <StatChip label="حاضر" value={student.attendance.present} color="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" />
                        <StatChip label="غائب" value={student.attendance.absent} color="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" />
                        <StatChip label="متأخر" value={student.attendance.late} color="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" />
                        <StatChip label="مستأذن" value={student.attendance.excused} color="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" />
                      </div>
                      {student.attendance.monthly.some(m => m.percentage > 0) && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">الحضور الشهري (آخر 3 أشهر)</p>
                          <div className="flex items-end gap-3 justify-center">
                            {student.attendance.monthly.map((m, i) => (
                              <div key={i} className="flex flex-col items-center gap-1">
                                <motion.div
                                  initial={{ height: 0 }}
                                  animate={{ height: `${m.percentage * 0.6}px` }}
                                  transition={{ duration: 0.6, delay: i * 0.15 }}
                                  className="w-10 rounded-t-md"
                                  style={{
                                    background: m.percentage >= 85
                                      ? 'linear-gradient(to top, #0d9488, #059669)'
                                      : m.percentage >= 70
                                      ? 'linear-gradient(to top, #f59e0b, #fbbf24)'
                                      : 'linear-gradient(to top, #ef4444, #f87171)',
                                    minHeight: '4px',
                                  }}
                                />
                                <span className="text-[10px] text-muted-foreground">{m.month}</span>
                                <span className="text-[10px] font-semibold">{m.percentage}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                      لا توجد سجلات حضور
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Grades Overview Card */}
            <motion.div variants={itemVariants}>
              <Card className="overflow-hidden dark:bg-gray-900/50 h-full">
                <div className="h-1" style={{ background: 'linear-gradient(to left, #f59e0b, #ef4444)' }} />
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <GraduationCap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    نظرة عامة على الدرجات
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {student.grades.subjects.length > 0 ? (
                    <>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Star className="w-5 h-5 text-amber-500" />
                          <span className={cn('text-3xl font-bold', gradeAvgColor)}>{student.grades.average}</span>
                          <span className="text-sm text-muted-foreground">/ 100</span>
                        </div>
                      </div>
                      <Separator className="dark:bg-gray-700" />
                      <div className="space-y-0.5 max-h-64 overflow-y-auto">
                        {student.grades.subjects.map((subject, i) => (
                          <SubjectGradeBar
                            key={i}
                            name={subject.name}
                            score={subject.score}
                            maxScore={subject.maxScore}
                            grade={subject.grade}
                          />
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                      لا توجد درجات مسجلة
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Activity Timeline Card */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden dark:bg-gray-900/50">
              <div className="h-1" style={{ background: 'linear-gradient(to left, #0d9488, #059669)' }} />
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  </div>
                  النشاط الأخير
                </CardTitle>
              </CardHeader>
              <CardContent>
                {student.activities.length > 0 ? (
                  <div className="space-y-0">
                    {student.activities.map((activity, i) => (
                      <ActivityItem key={activity.id} activity={activity} index={i} />
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                    لا توجد نشاطات مسجلة
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// Helper component: Info row
function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-sm font-medium dark:text-gray-200 truncate">{value || '—'}</p>
      </div>
    </div>
  );
}

// Helper component: Stat chip
function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={cn('flex items-center justify-between rounded-lg px-3 py-2', color)}>
      <span className="text-xs font-medium">{label}</span>
      <span className="text-sm font-bold">{value}</span>
    </div>
  );
}
