'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Search, Filter, Plus, Send, Paperclip,
  Mail, Bell, AlertTriangle, HelpCircle, Clock, Check,
  CheckCheck, User, Users, BookOpen, FileText, Megaphone,
  X, ChevronLeft, Star,
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
    subject: 'سلوك needs متابعة', preview: 'نرجو الحضور لمناقشة سلوك ابنكم...', content: 'السلام عليكم،\n\nنرجو الحضور للمدرسة لمناقشة بعض الملاحظات السلوكية حول ابنكم حسين في الفترة الأخيرة. نفضل الحضور يوم الأحد أو الاثنين.\n\nأ. مرتضى صالح',
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

// Message type config
const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  'رسالة': { icon: Mail, color: 'text-teal-700 dark:text-teal-300', bg: 'bg-teal-50 dark:bg-teal-900/30', border: 'border-teal-200 dark:border-teal-700' },
  'إشعار': { icon: Bell, color: 'text-sky-700 dark:text-sky-300', bg: 'bg-sky-50 dark:bg-sky-900/30', border: 'border-sky-200 dark:border-sky-700' },
  'تنبيه': { icon: AlertTriangle, color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-200 dark:border-amber-700' },
  'طلب': { icon: HelpCircle, color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-50 dark:bg-purple-900/30', border: 'border-purple-200 dark:border-purple-700' },
};

// Priority config
const PRIORITY_CONFIG: Record<string, { color: string; bg: string; dot: string }> = {
  'عادي': { color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800', dot: 'bg-gray-400' },
  'مهم': { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', dot: 'bg-amber-500' },
  'عاجل': { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', dot: 'bg-red-500' },
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

  // Stats
  const totalMessages = MOCK_MESSAGES.length;
  const unreadMessages = MOCK_MESSAGES.filter(m => !m.read).length;
  const todayMessages = MOCK_MESSAGES.filter(m => m.date === '2025/03/02').length;
  const contacts = [...new Set(MOCK_MESSAGES.map(m => m.sender))].length + [...new Set(MOCK_MESSAGES.map(m => m.recipient))].length;

  // Filter messages
  const filteredMessages = MOCK_MESSAGES.filter(m => {
    const matchesSearch = searchQuery === '' ||
      m.sender.includes(searchQuery) ||
      m.subject.includes(searchQuery) ||
      m.preview.includes(searchQuery);
    const matchesType = typeFilter === 'all' || m.type === typeFilter;
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'مقروء' && m.read) ||
      (statusFilter === 'غير مقروء' && !m.read);
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleMessageClick = (msg: Message) => {
    setSelectedMessage(msg);
    setMessageDialogOpen(true);
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

  const getInitials = (name: string) => {
    return name.replace('أ. ', '').split(' ').map(w => w[0]).join('').slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-11 h-11 rounded-xl shadow-lg"
            style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}
          >
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">التواصل والرسائل</h1>
            <p className="text-sm text-muted-foreground">إدارة التواصل بين المدرسة وأولياء الأمور</p>
          </div>
        </div>
        <Button
          onClick={() => setComposeOpen(true)}
          className="gap-2 text-white shadow-lg hover:shadow-xl transition-shadow"
          style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}
        >
          <Plus className="h-4 w-4" />
          رسالة جديدة
        </Button>
      </div>

      {/* Summary Cards */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {[
          { label: 'إجمالي الرسائل', value: totalMessages, icon: Mail, gradient: 'from-teal-500 to-teal-600' },
          { label: 'غير مقروءة', value: unreadMessages, icon: Bell, gradient: 'from-amber-500 to-amber-600' },
          { label: 'رسائل اليوم', value: todayMessages, icon: Clock, gradient: 'from-emerald-500 to-emerald-600' },
          { label: 'جهات الاتصال', value: contacts, icon: Users, gradient: 'from-cyan-500 to-cyan-600' },
        ].map((stat, idx) => (
          <motion.div key={stat.label} variants={itemVariants}>
            <Card className="border-border/50 overflow-hidden relative">
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-l ${stat.gradient}`} />
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-md`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-lg">
          <TabsTrigger value="messages" className="gap-2">
            <Mail className="h-4 w-4" />
            الرسائل
          </TabsTrigger>
          <TabsTrigger value="compose" className="gap-2">
            <Send className="h-4 w-4" />
            إرسال رسالة
          </TabsTrigger>
          <TabsTrigger value="announcements" className="gap-2">
            <Megaphone className="h-4 w-4" />
            الإعلانات
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Messages */}
        <TabsContent value="messages" className="space-y-4">
          {/* Search & Filters */}
          <Card className="border-border/50 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-l from-teal-500 to-emerald-500" />
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
              </div>
            </CardContent>
          </Card>

          {/* Message List */}
          <motion.div
            className="space-y-2"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {filteredMessages.length === 0 ? (
              <Card className="border-border/50">
                <CardContent className="p-8 text-center">
                  <Mail className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground">لا توجد رسائل مطابقة للبحث</p>
                </CardContent>
              </Card>
            ) : (
              filteredMessages.map((msg) => {
                const typeConf = TYPE_CONFIG[msg.type];
                const priorityConf = PRIORITY_CONFIG[msg.priority];
                const TypeIcon = typeConf.icon;
                return (
                  <motion.div key={msg.id} variants={itemVariants}>
                    <Card
                      className={`border-border/50 cursor-pointer hover:shadow-md transition-all duration-200 overflow-hidden ${
                        !msg.read ? 'border-r-4 border-r-teal-500 dark:border-r-teal-400' : ''
                      }`}
                      onClick={() => handleMessageClick(msg)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="w-10 h-10 shrink-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}>
                            <AvatarFallback className="text-white text-xs font-bold bg-transparent">
                              {getInitials(msg.sender)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`font-semibold text-sm truncate ${!msg.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                  {msg.sender}
                                </span>
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 shrink-0 ${typeConf.bg} ${typeConf.color} ${typeConf.border}`}>
                                  {msg.type}
                                </Badge>
                                {msg.priority !== 'عادي' && (
                                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 shrink-0 ${priorityConf.bg} ${priorityConf.color}`}>
                                    {msg.priority}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {!msg.read && (
                                  <div className="w-2 h-2 rounded-full bg-teal-500" />
                                )}
                                <span className="text-[11px] text-muted-foreground">{msg.time}</span>
                              </div>
                            </div>
                            <p className={`text-sm mb-0.5 truncate ${!msg.read ? 'font-medium' : 'text-muted-foreground'}`}>
                              {msg.subject}
                            </p>
                            <p className="text-xs text-muted-foreground/70 truncate">
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

        {/* Tab 2: Compose */}
        <TabsContent value="compose" className="space-y-4">
          <Card className="border-border/50 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-l from-teal-500 to-emerald-500" />
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Send className="h-4 w-4" style={{ color: '#0d9488' }} />
                إرسال رسالة جديدة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Template Selector */}
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

              <Separator />

              {/* Recipient */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">المستلم</label>
                <Select value={composeRecipient} onValueChange={setComposeRecipient}>
                  <SelectTrigger>
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
                <label className="text-sm font-medium mb-1.5 block">الموضوع</label>
                <Input
                  placeholder="موضوع الرسالة"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                />
              </div>

              {/* Message Body */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">نص الرسالة</label>
                <Textarea
                  placeholder="اكتب رسالتك هنا..."
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
              </div>

              {/* Priority + Attachment */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
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
                  <Button variant="outline" className="gap-2" type="button">
                    <Paperclip className="h-4 w-4" />
                    مرفقات
                  </Button>
                </div>
              </div>

              {/* Send Button */}
              <Button
                className="w-full gap-2 text-white shadow-lg hover:shadow-xl transition-shadow py-5"
                style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}
                onClick={handleSendMessage}
              >
                <Send className="h-4 w-4" />
                إرسال الرسالة
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Announcements */}
        <TabsContent value="announcements" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">إعلانات المدرسة</h2>
            <Dialog open={announcementOpen} onOpenChange={setAnnouncementOpen}>
              <DialogTrigger asChild>
                <Button
                  className="gap-2 text-white shadow-md"
                  style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}
                >
                  <Plus className="h-4 w-4" />
                  إضافة إعلان
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg" dir="rtl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Megaphone className="h-5 w-5" style={{ color: '#0d9488' }} />
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
                    className="gap-2 text-white"
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
            {MOCK_ANNOUNCEMENTS.map((ann) => {
              const targetConf = TARGET_CONFIG[ann.target];
              const priorityConf = PRIORITY_CONFIG[ann.priority];
              return (
                <motion.div key={ann.id} variants={itemVariants}>
                  <Card className="border-border/50 overflow-hidden hover:shadow-md transition-shadow">
                    <div className={`absolute top-0 left-0 right-0 h-1 ${
                      ann.priority === 'عاجل' ? 'bg-gradient-to-l from-red-500 to-red-400' :
                      ann.priority === 'مهم' ? 'bg-gradient-to-l from-amber-500 to-amber-400' :
                      'bg-gradient-to-l from-teal-500 to-emerald-500'
                    }`} />
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <h3 className="font-semibold text-sm">{ann.title}</h3>
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
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[11px] text-muted-foreground">{ann.date}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Message Detail Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          {selectedMessage && (() => {
            const typeConf = TYPE_CONFIG[selectedMessage.type];
            const priorityConf = PRIORITY_CONFIG[selectedMessage.priority];
            const TypeIcon = typeConf.icon;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="text-base">{selectedMessage.subject}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 shadow-sm" style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}>
                      <AvatarFallback className="text-white text-xs font-bold bg-transparent">
                        {getInitials(selectedMessage.sender)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{selectedMessage.sender}</p>
                      <p className="text-xs text-muted-foreground">{selectedMessage.senderRole}</p>
                    </div>
                    <div className="mr-auto flex items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${typeConf.bg} ${typeConf.color} ${typeConf.border}`}>
                        <TypeIcon className="h-3 w-3 ml-1" />
                        {selectedMessage.type}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${priorityConf.bg} ${priorityConf.color}`}>
                        {selectedMessage.priority}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>إلى: {selectedMessage.recipient}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{selectedMessage.date} - {selectedMessage.time}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                    {selectedMessage.content}
                  </div>

                  <Separator />

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
                        className="gap-1.5"
                        onClick={() => {
                          setComposeSubject(`رد: ${selectedMessage.subject}`);
                          setComposeRecipient(selectedMessage.sender);
                          setMessageDialogOpen(false);
                          setActiveTab('compose');
                          setComposeOpen(false);
                        }}
                      >
                        <Send className="h-3.5 w-3.5" />
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
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Compose Dialog (from header button) */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" style={{ color: '#0d9488' }} />
              رسالة جديدة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
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
              className="gap-2 text-white"
              style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}
              onClick={handleSendMessage}
            >
              <Send className="h-4 w-4" />
              إرسال
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
