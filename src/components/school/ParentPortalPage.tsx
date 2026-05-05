'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
  { id: '1', subject: 'الرياضيات', examType: 'اختبار شهري', score: 85, maxScore: 100, status: 'ناجح' },
  { id: '2', subject: 'الفيزياء', examType: 'اختبار نصفي', score: 72, maxScore: 100, status: 'ناجح' },
  { id: '3', subject: 'الكيمياء', examType: 'اختبار شهري', score: 55, maxScore: 100, status: 'راسب' },
  { id: '4', subject: 'اللغة العربية', examType: 'اختبار نصفي', score: 90, maxScore: 100, status: 'ناجح' },
  { id: '5', subject: 'اللغة الإنكليزية', examType: 'اختبار شهري', score: 68, maxScore: 100, status: 'ناجح' },
  { id: '6', subject: 'التربية الإسلامية', examType: 'اختبار نصفي', score: 92, maxScore: 100, status: 'ناجح' },
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

export default function ParentPortalPage() {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('1');
  const [searchQuery, setSearchQuery] = useState('');

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

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0d9488 0%, #059669 60%, #047857 100%)' }}
      >
        <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/3 w-16 h-16 rounded-full bg-white/5" />
        <div className="relative px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shrink-0 bg-white/20 backdrop-blur-sm">
              <Heart className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">بوابة ولي الأمر</h2>
              <p className="text-sm text-white/70 mt-0.5">
                {selectedStudent.parentName} — متابعة الأبناء الأكاديمية
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2">
            <Phone className="w-4 h-4 text-white/70" />
            <span className="text-sm text-white/90" dir="ltr">{selectedStudent.parentPhone}</span>
          </div>
        </div>
      </motion.div>

      {/* Student Lookup */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث برقم الطالب أو الاسم..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 border-gray-200 focus:border-teal-500 focus:ring-teal-500/20"
                />
              </div>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger className="w-full sm:w-[260px] border-gray-200 focus:border-teal-500">
                  <SelectValue placeholder="اختر الطالب" />
                </SelectTrigger>
                <SelectContent>
                  {mockStudents.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-teal-600" />
                        <span>{student.name}</span>
                        <span className="text-xs text-muted-foreground">({student.studentNumber})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                    <p className="text-sm font-semibold text-gray-800">{selectedStudent.class} - {selectedStudent.section}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-cyan-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">الرقم المدرسي</p>
                    <p className="text-sm font-semibold text-gray-800" dir="ltr">{selectedStudent.studentNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">ولي الأمر</p>
                    <p className="text-sm font-semibold text-gray-800">{selectedStudent.parentName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">العنوان</p>
                    <p className="text-sm font-semibold text-gray-800">{selectedStudent.address}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Attendance Summary Card */}
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
              {/* Attendance Rate Circle */}
              <div className="flex items-center justify-center mb-5">
                <div className="relative w-36 h-36">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" stroke="#e5e7eb" strokeWidth="10" fill="none" />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      stroke={mockAttendance.attendanceRate >= 90 ? '#10b981' : mockAttendance.attendanceRate >= 75 ? '#f59e0b' : '#ef4444'}
                      strokeWidth="10"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${(mockAttendance.attendanceRate / 100) * 314.16} 314.16`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold" style={{ color: mockAttendance.attendanceRate >= 90 ? '#10b981' : mockAttendance.attendanceRate >= 75 ? '#f59e0b' : '#ef4444' }}>
                      {mockAttendance.attendanceRate}%
                    </span>
                    <span className="text-xs text-muted-foreground">نسبة الحضور</span>
                  </div>
                </div>
              </div>

              {/* Stats Rows */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/70">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm text-gray-700">أيام الحضور</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">{mockAttendance.presentDays} يوم</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-red-50/70">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-gray-700">أيام الغياب</span>
                  </div>
                  <span className="text-sm font-bold text-red-600">{mockAttendance.absentDays} يوم</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50/70">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span className="text-sm text-gray-700">أيام التأخير</span>
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

        {/* Recent Grades Card */}
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
                      className="p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-800">{grade.subject}</span>
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
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-muted-foreground">{grade.examType}</span>
                        <span className="text-xs font-semibold" style={{ color: isPass ? '#0d9488' : '#ef4444' }}>
                          {grade.score}/{grade.maxScore}
                        </span>
                      </div>
                      <Progress
                        value={pct}
                        className="h-1.5"
                      />
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
        {/* Notices */}
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
                    className={`p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-colors border-r-4 ${noticeBorderColors[notice.type] || 'border-r-gray-300'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-gray-800">{notice.title}</h4>
                      <Badge
                        variant="secondary"
                        className={`text-xs shrink-0 ${noticeTypeColors[notice.type] || 'bg-gray-100 text-gray-700'}`}
                      >
                        {notice.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{notice.content}</p>
                    <p className="text-xs text-muted-foreground/60 mt-2">
                      {new Date(notice.date).toLocaleDateString('ar-SA', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Weekly Schedule */}
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
                <TabsList className="w-full flex h-auto flex-wrap gap-1 bg-muted/50 p-1">
                  {mockSchedule.map((day) => (
                    <TabsTrigger
                      key={day.day}
                      value={day.day}
                      className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm flex-1 min-w-[60px]"
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
                      <TableRow key={grade.id} className="hover:bg-gray-50/50">
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
