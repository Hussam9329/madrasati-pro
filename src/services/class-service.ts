import { Prisma } from "@/lib/prisma-types";
import { db } from "@/lib/db";
import { getSupabaseConfigErrorMessage, hasSupabaseConfig } from "@/lib/supabase-client";
import {
  canDeleteClass,
  canDeleteSection,
  normalizeClassInput,
  normalizeSectionInput,
  validateClassInput,
  validateSectionInput,
  type ClassDetails,
  type ClassFormInput,
  type ClassListItem,
  type SchoolClass,
  type Section,
  type SectionFormInput,
  type SectionListItem,
} from "@/types/class";

export type ClassServiceResult<T> = {
  ok: boolean;
  data?: T;
  message: string;
  errors?: Record<string, string>;
};

export async function getClasses(): Promise<ClassListItem[]> {
  const classes = await db.schoolClass.findMany({
    orderBy: [
      {
        isActive: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    include: {
      sections: {
        include: {
          _count: {
            select: {
              students: true,
              schedules: true,
            },
          },
        },
      },
      classSubjects: {
        select: {
          subjectId: true,
        },
      },
      _count: {
        select: {
          sections: true,
          classSubjects: true,
        },
      },
    },
  });

  return classes.map((schoolClass) => {
    const studentsCount = schoolClass.sections.reduce(
      (total, section) => total + section._count.students,
      0,
    );
    const schedulesCount = schoolClass.sections.reduce(
      (total, section) => total + section._count.schedules,
      0,
    );

    return {
      id: schoolClass.id,
      name: schoolClass.name,
      level: schoolClass.level,
      description: schoolClass.description,
      isActive: schoolClass.isActive,
      sectionsCount: schoolClass._count.sections,
      studentsCount,
      subjectsCount: schoolClass._count.classSubjects,
      schedulesCount,
      subjectIds: schoolClass.classSubjects.map((cs: { subjectId: string }) => cs.subjectId),
      createdAt: schoolClass.createdAt,
    };
  });
}

export async function getActiveClasses(): Promise<SchoolClass[]> {
  return db.schoolClass.findMany({
    orderBy: [
      {
        level: "asc",
      },
      {
        name: "asc",
      },
    ],
  });
}

export async function getClassById(id: string): Promise<SchoolClass | null> {
  return db.schoolClass.findUnique({
    where: {
      id,
    },
  });
}

export async function getClassDetails(
  id: string,
): Promise<ClassDetails | null> {
  const schoolClass = await db.schoolClass.findUnique({
    where: {
      id,
    },
    include: {
      sections: {
        include: {
          _count: {
            select: {
              students: true,
              schedules: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      },
      _count: {
        select: {
          classSubjects: true,
        },
      },
    },
  });

  if (!schoolClass) {
    return null;
  }

  const sections: SectionListItem[] = schoolClass.sections.map((section) => ({
    id: section.id,
    name: section.name,
    capacity: section.capacity,
    description: section.description,
    isActive: section.isActive,
    classId: section.classId,
    className: schoolClass.name,
    studentsCount: section._count.students,
    schedulesCount: section._count.schedules,
    createdAt: section.createdAt,
  }));

  const studentsCount = sections.reduce(
    (total, section) => total + section.studentsCount,
    0,
  );
  const schedulesCount = sections.reduce(
    (total, section) => total + section.schedulesCount,
    0,
  );

  return {
    id: schoolClass.id,
    name: schoolClass.name,
    level: schoolClass.level,
    description: schoolClass.description,
    isActive: schoolClass.isActive,
    createdAt: schoolClass.createdAt,
    updatedAt: schoolClass.updatedAt,
    sections,
    subjectsCount: schoolClass._count.classSubjects,
    schedulesCount,
    studentsCount,
  };
}

export async function createClass(
  input: ClassFormInput,
): Promise<ClassServiceResult<SchoolClass>> {
  const validation = validateClassInput(input);

  if (!validation.valid) {
    return {
      ok: false,
      message: (Object.values(validation.errors).find(Boolean) as string) || "توجد بيانات ناقصة أو غير صحيحة.",
      errors: validation.errors as Record<string, string>,
    };
  }

  if (!hasSupabaseConfig()) {
    return {
      ok: false,
      message: getSupabaseConfigErrorMessage(),
    };
  }

  const data = normalizeClassInput(input);

  try {
    const schoolClass = await db.schoolClass.create({
      data: {
        name: data.name,
        level: data.level ?? null,
        description: data.description ?? null,
        isActive: true,
      },
    });

    return {
      ok: true,
      data: schoolClass,
      message: "تمت إضافة الصف بنجاح.",
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        ok: false,
        message: "هذا الصف موجود مسبقًا بنفس المرحلة.",
        errors: {
          name: "اسم الصف والمرحلة مستخدمان مسبقًا.",
        },
      };
    }

    return {
      ok: false,
      message: "حدث خطأ أثناء إضافة الصف.",
    };
  }
}

export async function updateClass(
  id: string,
  input: ClassFormInput,
): Promise<ClassServiceResult<SchoolClass>> {
  const validation = validateClassInput(input);

  if (!validation.valid) {
    return {
      ok: false,
      message: (Object.values(validation.errors).find(Boolean) as string) || "توجد بيانات ناقصة أو غير صحيحة.",
      errors: validation.errors as Record<string, string>,
    };
  }

  if (!hasSupabaseConfig()) {
    return {
      ok: false,
      message: getSupabaseConfigErrorMessage(),
    };
  }

  const existingClass = await getClassById(id);

  if (!existingClass) {
    return {
      ok: false,
      message: "لم يتم العثور على الصف.",
    };
  }

  const data = normalizeClassInput(input);

  try {
    const schoolClass = await db.schoolClass.update({
      where: {
        id,
      },
      data: {
        name: data.name,
        level: data.level ?? null,
        description: data.description ?? null,
        isActive: true,
      },
    });

    return {
      ok: true,
      data: schoolClass,
      message: "تم تحديث بيانات الصف بنجاح.",
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        ok: false,
        message: "يوجد صف آخر بنفس الاسم والمرحلة.",
        errors: {
          name: "اسم الصف والمرحلة مستخدمان مسبقًا.",
        },
      };
    }

    return {
      ok: false,
      message: "حدث خطأ أثناء تحديث الصف.",
    };
  }
}

export async function deleteClass(
  id: string,
): Promise<ClassServiceResult<null>> {
  const schoolClass = await db.schoolClass.findUnique({
    where: {
      id,
    },
    include: {
      sections: {
        include: {
          _count: {
            select: {
              students: true,
              schedules: true,
            },
          },
        },
      },
      _count: {
        select: {
          sections: true,
          classSubjects: true,
        },
      },
    },
  });

  if (!schoolClass) {
    return {
      ok: false,
      message: "لم يتم العثور على الصف.",
    };
  }

  const studentsCount = schoolClass.sections.reduce(
    (total, section) => total + section._count.students,
    0,
  );
  const schedulesCount = schoolClass.sections.reduce(
    (total, section) => total + section._count.schedules,
    0,
  );

  const deleteCheck = canDeleteClass({
    sectionsCount: schoolClass._count.sections,
    studentsCount,
    subjectsCount: schoolClass._count.classSubjects,
    schedulesCount,
  });

  if (!deleteCheck.allowed) {
    return {
      ok: false,
      message: deleteCheck.reason ?? "لا يمكن حذف الصف حاليًا.",
    };
  }

  try {
    await db.schoolClass.delete({
      where: {
        id,
      },
    });
  } catch (error) {
    console.error("[deleteClass] Error:", error);
    return {
      ok: false,
      message: "حدث خطأ أثناء حذف الصف. تأكد من عدم وجود بيانات مرتبطة.",
    };
  }

  return {
    ok: true,
    data: null,
    message: "تم حذف الصف بنجاح.",
  };
}

export async function searchClasses(query: string): Promise<ClassListItem[]> {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return getClasses();
  }

  const classes = await db.schoolClass.findMany({
    where: {
      OR: [
        {
          name: {
            contains: normalizedQuery,
          },
        },
        {
          level: {
            contains: normalizedQuery,
          },
        },
        {
          description: {
            contains: normalizedQuery,
          },
        },
      ],
    },
    orderBy: {
      name: "asc",
    },
    include: {
      sections: {
        include: {
          _count: {
            select: {
              students: true,
              schedules: true,
            },
          },
        },
      },
      classSubjects: {
        select: {
          subjectId: true,
        },
      },
      _count: {
        select: {
          sections: true,
          classSubjects: true,
        },
      },
    },
  });

  return classes.map((schoolClass) => {
    const studentsCount = schoolClass.sections.reduce(
      (total, section) => total + section._count.students,
      0,
    );
    const schedulesCount = schoolClass.sections.reduce(
      (total, section) => total + section._count.schedules,
      0,
    );

    return {
      id: schoolClass.id,
      name: schoolClass.name,
      level: schoolClass.level,
      description: schoolClass.description,
      isActive: schoolClass.isActive,
      sectionsCount: schoolClass._count.sections,
      studentsCount,
      subjectsCount: schoolClass._count.classSubjects,
      schedulesCount,
      subjectIds: schoolClass.classSubjects.map((cs: { subjectId: string }) => cs.subjectId),
      createdAt: schoolClass.createdAt,
    };
  });
}

export async function getClassesCount(): Promise<{
  total: number;
  active: number;
  inactive: number;
  sections: number;
}> {
  const [total, sections] = await Promise.all([
    db.schoolClass.count(),
    db.section.count(),
  ]);

  return {
    total,
    active: total,
    inactive: 0,
    sections,
  };
}

export async function hasClasses(): Promise<boolean> {
  const count = await db.schoolClass.count();
  return count > 0;
}

export async function getSections(): Promise<SectionListItem[]> {
  const sections = await db.section.findMany({
    orderBy: [
      {
        class: {
          name: "asc",
        },
      },
      {
        name: "asc",
      },
    ],
    include: {
      class: true,
      _count: {
        select: {
          students: true,
          schedules: true,
        },
      },
    },
  });

  return sections.map((section) => ({
    id: section.id,
    name: section.name,
    capacity: section.capacity,
    description: section.description,
    isActive: section.isActive,
    classId: section.classId,
    className: section.class.name,
    studentsCount: section._count.students,
    schedulesCount: section._count.schedules,
    createdAt: section.createdAt,
  }));
}

export async function getSectionsByClassId(
  classId: string,
): Promise<SectionListItem[]> {
  const sections = await db.section.findMany({
    where: {
      classId,
    },
    orderBy: {
      name: "asc",
    },
    include: {
      class: true,
      _count: {
        select: {
          students: true,
          schedules: true,
        },
      },
    },
  });

  return sections.map((section) => ({
    id: section.id,
    name: section.name,
    capacity: section.capacity,
    description: section.description,
    isActive: section.isActive,
    classId: section.classId,
    className: section.class.name,
    studentsCount: section._count.students,
    schedulesCount: section._count.schedules,
    createdAt: section.createdAt,
  }));
}

export async function getActiveSectionsByClassId(
  classId: string,
): Promise<Section[]> {
  return db.section.findMany({
    where: {
      classId,
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function getSectionById(id: string): Promise<Section | null> {
  return db.section.findUnique({
    where: {
      id,
    },
  });
}

export async function createSection(
  input: SectionFormInput,
): Promise<ClassServiceResult<Section>> {
  const validation = validateSectionInput(input);

  if (!validation.valid) {
    return {
      ok: false,
      message: (Object.values(validation.errors).find(Boolean) as string) || "توجد بيانات ناقصة أو غير صحيحة.",
      errors: validation.errors as Record<string, string>,
    };
  }

  if (!hasSupabaseConfig()) {
    return {
      ok: false,
      message: getSupabaseConfigErrorMessage(),
    };
  }

  const data = normalizeSectionInput(input);

  const schoolClass = await getClassById(data.classId);

  if (!schoolClass) {
    return {
      ok: false,
      message: "لم يتم العثور على الصف المرتبط بهذه الشعبة.",
    };
  }

  try {
    const section = await db.section.create({
      data: {
        name: data.name,
        capacity:
          data.capacity === undefined ? null : Number(data.capacity),
        description: data.description ?? null,
        isActive: true,
        classId: data.classId,
      },
    });

    return {
      ok: true,
      data: section,
      message: "تمت إضافة الشعبة بنجاح.",
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        ok: false,
        message: "هذه الشعبة موجودة مسبقًا داخل نفس الصف.",
        errors: {
          name: "اسم الشعبة مستخدم مسبقًا داخل هذا الصف.",
        },
      };
    }

    return {
      ok: false,
      message: "حدث خطأ أثناء إضافة الشعبة.",
    };
  }
}

export async function updateSection(
  id: string,
  input: SectionFormInput,
): Promise<ClassServiceResult<Section>> {
  const validation = validateSectionInput(input);

  if (!validation.valid) {
    return {
      ok: false,
      message: (Object.values(validation.errors).find(Boolean) as string) || "توجد بيانات ناقصة أو غير صحيحة.",
      errors: validation.errors as Record<string, string>,
    };
  }

  if (!hasSupabaseConfig()) {
    return {
      ok: false,
      message: getSupabaseConfigErrorMessage(),
    };
  }

  const existingSection = await getSectionById(id);

  if (!existingSection) {
    return {
      ok: false,
      message: "لم يتم العثور على الشعبة.",
    };
  }

  const data = normalizeSectionInput(input);

  try {
    const section = await db.section.update({
      where: {
        id,
      },
      data: {
        name: data.name,
        capacity:
          data.capacity === undefined ? null : Number(data.capacity),
        description: data.description ?? null,
        isActive: true,
        classId: data.classId,
      },
    });

    return {
      ok: true,
      data: section,
      message: "تم تحديث بيانات الشعبة بنجاح.",
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        ok: false,
        message: "توجد شعبة أخرى بنفس الاسم داخل هذا الصف.",
        errors: {
          name: "اسم الشعبة مستخدم مسبقًا داخل هذا الصف.",
        },
      };
    }

    return {
      ok: false,
      message: "حدث خطأ أثناء تحديث الشعبة.",
    };
  }
}

export async function deleteSection(
  id: string,
): Promise<ClassServiceResult<null>> {
  const section = await db.section.findUnique({
    where: {
      id,
    },
    include: {
      _count: {
        select: {
          students: true,
          schedules: true,
        },
      },
    },
  });

  if (!section) {
    return {
      ok: false,
      message: "لم يتم العثور على الشعبة.",
    };
  }

  const deleteCheck = canDeleteSection({
    studentsCount: section._count.students,
    schedulesCount: section._count.schedules,
  });

  if (!deleteCheck.allowed) {
    return {
      ok: false,
      message: deleteCheck.reason ?? "لا يمكن حذف الشعبة حاليًا.",
    };
  }

  try {
    await db.section.delete({
      where: {
        id,
      },
    });
  } catch (error) {
    console.error("[deleteSection] Error:", error);
    return {
      ok: false,
      message: "حدث خطأ أثناء حذف الشعبة. تأكد من عدم وجود بيانات مرتبطة.",
    };
  }

  return {
    ok: true,
    data: null,
    message: "تم حذف الشعبة بنجاح.",
  };
}

export async function assignSubjectsToClass(classId: string, subjectIds: string[]) {
  const uniqueSubjectIds = Array.from(new Set(subjectIds.filter(Boolean)));

  const schoolClass = await db.schoolClass.findUnique({
    where: { id: classId },
    select: { id: true },
  });

  if (!schoolClass) {
    return { ok: false as const, message: "لم يتم العثور على الصف." };
  }

  const validSubjects = await db.subject.findMany({
    where: {
      id: { in: uniqueSubjectIds },
    },
    select: { id: true },
  });

  await db.$transaction(async (tx) => {
    await tx.classSubject.deleteMany({ where: { classId } });

    if (validSubjects.length > 0) {
      await tx.classSubject.createMany({
        data: validSubjects.map((subject) => ({
          classId,
          subjectId: subject.id,
        })),
      });
    }
  });

  return { ok: true as const, message: "تم تحديث مواد الصف بنجاح." };
}

export async function getClassSubjectIds(classId: string) {
  const rows = await db.classSubject.findMany({
    where: { classId },
    select: { subjectId: true },
  });

  return rows.map((row) => row.subjectId);
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    (error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002") ||
    ((error as any)?.code === "P2002")
  );
}
