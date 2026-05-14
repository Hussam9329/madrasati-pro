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
    title: "الإعداد الأول",
    description: "الخطوات الأولى التي تُبنى عليها بقية البيانات.",
  },
  people: {
    title: "الأشخاص",
    description: "إدارة المدرسين والطالبات بعد تجهيز الأساسيات.",
  },
  operations: {
    title: "التشغيل اليومي",
    description: "الحضور، الجدول، والمتابعة اليومية.",
  },
  results: {
    title: "الدرجات والأقساط",
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
    description: "ملخص المدرسة: إحصائيات، تنبيهات، وأزرار انتقال سريع.",
    priority: 1,
    group: "overview",
    isPrimary: true,
  },
  {
    title: "المواد الدراسية",
    href: "/subjects",
    icon: "book",
    description: "أضف المواد أولًا حتى يمكن ربطها بالمدرسين والصفوف.",
    priority: 2,
    group: "foundation",
  },
  {
    title: "الصفوف والشُعب",
    href: "/classes",
    icon: "classes",
    description: "أنشئ الصفوف والشعب قبل إضافة الطالبات إليها.",
    priority: 3,
    group: "foundation",
  },
  {
    title: "المدرسين",
    href: "/teachers",
    icon: "teachers",
    description: "أضف المدرسين واربطهم بالمواد والصفوف المناسبة.",
    priority: 4,
    group: "people",
  },
  {
    title: "الطالبات",
    href: "/students",
    icon: "students",
    description: "أضف الطالبات بعد تجهيز الصفوف والشعب.",
    priority: 5,
    group: "people",
  },
  {
    title: "الجدول الدراسي",
    href: "/schedules",
    icon: "schedule",
    description: "نظّم المحاضرات بعد توفر المواد، الصفوف، والمدرسين.",
    priority: 6,
    group: "operations",
  },
  {
    title: "الحضور",
    href: "/attendance",
    icon: "attendance",
    description: "سجّل حضور الطالبات حسب الصف والتاريخ.",
    priority: 7,
    group: "operations",
  },
  {
    title: "الدرجات",
    href: "/grades",
    icon: "grades",
    description: "أدخل درجات الطالبات حسب المادة والامتحان.",
    priority: 8,
    group: "results",
  },
  {
    title: "الأقساط",
    href: "/payments",
    icon: "fees",
    description: "تابع المدفوعات والمتبقي لكل طالبة.",
    priority: 9,
    group: "results",
  },
  {
    title: "التقارير",
    href: "/reports",
    icon: "reports",
    description: "استخرج تقارير الطالبات، الحضور، الدرجات، والأقساط.",
    priority: 10,
    group: "results",
  },
  {
    title: "الإعدادات",
    href: "/settings",
    icon: "settings",
    description: "خيارات النظام العامة والتخصيص.",
    priority: 11,
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
    hint: "ابدأ بتجهيز المواد الدراسية.",
  },
  {
    title: "إضافة صف",
    href: "/classes",
    icon: "classes",
    hint: "أنشئ الصفوف والشُعب.",
  },
  {
    title: "إضافة مدرس",
    href: "/teachers",
    icon: "teachers",
    hint: "اربط المدرسين بالمواد.",
  },
  {
    title: "إضافة طالبة",
    href: "/students",
    icon: "students",
    hint: "أضف الطالبات إلى صفوفهن.",
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
    hint: "سجّل نتائج الامتحانات.",
  },
  {
    title: "تسجيل دفعة",
    href: "/payments",
    icon: "fees",
    hint: "حدّث حالة الأقساط.",
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
      title: "ابدأ بإضافة المواد الدراسية",
      description:
        "المواد هي الأساس الذي سنربط به المدرسين والدرجات لاحقًا.",
      href: "/subjects",
      actionLabel: "إضافة أول مادة",
    };
  }

  if (classes === 0) {
    return {
      title: "الخطوة التالية: إنشاء الصفوف والشُعب",
      description:
        "بعد إضافة المواد، أنشئ الصفوف حتى تتمكن من تنظيم الطالبات والحضور.",
      href: "/classes",
      actionLabel: "إنشاء أول صف",
    };
  }

  if (teachers === 0) {
    return {
      title: "أضف المدرسين الآن",
      description:
        "اربط كل مدرس بالمواد التي يدرّسها حتى يصبح الجدول والدرجات أوضح.",
      href: "/teachers",
      actionLabel: "إضافة أول مدرس",
    };
  }

  if (students === 0) {
    return {
      title: "أضف الطالبات إلى صفوفهن",
      description:
        "بعد تجهيز المواد والصفوف والمدرسين، يمكنك إضافة الطالبات بثقة.",
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
