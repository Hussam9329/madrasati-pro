export type NavigationItem = {
  title: string;
  href: string;
  icon: NavigationIcon;
  description: string;
  priority: number;
  group: NavigationGroup;
  isPrimary?: boolean;
};

export type NavigationGroup =
  | "overview"
  | "foundation"
  | "people"
  | "operations"
  | "results"
  | "system";

export type NavigationIcon =
  | "dashboard"
  | "school"
  | "book"
  | "classes"
  | "teachers"
  | "students"
  | "schedule"
  | "attendance"
  | "grades"
  | "fees"
  | "payments"
  | "reports"
  | "settings";

export const navigationGroups: Record<
  NavigationGroup,
  {
    title: string;
    description: string;
  }
> = {
  overview: {
    title: "البداية",
    description: "نظرة عامة وسريعة على حالة النظام.",
  },
  foundation: {
    title: "التأسيس",
    description: "الخطوات الأولى التي تُبنى عليها بقية البيانات.",
  },
  people: {
    title: "الأشخاص",
    description: "إدارة المدرسات والطالبات بعد تجهيز الأساسيات.",
  },
  operations: {
    title: "التشغيل اليومي",
    description: "الحضور، الجدول، والمتابعة اليومية.",
  },
  results: {
    title: "النتائج والماليات",
    description: "الدرجات، الأقساط، والتقارير.",
  },
  system: {
    title: "النظام",
    description: "الإعدادات العامة وخيارات التخصيص.",
  },
};

export const navigationItems: NavigationItem[] = [
  {
    title: "لوحة التحكم",
    href: "/",
    icon: "dashboard",
    description: "مركز القيادة: إحصائيات، تنبيهات، وأزرار انتقال سريع.",
    priority: 1,
    group: "overview",
    isPrimary: true,
  },
  {
    title: "بيانات المدرسة",
    href: "/school",
    icon: "school",
    description: "اسم المدرسة، الشعار، العنوان، والسنة الدراسية.",
    priority: 2,
    group: "foundation",
  },
  {
    title: "المواد الدراسية",
    href: "/subjects",
    icon: "book",
    description: "أضيفي المواد أولًا حتى يمكن ربطها بالمدرسات والصفوف.",
    priority: 3,
    group: "foundation",
  },
  {
    title: "الصفوف والشُعب",
    href: "/classes",
    icon: "classes",
    description: "أنشئي الصفوف والشعب قبل إضافة الطالبات إليها.",
    priority: 4,
    group: "foundation",
  },
  {
    title: "المدرسات",
    href: "/teachers",
    icon: "teachers",
    description: "أضيفي المدرسات واربطيهن بالمواد والصفوف المناسبة.",
    priority: 5,
    group: "people",
  },
  {
    title: "الطالبات",
    href: "/students",
    icon: "students",
    description: "أضيفي الطالبات بعد تجهيز الصفوف والشعب.",
    priority: 6,
    group: "people",
  },
  {
    title: "الجدول الدراسي",
    href: "/schedules",
    icon: "schedule",
    description: "نظّمي الحصص بعد توفر المواد، الصفوف، والمدرسات.",
    priority: 7,
    group: "operations",
  },
  {
    title: "الحضور",
    href: "/attendance",
    icon: "attendance",
    description: "سجّلي حضور الطالبات حسب الصف والتاريخ.",
    priority: 8,
    group: "operations",
  },
  {
    title: "الدرجات",
    href: "/grades",
    icon: "grades",
    description: "أدخلي درجات الطالبات حسب المادة والاختبار.",
    priority: 9,
    group: "results",
  },
  {
    title: "الأقساط",
    href: "/payments",
    icon: "fees",
    description: "تابعي المدفوعات والمتبقي لكل طالبة.",
    priority: 10,
    group: "results",
  },
  {
    title: "التقارير",
    href: "/reports",
    icon: "reports",
    description: "استخرجي تقارير الطالبات، الحضور، الدرجات، والأقساط.",
    priority: 11,
    group: "results",
  },
  {
    title: "الإعدادات",
    href: "/settings",
    icon: "settings",
    description: "خيارات النظام العامة والتخصيص.",
    priority: 12,
    group: "system",
  },
];

export const orderedNavigationItems = [...navigationItems].sort(
  (a, b) => a.priority - b.priority,
);

export const primaryQuickActions = [
  {
    title: "إضافة مادة",
    href: "/subjects",
    icon: "book",
    hint: "ابدئي بتجهيز المواد الدراسية.",
  },
  {
    title: "إضافة صف",
    href: "/classes",
    icon: "classes",
    hint: "أنشئي الصفوف والشُعب.",
  },
  {
    title: "إضافة مدرسة",
    href: "/teachers",
    icon: "teachers",
    hint: "اربطي المدرسات بالمواد.",
  },
  {
    title: "إضافة طالبة",
    href: "/students",
    icon: "students",
    hint: "أضيفي الطالبات إلى صفوفهن.",
  },
  {
    title: "تسجيل حضور",
    href: "/attendance",
    icon: "attendance",
    hint: "تابع حضور اليوم بسرعة.",
  },
  {
    title: "إدخال درجات",
    href: "/grades",
    icon: "grades",
    hint: "سجّلي نتائج الاختبارات.",
  },
  {
    title: "تسجيل دفعة",
    href: "/payments",
    icon: "fees",
    hint: "حدّثي حالة الأقساط.",
  },
  {
    title: "طباعة تقرير",
    href: "/reports",
    icon: "reports",
    hint: "استخرج تقريرًا منظمًا.",
  },
];

export function getNavigationItemByHref(href: string) {
  return orderedNavigationItems.find((item) => item.href === href);
}

export function getNavigationItemsByGroup(group: NavigationGroup) {
  return orderedNavigationItems.filter((item) => item.group === group);
}

export function getNextSetupStep(existingCounts: {
  subjects?: number;
  classes?: number;
  teachers?: number;
  students?: number;
}) {
  const subjects = existingCounts.subjects ?? 0;
  const classes = existingCounts.classes ?? 0;
  const teachers = existingCounts.teachers ?? 0;
  const students = existingCounts.students ?? 0;

  if (subjects === 0) {
    return {
      title: "ابدئي بإضافة المواد الدراسية",
      description:
        "المواد هي الأساس الذي سنربط به المدرسات والدرجات لاحقًا.",
      href: "/subjects",
      actionLabel: "إضافة أول مادة",
    };
  }

  if (classes === 0) {
    return {
      title: "الخطوة التالية: إنشاء الصفوف والشُعب",
      description:
        "بعد إضافة المواد، أنشئي الصفوف حتى تتمكني من تنظيم الطالبات والحضور.",
      href: "/classes",
      actionLabel: "إنشاء أول صف",
    };
  }

  if (teachers === 0) {
    return {
      title: "أضيفي المدرسات الآن",
      description:
        "اربطي كل مدرسة بالمواد التي تدرّسها حتى يصبح الجدول والدرجات أوضح.",
      href: "/teachers",
      actionLabel: "إضافة أول مدرسة",
    };
  }

  if (students === 0) {
    return {
      title: "أضيفي الطالبات إلى صفوفهن",
      description:
        "بعد تجهيز المواد والصفوف والمدرسات، يمكنك إضافة الطالبات بثقة.",
      href: "/students",
      actionLabel: "إضافة أول طالبة",
    };
  }

  return {
    title: "النظام جاهز للتشغيل اليومي",
    description:
      "يمكنك الآن تسجيل الحضور، إدخال الدرجات، ومتابعة الأقساط والتقارير.",
    href: "/attendance",
    actionLabel: "بدء تسجيل الحضور",
  };
}
