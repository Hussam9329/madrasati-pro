import { NextRequest, NextResponse } from 'next/server';

// Mock data for messages
const messages = [
  {
    id: 1,
    sender: 'أ. أحمد كاظم',
    senderRole: 'مدرس',
    recipient: 'ولي أمر علي حسين',
    recipientRole: 'ولي أمر',
    subject: 'إشعار غياب الطالب',
    preview: 'نود إعلامكم بأن ابنكم لم يحضر اليوم...',
    content: 'السلام عليكم،\n\nنود إعلامكم بأن ابنكم علي لم يحضر إلى المدرسة اليوم يوم الأحد الموافق 2025/03/02. نرجو التواصل مع إدارة المدرسة لتوضيح سبب الغياب.\n\nمع التحية\nأ. أحمد كاظم',
    time: '09:30',
    date: '2025/03/02',
    type: 'إشعار',
    read: false,
    priority: 'مهم',
  },
  {
    id: 2,
    sender: 'أ. مصطفى جواد',
    senderRole: 'مدرس',
    recipient: 'ولي أمر فاطمة حسين',
    recipientRole: 'ولي أمر',
    subject: 'نتائج امتحان الرياضيات',
    preview: 'نتشرف بإعلامكم بنتيجة ابنكم في...',
    content: 'السلام عليكم،\n\nنتشرف بإعلامكم بنتيجة ابنتكم فاطمة في امتحان الرياضيات للشهر الأول. حققت درجة 92/100 وهي من الأوائل في الصف.\n\nبارك الله فيها.\nأ. مصطفى جواد',
    time: '10:15',
    date: '2025/03/02',
    type: 'رسالة',
    read: false,
    priority: 'عادي',
  },
  {
    id: 3,
    sender: 'إدارة المدرسة',
    senderRole: 'إدارة',
    recipient: 'جميع أولياء الأمور',
    recipientRole: 'ولي أمر',
    subject: 'اجتماع أولياء الأمور',
    preview: 'يسر إدارة المدرسة دعوتكم لحضور...',
    content: 'السلام عليكم ورحمة الله،\n\nيسر إدارة المدرسة دعوتكم لحضور اجتماع أولياء الأمور السنوي الذي سيقام يوم الخميس الموافق 2025/03/06 في قاعة المدرسة الرئيسية الساعة العاشرة صباحاً.\n\nنأمل حضوركم للتباحث حول سير العملية التعليمية.\n\nمع التقدير\nإدارة المدرسة',
    time: '11:00',
    date: '2025/03/01',
    type: 'تنبيه',
    read: false,
    priority: 'عاجل',
  },
];

const templates = [
  {
    id: 1,
    name: 'إشعار غياب',
    subject: 'إشعار غياب الطالب',
    content: 'السلام عليكم،\n\nنود إعلامكم بأن ابنكم/ابنتكم لم يحضر/تحضر إلى المدرسة اليوم. نرجو التواصل مع إدارة المدرسة لتوضيح سبب الغياب.\n\nمع التحية',
  },
  {
    id: 2,
    name: 'نتائج الامتحانات',
    subject: 'نتائج الامتحانات',
    content: 'السلام عليكم،\n\nنتشرف بإعلامكم بنتيجة ابنكم/ابنتكم في امتحان [المادة] للفترة [الفترة]. حقق/حققت درجة [الدرجة]/100.\n\nمع التحية',
  },
  {
    id: 3,
    name: 'اجتماع أولياء الأمور',
    subject: 'دعوة لحضور اجتماع أولياء الأمور',
    content: 'السلام عليكم ورحمة الله،\n\nيسر إدارة المدرسة دعوتكم لحضور اجتماع أولياء الأمور الذي سيقام يوم [التاريخ] في [المكان] الساعة [الوقت].\n\nنأمل حضوركم.',
  },
  {
    id: 4,
    name: 'رسوم مدرسية',
    subject: 'تذكير بالرسوم المدرسية',
    content: 'السلام عليكم،\n\nنود تذكيركم بضرورة سداد الرسوم المدرسية للفصل الدراسي الحالي قبل تاريخ [التاريخ]. يرجى مراجعة شؤون الطلاب.\n\nإدارة المدرسة',
  },
  {
    id: 5,
    name: 'إعلان عام',
    subject: 'إعلان عام',
    content: 'السلام عليكم،\n\n[محتوى الإعلان]\n\nمع التقدير\nإدارة المدرسة',
  },
];

const announcements = [
  {
    id: 1,
    title: 'بدء التسجيل للعام الدراسي الجديد',
    content: 'يسر إدارة المدرسة الإعلان عن بدء التسجيل للعام الدراسي 2026-2027.',
    date: '2025/03/02',
    target: 'جميع',
    priority: 'مهم',
  },
  {
    id: 2,
    title: 'إجازة عيد الفطر المبارك',
    content: 'تبدأ إجازة عيد الفطر المبارك وتستمر لمدة أسبوع.',
    date: '2025/03/01',
    target: 'جميع',
    priority: 'عاجل',
  },
  {
    id: 3,
    title: 'موعد اجتماع أولياء الأمور',
    content: 'سيقام اجتماع أولياء الأمور يوم الخميس القادم.',
    date: '2025/02/28',
    target: 'أولياء الأمور',
    priority: 'مهم',
  },
];

// In-memory store for new messages
const sentMessages: Array<Record<string, string>> = [];

export async function GET() {
  return NextResponse.json({
    messages: [...messages, ...sentMessages],
    templates,
    announcements,
    stats: {
      total: messages.length + sentMessages.length,
      unread: messages.filter(m => !m.read).length,
      today: messages.filter(m => m.date === '2025/03/02').length,
      contacts: 12,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipient, subject, content, priority, type } = body;

    if (!recipient || !subject || !content) {
      return NextResponse.json(
        { error: 'recipient, subject, and content are required' },
        { status: 400 }
      );
    }

    const newMessage = {
      id: messages.length + sentMessages.length + 1,
      sender: 'المستخدم الحالي',
      senderRole: 'مدرس',
      recipient,
      recipientRole: 'ولي أمر',
      subject,
      preview: content.substring(0, 60) + '...',
      content,
      time: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toISOString().split('T')[0],
      type: type || 'رسالة',
      read: false,
      priority: priority || 'عادي',
    };

    sentMessages.push(newMessage);

    return NextResponse.json({ success: true, message: newMessage }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
