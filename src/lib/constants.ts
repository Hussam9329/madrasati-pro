// ==================== Shared Constants ====================

// ---- Status Colors ----
export const ATTENDANCE_STATUS_COLORS: Record<string, string> = {
  'حاضر': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  'غائب': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  'متأخر': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  'خروج مبكر': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  'إجازة مرضية': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  'إجازة رسمية': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'عذر': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
};

export const STUDENT_STATUS_COLORS: Record<string, string> = {
  'مستمر': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  'متوقف': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  'منقول': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'متخرج': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

export const TEACHER_STATUS_COLORS: Record<string, string> = {
  'نشط': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  'غير نشط': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  'إجازة': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  'مدفوع بالكامل': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  'مدفوع جزئياً': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  'غير مدفوع': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

// ---- Chart Colors ----
export const CHART_COLORS = [
  '#22c55e', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1',
];

// ---- Framer Motion Presets ----
export const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' as const },
  },
};

// ---- Form Constants ----
export const LEVELS = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس'];
export const STAGES = ['متوسط', 'خامس', 'سادس', 'إعدادي'];
export const BRANCHES = ['علمي', 'أدبي', 'احيائي', 'تطبيقي'];
export const SECTION_OPTIONS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];

export const LEVEL_COLORS: Record<string, { bg: string; dot: string; text: string; border: string }> = {
  'الأول': { bg: 'bg-blue-100 dark:bg-blue-900/30', dot: 'bg-blue-500', text: 'text-blue-800 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
  'الثاني': { bg: 'bg-green-100 dark:bg-green-900/30', dot: 'bg-green-500', text: 'text-green-800 dark:text-green-400', border: 'border-green-200 dark:border-green-800' },
  'الثالث': { bg: 'bg-purple-100 dark:bg-purple-900/30', dot: 'bg-purple-500', text: 'text-purple-800 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' },
  'الرابع': { bg: 'bg-orange-100 dark:bg-orange-900/30', dot: 'bg-orange-500', text: 'text-orange-800 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' },
  'الخامس': { bg: 'bg-cyan-100 dark:bg-cyan-900/30', dot: 'bg-cyan-500', text: 'text-cyan-800 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-800' },
  'السادس': { bg: 'bg-pink-100 dark:bg-pink-900/30', dot: 'bg-pink-500', text: 'text-pink-800 dark:text-pink-400', border: 'border-pink-200 dark:border-pink-800' },
  'إعدادي': { bg: 'bg-indigo-100 dark:bg-indigo-900/30', dot: 'bg-indigo-500', text: 'text-indigo-800 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800' },
};

export const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
export const PERIODS = [1, 2, 3, 4, 5, 6, 7];

export const ROLE_COLORS: Record<string, string> = {
  'مدير': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  'معاون': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'موظف تسجيل': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  'موظف بوابة': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  'مدرس': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  'مسؤول نظام': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

export const SUBJECT_COLORS: Record<string, { bg: string; dot: string; text: string; border: string }> = {
  'رياضيات': { bg: 'bg-blue-50 dark:bg-blue-900/20', dot: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
  'فيزياء': { bg: 'bg-purple-50 dark:bg-purple-900/20', dot: 'bg-purple-500', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
  'كيمياء': { bg: 'bg-green-50 dark:bg-green-900/20', dot: 'bg-green-500', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-800' },
  'أحياء': { bg: 'bg-emerald-50 dark:bg-emerald-900/20', dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
  'عربي': { bg: 'bg-orange-50 dark:bg-orange-900/20', dot: 'bg-orange-500', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800' },
  'انكليزي': { bg: 'bg-red-50 dark:bg-red-900/20', dot: 'bg-red-500', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-800' },
  'تربية إسلامية': { bg: 'bg-teal-50 dark:bg-teal-900/20', dot: 'bg-teal-500', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800' },
  'تاريخ': { bg: 'bg-amber-50 dark:bg-amber-900/20', dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
  'جغرافيا': { bg: 'bg-cyan-50 dark:bg-cyan-900/20', dot: 'bg-cyan-500', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-200 dark:border-cyan-800' },
  'حاسوب': { bg: 'bg-indigo-50 dark:bg-indigo-900/20', dot: 'bg-indigo-500', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800' },
  'رياضة': { bg: 'bg-lime-50 dark:bg-lime-900/20', dot: 'bg-lime-500', text: 'text-lime-700 dark:text-lime-300', border: 'border-lime-200 dark:border-lime-800' },
  'فنية': { bg: 'bg-pink-50 dark:bg-pink-900/20', dot: 'bg-pink-500', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-200 dark:border-pink-800' },
};

export const DEFAULT_SUBJECT_COLOR = { bg: 'bg-gray-50 dark:bg-gray-900/20', dot: 'bg-gray-500', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-800' };
