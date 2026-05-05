'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, LogIn, UserPlus, BookOpen, ClipboardCheck, FileText,
  Settings, Bell, Shield, Trash2, Edit, Download, Search,
  Calendar, Clock, Filter, ChevronLeft, ChevronRight, AlertCircle,
  CheckCircle2, Info, X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

// Activity types
type ActivityType =
  | 'login'
  | 'student_added'
  | 'grade_entered'
  | 'attendance_recorded'
  | 'settings_changed'
  | 'notice_sent'
  | 'user_created'
  | 'student_deleted'
  | 'student_edited'
  | 'export_data'
  | 'system';

interface ActivityEntry {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  user: string;
  userRole: string;
  timestamp: Date;
}

const ACTIVITY_CONFIG: Record<ActivityType, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
  login: { icon: LogIn, color: 'text-sky-600', bgColor: 'bg-sky-50', label: 'تسجيل دخول' },
  student_added: { icon: UserPlus, color: 'text-emerald-600', bgColor: 'bg-emerald-50', label: 'إضافة طالب' },
  grade_entered: { icon: FileText, color: 'text-amber-600', bgColor: 'bg-amber-50', label: 'إدخال درجات' },
  attendance_recorded: { icon: ClipboardCheck, color: 'text-teal-600', bgColor: 'bg-teal-50', label: 'تسجيل حضور' },
  settings_changed: { icon: Settings, color: 'text-gray-600', bgColor: 'bg-gray-50', label: 'تغيير إعدادات' },
  notice_sent: { icon: Bell, color: 'text-purple-600', bgColor: 'bg-purple-50', label: 'إرسال إشعار' },
  user_created: { icon: Shield, color: 'text-rose-600', bgColor: 'bg-rose-50', label: 'إنشاء مستخدم' },
  student_deleted: { icon: Trash2, color: 'text-red-600', bgColor: 'bg-red-50', label: 'حذف طالب' },
  student_edited: { icon: Edit, color: 'text-blue-600', bgColor: 'bg-blue-50', label: 'تعديل طالب' },
  export_data: { icon: Download, color: 'text-indigo-600', bgColor: 'bg-indigo-50', label: 'تصدير بيانات' },
  system: { icon: AlertCircle, color: 'text-orange-600', bgColor: 'bg-orange-50', label: 'نظام' },
};

// Mock data
const MOCK_ACTIVITIES: ActivityEntry[] = [
  {
    id: '1',
    type: 'login',
    title: 'تسجيل دخول ناجح',
    description: 'المدير العام سجّل الدخول إلى النظام',
    user: 'المدير العام',
    userRole: 'مدير',
    timestamp: new Date(2026, 2, 4, 8, 15),
  },
  {
    id: '2',
    type: 'attendance_recorded',
    title: 'تسجيل حضور الصف',
    description: 'تم تسجيل حضور الرابع الإعدادي - علمي / شعبة أ',
    user: 'موظف البوابة',
    userRole: 'موظف بوابة',
    timestamp: new Date(2026, 2, 4, 8, 30),
  },
  {
    id: '3',
    type: 'student_added',
    title: 'إضافة طالب جديد',
    description: 'تم إضافة الطالب أحمد محمد صالح إلى السادس الإعدادي - أحيائي / شعبة أ',
    user: 'موظف التسجيل',
    userRole: 'موظف تسجيل',
    timestamp: new Date(2026, 2, 4, 9, 0),
  },
  {
    id: '4',
    type: 'grade_entered',
    title: 'إدخال درجات',
    description: 'تم إدخال درجات مادة الرياضيات - شهر أول للخامس الإعدادي - علمي',
    user: 'أ. كريم حمزة',
    userRole: 'مدرس',
    timestamp: new Date(2026, 2, 4, 9, 45),
  },
  {
    id: '5',
    type: 'notice_sent',
    title: 'إرسال إشعار',
    description: 'تم إرسال إشعار "جدول الامتحانات" لجميع الطلاب وأولياء الأمور',
    user: 'المدير العام',
    userRole: 'مدير',
    timestamp: new Date(2026, 2, 4, 10, 15),
  },
  {
    id: '6',
    type: 'student_edited',
    title: 'تعديل بيانات طالب',
    description: 'تم تعديل بيانات الطالب زينب محمد علي - تحديث رقم الهاتف',
    user: 'موظف التسجيل',
    userRole: 'موظف تسجيل',
    timestamp: new Date(2026, 2, 4, 10, 30),
  },
  {
    id: '7',
    type: 'attendance_recorded',
    title: 'تسجيل حضور الصف',
    description: 'تم تسجيل حضور الخامس الإعدادي - أدبي / شعبة ب',
    user: 'موظف البوابة',
    userRole: 'موظف بوابة',
    timestamp: new Date(2026, 2, 4, 10, 45),
  },
  {
    id: '8',
    type: 'login',
    title: 'تسجيل دخول ناجح',
    description: 'المعاون الإداري سجّل الدخول إلى النظام',
    user: 'المعاون الإداري',
    userRole: 'معاون',
    timestamp: new Date(2026, 2, 4, 11, 0),
  },
  {
    id: '9',
    type: 'grade_entered',
    title: 'إدخال درجات',
    description: 'تم إدخال درجات مادة الفيزياء - شهر أول للسادس الإعدادي - تطبيقي',
    user: 'أ. حسين خالد',
    userRole: 'مدرس',
    timestamp: new Date(2026, 2, 4, 11, 30),
  },
  {
    id: '10',
    type: 'settings_changed',
    title: 'تغيير إعدادات النظام',
    description: 'تم تحديث وقت التأخير المسموح من 10 إلى 15 دقيقة',
    user: 'المدير العام',
    userRole: 'مدير',
    timestamp: new Date(2026, 2, 4, 12, 0),
  },
  {
    id: '11',
    type: 'user_created',
    title: 'إنشاء مستخدم جديد',
    description: 'تم إنشاء حساب لموظف البوابة الجديد',
    user: 'المدير العام',
    userRole: 'مدير',
    timestamp: new Date(2026, 2, 3, 14, 30),
  },
  {
    id: '12',
    type: 'export_data',
    title: 'تصدير بيانات',
    description: 'تم تصدير تقرير الحضور الشهري بصيغة PDF',
    user: 'المعاون الإداري',
    userRole: 'معاون',
    timestamp: new Date(2026, 2, 3, 13, 0),
  },
  {
    id: '13',
    type: 'student_deleted',
    title: 'حذف طالب',
    description: 'تم حذف الطالب سامي عبدالله حسن - منقول إلى مدرسة أخرى',
    user: 'موظف التسجيل',
    userRole: 'موظف تسجيل',
    timestamp: new Date(2026, 2, 3, 11, 45),
  },
  {
    id: '14',
    type: 'attendance_recorded',
    title: 'تسجيل حضور الصف',
    description: 'تم تسجيل حضور الرابع الإعدادي - أدبي / شعبة أ',
    user: 'موظف البوابة',
    userRole: 'موظف بوابة',
    timestamp: new Date(2026, 2, 3, 8, 30),
  },
  {
    id: '15',
    type: 'login',
    title: 'تسجيل دخول ناجح',
    description: 'موظف التسجيل سجّل الدخول إلى النظام',
    user: 'موظف التسجيل',
    userRole: 'موظف تسجيل',
    timestamp: new Date(2026, 2, 3, 8, 10),
  },
  {
    id: '16',
    type: 'grade_entered',
    title: 'إدخال درجات',
    description: 'تم إدخال درجات مادة التربية الإسلامية - نصف السنة للرابع الإعدادي - علمي',
    user: 'أ. أحمد كاظم',
    userRole: 'مدرس',
    timestamp: new Date(2026, 2, 2, 10, 0),
  },
  {
    id: '17',
    type: 'student_added',
    title: 'إضافة طالب جديد',
    description: 'تم إضافة الطالب مريم عباس جواد إلى الرابع الإعدادي - أدبي / شعبة ب',
    user: 'موظف التسجيل',
    userRole: 'موظف تسجيل',
    timestamp: new Date(2026, 2, 2, 9, 30),
  },
  {
    id: '18',
    type: 'system',
    title: 'تحديث النظام',
    description: 'تم تحديث النظام إلى الإصدار 2.1.0 - إضافة صفحة جدول الحصص وسجل النشاط',
    user: 'النظام',
    userRole: 'نظام',
    timestamp: new Date(2026, 2, 1, 0, 0),
  },
  {
    id: '19',
    type: 'notice_sent',
    title: 'إرسال إشعار',
    description: 'تم إرسال إشعار "بداية العام الدراسي" لجميع المستخدمين',
    user: 'المدير العام',
    userRole: 'مدير',
    timestamp: new Date(2026, 2, 1, 8, 0),
  },
  {
    id: '20',
    type: 'login',
    title: 'تسجيل دخول ناجح',
    description: 'المدير العام سجّل الدخول إلى النظام لأول مرة',
    user: 'المدير العام',
    userRole: 'مدير',
    timestamp: new Date(2026, 2, 1, 7, 45),
  },
];

const ROLE_COLORS: Record<string, string> = {
  'مدير': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'معاون': 'bg-teal-100 text-teal-700 border-teal-200',
  'موظف تسجيل': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  'موظف بوابة': 'bg-amber-100 text-amber-700 border-amber-200',
  'مدرس': 'bg-sky-100 text-sky-700 border-sky-200',
  'نظام': 'bg-gray-100 text-gray-600 border-gray-200',
};

function formatArabicDate(date: Date): string {
  return date.toLocaleDateString('ar-IQ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatArabicTime(date: Date): string {
  return date.toLocaleTimeString('ar-IQ', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatArabicFull(date: Date): string {
  return date.toLocaleDateString('ar-IQ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

export default function ActivityLogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [page, setPage] = useState(1);
  const perPage = 8;

  // Get unique users
  const uniqueUsers = useMemo(() => {
    const users = new Set(MOCK_ACTIVITIES.map((a) => a.user));
    return Array.from(users);
  }, []);

  // Filter activities
  const filteredActivities = useMemo(() => {
    let activities = [...MOCK_ACTIVITIES];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      activities = activities.filter(
        (a) =>
          a.title.includes(q) ||
          a.description.includes(q) ||
          a.user.includes(q)
      );
    }

    if (filterType !== 'all') {
      activities = activities.filter((a) => a.type === filterType);
    }

    if (filterUser !== 'all') {
      activities = activities.filter((a) => a.user === filterUser);
    }

    // Sort by timestamp descending
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return activities;
  }, [searchQuery, filterType, filterUser]);

  const totalPages = Math.ceil(filteredActivities.length / perPage);
  const paginatedActivities = filteredActivities.slice(
    (page - 1) * perPage,
    page * perPage
  );

  // Group by date for display
  const groupedActivities: { date: string; dateObj: Date; activities: ActivityEntry[] }[] = [];
  let lastDateStr = '';

  paginatedActivities.forEach((activity) => {
    const dateStr = formatArabicDate(activity.timestamp);
    if (dateStr !== lastDateStr) {
      groupedActivities.push({
        date: dateStr,
        dateObj: activity.timestamp,
        activities: [activity],
      });
      lastDateStr = dateStr;
    } else {
      groupedActivities[groupedActivities.length - 1].activities.push(activity);
    }
  });

  // Stats
  const todayActivities = MOCK_ACTIVITIES.filter((a) =>
    isSameDay(a.timestamp, new Date(2026, 2, 4))
  );
  const loginCount = MOCK_ACTIVITIES.filter((a) => a.type === 'login').length;
  const studentOps = MOCK_ACTIVITIES.filter(
    (a) => a.type === 'student_added' || a.type === 'student_edited' || a.type === 'student_deleted'
  ).length;
  const gradeOps = MOCK_ACTIVITIES.filter((a) => a.type === 'grade_entered').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-11 h-11 rounded-xl shadow-lg"
            style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}
          >
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">سجل النشاط</h1>
            <p className="text-sm text-muted-foreground">متابعة جميع الأنشطة والعمليات في النظام</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-sky-50">
                <Activity className="h-4 w-4 text-sky-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">إجمالي الأنشطة</p>
                <p className="text-lg font-bold">{MOCK_ACTIVITIES.length}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-50">
                <LogIn className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">عمليات الدخول</p>
                <p className="text-lg font-bold">{loginCount}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-teal-50">
                <UserPlus className="h-4 w-4 text-teal-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">عمليات الطلاب</p>
                <p className="text-lg font-bold">{studentOps}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-50">
                <FileText className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">إدخال الدرجات</p>
                <p className="text-lg font-bold">{gradeOps}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث في الأنشطة..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                  className="pr-9"
                />
              </div>
              <Select value={filterType} onValueChange={(v) => { setFilterType(v); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="نوع النشاط" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  {Object.entries(ACTIVITY_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterUser} onValueChange={(v) => { setFilterUser(v); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="المستخدم" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المستخدمين</SelectItem>
                  {uniqueUsers.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Timeline */}
      <div className="space-y-4">
        <AnimatePresence mode="wait">
          {groupedActivities.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Card>
                <CardContent className="py-16 flex flex-col items-center justify-center text-muted-foreground">
                  <Activity className="h-12 w-12 mb-4 opacity-30" />
                  <p className="text-lg font-medium">لا توجد أنشطة مطابقة</p>
                  <p className="text-sm">جرّب تغيير معايير البحث أو الفلتر</p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="timeline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {groupedActivities.map((group, groupIdx) => (
                <div key={group.date}>
                  {/* Date Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-sm">{group.date}</h3>
                    <Separator className="flex-1" />
                    <Badge variant="outline" className="text-xs">
                      {group.activities.length} نشاط
                    </Badge>
                  </div>

                  {/* Activities */}
                  <div className="space-y-2 mr-4 border-r-2 border-muted pr-4">
                    {group.activities.map((activity, idx) => {
                      const config = ACTIVITY_CONFIG[activity.type];
                      const Icon = config.icon;
                      return (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: groupIdx * 0.1 + idx * 0.05 }}
                        >
                          <Card className="border-border/50 hover:shadow-sm transition-shadow">
                            <CardContent className="p-3 sm:p-4">
                              <div className="flex items-start gap-3">
                                {/* Icon */}
                                <div className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${config.bgColor}`}>
                                  <Icon className={`h-4 w-4 ${config.color}`} />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-semibold text-sm">{activity.title}</h4>
                                    <Badge
                                      variant="outline"
                                      className={`text-[10px] h-5 ${config.bgColor} ${config.color}`}
                                    >
                                      {config.label}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {activity.description}
                                  </p>
                                  <div className="flex items-center gap-3 mt-2">
                                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatArabicTime(activity.timestamp)}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className={`text-[10px] h-4 px-1.5 ${ROLE_COLORS[activity.userRole] || ''}`}
                                    >
                                      {activity.user}
                                    </Badge>
                                  </div>
                                </div>

                                {/* Timeline dot */}
                                <div className="relative">
                                  <div
                                    className="w-3 h-3 rounded-full border-2 border-background shrink-0"
                                    style={{ backgroundColor: '#0d9488' }}
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            عرض {((page - 1) * perPage) + 1} - {Math.min(page * perPage, filteredActivities.length)} من {filteredActivities.length} نشاط
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">{page} / {totalPages}</span>
            <Button
              size="icon"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
