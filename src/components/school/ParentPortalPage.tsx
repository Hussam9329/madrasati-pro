'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  User,
  GraduationCap,
  BookOpen,
  Calendar,
  Bell,
  Clock,
  Heart,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Award,
  CalendarDays,
  Eye,
  Phone,
  Mail,
  MapPin,
  ChevronLeft,
  MessageSquare,
  Send,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

// --- Mock Data ---
const mockStudents = [
  {
    id: '1',
    studentNumber: 'STD-2024-015',
    name: 'علي حسين جاسم',
    class: 'الخامس الإعدادي',
    section: 'علمي',
    status: 'مستمر',
    gender: 'ذكر',
    photo: null,
    parentName: 'حسين جاسم محمد',
    parentPhone: '07701234567',
    address: 'بغداد - الكرخ - حي الأعلام',
  },
  {
    id: '2',
    studentNumber: 'STD-2024-022',
    name: 'فاطمة حسين جاسم',
    class: 'الثالث المتوسط',
    section: 'أ',
    status: 'مستمر',
    gender: 'أنثى',
    photo: null,
    parentName: 'حسين جاسم محمد',
    parentPhone: '07701234567',
    address: 'بغداد - الكرخ - حي الأعلام',
  },
];

const mockAttendance = {
  presentDays: 18,
  absentDays: 3,
  lateDays: 2,
  totalDays: 23,
  attendanceRate: 78,
};

const mockGrades = [
  { id: '1', subject: 'الرياضيات', examType: 'اختبار شهري', score: 85, maxScore: 100, status: 'ناجح', trend: 'up' as const },
  { id: '2', subject: 'الفيزياء', examType: 'اختبار نصفي', score: 72, maxScore: 100, status: 'ناجح', trend: 'up' as const },
  { id: '3', subject: 'الكيمياء', examType: 'اختبار شهري', score: 55, maxScore: 100, status: 'راسب', trend: 'down' as const },
  { id: '4', subject: 'اللغة العربية', examType: 'اختبار نصفي', score: 90, maxScore: 100, status: 'ناجح', trend: 'up' as const },
  { id: '5', subject: 'اللغة الإنكليزية', examType: 'اختبار شهري', score: 68, maxScore: 100, status: 'ناجح', trend: 'same' as const },
  { id: '6', subject: 'التربية الإسلامية', examType: 'اختبار نصفي', score: 92, maxScore: 100, status: 'ناجح', trend: 'up' as const },
];

const mockNotices = [
  {
    id: '1',
    title: 'بدء التسجيل للامتحانات النهائية',
    content: 'يُعلن عن بدء التسجيل للامتحانات النهائية للفصل الدراسي الثاني ابتداءً من يوم الأحد القادم.',
    type: 'أكاديمي',
    date: '2025-03-01',
  },
  {
    id: '2',
    title: 'اجتماع أولياء الأمور',
    content: 'يُدعى أولياء الأمور لحضور الاجتماع السنوي يوم الخميس القادم في تمام الساعة العاشرة صباحاً.',
    type: 'مهم',
    date: '2025-02-28',
  },
  {
    id: '3',
    title: 'إجازة رسمية',
    content: 'تعلن المدرسة عن إجازة رسمية يوم الثلاثاء القادم بمناسبة عطلة ربيعية.',
    type: 'إداري',
    date: '2025-02-25',
  },
  {
    id: '4',
    title: 'مسابقة العلوم السنوية',
    content: 'تقام المسابقة العلوم السنوية يوم الأربعاء القادم. الراغبون في المشاركة يرجى مراجعة المعلم المسؤول.',
    type: 'عام',
    date: '2025-02-24',
  },
];

const mockSchedule = [
  { day: 'الأحد', periods: ['الرياضيات', 'الفيزياء', 'الكيمياء', 'استراحة', 'العربية', 'الإنكليزية', 'الإسلامية'] },
  { day: 'الإثنين', periods: ['الفيزياء', 'الرياضيات', 'العربية', 'استراحة', 'الكيمياء', 'الإسلامية', 'الإنكليزية'] },
  { day: 'الثلاثاء', periods: ['الكيمياء', 'العربية', 'الرياضيات', 'استراحة', 'الفيزياء', 'الإنكليزية', 'حصة حرة'] },
  { day: 'الأربعاء', periods: ['الإسلامية', 'الكيمياء', 'الفيزياء', 'استراحة', 'الرياضيات', 'العربية', 'الإنكليزية'] },
  { day: 'الخميس', periods: ['الإنكليزية', 'الرياضيات', 'الإسلامية', 'استراحة', 'العربية', 'الكيمياء', 'الفيزياء'] },
];

const periodTimes = ['08:00-08:45', '08:45-09:30', '09:30-10:15', '10:15-10:30', '10:30-11:15', '11:15-12:00', '12:00-12:45'];

const subjectColors: Record<string, string> = {
  'الرياضيات': 'bg-blue-100 text-blue-700 border-blue-200',
  'الفيزياء': 'bg-purple-100 text-purple-700 border-purple-200',
  'الكيمياء': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'العربية': 'bg-amber-100 text-amber-700 border-amber-200',
  'الإنكليزية': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  'الإسلامية': 'bg-teal-100 text-teal-700 border-teal-200',
  'استراحة': 'bg-gray-50 text-gray-500 border-gray-200',
  'حصة حرة': 'bg-gray-50 text-gray-400 border-gray-200',
};

const noticeTypeColors: Record<string, string> = {
  'عام': 'bg-gray-100 text-gray-700',
  'مهم': 'bg-red-100 text-red-700',
  'إداري': 'bg-blue-100 text-blue-700',
  'أكاديمي': 'bg-emerald-100 text-emerald-700',
  'طوارئ': 'bg-orange-100 text-orange-700',
};

const noticeBorderColors: Record<string, string> = {
  'عام': 'border-r-gray-400',
  'مهم': 'border-r-red-500',
  'إداري': 'border-r-blue-500',
  'أكاديمي': 'border-r-emerald-500',
  'طوارئ': 'border-r-orange-500',
};

const noticeGradientBorders: Record<string, string> = {
  'عام': 'from-gray-300 to-gray-400',
  'مهم': 'from-red-400 to-red-600',
  'إداري': 'from-blue-400 to-blue-600',
  'أكاديمي': 'from-emerald-400 to-emerald-600',
  'طوارئ': 'from-orange-400 to-orange-600',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

// Animated attendance ring component
function AnimatedAttendanceRing({ rate }: { rate: number }) {
  const [animatedRate, setAnimatedRate] = useState(0);
  const circumference = 2 * Math.PI * 50; // r=50

  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      start = eased * rate;
      setAnimatedRate(Math.round(start));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [rate]);

  const strokeDashoffset = circumference - (animatedRate / 100) * circumference;
  const color = rate >= 90 ? '#10b981' : rate >= 75 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative w-36 h-36">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="50" stroke="#e5e7eb" strokeWidth="10" fill="none" className="dark:stroke-gray-700" />
        <motion.circle
          cx="60"
          cy="60"
          r="50"
          stroke={color}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color }}>
          {animatedRate}%
        </span>
        <span className="text-xs text-muted-foreground">نسبة الحضور</span>
      </div>
    </div>
  );
}

export default function ParentPortalPage() {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [contactOpen, setContactOpen] = useState(false);
  const [contactMessage, setContactMessage] = useState('');

  const selectedStudent = mockStudents.find((s) => s.id === selectedStudentId) || mockStudents[0];
  const averageGrade = Math.round(mockGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / mockGrades.length);

  const quickStats = [
    {
      title: 'نسبة الحضور',
      value: `${mockAttendance.attendanceRate}%`,
      icon: CheckCircle,
      color: mockAttendance.attendanceRate >= 90 ? '#10b981' : mockAttendance.attendanceRate >= 75 ? '#f59e0b' : '#ef4444',
      bgColor: mockAttendance.attendanceRate >= 90 ? 'bg-emerald-50' : mockAttendance.attendanceRate >= 75 ? 'bg-amber-50' : 'bg-red-50',
      iconBg: mockAttendance.attendanceRate >= 90 ? 'bg-emerald-100' : mockAttendance.attendanceRate >= 75 ? 'bg-amber-100' : 'bg-red-100',
    },
    {
      title: 'معدل الدرجات',
      value: `${averageGrade}%`,
      icon: TrendingUp,
      color: averageGrade >= 80 ? '#0d9488' : averageGrade >= 60 ? '#f59e0b' : '#ef4444',
      bgColor: averageGrade >= 80 ? 'bg-teal-50' : averageGrade >= 60 ? 'bg-amber-50' : 'bg-red-50',
      iconBg: averageGrade >= 80 ? 'bg-teal-100' : averageGrade >= 60 ? 'bg-amber-100' : 'bg-red-100',
    },
    {
      title: 'ترتيب الصف',
      value: '5/30',
      icon: Award,
      color: '#0d9488',
      bgColor: 'bg-teal-50',
      iconBg: 'bg-teal-100',
    },
    {
      title: 'الامتحان القادم',
      value: 'فيزياء',
      icon: CalendarDays,
      color: '#0891b2',
      bgColor: 'bg-cyan-50',
      iconBg: 'bg-cyan-100',
    },
  ];

  const getGradeBorderColor = (score: number) => {
    if (score >= 80) return 'border-r-emerald-500';
    if (score >= 50) return 'border-r-amber-500';
    return 'border-r-red-500';
  };

  const getGradeGradientBorder = (score: number) => {
    if (score >= 80) return 'from-emerald-400 to-emerald-600';
    if (score >= 50) return 'from-amber-400 to-amber-600';
    return 'from-red-400 to-red-600';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'same') => {
    if (trend === 'up') return <ArrowUpRight className="w-3 h-3 text-emerald-500" />;
    if (trend === 'down') return <ArrowDownRight className="w-3 h-3 text-red-500" />;
    return <Minus className="w-3 h-3 text-gray-400" />;
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'اليوم';
    if (diffDays === 1) return 'أمس';
    if (diffDays === 2) return 'منذ يومين';
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    if (diffDays < 30) return `منذ ${Math.floor(diffDays / 7)} أسبوع`;
    return `منذ ${Math.floor(diffDays / 30)} شهر`;
  };

  const handleSendMessage = () => {
    setContactOpen(false);
    setContactMessage('');
  };

  return (
    <div className="space-y-6">
      {/* Animated Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0d9488 0%, #059669 60%, #047857 100%)' }}
      >
        {/* Decorative shapes */}
        <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/3 w-16 h-16 rounded-full bg-white/5" />
        <div className="absolute top-4 right-16 w-8 h-8 rounded-full bg-white/10" />
        <div className="absolute bottom-4 left-20 w-6 h-6 rounded-lg bg-white/10 rotate-45" />
        <motion.div
          className="absolute top-8 right-1/3 w-4 h-4 rounded-full bg-white/15"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-8 left-1/3 w-3 h-3 rounded-full bg-white/10"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shrink-0 bg-white/20 backdrop-blur-sm">
              <Heart className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                مرحباً، {selectedStudent.parentName}
              </h2>
              <p className="text-sm text-white/70 mt-0.5">
                متابعة أداء الطالب {selectedStudent.name} — {selectedStudent.class}
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2">
              <Phone className="w-4 h-4 text-white/70" />
              <span className="text-sm text-white/90" dir="ltr">{selectedStudent.parentPhone}</span>
            </div>
            {/* Contact Teacher Button */}
            <Dialog open={contactOpen} onOpenChange={setContactOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm">
                  <MessageSquare className="w-4 h-4" />
                  تواصل مع المعلم
                </Button>
              </DialogTrigger>
              <DialogContent dir="rtl" className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-teal-600" />
                    تواصل مع المعلم
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800">
                    <p className="text-sm text-teal-700 dark:text-teal-300">
                      الرسالة ستُرسل إلى معلم الطالب: <strong>{selectedStudent.name}</strong>
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">الموضوع</label>
                    <Input placeholder="موضوع الرسالة..." className="border-gray-200 focus:border-teal-500 focus:ring-teal-500/20" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">الرسالة</label>
                    <Textarea
                      placeholder="اكتب رسالتك هنا..."
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      rows={4}
                      className="border-gray-200 focus:border-teal-500 focus:ring-teal-500/20"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setContactOpen(false)}>
                      إلغاء
                    </Button>
                    <Button
                      onClick={handleSendMessage}
                      className="gap-2 text-white"
                      style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}
                      disabled={!contactMessage.trim()}
                    >
                      <Send className="w-4 h-4" />
                      إرسال
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </motion.div>

      {/* Student Selector - Card Style */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-0 shadow-sm dark:bg-gray-900/50 dark:border dark:border-gray-700 overflow-hidden">
          <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #0d9488, #059669)' }} />
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">اختر الطالب</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث برقم الطالب أو الاسم..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 border-gray-200 focus:border-teal-500 focus:ring-teal-500/20"
                />
              </div>
              <div className="flex gap-3">
                {mockStudents.map((student) => (
                  <motion.div
                    key={student.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedStudentId(student.id)}
                    className={`cursor-pointer flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 transition-all duration-200 ${
                      selectedStudentId === student.id
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 dark:border-teal-600 shadow-sm'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                    }`}
                  >
                    <Avatar className="w-9 h-9">
                      <AvatarFallback
                        className="text-xs font-bold bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-800 dark:to-emerald-800"
                        style={{ color: '#0d9488' }}
                      >
                        {student.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{student.name}</p>
                      <p className="text-xs text-muted-foreground">{student.class} - {student.section}</p>
                    </div>
                    {selectedStudentId === student.id && (
                      <div className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Stats Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {quickStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.title} variants={itemVariants} whileHover={{ y: -2 }}>
              <div className="rounded-xl p-[1px] bg-gradient-to-br from-gray-200/80 via-gray-100/50 to-gray-200/80 hover:from-teal-200/60 hover:via-emerald-200/40 hover:to-teal-200/60 transition-all duration-300">
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
                  <CardContent className="p-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.iconBg}`}>
                      <Icon className="w-5 h-5" style={{ color: stat.color }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-3 font-medium">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: stat.color }}>
                      {stat.value}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Student Info + Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-sm h-full overflow-hidden dark:bg-gray-900/50 dark:border dark:border-gray-700">
            <div className="h-2" style={{ background: 'linear-gradient(90deg, #0d9488, #059669)' }} />
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <User className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                بيانات الطالب
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center text-center mb-4">
                <Avatar className="w-20 h-20 ring-4 ring-teal-100 dark:ring-teal-900/50 shadow-lg mb-3">
                  <AvatarFallback
                    className="text-xl font-bold bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/50 dark:to-emerald-900/50"
                    style={{ color: '#0d9488' }}
                  >
                    {selectedStudent.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">{selectedStudent.name}</h3>
                <Badge
                  className={`mt-1.5 text-xs ${
                    selectedStudent.status === 'مستمر'
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {selectedStudent.status}
                </Badge>
              </div>
              <Separator className="my-3" />
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-4 h-4 text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">الصف / القسم</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{selectedStudent.class} - {selectedStudent.section}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-cyan-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">الرقم المدرسي</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200" dir="ltr">{selectedStudent.studentNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">ولي الأمر</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{selectedStudent.parentName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">العنوان</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{selectedStudent.address}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Attendance Summary Card - With Animated Ring */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-sm h-full overflow-hidden dark:bg-gray-900/50 dark:border dark:border-gray-700">
            <div className="h-2" style={{ background: 'linear-gradient(90deg, #10b981, #059669)' }} />
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ملخص الحضور — الشهر الحالي
              </CardTitle>
              <CardDescription className="dark:text-gray-400">إحصائيات الحضور والغياب</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Attendance Rate Circle - Animated */}
              <div className="flex items-center justify-center mb-5">
                <AnimatedAttendanceRing rate={mockAttendance.attendanceRate} />
              </div>

              {/* Stats Rows */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-900/20">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">أيام الحضور</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">{mockAttendance.presentDays} يوم</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-red-50/70 dark:bg-red-900/20">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">أيام الغياب</span>
                  </div>
                  <span className="text-sm font-bold text-red-600">{mockAttendance.absentDays} يوم</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50/70 dark:bg-amber-900/20">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">أيام التأخير</span>
                  </div>
                  <span className="text-sm font-bold text-amber-600">{mockAttendance.lateDays} يوم</span>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">تقدم الشهر</span>
                  <span className="font-semibold" style={{ color: '#0d9488' }}>{mockAttendance.totalDays} يوم</span>
                </div>
                <Progress value={(mockAttendance.totalDays / 30) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Grades Card - With Gradient Left Borders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-sm h-full overflow-hidden dark:bg-gray-900/50 dark:border dark:border-gray-700">
            <div className="h-2" style={{ background: 'linear-gradient(90deg, #0d9488, #0891b2)' }} />
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                آخر الدرجات
              </CardTitle>
              <CardDescription className="dark:text-gray-400">نتائج الامتحانات الأخيرة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                {mockGrades.map((grade) => {
                  const pct = Math.round((grade.score / grade.maxScore) * 100);
                  const isPass = grade.status === 'ناجح';
                  return (
                    <div
                      key={grade.id}
                      className="relative p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors overflow-hidden"
                    >
                      {/* Gradient left border strip */}
                      <div className="absolute right-0 top-0 bottom-0 w-1 rounded-l" style={{ background: `linear-gradient(180deg, ${isPass ? '#10b981, #059669' : '#ef4444, #dc2626'})` }} />
                      <div className="flex items-center justify-between mb-2 pr-2">
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{grade.subject}</span>
                        <div className="flex items-center gap-1.5">
                          {getTrendIcon(grade.trend)}
                          <Badge
                            className={`text-xs ${
                              isPass
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-red-100 text-red-700 hover:bg-red-100'
                            }`}
                          >
                            {isPass ? 'ناجح' : 'راسب'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-1.5 pr-2">
                        <span className="text-xs text-muted-foreground">{grade.examType}</span>
                        <span className="text-xs font-semibold" style={{ color: isPass ? '#0d9488' : '#ef4444' }}>
                          {grade.score}/{grade.maxScore}
                        </span>
                      </div>
                      <div className="pr-2">
                        <Progress value={pct} className="h-1.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Section: Notices + Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notices - Enhanced with gradient border strips and date badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-0 shadow-sm h-full overflow-hidden dark:bg-gray-900/50 dark:border dark:border-gray-700">
            <div className="h-2" style={{ background: 'linear-gradient(90deg, #f59e0b, #f97316)' }} />
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                إشعارات المدرسة
              </CardTitle>
              <CardDescription className="dark:text-gray-400">آخر الإعلانات والتنبيهات</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                {mockNotices.map((notice) => (
                  <div
                    key={notice.id}
                    className="relative p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors overflow-hidden"
                  >
                    {/* Gradient left border strip based on type */}
                    <div className={`absolute right-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${noticeGradientBorders[notice.type] || 'from-gray-300 to-gray-400'}`} />
                    <div className="flex items-start justify-between gap-2 pr-2">
                      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{notice.title}</h4>
                      <Badge
                        variant="secondary"
                        className={`text-xs shrink-0 ${noticeTypeColors[notice.type] || 'bg-gray-100 text-gray-700'}`}
                      >
                        {notice.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 pr-2">{notice.content}</p>
                    <div className="flex items-center gap-2 mt-2 pr-2">
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-xs text-muted-foreground">
                        <CalendarDays className="w-3 h-3" />
                        {new Date(notice.date).toLocaleDateString('ar-SA', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      <span className="text-xs text-teal-600 dark:text-teal-400 font-medium">
                        {getTimeAgo(notice.date)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Weekly Schedule - Enhanced with active teal tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-0 shadow-sm h-full overflow-hidden dark:bg-gray-900/50 dark:border dark:border-gray-700">
            <div className="h-2" style={{ background: 'linear-gradient(90deg, #0d9488, #059669)' }} />
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                الجدول الأسبوعي
              </CardTitle>
              <CardDescription className="dark:text-gray-400">جدول حصص الطالب للأسبوع الحالي</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="الأحد" dir="rtl">
                <TabsList className="w-full flex h-auto flex-wrap gap-1 bg-muted/50 p-1 rounded-xl">
                  {mockSchedule.map((day) => (
                    <TabsTrigger
                      key={day.day}
                      value={day.day}
                      className="text-xs data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-xl flex-1 min-w-[60px] transition-all"
                    >
                      {day.day}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {mockSchedule.map((day) => (
                  <TabsContent key={day.day} value={day.day} className="mt-3">
                    <div className="space-y-2">
                      {day.periods.map((period, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="w-20 shrink-0 text-xs text-muted-foreground text-left" dir="ltr">
                            {periodTimes[idx]}
                          </div>
                          <div className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium ${subjectColors[period] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                            {period === 'استراحة' ? (
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                <span>استراحة</span>
                              </div>
                            ) : period === 'حصة حرة' ? (
                              <div className="flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>حصة حرة</span>
                              </div>
                            ) : (
                              period
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Grades Table - Full Width */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="border-0 shadow-sm overflow-hidden dark:bg-gray-900/50 dark:border dark:border-gray-700">
          <div className="h-2" style={{ background: 'linear-gradient(90deg, #0d9488, #059669)' }} />
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              تفاصيل الدرجات
            </CardTitle>
            <CardDescription className="dark:text-gray-400">جميع نتائج الامتحانات مع حالة النجاح والرسوب</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold">المادة</TableHead>
                    <TableHead className="text-xs font-semibold">نوع الامتحان</TableHead>
                    <TableHead className="text-xs font-semibold">الدرجة</TableHead>
                    <TableHead className="text-xs font-semibold">النسبة</TableHead>
                    <TableHead className="text-xs font-semibold">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockGrades.map((grade) => {
                    const pct = Math.round((grade.score / grade.maxScore) * 100);
                    const isPass = grade.status === 'ناجح';
                    return (
                      <TableRow key={grade.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                        <TableCell className="text-sm font-medium">{grade.subject}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{grade.examType}</TableCell>
                        <TableCell className="text-sm">
                          <span className="font-semibold" style={{ color: isPass ? '#0d9488' : '#ef4444' }}>
                            {grade.score}
                          </span>
                          <span className="text-muted-foreground">/{grade.maxScore}</span>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-2">
                            <Progress value={pct} className="h-1.5 w-16" />
                            <span className="text-xs font-medium" style={{ color: isPass ? '#0d9488' : '#ef4444' }}>
                              {pct}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`text-xs ${
                              isPass
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-red-100 text-red-700 hover:bg-red-100'
                            }`}
                          >
                            {isPass ? 'ناجح ✓' : 'راسب ✗'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
