'use client';

import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  Upload,
  Users,
  GraduationCap,
  ClipboardCheck,
  BookOpen,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  Trash2,
  Eye,
  ArrowLeft,
  RefreshCw,
  Clock,
  ChevronDown,
  FileText,
  Database,
  Search,
  Filter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// ─── Types ───────────────────────────────────────────────────────────
type ImportType = 'students' | 'grades' | 'attendance' | 'teachers';

interface ImportTypeConfig {
  key: ImportType;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  gradientFrom: string;
  gradientTo: string;
}

interface UploadedFile {
  name: string;
  size: number;
  type: string;
}

interface ColumnMapping {
  csvColumn: string;
  systemField: string;
  valid: boolean;
}

interface ImportRecord {
  id: number;
  date: string;
  type: ImportType;
  typeName: string;
  recordsCount: number;
  successCount: number;
  failCount: number;
  status: 'مكتمل' | 'فاشل' | 'جزئي';
  fileName: string;
  details: string;
}

// ─── Constants ───────────────────────────────────────────────────────
const IMPORT_TYPES: ImportTypeConfig[] = [
  {
    key: 'students',
    label: 'استيراد الطلاب',
    description: 'استيراد بيانات الطلاب بشكل جماعي',
    icon: Users,
    color: 'text-blue-600 dark:text-blue-400',
    gradientFrom: '#3b82f6',
    gradientTo: '#0d9488',
  },
  {
    key: 'grades',
    label: 'استيراد الدرجات',
    description: 'استيراد درجات الامتحانات والاختبارات',
    icon: GraduationCap,
    color: 'text-emerald-600 dark:text-emerald-400',
    gradientFrom: '#059669',
    gradientTo: '#0d9488',
  },
  {
    key: 'attendance',
    label: 'استيراد الحضور',
    description: 'استيراد سجلات الحضور والغياب',
    icon: ClipboardCheck,
    color: 'text-amber-600 dark:text-amber-400',
    gradientFrom: '#f59e0b',
    gradientTo: '#0d9488',
  },
  {
    key: 'teachers',
    label: 'استيراد المعلمين',
    description: 'استيراد بيانات المدرسين والموظفين',
    icon: BookOpen,
    color: 'text-purple-600 dark:text-purple-400',
    gradientFrom: '#8b5cf6',
    gradientTo: '#0d9488',
  },
];

const SYSTEM_FIELDS: Record<ImportType, { key: string; label: string; required: boolean }[]> = {
  students: [
    { key: 'name', label: 'اسم الطالب', required: true },
    { key: 'gender', label: 'الجنس', required: true },
    { key: 'class', label: 'الصف', required: true },
    { key: 'section', label: 'الشعبة', required: false },
    { key: 'studentNumber', label: 'رقم الطالب', required: false },
    { key: 'parentName', label: 'اسم ولي الأمر', required: false },
    { key: 'parentPhone', label: 'هاتف ولي الأمر', required: false },
    { key: 'address', label: 'العنوان', required: false },
    { key: 'birthDate', label: 'تاريخ الميلاد', required: false },
  ],
  grades: [
    { key: 'studentName', label: 'اسم الطالب', required: true },
    { key: 'studentNumber', label: 'رقم الطالب', required: true },
    { key: 'subject', label: 'المادة', required: true },
    { key: 'examType', label: 'نوع الامتحان', required: true },
    { key: 'score', label: 'الدرجة', required: true },
    { key: 'maxScore', label: 'الدرجة العظمى', required: false },
    { key: 'date', label: 'التاريخ', required: false },
    { key: 'notes', label: 'ملاحظات', required: false },
  ],
  attendance: [
    { key: 'studentName', label: 'اسم الطالب', required: true },
    { key: 'studentNumber', label: 'رقم الطالب', required: true },
    { key: 'date', label: 'التاريخ', required: true },
    { key: 'status', label: 'الحالة', required: true },
    { key: 'checkInTime', label: 'وقت الحضور', required: false },
    { key: 'checkOutTime', label: 'وقت الانصراف', required: false },
    { key: 'notes', label: 'ملاحظات', required: false },
  ],
  teachers: [
    { key: 'name', label: 'اسم المعلم', required: true },
    { key: 'specialty', label: 'التخصص', required: true },
    { key: 'phone', label: 'الهاتف', required: false },
    { key: 'email', label: 'البريد الإلكتروني', required: false },
    { key: 'subject', label: 'المادة', required: false },
    { key: 'classes', label: 'الصفوف', required: false },
    { key: 'address', label: 'العنوان', required: false },
  ],
};

const CSV_TEMPLATES: Record<ImportType, string[]> = {
  students: ['اسم الطالب', 'الجنس', 'الصف', 'الشعبة', 'رقم الطالب', 'اسم ولي الأمر', 'هاتف ولي الأمر', 'العنوان', 'تاريخ الميلاد'],
  grades: ['اسم الطالب', 'رقم الطالب', 'المادة', 'نوع الامتحان', 'الدرجة', 'الدرجة العظمى', 'التاريخ', 'ملاحظات'],
  attendance: ['اسم الطالب', 'رقم الطالب', 'التاريخ', 'الحالة', 'وقت الحضور', 'وقت الانصراف', 'ملاحظات'],
  teachers: ['اسم المعلم', 'التخصص', 'الهاتف', 'البريد الإلكتروني', 'المادة', 'الصفوف', 'العنوان'],
};

const MOCK_PREVIEW_DATA: Record<ImportType, string[][]> = {
  students: [
    ['أحمد محمد علي', 'ذكر', 'السادس', 'أ', 'STU001', 'محمد علي', '07701234567', 'بغداد/الكرادة', '2012-03-15'],
    ['فاطمة حسين جاسم', 'أنثى', 'الخامس', 'ب', 'STU002', 'حسين جاسم', '07702345678', 'بغداد/المنصور', '2013-07-22'],
    ['عمر ياسر خالد', 'ذكر', 'الرابع', 'أ', 'STU003', 'ياسر خالد', '07703456789', 'بغداد/الدورة', '2014-01-10'],
    ['زينب عبد الله', 'أنثى', 'السادس', 'ب', 'STU004', 'عبد الله محمود', '07704567890', 'بغداد/الحارثية', '2012-11-05'],
    ['بلال صالح أحمد', 'ذكر', 'الثالث', 'أ', 'STU005', 'صالح أحمد', '07705678901', 'بغداد/البياع', '2015-09-18'],
  ],
  grades: [
    ['أحمد محمد علي', 'STU001', 'الرياضيات', 'شهر أول', '85', '100', '2025-01-15', ''],
    ['فاطمة حسين جاسم', 'STU002', 'العلوم', 'نصف سنة', '92', '100', '2025-01-14', 'ممتاز'],
    ['عمر ياسر خالد', 'STU003', 'اللغة العربية', 'شهر أول', '78', '100', '2025-01-15', ''],
    ['زينب عبد الله', 'STU004', 'اللغة الإنجليزية', 'شهر أول', '65', '100', '2025-01-13', 'يحتاج متابعة'],
    ['بلال صالح أحمد', 'STU005', 'الفيزياء', 'نصف سنة', '45', '100', '2025-01-14', 'راسب'],
  ],
  attendance: [
    ['أحمد محمد علي', 'STU001', '2025-01-15', 'حاضر', '08:00', '13:15', ''],
    ['فاطمة حسين جاسم', 'STU002', '2025-01-15', 'متأخر', '08:25', '13:15', 'تأخر 25 دقيقة'],
    ['عمر ياسر خالد', 'STU003', '2025-01-15', 'غائب', '', '', 'بدون عذر'],
    ['زينب عبد الله', 'STU004', '2025-01-15', 'حاضر', '07:55', '13:10', ''],
    ['بلال صالح أحمد', 'STU005', '2025-01-15', 'مستأذن', '08:00', '11:30', 'خروج مبكر'],
  ],
  teachers: [
    ['د. محمد عبد الرحمن', 'رياضيات', '07701112233', 'm.math@school.iq', 'الرياضيات', 'السادس، الخامس', 'بغداد/الكرادة'],
    ['أ. سعاد حسن', 'لغة عربية', '07702223344', 's.arabic@school.iq', 'اللغة العربية', 'الرابع، الثالث', 'بغداد/المنصور'],
    ['م. علي كاظم', 'فيزياء', '07703334455', 'a.physics@school.iq', 'الفيزياء', 'السادس', 'بغداد/الدورة'],
    ['أ. هدى صالح', 'لغة إنجليزية', '07704445566', 'h.english@school.iq', 'اللغة الإنجليزية', 'الخامس، الرابع', 'بغداد/الحارثية'],
    ['م. أحمد وليد', 'كيمياء', '07705556677', 'a.chem@school.iq', 'الكيمياء', 'السادس، الخامس', 'بغداد/البياع'],
  ],
};

const MOCK_IMPORT_HISTORY: ImportRecord[] = [
  { id: 1, date: '2025-03-01 09:15', type: 'students', typeName: 'استيراد الطلاب', recordsCount: 45, successCount: 43, failCount: 2, status: 'جزئي', fileName: 'students_2025.csv', details: 'سجلان بهما أخطاء في تنسيق التاريخ' },
  { id: 2, date: '2025-02-28 14:30', type: 'grades', typeName: 'استيراد الدرجات', recordsCount: 120, successCount: 120, failCount: 0, status: 'مكتمل', fileName: 'grades_term1.csv', details: 'تم استيراد جميع الدرجات بنجاح' },
  { id: 3, date: '2025-02-25 11:00', type: 'attendance', typeName: 'استيراد الحضور', recordsCount: 200, successCount: 195, failCount: 5, status: 'جزئي', fileName: 'attendance_week4.csv', details: '5 سجلات بأرقام طلاب غير موجودة' },
  { id: 4, date: '2025-02-20 08:45', type: 'teachers', typeName: 'استيراد المعلمين', recordsCount: 14, successCount: 14, failCount: 0, status: 'مكتمل', fileName: 'teachers_new.csv', details: 'تم استيراد جميع المعلمين بنجاح' },
  { id: 5, date: '2025-02-15 16:20', type: 'grades', typeName: 'استيراد الدرجات', recordsCount: 85, successCount: 0, failCount: 85, status: 'فاشل', fileName: 'grades_invalid.csv', details: 'تنسيق ملف غير صالح - أعمدة مفقودة' },
  { id: 6, date: '2025-02-10 10:00', type: 'students', typeName: 'استيراد الطلاب', recordsCount: 30, successCount: 30, failCount: 0, status: 'مكتمل', fileName: 'students_batch2.csv', details: 'تم استيراد جميع الطلاب بنجاح' },
  { id: 7, date: '2025-02-05 13:30', type: 'attendance', typeName: 'استيراد الحضور', recordsCount: 150, successCount: 148, failCount: 2, status: 'جزئي', fileName: 'attendance_week2.csv', details: 'سجلان بتواريخ غير صالحة' },
];

// ─── Helpers ─────────────────────────────────────────────────────────
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' بايت';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' كيلوبايت';
  return (bytes / (1024 * 1024)).toFixed(2) + ' ميجابايت';
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'مكتمل':
      return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700">{status}</Badge>;
    case 'فاشل':
      return <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700">{status}</Badge>;
    case 'جزئي':
      return <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700">{status}</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

const getTypeIcon = (type: ImportType) => {
  switch (type) {
    case 'students': return Users;
    case 'grades': return GraduationCap;
    case 'attendance': return ClipboardCheck;
    case 'teachers': return BookOpen;
  }
};

// ─── Component ───────────────────────────────────────────────────────
export default function DataImportPage() {
  const [selectedType, setSelectedType] = useState<ImportType | null>(null);
  const [activeTab, setActiveTab] = useState<'import' | 'history'>('import');
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [importComplete, setImportComplete] = useState(false);
  const [importSuccessCount, setImportSuccessCount] = useState(0);
  const [importFailCount, setImportFailCount] = useState(0);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── File Handling ───────────────────────────────────────────────
  const initializeColumnMappings = useCallback(() => {
    if (!selectedType) return;
    const headers = CSV_TEMPLATES[selectedType];
    const fields = SYSTEM_FIELDS[selectedType];
    const mappings: ColumnMapping[] = headers.map((h) => {
      const matchedField = fields.find(f => f.label === h);
      return {
        csvColumn: h,
        systemField: matchedField ? matchedField.key : '',
        valid: !!matchedField,
      };
    });
    setColumnMappings(mappings);
  }, [selectedType]);

  const handleFileSelect = useCallback((file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      return; // Max 5MB
    }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'csv' && ext !== 'xlsx') {
      return;
    }
    setUploadedFile({
      name: file.name,
      size: file.size,
      type: ext.toUpperCase(),
    });
    setIsUploading(true);
    setShowPreview(false);
    setImportComplete(false);
    setImportProgress(0);

    // Simulate upload
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setIsUploading(false);
        setUploadProgress(100);
        // Show preview after upload
        setTimeout(() => {
          setShowPreview(true);
          initializeColumnMappings();
        }, 300);
      }
      setUploadProgress(Math.min(progress, 100));
    }, 200);
  }, [selectedType, initializeColumnMappings]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const removeFile = () => {
    setUploadedFile(null);
    setUploadProgress(0);
    setShowPreview(false);
    setImportComplete(false);
    setImportProgress(0);
    setColumnMappings([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ─── Import Logic ───────────────────────────────────────────────
  const startImport = () => {
    setIsImporting(true);
    setImportProgress(0);
    setImportComplete(false);

    let progress = 0;
    const totalRecords = 45;
    const interval = setInterval(() => {
      progress += Math.random() * 8 + 2;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setIsImporting(false);
        setImportComplete(true);
        setImportSuccessCount(43);
        setImportFailCount(2);
      }
      setImportProgress(Math.min(progress, 100));
    }, 150);
  };

  const resetImport = () => {
    setSelectedType(null);
    setUploadedFile(null);
    setUploadProgress(0);
    setShowPreview(false);
    setImportComplete(false);
    setImportProgress(0);
    setIsImporting(false);
    setColumnMappings([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ─── Template Download ──────────────────────────────────────────
  const downloadTemplate = (type: ImportType) => {
    const headers = CSV_TEMPLATES[type];
    const sampleRows = MOCK_PREVIEW_DATA[type];
    const bom = '\uFEFF';
    const csvContent = bom + [headers.join(','), ...sampleRows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `template_${type}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ─── Filtered History ───────────────────────────────────────────
  const filteredHistory = useMemo(() => {
    let records = MOCK_IMPORT_HISTORY;
    if (historySearch) {
      records = records.filter(r =>
        r.typeName.includes(historySearch) ||
        r.fileName.includes(historySearch) ||
        r.details.includes(historySearch)
      );
    }
    if (historyFilter !== 'all') {
      records = records.filter(r => r.status === historyFilter);
    }
    return records;
  }, [historySearch, historyFilter]);

  // ─── Animation Variants ─────────────────────────────────────────
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  // ─── Render ─────────────────────────────────────────────────────
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
      dir="rtl"
    >
      {/* ─── Header ──────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex items-start gap-4">
        <div
          className="flex items-center justify-center w-12 h-12 rounded-xl shadow-lg shrink-0"
          style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}
        >
          <Upload className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">استيراد البيانات</h1>
          <p className="text-sm text-muted-foreground mt-0.5">استيراد البيانات بشكل جماعي من ملفات CSV</p>
        </div>
      </motion.div>

      {/* ─── Tabs ────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'import' | 'history')}>
          <TabsList className="bg-muted/60 dark:bg-gray-800/60 h-10">
            <TabsTrigger value="import" className="gap-1.5 text-sm data-[state=active]:bg-teal-600 data-[state=active]:text-white">
              <Upload className="w-3.5 h-3.5" />
              استيراد جديد
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5 text-sm data-[state=active]:bg-teal-600 data-[state=active]:text-white">
              <Clock className="w-3.5 h-3.5" />
              سجل الاستيراد
            </TabsTrigger>
          </TabsList>

          {/* ─── Import Tab ──────────────────────────────────────── */}
          <TabsContent value="import" className="mt-6 space-y-6">
            {/* Step 1: Select Import Type */}
            {!selectedType ? (
              <motion.div variants={itemVariants} className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-900/30">
                    <span className="text-sm font-bold" style={{ color: '#0d9488' }}>1</span>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">اختر نوع الاستيراد</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {IMPORT_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <motion.div
                        key={type.key}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedType(type.key)}
                        className="relative cursor-pointer group overflow-hidden"
                      >
                        <Card className="border border-gray-200 dark:border-gray-700 hover:border-teal-400 dark:hover:border-teal-500 transition-all duration-300 shadow-sm hover:shadow-lg overflow-hidden">
                          {/* Gradient top strip */}
                          <div
                            className="h-1 w-full transition-all duration-300 group-hover:h-1.5"
                            style={{
                              background: `linear-gradient(90deg, ${type.gradientFrom}, ${type.gradientTo})`,
                            }}
                          />
                          <CardContent className="p-5">
                            <div className="flex items-start gap-4">
                              <div
                                className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0 transition-transform duration-300 group-hover:scale-110"
                                style={{
                                  background: `linear-gradient(135deg, ${type.gradientFrom}20, ${type.gradientTo}20)`,
                                }}
                              >
                                <Icon className={`w-6 h-6 ${type.color}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-0.5">{type.label}</h3>
                                <p className="text-xs text-muted-foreground">{type.description}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="shrink-0 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20"
                                onClick={(e) => { e.stopPropagation(); downloadTemplate(type.key); }}
                              >
                                <Download className="w-4 h-4 ml-1" />
                                نموذج
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Quick template download section */}
                <Card className="border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">تحميل نموذج CSV</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {IMPORT_TYPES.map((type) => {
                        const Icon = type.icon;
                        return (
                          <Button
                            key={type.key}
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs"
                            onClick={() => downloadTemplate(type.key)}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {type.label}
                          </Button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              /* Steps 2-4: File Upload, Preview, Import */
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                {/* Selected type indicator */}
                <div className="flex items-center justify-between bg-gradient-to-l from-teal-50 to-emerald-50/50 dark:from-teal-900/20 dark:to-emerald-900/10 p-4 rounded-xl border border-teal-200/60 dark:border-teal-700/40">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-800/40">
                      {React.createElement(getTypeIcon(selectedType), { className: 'w-4 h-4 text-teal-600 dark:text-teal-400' })}
                    </div>
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {IMPORT_TYPES.find(t => t.key === selectedType)?.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => downloadTemplate(selectedType)}
                    >
                      <Download className="w-3.5 h-3.5" />
                      تحميل نموذج CSV
                    </Button>
                    <Button variant="ghost" size="sm" onClick={resetImport} className="text-muted-foreground hover:text-red-600">
                      <ArrowLeft className="w-4 h-4 ml-1" />
                      رجوع
                    </Button>
                  </div>
                </div>

                {/* Step 2: File Upload */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-900/30">
                      <span className="text-sm font-bold" style={{ color: '#0d9488' }}>2</span>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">رفع الملف</h2>
                  </div>

                  {!uploadedFile ? (
                    /* Drag and drop zone */
                    <motion.div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`
                        relative cursor-pointer border-2 border-dashed rounded-2xl p-10 text-center
                        transition-all duration-300 group
                        ${isDragging
                          ? 'border-teal-500 bg-teal-50/60 dark:bg-teal-900/20 scale-[1.01] shadow-lg shadow-teal-200/40 dark:shadow-teal-800/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-teal-400 dark:hover:border-teal-500 bg-white dark:bg-gray-800/50 hover:bg-teal-50/30 dark:hover:bg-teal-900/10'
                        }
                      `}
                      whileHover={{ scale: 1.005 }}
                    >
                      {/* Glow effect on drag */}
                      {isDragging && (
                        <div
                          className="absolute inset-0 rounded-2xl opacity-30 pointer-events-none"
                          style={{
                            background: 'radial-gradient(circle at center, #0d9488, transparent 70%)',
                          }}
                        />
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.xlsx"
                        className="hidden"
                        onChange={handleInputChange}
                      />
                      <motion.div
                        animate={isDragging ? { y: -5, scale: 1.1 } : { y: 0, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col items-center gap-3 relative z-10"
                      >
                        <div
                          className="flex items-center justify-center w-16 h-16 rounded-2xl"
                          style={{
                            background: isDragging
                              ? 'linear-gradient(135deg, #0d9488, #059669)'
                              : 'linear-gradient(135deg, #0d948820, #05966920)',
                          }}
                        >
                          <Upload className={`w-8 h-8 ${isDragging ? 'text-white' : 'text-teal-600 dark:text-teal-400'}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-700 dark:text-gray-200">
                            {isDragging ? 'أفلت الملف هنا' : 'اسحب الملف هنا أو انقر للاختيار'}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            CSV, XLSX — الحد الأقصى: 5 ميجابايت
                          </p>
                        </div>
                      </motion.div>
                    </motion.div>
                  ) : (
                    /* File info display */
                    <Card className="border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #0d9488, #059669)' }} />
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="flex items-center justify-center w-10 h-10 rounded-xl"
                              style={{ background: 'linear-gradient(135deg, #0d948820, #05966920)' }}
                            >
                              <FileSpreadsheet className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                            </div>
                            <div>
                              <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{uploadedFile.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(uploadedFile.size)} • {uploadedFile.type}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isUploading ? (
                              <div className="flex items-center gap-2 min-w-[200px]">
                                <Progress value={uploadProgress} className="h-2 flex-1" />
                                <span className="text-xs text-muted-foreground whitespace-nowrap">{Math.round(uploadProgress)}%</span>
                              </div>
                            ) : (
                              <>
                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700 gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  تم الرفع
                                </Badge>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={removeFile}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Step 3: Data Preview & Column Mapping */}
                {showPreview && !importComplete && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-900/30">
                        <span className="text-sm font-bold" style={{ color: '#0d9488' }}>3</span>
                      </div>
                      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">معاينة البيانات وتعيين الأعمدة</h2>
                    </div>

                    {/* Row count summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Card className="border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, #0d9488, #059669)' }} />
                        <CardContent className="p-3 flex items-center gap-3">
                          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-teal-100 dark:bg-teal-900/30">
                            <Database className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">عدد السجلات</p>
                            <p className="text-lg font-bold text-gray-800 dark:text-gray-200">45</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="h-0.5 w-full bg-emerald-400" />
                        <CardContent className="p-3 flex items-center gap-3">
                          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">صالح</p>
                            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">43</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="h-0.5 w-full bg-red-400" />
                        <CardContent className="p-3 flex items-center gap-3">
                          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-red-100 dark:bg-red-900/30">
                            <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">غير صالح</p>
                            <p className="text-lg font-bold text-red-600 dark:text-red-400">2</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Column Mapping */}
                    <Card className="border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #0d9488, #059669)' }} />
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                          <Eye className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                          تعيين الأعمدة
                        </h3>
                        <div className="space-y-2">
                          {columnMappings.map((mapping, idx) => {
                            const fields = selectedType ? SYSTEM_FIELDS[selectedType] : [];
                            return (
                              <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <div className="flex items-center gap-2 min-w-[160px]">
                                  {mapping.valid ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                                  )}
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{mapping.csvColumn}</span>
                                </div>
                                <ArrowLeft className="w-4 h-4 text-muted-foreground shrink-0" />
                                <Select
                                  value={mapping.systemField}
                                  onValueChange={(val) => {
                                    const updated = [...columnMappings];
                                    updated[idx] = { ...mapping, systemField: val, valid: val !== '' };
                                    setColumnMappings(updated);
                                  }}
                                >
                                  <SelectTrigger className="w-[200px] h-8 text-sm">
                                    <SelectValue placeholder="اختر الحقل..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="">— غير محدد —</SelectItem>
                                    {fields.map((field) => (
                                      <SelectItem key={field.key} value={field.key}>
                                        {field.label}
                                        {field.required && <span className="text-red-500 mr-1">*</span>}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          الحقول المطلوبة مُعلّمة بنجمة حمراء (*)
                        </p>
                      </CardContent>
                    </Card>

                    {/* Data Preview Table */}
                    <Card className="border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #0d9488, #059669)' }} />
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                          معاينة البيانات (أول 5 سجلات)
                        </h3>
                        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gray-50 dark:bg-gray-800/80">
                                {CSV_TEMPLATES[selectedType].map((header, i) => (
                                  <th key={i} className="px-3 py-2.5 text-right font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap">
                                    {header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {MOCK_PREVIEW_DATA[selectedType].map((row, rowIdx) => (
                                <tr key={rowIdx} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
                                  {row.map((cell, cellIdx) => (
                                    <td key={cellIdx} className="px-3 py-2.5 text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800 whitespace-nowrap">
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">عرض أول 5 سجلات من أصل 45 سجل</p>
                      </CardContent>
                    </Card>

                    {/* Import Button */}
                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={resetImport}>
                        إلغاء
                      </Button>
                      <Button
                        onClick={startImport}
                        disabled={isImporting}
                        className="gap-2 text-white shadow-lg hover:shadow-xl transition-shadow"
                        style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}
                      >
                        {isImporting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            جاري الاستيراد...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            بدء الاستيراد
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Step 4: Import Progress */}
                {(isImporting || importComplete) && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-900/30">
                        <span className="text-sm font-bold" style={{ color: '#0d9488' }}>4</span>
                      </div>
                      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        {importComplete ? 'اكتمل الاستيراد' : 'جاري الاستيراد...'}
                      </h2>
                    </div>

                    <Card className="border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #0d9488, #059669)' }} />
                      <CardContent className="p-6 space-y-4">
                        {/* Progress bar */}
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">تقدم الاستيراد</span>
                            <span className="text-sm font-bold" style={{ color: '#0d9488' }}>{Math.round(importProgress)}%</span>
                          </div>
                          <Progress value={importProgress} className="h-3" />
                        </div>

                        {/* Success/Error counts */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            <div>
                              <p className="text-xs text-emerald-700 dark:text-emerald-400">ناجح</p>
                              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                                {importComplete ? importSuccessCount : Math.round(importProgress * 0.96 * 45 / 100)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                            <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                            <div>
                              <p className="text-xs text-red-700 dark:text-red-400">فاشل</p>
                              <p className="text-xl font-bold text-red-700 dark:text-red-300">
                                {importComplete ? importFailCount : Math.round(importProgress * 0.04 * 45 / 100)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Detailed log */}
                        {importComplete && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                            <Separator />
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                              <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                              سجل الاستيراد
                            </h4>
                            <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 space-y-1 custom-scrollbar">
                              <div className="p-2 flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/10 text-xs">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                                <span className="text-gray-700 dark:text-gray-300">تم استيراد السجل 1-43 بنجاح</span>
                              </div>
                              <div className="p-2 flex items-center gap-2 bg-red-50 dark:bg-red-900/10 text-xs">
                                <XCircle className="w-3 h-3 text-red-500 shrink-0" />
                                <span className="text-gray-700 dark:text-gray-300">السجل 12: تنسيق تاريخ غير صالح — &quot;2025/13/45&quot;</span>
                              </div>
                              <div className="p-2 flex items-center gap-2 bg-red-50 dark:bg-red-900/10 text-xs">
                                <XCircle className="w-3 h-3 text-red-500 shrink-0" />
                                <span className="text-gray-700 dark:text-gray-300">السجل 27: حقل مطلوب مفقود — &quot;الجنس&quot;</span>
                              </div>
                            </div>

                            {/* Action buttons after completion */}
                            <div className="flex justify-end gap-3 pt-2">
                              <Button variant="outline" onClick={resetImport}>
                                <RefreshCw className="w-4 h-4 ml-1" />
                                استيراد جديد
                              </Button>
                              <Button
                                className="gap-2 text-white"
                                style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}
                                onClick={() => setActiveTab('history')}
                              >
                                عرض السجل
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </motion.div>
            )}
          </TabsContent>

          {/* ─── History Tab ──────────────────────────────────────── */}
          <TabsContent value="history" className="mt-6 space-y-4">
            <motion.div variants={itemVariants}>
              {/* Filters */}
              <Card className="border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #0d9488, #059669)' }} />
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="بحث في سجل الاستيراد..."
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                        className="w-full pr-9 pl-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                      />
                    </div>
                    <Select value={historyFilter} onValueChange={setHistoryFilter}>
                      <SelectTrigger className="w-[160px] h-9 text-sm">
                        <Filter className="w-3.5 h-3.5 ml-1.5" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">الكل</SelectItem>
                        <SelectItem value="مكتمل">مكتمل</SelectItem>
                        <SelectItem value="فاشل">فاشل</SelectItem>
                        <SelectItem value="جزئي">جزئي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* History Table */}
              <Card className="border border-gray-200 dark:border-gray-700 overflow-hidden mt-4">
                <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #0d9488, #059669)' }} />
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
                          <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">التاريخ</th>
                          <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">النوع</th>
                          <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">الملف</th>
                          <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">السجلات</th>
                          <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">الحالة</th>
                          <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">التفاصيل</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredHistory.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                              لا توجد سجلات مطابقة
                            </td>
                          </tr>
                        ) : (
                          filteredHistory.map((record) => {
                            const TypeIcon = getTypeIcon(record.type);
                            return (
                              <tr key={record.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0">
                                <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                    {record.date}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <TypeIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                                    <span className="text-gray-700 dark:text-gray-300">{record.typeName}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                  <div className="flex items-center gap-1.5">
                                    <FileSpreadsheet className="w-3.5 h-3.5 text-muted-foreground" />
                                    {record.fileName}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-700 dark:text-gray-300 font-medium">{record.recordsCount}</span>
                                    <span className="text-xs text-emerald-600 dark:text-emerald-400">✓{record.successCount}</span>
                                    {record.failCount > 0 && (
                                      <span className="text-xs text-red-600 dark:text-red-400">✗{record.failCount}</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  {getStatusBadge(record.status)}
                                </td>
                                <td className="px-4 py-3">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="ghost" size="sm" className="text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20">
                                        <Eye className="w-4 h-4 ml-1" />
                                        عرض
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-md" dir="rtl">
                                      <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                                          <TypeIcon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                                          تفاصيل الاستيراد
                                        </DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                                            <p className="text-xs text-muted-foreground mb-1">التاريخ</p>
                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{record.date}</p>
                                          </div>
                                          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                                            <p className="text-xs text-muted-foreground mb-1">النوع</p>
                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{record.typeName}</p>
                                          </div>
                                          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                                            <p className="text-xs text-muted-foreground mb-1">الملف</p>
                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{record.fileName}</p>
                                          </div>
                                          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                                            <p className="text-xs text-muted-foreground mb-1">الحالة</p>
                                            {getStatusBadge(record.status)}
                                          </div>
                                        </div>
                                        <Separator />
                                        <div className="grid grid-cols-3 gap-3">
                                          <div className="text-center p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                                            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{record.recordsCount}</p>
                                            <p className="text-xs text-muted-foreground">إجمالي</p>
                                          </div>
                                          <div className="text-center p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                                            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{record.successCount}</p>
                                            <p className="text-xs text-muted-foreground">ناجح</p>
                                          </div>
                                          <div className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                                            <p className="text-lg font-bold text-red-600 dark:text-red-400">{record.failCount}</p>
                                            <p className="text-xs text-muted-foreground">فاشل</p>
                                          </div>
                                        </div>
                                        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                                          <div className="flex items-start gap-2">
                                            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                            <p className="text-sm text-amber-800 dark:text-amber-300">{record.details}</p>
                                          </div>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
                    <p className="text-xs text-muted-foreground">
                      عرض {filteredHistory.length} من أصل {MOCK_IMPORT_HISTORY.length} سجل
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
