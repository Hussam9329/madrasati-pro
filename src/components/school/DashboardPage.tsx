'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  LogOut,
  RefreshCw,
  Loader2,
  ScanLine,
  FileText,
  BarChart3,
  TrendingUp,
  School,
} from 'lucide-react';
import { useAppStore, type PageKey } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardData {
  totals: {
    students: number;
    teachers: number;
    subjects: number;
    classes: number;
  };
  todayAttendance: {
    present: number;
    absent: number;
    late: number;
    earlyExit: number;
    excused: number;
    sickLeave: number;
    officialLeave: number;
    partialAttendance: number;
    total: number;
  };
  recentAttendance: Array<{
    id: string;
    status: string;
    time: string;
    date: string;
    student: {
      id: string;
      fullName: string;
      studentNumber: string;
      class: { name: string };
      section: { name: string } | null;
    };
  }>;
  gradeCompletion: Array<{
    subjectId: string;
    subjectName: string;
    totalStudents: number;
    examTypesCount: number;
    expectedGrades: number;
    totalGrades: number;
    completedGrades: number;
    missingGrades: number;
    completionPercentage: number;
  }>;
  notices: Array<{
    id: string;
    title: string;
    content: string;
    type: string;
    createdAt: string;
  }>;
  studentsByStatus: Array<{
    status: string;
    count: number;
  }>;
  classAttendanceStats: Array<{
    classId: string;
    className: string;
    totalStudents: number;
    present: number;
    absent: number;
    attendancePercentage: number;
  }>;
}

const statusBadgeMap: Record<string, { label: string; className: string }> = {
  'حاضر': { label: 'حاضر', className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' },
  'غائب': { label: 'غائب', className: 'bg-red-100 text-red-700 hover:bg-red-100' },
  'متأخر': { label: 'متأخر', className: 'bg-amber-100 text-amber-700 hover:bg-amber-100' },
  'خروج مبكر': { label: 'خروج مبكر', className: 'bg-orange-100 text-orange-700 hover:bg-orange-100' },
  'مستأذن': { label: 'مستأذن', className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
  'إجازة مرضية': { label: 'إجازة مرضية', className: 'bg-purple-100 text-purple-700 hover:bg-purple-100' },
  'إجازة رسمية': { label: 'إجازة رسمية', className: 'bg-cyan-100 text-cyan-700 hover:bg-cyan-100' },
  'حضور ناقص': { label: 'حضور ناقص', className: 'bg-gray-100 text-gray-700 hover:bg-gray-100' },
};

const noticeTypeBadge: Record<string, { label: string; className: string }> = {
  'عام': { label: 'عام', className: 'bg-gray-100 text-gray-700' },
  'مهم': { label: 'مهم', className: 'bg-red-100 text-red-700' },
  'إداري': { label: 'إداري', className: 'bg-blue-100 text-blue-700' },
  'أكاديمي': { label: 'أكاديمي', className: 'bg-emerald-100 text-emerald-700' },
  'طوارئ': { label: 'طوارئ', className: 'bg-orange-100 text-orange-700' },
};

const PIE_COLORS = ['#10b981', '#ef4444', '#f59e0b', '#f97316', '#06b6d4', '#8b5cf6', '#ec4899', '#6b7280'];

// Mock data for weekly attendance trend
const weeklyAttendanceTrend = [
  { day: 'الأحد', attendance: 92, late: 3, absent: 5 },
  { day: 'الإثنين', attendance: 88, late: 5, absent: 7 },
  { day: 'الثلاثاء', attendance: 95, late: 2, absent: 3 },
  { day: 'الأربعاء', attendance: 90, late: 4, absent: 6 },
  { day: 'الخميس', attendance: 85, late: 6, absent: 9 },
  { day: 'السبت', attendance: 78, late: 8, absent: 14 },
  { day: 'الأحد*', attendance: 91, late: 3, absent: 6 },
];

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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const { setActivePage, auth } = useAppStore();

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('فشل جلب البيانات');
      const json = await res.json();
      setData(json);
    } catch {
      setError('تعذر جلب بيانات لوحة التحكم');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    setLoading(true);
    fetchData();
  };

  const attendance = data?.todayAttendance;
  const attendanceTotal = attendance?.total || 0;

  const pieData = attendance
    ? [
        { name: 'حاضر', value: attendance.present },
        { name: 'غائب', value: attendance.absent },
        { name: 'متأخر', value: attendance.late },
        { name: 'خروج مبكر', value: attendance.earlyExit },
        { name: 'مستأذن', value: attendance.excused },
        { name: 'إجازة مرضية', value: attendance.sickLeave },
        { name: 'إجازة رسمية', value: attendance.officialLeave },
        { name: 'حضور ناقص', value: attendance.partialAttendance },
      ].filter((d) => d.value > 0)
    : [];

  // Stat cards config
  const statCards = data
    ? [
        {
          title: 'إجمالي الطلاب',
          value: data.totals.students,
          icon: GraduationCap,
          color: '#059669',
          bgColor: 'bg-emerald-50',
          iconBg: 'bg-emerald-100',
        },
        {
          title: 'المدرسون',
          value: data.totals.teachers,
          icon: Users,
          color: '#0891b2',
          bgColor: 'bg-cyan-50',
          iconBg: 'bg-cyan-100',
        },
        {
          title: 'الحاضرون اليوم',
          value: attendance?.present || 0,
          icon: CheckCircle,
          color: '#10b981',
          bgColor: 'bg-green-50',
          iconBg: 'bg-green-100',
        },
        {
          title: 'الغائبون',
          value: attendance?.absent || 0,
          icon: XCircle,
          color: '#ef4444',
          bgColor: 'bg-red-50',
          iconBg: 'bg-red-100',
        },
        {
          title: 'المتأخرون',
          value: attendance?.late || 0,
          icon: Clock,
          color: '#f59e0b',
          bgColor: 'bg-amber-50',
          iconBg: 'bg-amber-100',
        },
        {
          title: 'خروج مبكر',
          value: attendance?.earlyExit || 0,
          icon: LogOut,
          color: '#f97316',
          bgColor: 'bg-orange-50',
          iconBg: 'bg-orange-100',
        },
      ]
    : [];

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-red-500 text-lg">{error}</p>
        <Button onClick={handleRefresh} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header - Prominent Gradient Card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0d9488 0%, #059669 60%, #047857 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/3 w-16 h-16 rounded-full bg-white/5" />
        <div className="relative px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shrink-0 bg-white/20 backdrop-blur-sm"
            >
              <School className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                مرحباً، {auth.user?.name || 'مستخدم'} 👋
              </h2>
              <p className="text-sm text-white/70 mt-0.5">
                {new Date().toLocaleDateString('ar-IQ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                {' · '}
                نظرة عامة على حالة المدرسة
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            تحديث
          </Button>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
      >
        {[
          { title: 'مسح حضور QR', desc: 'تسجيل دخول أو خروج', icon: ScanLine, page: 'attendance' as PageKey, gradient: 'from-emerald-500 to-emerald-600' },
          { title: 'إدخال الدرجات', desc: 'تسجيل درجات الطلاب', icon: FileText, page: 'grades' as PageKey, gradient: 'from-teal-500 to-teal-600' },
          { title: 'التقارير', desc: 'عرض التقارير والإحصائيات', icon: BarChart3, page: 'reports' as PageKey, gradient: 'from-cyan-500 to-cyan-600' },
        ].map((action, index) => (
          <motion.button
            key={action.title}
            onClick={() => setActivePage(action.page)}
            className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 text-right group"
            whileHover={{ y: -3, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${action.gradient} text-white shrink-0 shadow-sm group-hover:shadow-md transition-shadow`}>
              <action.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">{action.title}</p>
              <p className="text-[11px] text-muted-foreground">{action.desc}</p>
            </div>
          </motion.button>
        ))}
      </motion.div>

      {/* Statistics Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
      >
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-7 w-12" />
                  </div>
                </CardContent>
              </Card>
            ))
          : statCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <motion.div key={card.title} variants={itemVariants} whileHover={{ y: -2 }}>
                  <div className="rounded-xl p-[1px] bg-gradient-to-br from-gray-200/80 via-gray-100/50 to-gray-200/80 hover:from-teal-200/60 hover:via-emerald-200/40 hover:to-teal-200/60 transition-all duration-300">
                    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
                      <CardContent className="p-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.iconBg}`}>
                          <Icon className="w-5 h-5" style={{ color: card.color }} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-3 font-medium">{card.title}</p>
                        <p className="text-2xl font-bold mt-1" style={{ color: card.color }}>
                          {card.value.toLocaleString('ar-SA')}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              );
            })}
      </motion.div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-gray-800">
                توزيع الحضور اليوم
              </CardTitle>
              <CardDescription>
                إجمالي السجلات: {attendanceTotal.toLocaleString('ar-SA')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                </div>
              ) : pieData.length > 0 ? (
                <div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {pieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(value: number, name: string) => [
                            value.toLocaleString('ar-SA'),
                            name,
                          ]}
                          contentStyle={{
                            borderRadius: '8px',
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            fontFamily: 'inherit',
                            direction: 'rtl',
                          }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          iconType="circle"
                          iconSize={8}
                          formatter={(value: string) => (
                            <span style={{ fontSize: '12px', color: '#6b7280' }}>{value}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Total Attendance Percentage */}
                  {attendanceTotal > 0 && (
                    <div className="flex items-center justify-center gap-2 pt-2 border-t border-gray-100 mt-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        ((attendance?.present || 0) / attendanceTotal * 100) >= 90 ? 'bg-emerald-500' :
                        ((attendance?.present || 0) / attendanceTotal * 100) >= 75 ? 'bg-amber-500' : 'bg-red-500'
                      }`} />
                      <span className="text-sm text-muted-foreground">نسبة الحضور الإجمالية</span>
                      <span className={`text-lg font-bold ${
                        ((attendance?.present || 0) / attendanceTotal * 100) >= 90 ? 'text-emerald-600' :
                        ((attendance?.present || 0) / attendanceTotal * 100) >= 75 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {Math.round((attendance?.present || 0) / attendanceTotal * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                  لا توجد بيانات حضور لليوم
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="border-0 shadow-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-gray-800">
                آخر سجلات الحضور
              </CardTitle>
              <CardDescription>آخر 10 سجلات حضور وانصراف</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))}
                </div>
              ) : data?.recentAttendance && data.recentAttendance.length > 0 ? (
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-semibold">الطالب</TableHead>
                        <TableHead className="text-xs font-semibold">الصف</TableHead>
                        <TableHead className="text-xs font-semibold">الوقت</TableHead>
                        <TableHead className="text-xs font-semibold">الحالة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.recentAttendance.map((record) => {
                        const badgeInfo = statusBadgeMap[record.status] || {
                          label: record.status,
                          className: 'bg-gray-100 text-gray-700',
                        };
                        return (
                          <TableRow key={record.id} className="hover:bg-gray-50/50">
                            <TableCell className="text-sm font-medium">
                              {record.student.fullName}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {record.student.class?.name || '-'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {record.time || '-'}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={`text-xs ${badgeInfo.className}`}
                              >
                                {badgeInfo.label}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                  لا توجد سجلات حضور حديثة
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom section: Notices + Grade Completion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notices */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-0 shadow-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-gray-800">الإشعارات الأخيرة</CardTitle>
              <CardDescription>آخر الإشعارات والتنبيهات</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  ))}
                </div>
              ) : data?.notices && data.notices.length > 0 ? (
                <div className="space-y-3 max-h-72 overflow-y-auto custom-scrollbar">
                  {data.notices.map((notice) => {
                    const typeInfo = noticeTypeBadge[notice.type] || {
                      label: notice.type,
                      className: 'bg-gray-100 text-gray-700',
                    };
                    const borderColor: Record<string, string> = {
                      'عام': 'border-r-gray-400',
                      'مهم': 'border-r-red-500',
                      'إداري': 'border-r-blue-500',
                      'أكاديمي': 'border-r-emerald-500',
                      'طوارئ': 'border-r-orange-500',
                    };
                    return (
                      <div
                        key={notice.id}
                        className={`p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-colors border-r-4 ${borderColor[notice.type] || 'border-r-gray-300'}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-semibold text-gray-800">{notice.title}</h4>
                          <Badge variant="secondary" className={`text-xs shrink-0 ${typeInfo.className}`}>
                            {typeInfo.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                          {notice.content}
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-2">
                          {new Date(notice.createdAt).toLocaleDateString('ar-SA', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                  لا توجد إشعارات
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Grade Completion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-0 shadow-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-gray-800">
                نسبة إكمال الدرجات
              </CardTitle>
              <CardDescription>تقدم إدخال الدرجات لكل مادة</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))}
                </div>
              ) : data?.gradeCompletion && data.gradeCompletion.length > 0 ? (
                <div className="space-y-4 max-h-72 overflow-y-auto custom-scrollbar">
                  {data.gradeCompletion.map((subject) => (
                    <div key={subject.subjectId} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          {subject.subjectName}
                        </span>
                        <span className="text-xs font-semibold" style={{ color: '#0d9488' }}>
                          {subject.completionPercentage}%
                        </span>
                      </div>
                      <Progress
                        value={subject.completionPercentage}
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>تم: {subject.totalGrades}</span>
                        <span>متوقع: {subject.expectedGrades}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                  لا توجد بيانات درجات
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Third row: Students by Status + Class Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Students by Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="border-0 shadow-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-gray-800 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                حالات الطلاب
              </CardTitle>
              <CardDescription>توزيع الطلاب حسب الحالة</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : data?.studentsByStatus && data.studentsByStatus.length > 0 ? (
                <div className="space-y-2">
                  {data.studentsByStatus.map((item) => {
                    const statusColors: Record<string, string> = {
                      'مستمر': 'bg-emerald-500',
                      'منقول': 'bg-amber-500',
                      'تارك': 'bg-red-500',
                      'مفصول': 'bg-red-700',
                      'متخرج': 'bg-teal-600',
                    };
                    const total = data.studentsByStatus.reduce((s, i) => s + i.count, 0);
                    const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                    return (
                      <div key={item.status} className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full shrink-0 ${statusColors[item.status] || 'bg-gray-400'}`} />
                        <span className="text-sm text-gray-700 w-20 shrink-0">{item.status}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, delay: 0.1 }}
                            className={`h-full rounded-full ${statusColors[item.status] || 'bg-gray-400'}`}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-600 w-8 text-left">{item.count}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                  لا توجد بيانات
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Class Attendance Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="border-0 shadow-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-gray-800 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-teal-600" />
                حضور الصفوف اليوم
              </CardTitle>
              <CardDescription>نسبة الحضور لكل صف</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : data?.classAttendanceStats && data.classAttendanceStats.length > 0 ? (
                <div className="space-y-2.5 max-h-72 overflow-y-auto custom-scrollbar">
                  {data.classAttendanceStats.map((cls) => (
                    <div key={cls.classId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <span className="text-sm text-gray-700 min-w-0 flex-1 truncate">{cls.className}</span>
                      <div className="w-24 bg-gray-100 rounded-full h-2 overflow-hidden shrink-0">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${cls.attendancePercentage}%` }}
                          transition={{ duration: 0.8, delay: 0.1 }}
                          className={`h-full rounded-full ${
                            cls.attendancePercentage >= 90 ? 'bg-emerald-500' :
                            cls.attendancePercentage >= 75 ? 'bg-amber-500' :
                            'bg-red-500'
                          }`}
                        />
                      </div>
                      <span className={`text-xs font-bold min-w-[3rem] text-left ${
                        cls.attendancePercentage >= 90 ? 'text-emerald-600' :
                        cls.attendancePercentage >= 75 ? 'text-amber-600' :
                        'text-red-600'
                      }`}>
                        {cls.attendancePercentage}%
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                  لا توجد بيانات حضور للصفوف
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Fourth row: Weekly Attendance Trend Line Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              اتجاه الحضور الأسبوعي
            </CardTitle>
            <CardDescription>نسبة الحضور وعدد المتأخرين والغائبين خلال آخر 7 أيام</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyAttendanceTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickLine={false}
                    domain={[60, 100]}
                    label={{ value: 'نسبة الحضور %', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#9ca3af' } }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="left"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickLine={false}
                    domain={[0, 'auto']}
                    label={{ value: 'عدد الطلاب', angle: 90, position: 'insideRight', style: { fontSize: 11, fill: '#9ca3af' } }}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      fontFamily: 'inherit',
                      direction: 'rtl',
                    }}
                    formatter={(value: number, name: string) => {
                      const labels: Record<string, string> = {
                        attendance: 'نسبة الحضور',
                        late: 'المتأخرون',
                        absent: 'الغائبون',
                      };
                      return [
                        name === 'attendance' ? `${value}%` : value,
                        labels[name] || name,
                      ];
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => {
                      const labels: Record<string, string> = {
                        attendance: 'نسبة الحضور',
                        late: 'المتأخرون',
                        absent: 'الغائبون',
                      };
                      return <span style={{ fontSize: '12px', color: '#6b7280' }}>{labels[value] || value}</span>;
                    }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="attendance"
                    stroke="#0d9488"
                    strokeWidth={3}
                    dot={{ fill: '#0d9488', r: 4, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="late"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ fill: '#f59e0b', r: 3, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="absent"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ fill: '#ef4444', r: 3, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
