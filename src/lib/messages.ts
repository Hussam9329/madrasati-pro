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
    title: "أهلًا بك في مدرستي",
    description:
      "ابدئي بتجهيز النظام خطوة خطوة. أضيفي المواد الدراسية، ثم الصفوف، ثم المدرسات والطالبات.",
    tone: "info",
  } satisfies SmartMessage,

  noLoginMode: {
    title: "تم تسجيل الدخول بنجاح",
    description:
      "أنت الآن في لوحة تحكم ثانوية مارينا للبنات.",
    tone: "success",
  } satisfies SmartMessage,

  setupOrder: {
    title: "اتبعي ترتيب التأسيس الصحيح",
    description:
      "ابدئي بالمواد الدراسية، ثم الصفوف والشُعب، بعدها أضيفي المدرسات والطالبات. هذا الترتيب يمنع الأخطاء لاحقًا.",
    tone: "info",
    actionLabel: "ابدئي بإضافة مادة",
    actionHref: "/subjects",
  } satisfies SmartMessage,

  subjectsFirst: {
    title: "أضيفي المواد الدراسية أولًا",
    description:
      "المواد الدراسية ضرورية قبل ربط المدرسات، إنشاء الجداول، وإدخال الدرجات.",
    tone: "warning",
    actionLabel: "إضافة مادة",
    actionHref: "/subjects",
  } satisfies SmartMessage,

  classesBeforeStudents: {
    title: "لا تضيفي الطالبات قبل إنشاء الصفوف",
    description:
      "كل طالبة تحتاج صفًا وشعبة. أنشئي الصفوف أولًا حتى تكون بيانات الطالبات منظمة من البداية.",
    tone: "warning",
    actionLabel: "إنشاء صف",
    actionHref: "/classes",
  } satisfies SmartMessage,

  teachersNeedSubjects: {
    title: "المدرسة تحتاج مادة دراسية",
    description:
      "قبل إضافة المدرسةات، تأكدي من وجود المواد الدراسية حتى يمكن ربط كل مدرسة بالمادة المناسبة.",
    tone: "info",
    actionLabel: "إدارة المواد",
    actionHref: "/subjects",
  } satisfies SmartMessage,

  attendanceNeedsStudents: {
    title: "الحضور يحتاج طالبات داخل الصفوف",
    description:
      "حتى تسجلي الحضور، يجب أن تكون لديك صفوف وشُعب وطالبات مسجلات داخلها.",
    tone: "warning",
    actionLabel: "إدارة الطالبات",
    actionHref: "/students",
  } satisfies SmartMessage,

  gradesNeedSubjectsAndStudents: {
    title: "الدرجات تحتاج مواد وطالبات",
    description:
      "لإدخال الدرجات بشكل صحيح، تأكدي من إضافة المواد الدراسية والطالبات وربطهن بالصفوف.",
    tone: "warning",
    actionLabel: "إدارة الدرجات",
    actionHref: "/grades",
  } satisfies SmartMessage,

  feesNeedStudents: {
    title: "الأقساط تبدأ بعد إضافة الطالبات",
    description:
      "بعد تسجيل الطالبات داخل النظام، يمكنك إنشاء الأقساط وتسجيل الدفعات لكل طالبة.",
    tone: "info",
    actionLabel: "إدارة الأقساط",
    actionHref: "/fees",
  } satisfies SmartMessage,
};

export const emptyStateMessages = {
  school: {
    title: "لم تتم إضافة بيانات المدرسة بعد",
    description:
      "أضيفي اسم المدرسة وشعارها ومعلومات الاتصال حتى تظهر في التقارير والواجهات.",
    actionLabel: "إضافة بيانات المدرسة",
  },

  subjects: {
    title: "لا توجد مواد دراسية بعد",
    description:
      "ابدئي بإضافة المواد مثل الرياضيات، اللغة العربية، العلوم وغيرها. المواد هي أساس الجدول والدرجات.",
    actionLabel: "إضافة أول مادة",
  },

  classes: {
    title: "لا توجد صفوف أو شُعب بعد",
    description:
      "أنشئي الصفوف والشُعب حتى تتمكني من إضافة الطالبات وتنظيم الحضور والدرجات.",
    actionLabel: "إنشاء أول صف",
  },

  teachers: {
    title: "لا يوجد مدرسات بعد",
    description:
      "أضيفي المدرسات واربطيهن بالمواد الدراسية حتى يصبح توزيع الحصص أسهل.",
    actionLabel: "إضافة أول مدرسة",
  },

  students: {
    title: "لا يوجد طالبات بعد",
    description:
      "بعد إنشاء الصفوف، أضيفي الطالبات واربطي كل طالبة بصفها وشعبتها.",
    actionLabel: "إضافة أول طالبة",
  },

  schedule: {
    title: "لم يتم إنشاء جدول دراسي بعد",
    description:
      "بعد إضافة المواد والصفوف والمدرسات، يمكنك بناء جدول دراسي واضح ومنظم.",
    actionLabel: "إنشاء جدول",
  },

  attendance: {
    title: "لا توجد سجلات حضور بعد",
    description:
      "اختاري الصف والتاريخ، ثم سجلي حالة كل طالبة: حاضرة، غائبة، متأخرة، أو مجازة.",
    actionLabel: "تسجيل حضور اليوم",
  },

  grades: {
    title: "لا توجد درجات بعد",
    description:
      "اختاري الصف والمادة والاختبار، ثم أدخلي درجات الطالبات بطريقة سهلة وسريعة.",
    actionLabel: "إدخال درجات",
  },

  fees: {
    title: "لا توجد أقساط بعد",
    description:
      "بعد إضافة الطالبات، يمكنك إنشاء الأقساط وتسجيل الدفعات والمتبقي.",
    actionLabel: "إضافة قسط",
  },

  reports: {
    title: "لا توجد تقارير جاهزة بعد",
    description:
      "عند توفر بيانات الطالبات والحضور والدرجات والأقساط، ستتمكن من استخراج تقارير منظمة.",
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
      title: "أضيفي المدرسات بعد تجهيز الصفوف",
      description:
        "الآن أصبح لديك مواد وصفوف. الخطوة التالية هي إضافة المدرسةات وربطهن بالمواد المناسبة.",
      tone: "info",
      actionLabel: "إضافة مدرسة",
      actionHref: "/teachers",
    };
  }

  if (students === 0) {
    return {
      title: "الآن أضيفي الطالبات",
      description:
        "بعد تجهيز المواد والصفوف والمدرسات، يمكنك إضافة الطالبات وتنظيمهن داخل الشعب.",
      tone: "info",
      actionLabel: "إضافة طالبة",
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

export const APP_MESSAGES = {
  phoneRule: "رقم الهاتف يجب أن يتكون من 11 رقم ويبدأ بـ 07.",
  fullNameRule: "يرجى إدخال الاسم الرباعي كاملًا.",
  saveSuccess: "تم الحفظ بنجاح.",
  saveError: "تعذر الحفظ، تحقق من البيانات وحاول مرة أخرى.",
  deleteWarning: "لا يمكن التراجع عن عملية الحذف.",
  relationWarning: "هذه البيانات مرتبطة بسجلات أخرى، تحقق قبل الحذف.",
  gradesWarning: "راجع الدرجات المنخفضة قبل اعتماد النتائج.",
  paymentWarning: "راجع مبلغ الخصم والمبلغ النهائي قبل حفظ الدفعة.",
  discountCalculated: "تم احتساب الخصم تلقائيًا، راجع المبلغ النهائي قبل الحفظ.",
  discountTooLarge: "تحذير: قيمة الخصم أكبر من القسط.",
  discountSuggestion: "اقتراح ذكي: هذه الطالبة قد تكون مؤهلة لخصم.",
  finalAmountAfterDiscount: "المبلغ النهائي بعد الخصم",
  classSeedInfo: "تم تجهيز الصفوف الأساسية من الأول إلى السادس، ويمكنك إضافة شعب إضافية عند الحاجة.",
  selectSectionFirst: "اختاري الشعبة أولًا حتى تظهر قائمة الطالبات.",
  selectSubjectFirst: "اختاري المادة حتى تظهر المدرسات المرتبطات بها.",
  gradeExceedsMax: "لا يمكن حفظ درجة أكبر من الدرجة الكلية.",
  gradesSaved: "تم حفظ الدرجات بنجاح.",
  reviewLowGrades: "راجع الدرجات المنخفضة قبل اعتمادها.",
  studentsWithoutGrades: "يوجد طالبات لم يتم إدخال درجاتهن.",
};
