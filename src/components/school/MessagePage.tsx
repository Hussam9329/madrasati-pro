'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Search, Filter, Plus, Send, Paperclip,
  Mail, Bell, AlertTriangle, HelpCircle, Clock, Check,
  CheckCheck, User, Users, BookOpen, FileText, Megaphone,
  X, ChevronLeft, Star, Upload, Reply, Calendar, ArrowUpRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

// Types
interface Message {
  id: number;
  sender: string;
  senderRole: string;
  recipient: string;
  recipientRole: string;
  subject: string;
  preview: string;
  content: string;
  time: string;
  date: string;
  type: 'رسالة' | 'إشعار' | 'تنبيه' | 'طلب';
  read: boolean;
  priority: 'عادي' | 'مهم' | 'عاجل';
  avatar?: string;
}

interface Announcement {
  id: number;
  title: string;
  content: string;
  date: string;
  target: 'جميع' | 'أولياء الأمور' | 'المدرسون' | 'الصف السادس';
  priority: 'عادي' | 'مهم' | 'عاجل';
}

interface Template {
  id: number;
  name: string;
  subject: string;
  content: string;
}

// Mock Data
const MOCK_MESSAGES: Message[] = [
  {
    id: 1, sender: 'أ. أحمد كاظم', senderRole: 'مدرس', recipient: 'ولي أمر علي حسين', recipientRole: 'ولي أمر',
    subject: 'إشعار غياب الطالب', preview: 'نود إعلامكم بأن ابنكم لم يحضر اليوم...', content: 'السلام عليكم،\n\nنود إعلامكم بأن ابنكم علي لم يحضر إلى المدرسة اليوم يوم الأحد الموافق 2025/03/02. نرجو التواصل مع إدارة المدرسة لتوضيح سبب الغياب.\n\nمع التحية\nأ. أحمد كاظم',
    time: '09:30', date: '2025/03/02', type: 'إشعار', read: false, priority: 'مهم',
  },
  {
    id: 2, sender: 'أ. مصطفى جواد', senderRole: 'مدرس', recipient: 'ولي أمر فاطمة حسين', recipientRole: 'ولي أمر',
    subject: 'نتائج امتحان الرياضيات', preview: 'نتشرف بإعلامكم بنتيجة ابنكم في...', content: 'السلام عليكم،\n\nنتشرف بإعلامكم بنتيجة ابنتكم فاطمة في امتحان الرياضيات للشهر الأول. حققت درجة 92/100 وهي من الأوائل في الصف.\n\nبارك الله فيها.\nأ. مصطفى جواد',
    time: '10:15', date: '2025/03/02', type: 'رسالة', read: false, priority: 'عادي',
  },
  {
    id: 3, sender: 'إدارة المدرسة', senderRole: 'إدارة', recipient: 'جميع أولياء الأمور', recipientRole: 'ولي أمر',
    subject: 'اجتماع أولياء الأمور', preview: 'يسر إدارة المدرسة دعوتكم لحضور...', content: 'السلام عليكم ورحمة الله،\n\nيسر إدارة المدرسة دعوتكم لحضور اجتماع أولياء الأمور السنوي الذي سيقام يوم الخميس الموافق 2025/03/06 في قاعة المدرسة الرئيسية الساعة العاشرة صباحاً.\n\nنأمل حضوركم للتباحث حول سير العملية التعليمية.\n\nمع التقدير\nإدارة المدرسة',
    time: '11:00', date: '2025/03/01', type: 'تنبيه', read: false, priority: 'عاجل',
  },
  {
    id: 4, sender: 'ولي أمر محمد سعيد', senderRole: 'ولي أمر', recipient: 'أ. سارة حسين', recipientRole: 'مدرس',
    subject: 'استفسار عن درجات الابن', preview: 'أريد الاستفسار عن درجة ابني في...', content: 'السلام عليكم،\n\nأريد الاستفسار عن درجة ابني محمد في مادة الفيزياء للامتحان الشهري. هل يمكنكم تزويدي بالتفاصيل؟\n\nشكراً لكم\nولي أمر محمد سعيد',
    time: '12:30', date: '2025/03/01', type: 'طلب', read: true, priority: 'عادي',
  },
  {
    id: 5, sender: 'أ. زينب محمد', senderRole: 'مدرس', recipient: 'ولي أمر أحمد علي', recipientRole: 'ولي أمر',
    subject: 'تكليف إضافي في اللغة العربية', preview: 'نرجو متابعة ابنتكم في حل التكليف...', content: 'السلام عليكم،\n\nنرجو متابعة ابنتكم في حل التكليف الإضافي في مادة اللغة العربية الذي يتضمن كتابة موضوع تعبير عن الوطن. الموعد النهائي يوم الثلاثاء القادم.\n\nشكراً لتعاونكم\nأ. زينب محمد',
    time: '08:45', date: '2025/02/28', type: 'رسالة', read: true, priority: 'عادي',
  },
  {
    id: 6, sender: 'إدارة المدرسة', senderRole: 'إدارة', recipient: 'جميع أولياء الأمور', recipientRole: 'ولي أمر',
    subject: 'تذكير بدفع الرسوم', preview: 'نود تذكيركم بضرورة سداد الرسوم...', content: 'السلام عليكم،\n\nنود تذكيركم بضرورة سداد الرسوم المدرسية للفصل الدراسي الثاني قبل تاريخ 2025/03/15. يرجى مراجعة شؤون الطلاب لأي استفسار.\n\nإدارة المدرسة',
    time: '09:00', date: '2025/02/27', type: 'تنبيه', read: true, priority: 'مهم',
  },
  {
    id: 7, sender: 'أ. حيدر علي', senderRole: 'مدرس', recipient: 'ولي أمر عمر ياسر', recipientRole: 'ولي أمر',
    subject: 'غياب متكرر', preview: 'نود إعلامكم بتكرر غياب ابنكم خلال...', content: 'السلام عليكم،\n\nنود إعلامكم بتكرر غياب ابنكم عمر خلال الأسبوعين الماضيين (5 أيام). هذا الأمر يؤثر سلباً على تحصيله العلمي. نرجو الحضور للمدرسة لمناقشة الأمر.\n\nأ. حيدر علي',
    time: '13:00', date: '2025/02/26', type: 'تنبيه', read: false, priority: 'عاجل',
  },
  {
    id: 8, sender: 'ولي أمر بلال عمار', senderRole: 'ولي أمر', recipient: 'إدارة المدرسة', recipientRole: 'إدارة',
    subject: 'طلب إجازة', preview: 'أرجو الموافقة على إجازة ابني لمدة...', content: 'السلام عليكم،\n\nأرجو الموافقة على إجازة ابني بلال لمدة يومين (الأحد والاثنين) بسبب ظروف عائلية طارئة.\n\nشكراً لتفهمكم\nولي أمر بلال',
    time: '07:30', date: '2025/02/25', type: 'طلب', read: true, priority: 'عادي',
  },
  {
    id: 9, sender: 'أ. نور حسام', senderRole: 'مدرس', recipient: 'ولي أمر ثائر وليد', recipientRole: 'ولي أمر',
    subject: 'تحسن ملحوظ في الأداء', preview: 'يسعدني إعلامكم بتحسن أداء ابنكم...', content: 'السلام عليكم،\n\nيسعدني إعلامكم بتحسن أداء ابنكم ثائر في مادة الكيمياء خلال الفصل الحالي. حقق تقدماً ملحوظاً في آخر اختبار عملي.\n\nأستمر في تشجيعه.\nأ. نور حسام',
    time: '10:00', date: '2025/02/24', type: 'رسالة', read: true, priority: 'عادي',
  },
  {
    id: 10, sender: 'أ. فاطمة ناصر', senderRole: 'مدرس', recipient: 'ولي أمر رعد قاسم', recipientRole: 'ولي أمر',
    subject: 'موعد اختبار عملي', preview: 'نود إعلامكم بأن اختبار الأحياء العملي...', content: 'السلام عليكم،\n\nنود إعلامكم بأن اختبار الأحياء العملي سيكون يوم الأربعاء القادم 2025/03/05. يرجى التأكد من حضور ابنكم في الموعد المحدد وإحضار أدوات المخبر.\n\nأ. فاطمة ناصر',
    time: '14:20', date: '2025/03/02', type: 'إشعار', read: false, priority: 'مهم',
  },
  {
    id: 11, sender: 'ولي أمر نبيل صباح', senderRole: 'ولي أمر', recipient: 'أ. كريم حمزة', recipientRole: 'مدرس',
    subject: 'شكر وتقدير', preview: 'أود أن أشكركم على مجهوداتكم...', content: 'السلام عليكم،\n\nأود أن أشكركم على مجهوداتكم الكبيرة في تعليم ابننا نبيل. لاحظنا تحسناً كبيراً في مستواه العلمي بفضل متابعتكم المستمرة.\n\nجزاكم الله خيراً\nولي أمر نبيل',
    time: '16:00', date: '2025/02/23', type: 'رسالة', read: true, priority: 'عادي',
  },
  {
    id: 12, sender: 'أ. علي عباس', senderRole: 'مدرس', recipient: 'ولي أمر مريم رضا', recipientRole: 'ولي أمر',
    subject: 'مشاركة في مسابقة', preview: 'تم ترشيح ابنتكم للمشاركة في مسابقة...', content: 'السلام عليكم،\n\nتم ترشيح ابنتكم للمشاركة في مسابقة الرياضيات المدرسية التي ستقام يوم الخميس القادم. نرجو الموافقة على مشاركتها.\n\nأ. علي عباس',
    time: '09:15', date: '2025/02/22', type: 'إشعار', read: true, priority: 'عادي',
  },
  {
    id: 13, sender: 'إدارة المدرسة', senderRole: 'إدارة', recipient: 'جميع المدرسين', recipientRole: 'مدرس',
    subject: 'جدول الامتحانات النهائية', preview: 'تم اعتماد جدول الامتحانات النهائية...', content: 'السلام عليكم،\n\nتم اعتماد جدول الامتحانات النهائية للفصل الدراسي الثاني. يرجى الاطلاع على الجدول المرفق والالتزام بالمواعيد المحددة.\n\nإدارة المدرسة',
    time: '08:00', date: '2025/02/21', type: 'إشعار', read: true, priority: 'مهم',
  },
  {
    id: 14, sender: 'أ. مرتضى صالح', senderRole: 'مدرس', recipient: 'ولي أمر حسين خالد', recipientRole: 'ولي أمر',
    subject: 'سلوك يحتاج متابعة', preview: 'نرجو الحضور لمناقشة سلوك ابنكم...', content: 'السلام عليكم،\n\nنرجو الحضور للمدرسة لمناقشة بعض الملاحظات السلوكية حول ابنكم حسين في الفترة الأخيرة. نفضل الحضور يوم الأحد أو الاثنين.\n\nأ. مرتضى صالح',
    time: '11:30', date: '2025/02/20', type: 'تنبيه', read: true, priority: 'مهم',
  },
  {
    id: 15, sender: 'ولي أمر عباس جعفر', senderRole: 'ولي أمر', recipient: 'أ. عباس جعفر', recipientRole: 'مدرس',
    subject: 'استفسار عن الواجبات', preview: 'هل يمكنكم تزويدي بقائمة الواجبات...', content: 'السلام عليكم،\n\nهل يمكنكم تزويدي بقائمة الواجبات المطلوبة لهذا الأسبوع حتى أتمكن من متابعة ابني في المنزل؟\n\nشكراً\nولي أمر عباس',
    time: '15:45', date: '2025/02/19', type: 'طلب', read: true, priority: 'عادي',
  },
];

const MOCK_TEMPLATES: Template[] = [
  {
    id: 1, name: 'إشعار غياب', subject: 'إشعار غياب الطالب',
    content: 'السلام عليكم،\n\nنود إعلامكم بأن ابنكم/ابنتكم لم يحضر/تحضر إلى المدرسة اليوم. نرجو التواصل مع إدارة المدرسة لتوضيح سبب الغياب.\n\nمع التحية',
  },
  {
    id: 2, name: 'نتائج الامتحانات', subject: 'نتائج الامتحانات',
    content: 'السلام عليكم،\n\nنتشرف بإعلامكم بنتيجة ابنكم/ابنتكم في امتحان [المادة] للفترة [الفترة]. حقق/حققت درجة [الدرجة]/100.\n\nمع التحية',
  },
  {
    id: 3, name: 'اجتماع أولياء الأمور', subject: 'دعوة لحضور اجتماع أولياء الأمور',
    content: 'السلام عليكم ورحمة الله،\n\nيسر إدارة المدرسة دعوتكم لحضور اجتماع أولياء الأمور الذي سيقام يوم [التاريخ] في [المكان] الساعة [الوقت].\n\nنأمل حضوركم.',
  },
  {
    id: 4, name: 'رسوم مدرسية', subject: 'تذكير بالرسوم المدرسية',
    content: 'السلام عليكم،\n\nنود تذكيركم بضرورة سداد الرسوم المدرسية للفصل الدراسي الحالي قبل تاريخ [التاريخ]. يرجى مراجعة شؤون الطلاب.\n\nإدارة المدرسة',
  },
  {
    id: 5, name: 'إعلان عام', subject: 'إعلان عام',
    content: 'السلام عليكم،\n\n[محتوى الإعلان]\n\nمع التقدير\nإدارة المدرسة',
  },
];

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: 1, title: 'بدء التسجيل للعام الدراسي الجديد', content: 'يسر إدارة المدرسة الإعلان عن بدء التسجيل للعام الدراسي 2026-2027 ابتداءً من شهر نيسان. يرجى مراجعة شؤون الطلاب للمتطلبات والأوراق الثبوتية.', date: '2025/03/02', target: 'جميع', priority: 'مهم' },
  { id: 2, title: 'إجازة عيد الفطر المبارك', content: 'تبدأ إجازة عيد الفطر المبارك من يوم [التاريخ] وتستمر لمدة أسبوع. نتمنى لكم عيداً سعيداً وكل عام وأنتم بخير.', date: '2025/03/01', target: 'جميع', priority: 'عاجل' },
  { id: 3, title: 'موعد اجتماع أولياء الأمور', content: 'سيقام اجتماع أولياء الأمور يوم الخميس القادم في قاعة المدرسة الرئيسية الساعة 10 صباحاً لمناقشة سير العملية التعليمية.', date: '2025/02/28', target: 'أولياء الأمور', priority: 'مهم' },
  { id: 4, title: 'ورشة عمل للمدرسين', content: 'ستقام ورشة عمل حول استخدام التقنية في التعليم يوم الأحد القادم. الحضور إلزامي لجميع المدرسين.', date: '2025/02/27', target: 'المدرسون', priority: 'عادي' },
  { id: 5, title: 'مسابقة القرآن الكريم', content: 'تعلن المدرسة عن إقامة مسابقة حفظ القرآن الكريم. يرجى تسجيل الأسماء لدى مشرف التربية الإسلامية.', date: '2025/02/26', target: 'جميع', priority: 'عادي' },
  { id: 6, title: 'جدول الامتحانات النهائية للصف السادس', content: 'تم اعتماد جدول الامتحانات النهائية للصف السادس الإعدادي. يرجى الاطلاع على الجدول والاستعداد جيداً.', date: '2025/02/25', target: 'الصف السادس', priority: 'عاجل' },
  { id: 7, title: 'صيانة المختبرات', content: 'ستجرى أعمال صيانة لمختبرات العلوم خلال الأسبوع القادم. سيتم إعادة جدولة الحصص العملية.', date: '2025/02/24', target: 'المدرسون', priority: 'عادي' },
  { id: 8, title: 'حملة النظافة المدرسية', content: 'تدعو المدرسة جميع الطلاب للمشاركة في حملة النظافة المدرسية يوم الخميس. سيتم توزيع الجوائز على المشاركين.', date: '2025/02/23', target: 'جميع', priority: 'عادي' },
  { id: 9, title: 'تذكير بدفع الرسوم', content: 'نود تذكير أولياء الأمور بضرورة سداد الرسوم المدرسية للفصل الثاني قبل تاريخ 15 آذار.', date: '2025/02/22', target: 'أولياء الأمور', priority: 'مهم' },
];

// Message type config - Enhanced with border color for left strips
const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; border: string; stripColor: string; leftBorder: string }> = {
  'رسالة': { icon: Mail, color: 'text-teal-700 dark:text-teal-300', bg: 'bg-teal-50 dark:bg-teal-900/30', border: 'border-teal-200 dark:border-teal-700', stripColor: 'bg-gradient-to-l from-teal-400 to-teal-600', leftBorder: 'border-r-teal-500 dark:border-r-teal-400' },
  'إشعار': { icon: Bell, color: 'text-sky-700 dark:text-sky-300', bg: 'bg-sky-50 dark:bg-sky-900/30', border: 'border-sky-200 dark:border-sky-700', stripColor: 'bg-gradient-to-l from-sky-400 to-sky-600', leftBorder: 'border-r-sky-500 dark:border-r-sky-400' },
  'تنبيه': { icon: AlertTriangle, color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-200 dark:border-amber-700', stripColor: 'bg-gradient-to-l from-amber-400 to-amber-600', leftBorder: 'border-r-amber-500 dark:border-r-amber-400' },
  'طلب': { icon: HelpCircle, color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-50 dark:bg-purple-900/30', border: 'border-purple-200 dark:border-purple-700', stripColor: 'bg-gradient-to-l from-purple-400 to-purple-600', leftBorder: 'border-r-purple-500 dark:border-r-purple-400' },
};

// Priority config - Enhanced
const PRIORITY_CONFIG: Record<string, { color: string; bg: string; dot: string; stripColor: string }> = {
  'عادي': { color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800', dot: 'bg-gray-400', stripColor: 'bg-gradient-to-l from-gray-300 to-gray-400' },
  'مهم': { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', dot: 'bg-amber-500', stripColor: 'bg-gradient-to-l from-amber-400 to-amber-600' },
  'عاجل': { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', dot: 'bg-red-500', stripColor: 'bg-gradient-to-l from-red-400 to-red-600' },
};

// Announcement target config
const TARGET_CONFIG: Record<string, { color: string; bg: string }> = {
  'جميع': { color: 'text-teal-700 dark:text-teal-300', bg: 'bg-teal-50 dark:bg-teal-900/30' },
  'أولياء الأمور': { color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
  'المدرسون': { color: 'text-sky-700 dark:text-sky-300', bg: 'bg-sky-50 dark:bg-sky-900/30' },
  'الصف السادس': { color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-900/30' },
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function MessagingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('messages');

  // Compose form state
  const [composeRecipient, setComposeRecipient] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composePriority, setComposePriority] = useState('عادي');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  // Announcement form state
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annTarget, setAnnTarget] = useState('جميع');
  const [annPriority, setAnnPriority] = useState('عادي');

  // Reply state
  const [replyText, setReplyText] = useState('');
  const [showReplyArea, setShowReplyArea] = useState(false);

  // Character limit for compose
  const MAX_CHARS = 1000;
  const charCount = composeBody.length;
  const charPercentage = Math.min((charCount / MAX_CHARS) * 100, 100);

  // Stats
  const totalMessages = MOCK_MESSAGES.length;
  const unreadMessages = MOCK_MESSAGES.filter(m => !m.read).length;
  const todayMessages = MOCK_MESSAGES.filter(m => m.date === '2025/03/02').length;
  const contacts = [...new Set(MOCK_MESSAGES.map(m => m.sender))].length + [...new Set(MOCK_MESSAGES.map(m => m.recipient))].length;

  // Filter messages
  const filteredMessages = useMemo(() => MOCK_MESSAGES.filter(m => {
    const matchesSearch = searchQuery === '' ||
      m.sender.includes(searchQuery) ||
      m.subject.includes(searchQuery) ||
      m.preview.includes(searchQuery);
    const matchesType = typeFilter === 'all' || m.type === typeFilter;
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'مقروء' && m.read) ||
      (statusFilter === 'غير مقروء' && !m.read);
    return matchesSearch && matchesType && matchesStatus;
  }), [searchQuery, typeFilter, statusFilter]);

  // Selected template preview
  const selectedTemplateData = useMemo(() => {
    if (!selectedTemplate) return null;
    return MOCK_TEMPLATES.find(t => t.id === parseInt(selectedTemplate));
  }, [selectedTemplate]);

  const handleMessageClick = (msg: Message) => {
    setSelectedMessage(msg);
    setMessageDialogOpen(true);
    setShowReplyArea(false);
    setReplyText('');
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = MOCK_TEMPLATES.find(t => t.id === parseInt(templateId));
    if (template) {
      setComposeSubject(template.subject);
      setComposeBody(template.content);
      setSelectedTemplate(templateId);
    }
  };

  const handleSendMessage = () => {
    setComposeOpen(false);
    setComposeRecipient('');
    setComposeSubject('');
    setComposeBody('');
    setComposePriority('عادي');
    setSelectedTemplate('');
  };

  const handleAddAnnouncement = () => {
    setAnnouncementOpen(false);
    setAnnTitle('');
    setAnnContent('');
    setAnnTarget('جميع');
    setAnnPriority('عادي');
  };

  const handleReply = () => {
    setReplyText('');
    setShowReplyArea(false);
    setMessageDialogOpen(false);
  };

  const getInitials = (name: string) => {
    return name.replace('أ. ', '').split(' ').map(w => w[0]).join('').slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-12 h-12 rounded-xl shadow-lg"
            style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}
          >
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold dark:text-gray-200">التواصل والرسائل</h1>
            <p className="text-sm text-muted-foreground">إدارة التواصل بين المدرسة وأولياء الأمور</p>
          </div>
        </div>
        <Button
          onClick={() => setComposeOpen(true)}
          className="gap-2 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}
        >
          <Plus className="h-4 w-4" />
          رسالة جديدة
        </Button>
      </div>

      {/* Summary Cards - Enhanced with gradient icon backgrounds, top strips, hover animations */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {[
          { label: 'إجمالي الرسائل', value: totalMessages, icon: Mail, gradient: 'from-teal-500 to-teal-600', stripGradient: 'from-teal-400 to-emerald-400' },
          { label: 'غير مقروءة', value: unreadMessages, icon: Bell, gradient: 'from-amber-500 to-amber-600', stripGradient: 'from-amber-400 to-orange-400' },
          { label: 'رسائل اليوم', value: todayMessages, icon: Clock, gradient: 'from-emerald-500 to-emerald-600', stripGradient: 'from-emerald-400 to-green-400' },
          { label: 'جهات الاتصال', value: contacts, icon: Users, gradient: 'from-cyan-500 to-cyan-600', stripGradient: 'from-cyan-400 to-sky-400' },
        ].map((stat) => (
          <motion.div key={stat.label} variants={itemVariants} whileHover={{ y: -4, scale: 1.02 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
            <Card className="border-border/50 overflow-hidden relative dark:bg-gray-900/50 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300">
              <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${stat.stripGradient.includes('teal') ? '#0d9488' : stat.stripGradient.includes('amber') ? '#f59e0b' : stat.stripGradient.includes('emerald') ? '#059669' : '#06b6d4'}, ${stat.stripGradient.includes('emerald') ? '#34d399' : stat.stripGradient.includes('orange') ? '#fb923c' : stat.stripGradient.includes('green') ? '#4ade80' : '#38bdf8'})` }} />
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-lg`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold dark:text-gray-200">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Tabs - Enhanced with teal active state */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-lg">
          <TabsTrigger value="messages" className="gap-2 data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
            <Mail className="h-4 w-4" />
            الرسائل
          </TabsTrigger>
          <TabsTrigger value="compose" className="gap-2 data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
            <Send className="h-4 w-4" />
            إرسال رسالة
          </TabsTrigger>
          <TabsTrigger value="announcements" className="gap-2 data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
            <Megaphone className="h-4 w-4" />
            الإعلانات
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Messages */}
        <TabsContent value="messages" className="space-y-4">
          {/* Search & Filters - Enhanced with Mark all as read button */}
          <Card className="border-border/50 overflow-hidden dark:bg-gray-900/50 dark:border-gray-700 relative">
            <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, #0d9488, #059669)' }} />
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث في الرسائل..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-9"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <Filter className="h-4 w-4 ml-2 text-muted-foreground" />
                    <SelectValue placeholder="النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأنواع</SelectItem>
                    <SelectItem value="رسالة">رسالة</SelectItem>
                    <SelectItem value="إشعار">إشعار</SelectItem>
                    <SelectItem value="تنبيه">تنبيه</SelectItem>
                    <SelectItem value="طلب">طلب</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="مقروء">مقروء</SelectItem>
                    <SelectItem value="غير مقروء">غير مقروء</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  className="gap-2 shrink-0 border-teal-200 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-400 dark:hover:bg-teal-950/30"
                  onClick={() => {}}
                >
                  <CheckCheck className="h-4 w-4" />
                  تعيين الكل كمقروء
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Message List - Enhanced with hover gradient, scale, type-based left borders, thicker top strips */}
          <motion.div
            className="space-y-2"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {filteredMessages.length === 0 ? (
              <Card className="border-border/50 dark:bg-gray-900/50 dark:border-gray-700">
                <CardContent className="p-8 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center">
                      <Mail className="h-8 w-8 text-teal-400 dark:text-teal-500" />
                    </div>
                    <p className="text-muted-foreground font-medium">لا توجد رسائل مطابقة للبحث</p>
                    <p className="text-xs text-muted-foreground/70">جرّب تغيير معايير البحث أو الفلتر</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredMessages.map((msg) => {
                const typeConf = TYPE_CONFIG[msg.type];
                const priorityConf = PRIORITY_CONFIG[msg.priority];
                const TypeIcon = typeConf.icon;
                return (
                  <motion.div
                    key={msg.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.01, y: -2 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <Card
                      className={`border-border/50 cursor-pointer hover:shadow-lg transition-all duration-200 overflow-hidden dark:bg-gray-900/50 dark:border-gray-700 border-r-4 ${typeConf.leftBorder} ${
                        !msg.read ? 'bg-teal-50/30 dark:bg-teal-950/10' : 'dark:hover:bg-gray-800/50'
                      } ${msg.type === 'تنبيه' && msg.priority === 'عاجل' ? 'bg-red-50/30 dark:bg-red-950/10' : ''}`}
                      onClick={() => handleMessageClick(msg)}
                    >
                      {/* Thicker gradient top strip (2px) */}
                      <div className={`h-[2px] ${typeConf.stripColor}`} />
                      <CardContent className="p-4 relative group">
                        {/* Gradient hover background overlay */}
                        <div className="absolute inset-0 bg-gradient-to-l from-teal-500/5 to-emerald-500/5 dark:from-teal-500/10 dark:to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-lg" />
                        <div className="flex items-start gap-3 relative">
                          <div className="relative">
                            <Avatar className="w-10 h-10 shrink-0 shadow-sm ring-2 ring-white dark:ring-gray-800" style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}>
                              <AvatarFallback className="text-white text-xs font-bold bg-transparent">
                                {getInitials(msg.sender)}
                              </AvatarFallback>
                            </Avatar>
                            {!msg.read && (
                              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-teal-500 border-2 border-white dark:border-gray-900 animate-pulse" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`font-semibold text-sm truncate dark:text-gray-200 ${!msg.read ? 'text-foreground' : 'text-muted-foreground dark:text-gray-400'}`}>
                                  {msg.sender}
                                </span>
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 shrink-0 ${typeConf.bg} ${typeConf.color} ${typeConf.border}`}>
                                  <TypeIcon className="h-2.5 w-2.5 ml-0.5" />
                                  {msg.type}
                                </Badge>
                                {msg.priority !== 'عادي' && (
                                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 shrink-0 ${priorityConf.bg} ${priorityConf.color}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${priorityConf.dot} inline-block ml-1`} />
                                    {msg.priority}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[11px] text-muted-foreground dark:text-gray-500">{msg.time}</span>
                              </div>
                            </div>
                            <p className={`text-sm mb-0.5 truncate ${!msg.read ? 'font-medium dark:text-gray-200' : 'text-muted-foreground dark:text-gray-400'}`}>
                              {msg.subject}
                            </p>
                            <p className="text-xs text-muted-foreground/70 dark:text-gray-500 truncate">
                              {msg.preview}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        </TabsContent>

        {/* Tab 2: Compose - Enhanced with character counter, template preview, file attachment area */}
        <TabsContent value="compose" className="space-y-4">
          <Card className="border-border/50 overflow-hidden dark:bg-gray-900/50 dark:border-gray-700 relative">
            <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, #0d9488, #059669)' }} />
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 dark:text-gray-200">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg" style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}>
                  <Send className="h-3.5 w-3.5 text-white" />
                </div>
                إرسال رسالة جديدة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Template Selector - Enhanced with preview card */}
              <div>
                <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5 dark:text-gray-300"><BookOpen className="h-3.5 w-3.5 text-teal-500" />قالب الرسالة</label>
                <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                  <SelectTrigger className={selectedTemplate ? 'border-teal-300 dark:border-teal-700 ring-1 ring-teal-200 dark:ring-teal-800' : ''}>
                    <BookOpen className="h-4 w-4 ml-2 text-muted-foreground" />
                    <SelectValue placeholder="اختر قالباً جاهزاً..." />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_TEMPLATES.map(t => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Template Preview Card */}
                <AnimatePresence>
                  {selectedTemplateData && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-950/20 overflow-hidden">
                        <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, #0d9488, #059669)' }} />
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2 mb-1.5">
                            <BookOpen className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                            <span className="text-xs font-semibold text-teal-700 dark:text-teal-300">{selectedTemplateData.name}</span>
                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-700">قالب</Badge>
                          </div>
                          <p className="text-xs text-teal-600 dark:text-teal-400 font-medium mb-1">الموضوع: {selectedTemplateData.subject}</p>
                          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{selectedTemplateData.content}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Separator />

              {/* Recipient */}
              <div>
                <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5 dark:text-gray-300"><User className="h-3.5 w-3.5 text-teal-500" />المستلم</label>
                <Select value={composeRecipient} onValueChange={setComposeRecipient}>
                  <SelectTrigger className={composeRecipient ? 'border-teal-300 dark:border-teal-700 ring-1 ring-teal-200 dark:ring-teal-800' : ''}>
                    <User className="h-4 w-4 ml-2 text-muted-foreground" />
                    <SelectValue placeholder="اختر المستلم أو المجموعة..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="جميع أولياء الأمور">جميع أولياء الأمور</SelectItem>
                    <SelectItem value="أولياء أمور الرابع">أولياء أمور الصف الرابع</SelectItem>
                    <SelectItem value="أولياء أمور الخامس">أولياء أمور الصف الخامس</SelectItem>
                    <SelectItem value="أولياء أمور السادس">أولياء أمور الصف السادس</SelectItem>
                    <SelectItem value="ولي أمر علي حسين">ولي أمر علي حسين</SelectItem>
                    <SelectItem value="ولي أمر فاطمة حسين">ولي أمر فاطمة حسين</SelectItem>
                    <SelectItem value="ولي أمر أحمد علي">ولي أمر أحمد علي</SelectItem>
                    <SelectItem value="جميع المدرسين">جميع المدرسين</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Subject */}
              <div>
                <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5 dark:text-gray-300"><Mail className="h-3.5 w-3.5 text-teal-500" />الموضوع</label>
                <Input
                  placeholder="موضوع الرسالة"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                />
              </div>

              {/* Message Body - Enhanced with character counter */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium flex items-center gap-1.5 dark:text-gray-300"><FileText className="h-3.5 w-3.5 text-teal-500" />نص الرسالة</label>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          background: charPercentage > 90 ? 'linear-gradient(90deg, #ef4444, #dc2626)' :
                            charPercentage > 70 ? 'linear-gradient(90deg, #f59e0b, #d97706)' :
                            'linear-gradient(90deg, #0d9488, #059669)',
                          width: `${charPercentage}%`,
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${charPercentage}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <span className={`text-[10px] font-mono ${
                      charPercentage > 90 ? 'text-red-500 dark:text-red-400' :
                      charPercentage > 70 ? 'text-amber-500 dark:text-amber-400' :
                      'text-muted-foreground'
                    }`}>
                      {charCount}/{MAX_CHARS}
                    </span>
                  </div>
                </div>
                <Textarea
                  placeholder="اكتب رسالتك هنا..."
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value.slice(0, MAX_CHARS))}
                  rows={8}
                  className="resize-none"
                />
              </div>

              {/* File Attachment Area - Enhanced with dashed border and upload icon */}
              <div>
                <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5 dark:text-gray-300"><Paperclip className="h-3.5 w-3.5 text-teal-500" />المرفقات</label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:border-teal-400 dark:hover:border-teal-600 hover:bg-teal-50/30 dark:hover:bg-teal-950/10 transition-all duration-200 cursor-pointer group">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-teal-100 dark:group-hover:bg-teal-900/30 transition-colors">
                      <Upload className="h-5 w-5 text-gray-400 group-hover:text-teal-500 dark:group-hover:text-teal-400 transition-colors" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">اسحب الملفات هنا أو انقر للرفع</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">PDF, DOC, Images - حد أقصى 5 ميجا</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5 dark:text-gray-300"><AlertTriangle className="h-3.5 w-3.5 text-teal-500" />الأولوية</label>
                <Select value={composePriority} onValueChange={setComposePriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="عادي">عادي</SelectItem>
                    <SelectItem value="مهم">مهم</SelectItem>
                    <SelectItem value="عاجل">عاجل</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Send Button */}
              <Button
                className="w-full gap-2 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] py-5"
                style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}
                onClick={handleSendMessage}
              >
                <Send className="h-4 w-4" />
                إرسال الرسالة
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Announcements - Enhanced with gradient top strips, hover lift, empty state */}
        <TabsContent value="announcements" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold dark:text-gray-200">إعلانات المدرسة</h2>
            <Dialog open={announcementOpen} onOpenChange={setAnnouncementOpen}>
              <DialogTrigger asChild>
                <Button
                  className="gap-2 text-white shadow-md hover:shadow-xl transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}
                >
                  <Plus className="h-4 w-4" />
                  إضافة إعلان
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg" dir="rtl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg" style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}>
                      <Megaphone className="h-3.5 w-3.5 text-white" />
                    </div>
                    إضافة إعلان جديد
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">العنوان</label>
                    <Input
                      placeholder="عنوان الإعلان"
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">المحتوى</label>
                    <Textarea
                      placeholder="محتوى الإعلان..."
                      value={annContent}
                      onChange={(e) => setAnnContent(e.target.value)}
                      rows={5}
                      className="resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">الفئة المستهدفة</label>
                      <Select value={annTarget} onValueChange={setAnnTarget}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="جميع">جميع</SelectItem>
                          <SelectItem value="أولياء الأمور">أولياء الأمور</SelectItem>
                          <SelectItem value="المدرسون">المدرسون</SelectItem>
                          <SelectItem value="الصف السادس">الصف السادس</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">الأولوية</label>
                      <Select value={annPriority} onValueChange={setAnnPriority}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="عادي">عادي</SelectItem>
                          <SelectItem value="مهم">مهم</SelectItem>
                          <SelectItem value="عاجل">عاجل</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button
                    className="gap-2 text-white shadow-md hover:shadow-xl transition-all hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}
                    onClick={handleAddAnnouncement}
                  >
                    <Megaphone className="h-4 w-4" />
                    نشر الإعلان
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <motion.div
            className="space-y-3"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {MOCK_ANNOUNCEMENTS.length === 0 ? (
              /* Empty state for announcements with illustration-style icon */
              <Card className="border-border/50 dark:bg-gray-900/50 dark:border-gray-700">
                <CardContent className="p-10 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                        <Megaphone className="h-9 w-9 text-amber-400 dark:text-amber-500" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
                        <Plus className="h-3.5 w-3.5 text-teal-500" />
                      </div>
                    </div>
                    <p className="text-muted-foreground font-medium">لا توجد إعلانات حالياً</p>
                    <p className="text-xs text-muted-foreground/70">يمكنك إضافة إعلان جديد بالضغط على الزر أعلاه</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              MOCK_ANNOUNCEMENTS.map((ann) => {
                const targetConf = TARGET_CONFIG[ann.target];
                const priorityConf = PRIORITY_CONFIG[ann.priority];
                return (
                  <motion.div
                    key={ann.id}
                    variants={itemVariants}
                    whileHover={{ y: -3, scale: 1.01 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <Card className={`border-border/50 overflow-hidden hover:shadow-lg transition-all duration-200 dark:bg-gray-900/50 dark:border-gray-700 ${
                      ann.priority === 'عاجل' ? 'border-r-4 border-r-red-500 dark:border-r-red-400' :
                      ann.priority === 'مهم' ? 'border-r-4 border-r-amber-500 dark:border-r-amber-400' :
                      'border-r-4 border-r-teal-400 dark:border-r-teal-600'
                    }`}>
                      {/* Gradient top strip - thicker and more prominent */}
                      <div className={`h-[2px] ${
                        ann.priority === 'عاجل' ? 'bg-gradient-to-l from-red-500 to-red-400' :
                        ann.priority === 'مهم' ? 'bg-gradient-to-l from-amber-500 to-amber-400' :
                        'bg-gradient-to-l from-teal-500 to-emerald-500'
                      }`} />
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <h3 className="font-semibold text-sm dark:text-gray-200">{ann.title}</h3>
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${targetConf.bg} ${targetConf.color}`}>
                                {ann.target}
                              </Badge>
                              {ann.priority !== 'عادي' && (
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${priorityConf.bg} ${priorityConf.color}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${priorityConf.dot} inline-block ml-1`} />
                                  {ann.priority}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{ann.content}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[11px] text-muted-foreground">{ann.date}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Message Detail Dialog - Enhanced with gradient border, avatars, timestamps, reply */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden" dir="rtl">
          {selectedMessage && (() => {
            const typeConf = TYPE_CONFIG[selectedMessage.type];
            const priorityConf = PRIORITY_CONFIG[selectedMessage.priority];
            const TypeIcon = typeConf.icon;
            return (
              <div className="relative">
                {/* Decorative gradient border - top */}
                <div className="h-[3px]" style={{ background: 'linear-gradient(90deg, #0d9488, #059669, #0d9488)' }} />
                {/* Decorative gradient border - sides */}
                <div className="absolute top-0 bottom-0 right-0 w-[3px]" style={{ background: 'linear-gradient(180deg, #0d9488, #059669)' }} />
                <div className="absolute top-0 bottom-0 left-0 w-[3px]" style={{ background: 'linear-gradient(180deg, #0d9488, #059669)' }} />

                <div className="p-6 pt-5">
                  <DialogHeader>
                    <DialogTitle className="text-base dark:text-gray-200">{selectedMessage.subject}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-3">
                    {/* Sender/Recipient Info with Avatars */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          <Avatar className="w-10 h-10 shadow-md ring-2 ring-teal-100 dark:ring-teal-900" style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}>
                            <AvatarFallback className="text-white text-xs font-bold bg-transparent">
                              {getInitials(selectedMessage.sender)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div>
                          <p className="font-semibold text-sm dark:text-gray-200">{selectedMessage.sender}</p>
                          <p className="text-[11px] text-muted-foreground">{selectedMessage.senderRole}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <ArrowUpRight className="h-3.5 w-3.5 rotate-180" />
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div>
                          <p className="font-semibold text-sm text-right dark:text-gray-200">{selectedMessage.recipient}</p>
                          <p className="text-[11px] text-muted-foreground text-right">{selectedMessage.recipientRole}</p>
                        </div>
                        <Avatar className="w-10 h-10 shadow-md ring-2 ring-sky-100 dark:ring-sky-900" style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' }}>
                          <AvatarFallback className="text-white text-xs font-bold bg-transparent">
                            {getInitials(selectedMessage.recipient)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>

                    {/* Type and Priority Badges + Timestamp */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${typeConf.bg} ${typeConf.color} ${typeConf.border}`}>
                          <TypeIcon className="h-3 w-3 ml-1" />
                          {selectedMessage.type}
                        </Badge>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${priorityConf.bg} ${priorityConf.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${priorityConf.dot} inline-block ml-1`} />
                          {selectedMessage.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground dark:text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{selectedMessage.date}</span>
                        <span className="text-muted-foreground/50">•</span>
                        <span>{selectedMessage.time}</span>
                      </div>
                    </div>

                    <Separator />

                    {/* Message Content with preserved line breaks */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 max-h-60 overflow-y-auto">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 dark:text-gray-200">
                        {selectedMessage.content}
                      </div>
                    </div>

                    <Separator />

                    {/* Read Status + Reply/Star */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {selectedMessage.read ? (
                          <>
                            <CheckCheck className="h-4 w-4 text-teal-500" />
                            مقروء
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 text-muted-foreground" />
                            غير مقروء
                          </>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 border-teal-200 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-400 dark:hover:bg-teal-950/30"
                          onClick={() => setShowReplyArea(!showReplyArea)}
                        >
                          <Reply className="h-3.5 w-3.5" />
                          رد
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                        >
                          <Star className="h-3.5 w-3.5" />
                          تمييز
                        </Button>
                      </div>
                    </div>

                    {/* Reply Area */}
                    <AnimatePresence>
                      {showReplyArea && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Card className="border-teal-200 dark:border-teal-800 bg-teal-50/30 dark:bg-teal-950/10 overflow-hidden">
                            <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, #0d9488, #059669)' }} />
                            <CardContent className="p-3 space-y-3">
                              <div className="flex items-center gap-2">
                                <Reply className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                                <span className="text-xs font-medium text-teal-700 dark:text-teal-300">رد على: {selectedMessage.sender}</span>
                              </div>
                              <Textarea
                                placeholder="اكتب ردك هنا..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                rows={3}
                                className="resize-none bg-white dark:bg-gray-900"
                              />
                              <div className="flex items-center justify-between">
                                <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setShowReplyArea(false)}>
                                  <X className="h-3.5 w-3.5 ml-1" />
                                  إلغاء
                                </Button>
                                <Button
                                  size="sm"
                                  className="gap-1.5 text-white shadow-md"
                                  style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}
                                  onClick={handleReply}
                                  disabled={!replyText.trim()}
                                >
                                  <Send className="h-3.5 w-3.5" />
                                  إرسال الرد
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Compose Dialog (from header button) */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden" dir="rtl">
          <div className="relative">
            {/* Decorative gradient border */}
            <div className="h-[3px]" style={{ background: 'linear-gradient(90deg, #0d9488, #059669, #0d9488)' }} />
            <div className="absolute top-0 bottom-0 right-0 w-[3px]" style={{ background: 'linear-gradient(180deg, #0d9488, #059669)' }} />
            <div className="absolute top-0 bottom-0 left-0 w-[3px]" style={{ background: 'linear-gradient(180deg, #0d9488, #059669)' }} />

            <div className="p-6 pt-5">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg" style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}>
                    <Send className="h-3.5 w-3.5 text-white" />
                  </div>
                  رسالة جديدة
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">قالب الرسالة</label>
                  <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                    <SelectTrigger>
                      <BookOpen className="h-4 w-4 ml-2 text-muted-foreground" />
                      <SelectValue placeholder="اختر قالباً جاهزاً..." />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_TEMPLATES.map(t => (
                        <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">المستلم</label>
                  <Select value={composeRecipient} onValueChange={setComposeRecipient}>
                    <SelectTrigger>
                      <User className="h-4 w-4 ml-2 text-muted-foreground" />
                      <SelectValue placeholder="اختر المستلم..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="جميع أولياء الأمور">جميع أولياء الأمور</SelectItem>
                      <SelectItem value="أولياء أمور الرابع">أولياء أمور الصف الرابع</SelectItem>
                      <SelectItem value="أولياء أمور الخامس">أولياء أمور الصف الخامس</SelectItem>
                      <SelectItem value="أولياء أمور السادس">أولياء أمور الصف السادس</SelectItem>
                      <SelectItem value="ولي أمر علي حسين">ولي أمر علي حسين</SelectItem>
                      <SelectItem value="ولي أمر فاطمة حسين">ولي أمر فاطمة حسين</SelectItem>
                      <SelectItem value="جميع المدرسين">جميع المدرسين</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">الموضوع</label>
                  <Input
                    placeholder="موضوع الرسالة"
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">نص الرسالة</label>
                  <Textarea
                    placeholder="اكتب رسالتك هنا..."
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    rows={6}
                    className="resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">الأولوية</label>
                    <Select value={composePriority} onValueChange={setComposePriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="عادي">عادي</SelectItem>
                        <SelectItem value="مهم">مهم</SelectItem>
                        <SelectItem value="عاجل">عاجل</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button variant="outline" className="gap-2 w-full" type="button">
                      <Paperclip className="h-4 w-4" />
                      مرفقات
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button
                  className="gap-2 text-white shadow-md hover:shadow-xl transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}
                  onClick={handleSendMessage}
                >
                  <Send className="h-4 w-4" />
                  إرسال
                </Button>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
