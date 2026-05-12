export type MessageTone = "info" | "success" | "warning" | "danger";

export type SmartMessage = {
  title: string;
  description: string;
  tone: MessageTone;
  actionLabel?: string;
  actionHref?: string;
};

export const appMessages = {
  welcome: {
    title: "أهلًا بك في مدرستي برو",
    description:
      "ابدأ بتجهيز النظام خطوة خطوة. أضف المواد الدراسية، ثم الصفوف، ثم المدرسين والطلاب.",
    tone: "info",
  } satisfies SmartMessage,

  noLoginMode: {
    title: "النظام يعمل بدون تسجيل دخول",
    description:
      "تم ضبط هذه النسخة للدخول المباشر إلى لوحة التحكم، حتى تكون التجربة أسرع وأسهل.",
    tone: "success",
  } satisfies SmartMessage,

  setupOrder: {
    title: "اتبع ترتيب التأسيس الصحيح",
    description:
      "ابدأ بالمواد الدراسية، ثم الصفوف والشُعب، بعدها أضف المدرسين والطلاب. هذا الترتيب يمنع الأخطاء لاحقًا.",
    tone: "info",
    actionLabel: "ابدأ بإضافة مادة",
    actionHref: "/subjects",
  } satisfies SmartMessage,

  subjectsFirst: {
    title: "أضف المواد الدراسية أولًا",
    description:
      "المواد الدراسية ضرورية قبل ربط المدرسين، إنشاء الجداول، وإدخال الدرجات.",
    tone: "warning",
    actionLabel: "إضافة مادة",
    actionHref: "/subjects",
  } satisfies SmartMessage,

  classesBeforeStudents: {
    title: "لا تضف الطلاب قبل إنشاء الصفوف",
    description:
      "كل طالب يحتاج صفًا وشعبة. أنشئ الصفوف أولًا حتى تكون بيانات الطلاب منظمة من البداية.",
    tone: "warning",
    actionLabel: "إنشاء صف",
    actionHref: "/classes",
  } satisfies SmartMessage,

  teachersNeedSubjects: {
    title: "المدرس يحتاج مادة دراسية",
    description:
      "قبل إضافة المدرسين، تأكد من وجود المواد الدراسية حتى يمكن ربط كل مدرس بالمادة المناسبة.",
    tone: "info",
    actionLabel: "إدارة المواد",
    actionHref: "/subjects",
  } satisfies SmartMessage,

  attendanceNeedsStudents: {
    title: "الحضور يحتاج طلابًا داخل الصفوف",
    description:
      "حتى تسجل الحضور، يجب أن تكون لديك صفوف وشُعب وطلاب مسجلون داخلها.",
    tone: "warning",
    actionLabel: "إدارة الطلاب",
    actionHref: "/students",
  } satisfies SmartMessage,

  gradesNeedSubjectsAndStudents: {
    title: "الدرجات تحتاج مواد وطلاب",
    description:
      "لإدخال الدرجات بشكل صحيح، تأكد من إضافة المواد الدراسية والطلاب وربطهم بالصفوف.",
    tone: "warning",
    actionLabel: "إدارة الدرجات",
    actionHref: "/grades",
  } satisfies SmartMessage,

  feesNeedStudents: {
    title: "الأقساط تبدأ بعد إضافة الطلاب",
    description:
      "بعد تسجيل الطلاب داخل النظام، يمكنك إنشاء الأقساط وتسجيل الدفعات لكل طالب.",
    tone: "info",
    actionLabel: "إدارة الأقساط",
    actionHref: "/fees",
  } satisfies SmartMessage,
};

export const emptyStateMessages = {
  school: {
    title: "لم تتم إضافة بيانات المدرسة بعد",
    description:
      "أضف اسم المدرسة وشعارها ومعلومات الاتصال حتى تظهر في التقارير والواجهات.",
    actionLabel: "إضافة بيانات المدرسة",
  },

  subjects: {
    title: "لا توجد مواد دراسية بعد",
    description:
      "ابدأ بإضافة المواد مثل الرياضيات، اللغة العربية، العلوم وغيرها. المواد هي أساس الجدول والدرجات.",
    actionLabel: "إضافة أول مادة",
  },

  classes: {
    title: "لا توجد صفوف أو شُعب بعد",
    description:
      "أنشئ الصفوف والشُعب حتى تتمكن من إضافة الطلاب وتنظيم الحضور والدرجات.",
    actionLabel: "إنشاء أول صف",
  },

  teachers: {
    title: "لا يوجد مدرسون بعد",
    description:
      "أضف المدرسين واربطهم بالمواد الدراسية حتى يصبح توزيع الحصص أسهل.",
    actionLabel: "إضافة أول مدرس",
  },

  students: {
    title: "لا يوجد طلاب بعد",
    description:
      "بعد إنشاء الصفوف، أضف الطلاب واربط كل طالب بصفه وشعبته.",
    actionLabel: "إضافة أول طالب",
  },

  schedule: {
    title: "لم يتم إنشاء جدول دراسي بعد",
    description:
      "بعد إضافة المواد والصفوف والمدرسين، يمكنك بناء جدول دراسي واضح ومنظم.",
    actionLabel: "إنشاء جدول",
  },

  attendance: {
    title: "لا توجد سجلات حضور بعد",
    description:
      "اختر الصف والتاريخ، ثم سجل حالة كل طالب: حاضر، غائب، متأخر، أو مجاز.",
    actionLabel: "تسجيل حضور اليوم",
  },

  grades: {
    title: "لا توجد درجات بعد",
    description:
      "اختر الصف والمادة والاختبار، ثم أدخل درجات الطلاب بطريقة سهلة وسريعة.",
    actionLabel: "إدخال درجات",
  },

  fees: {
    title: "لا توجد أقساط بعد",
    description:
      "بعد إضافة الطلاب، يمكنك إنشاء الأقساط وتسجيل الدفعات والمتبقي.",
    actionLabel: "إضافة قسط",
  },

  reports: {
    title: "لا توجد تقارير جاهزة بعد",
    description:
      "عند توفر بيانات الطلاب والحضور والدرجات والأقساط، ستتمكن من استخراج تقارير منظمة.",
    actionLabel: "عرض التقارير",
  },
};

export const toastMessages = {
  saved: {
    title: "تم الحفظ بنجاح",
    description: "رائع، تم تسجيل البيانات داخل النظام.",
    tone: "success",
  } satisfies SmartMessage,

  updated: {
    title: "تم التحديث بنجاح",
    description: "تم حفظ التعديلات الجديدة بدون مشاكل.",
    tone: "success",
  } satisfies SmartMessage,

  deleted: {
    title: "تم الحذف",
    description: "تم حذف العنصر من القائمة بنجاح.",
    tone: "success",
  } satisfies SmartMessage,

  error: {
    title: "حدث خطأ غير متوقع",
    description:
      "لم تكتمل العملية. تأكد من البيانات وحاول مرة أخرى.",
    tone: "danger",
  } satisfies SmartMessage,

  requiredFields: {
    title: "توجد بيانات ناقصة",
    description:
      "يرجى تعبئة الحقول المطلوبة قبل الحفظ.",
    tone: "warning",
  } satisfies SmartMessage,

  duplicateName: {
    title: "هذا الاسم موجود مسبقًا",
    description:
      "استخدم اسمًا مختلفًا أو تحقق من العنصر الموجود في القائمة.",
    tone: "warning",
  } satisfies SmartMessage,
};

export const confirmationMessages = {
  delete: {
    title: "هل أنت متأكد من الحذف؟",
    description:
      "لن يظهر هذا العنصر في القوائم بعد الحذف. تأكد قبل المتابعة.",
    confirmLabel: "نعم، احذف",
    cancelLabel: "تراجع",
  },

  reset: {
    title: "هل تريد إعادة التعيين؟",
    description:
      "سيتم إرجاع هذه البيانات إلى حالتها الأولى. تأكد قبل تنفيذ العملية.",
    confirmLabel: "نعم، أعد التعيين",
    cancelLabel: "إلغاء",
  },

  leavePage: {
    title: "لديك تغييرات غير محفوظة",
    description:
      "إذا غادرت الصفحة الآن، قد تفقد التعديلات التي لم تحفظها.",
    confirmLabel: "مغادرة",
    cancelLabel: "البقاء هنا",
  },
};

export function getSetupMessage(counts: {
  subjects?: number;
  classes?: number;
  teachers?: number;
  students?: number;
}): SmartMessage {
  const subjects = counts.subjects ?? 0;
  const classes = counts.classes ?? 0;
  const teachers = counts.teachers ?? 0;
  const students = counts.students ?? 0;

  if (subjects === 0) {
    return appMessages.subjectsFirst;
  }

  if (classes === 0) {
    return appMessages.classesBeforeStudents;
  }

  if (teachers === 0) {
    return {
      title: "أضف المدرسين بعد تجهيز الصفوف",
      description:
        "الآن أصبح لديك مواد وصفوف. الخطوة التالية هي إضافة المدرسين وربطهم بالمواد المناسبة.",
      tone: "info",
      actionLabel: "إضافة مدرس",
      actionHref: "/teachers",
    };
  }

  if (students === 0) {
    return {
      title: "الآن أضف الطلاب",
      description:
        "بعد تجهيز المواد والصفوف والمدرسين، يمكنك إضافة الطلاب وتنظيمهم داخل الشعب.",
      tone: "info",
      actionLabel: "إضافة طالب",
      actionHref: "/students",
    };
  }

  return {
    title: "النظام جاهز للتشغيل اليومي",
    description:
      "يمكنك الآن تسجيل الحضور، إدخال الدرجات، متابعة الأقساط، واستخراج التقارير.",
    tone: "success",
    actionLabel: "بدء تسجيل الحضور",
    actionHref: "/attendance",
  };
}

export function getSaveSuccessMessage(entityName: string): SmartMessage {
  return {
    title: "تم الحفظ بنجاح",
    description: `تم حفظ ${entityName} داخل النظام بنجاح.`,
    tone: "success",
  };
}

export function getUpdateSuccessMessage(entityName: string): SmartMessage {
  return {
    title: "تم التحديث بنجاح",
    description: `تم تحديث بيانات ${entityName} بنجاح.`,
    tone: "success",
  };
}

export function getDeleteSuccessMessage(entityName: string): SmartMessage {
  return {
    title: "تم الحذف بنجاح",
    description: `تم حذف ${entityName} من النظام.`,
    tone: "success",
  };
}

export function getRequiredFieldMessage(fieldName: string): SmartMessage {
  return {
    title: "حقل مطلوب",
    description: `يرجى تعبئة حقل ${fieldName} قبل المتابعة.`,
    tone: "warning",
  };
}
