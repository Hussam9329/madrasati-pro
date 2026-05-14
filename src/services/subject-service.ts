import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  canDeleteSubject,
  normalizeSubjectInput,
  validateSubjectInput,
  type Subject,
  type SubjectFormInput,
  type SubjectListItem,
} from "@/types/subject";

export type SubjectServiceResult<T> = {
  ok: boolean;
  data?: T;
  message: string;
  errors?: Record<string, string>;
};

export async function getSubjects(): Promise<SubjectListItem[]> {
  const subjects = await db.subject.findMany({
    orderBy: [
      {
        isActive: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    include: {
      _count: {
        select: {
          teacherSubjects: true,
          classSubjects: true,
          grades: true,
        },
      },
    },
  });

  return subjects.map((subject) => ({
    id: subject.id,
    name: subject.name,
    description: subject.description,
    isActive: subject.isActive,
    teachersCount: subject._count.teacherSubjects,
    classesCount: subject._count.classSubjects,
    gradesCount: subject._count.grades,
    createdAt: subject.createdAt,
  }));
}

export async function getActiveSubjects(): Promise<Subject[]> {
  return db.subject.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function getSubjectById(id: string): Promise<Subject | null> {
  return db.subject.findUnique({
    where: {
      id,
    },
  });
}

export async function getSubjectDetails(id: string) {
  return db.subject.findUnique({
    where: {
      id,
    },
    include: {
      teacherSubjects: {
        include: {
          teacher: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      classSubjects: {
        include: {
          class: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      _count: {
        select: {
          grades: true,
          schedules: true,
        },
      },
    },
  });
}

export async function createSubject(
  input: SubjectFormInput,
): Promise<SubjectServiceResult<Subject>> {
  const validation = validateSubjectInput(input);

  if (!validation.valid) {
    return {
      ok: false,
      message: "توجد بيانات ناقصة أو غير صحيحة.",
      errors: validation.errors as Record<string, string>,
    };
  }

  const data = normalizeSubjectInput(input);

  try {
    const subject = await db.subject.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        isActive: data.isActive ?? true,
      },
    });

    return {
      ok: true,
      data: subject,
      message: "تمت إضافة المادة الدراسية بنجاح.",
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        ok: false,
        message: "هذه المادة موجودة مسبقًا.",
        errors: {
          name: "اسم المادة مستخدم مسبقًا.",
        },
      };
    }

    return {
      ok: false,
      message: "حدث خطأ أثناء إضافة المادة الدراسية.",
    };
  }
}

export async function updateSubject(
  id: string,
  input: SubjectFormInput,
): Promise<SubjectServiceResult<Subject>> {
  const validation = validateSubjectInput(input);

  if (!validation.valid) {
    return {
      ok: false,
      message: "توجد بيانات ناقصة أو غير صحيحة.",
      errors: validation.errors as Record<string, string>,
    };
  }

  const data = normalizeSubjectInput(input);

  const existingSubject = await getSubjectById(id);

  if (!existingSubject) {
    return {
      ok: false,
      message: "لم يتم العثور على المادة الدراسية.",
    };
  }

  try {
    const subject = await db.subject.update({
      where: {
        id,
      },
      data: {
        name: data.name,
        description: data.description ?? null,
        isActive: data.isActive ?? true,
      },
    });

    return {
      ok: true,
      data: subject,
      message: "تم تحديث المادة الدراسية بنجاح.",
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        ok: false,
        message: "هذه المادة موجودة مسبقًا.",
        errors: {
          name: "اسم المادة مستخدم مسبقًا.",
        },
      };
    }

    return {
      ok: false,
      message: "حدث خطأ أثناء تحديث المادة الدراسية.",
    };
  }
}

export async function deleteSubject(
  id: string,
): Promise<SubjectServiceResult<null>> {
  const subject = await db.subject.findUnique({
    where: {
      id,
    },
    include: {
      _count: {
        select: {
          teacherSubjects: true,
          classSubjects: true,
          grades: true,
        },
      },
    },
  });

  if (!subject) {
    return {
      ok: false,
      message: "لم يتم العثور على المادة الدراسية.",
    };
  }

  const deleteCheck = canDeleteSubject({
    teachersCount: subject._count.teacherSubjects,
    classesCount: subject._count.classSubjects,
    gradesCount: subject._count.grades,
  });

  if (!deleteCheck.allowed) {
    return {
      ok: false,
      message: deleteCheck.reason ?? "لا يمكن حذف هذه المادة حاليًا.",
    };
  }

  await db.subject.delete({
    where: {
      id,
    },
  });

  return {
    ok: true,
    data: null,
    message: "تم حذف المادة الدراسية بنجاح.",
  };
}

export async function toggleSubjectStatus(
  id: string,
): Promise<SubjectServiceResult<Subject>> {
  const subject = await getSubjectById(id);

  if (!subject) {
    return {
      ok: false,
      message: "لم يتم العثور على المادة الدراسية.",
    };
  }

  const updatedSubject = await db.subject.update({
    where: {
      id,
    },
    data: {
      isActive: !subject.isActive,
    },
  });

  return {
    ok: true,
    data: updatedSubject,
    message: updatedSubject.isActive
      ? "تم تفعيل المادة الدراسية."
      : "تم تعطيل المادة الدراسية.",
  };
}

export async function searchSubjects(query: string): Promise<SubjectListItem[]> {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return getSubjects();
  }

  const subjects = await db.subject.findMany({
    where: {
      OR: [
        {
          name: {
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
      _count: {
        select: {
          teacherSubjects: true,
          classSubjects: true,
          grades: true,
        },
      },
    },
  });

  return subjects.map((subject) => ({
    id: subject.id,
    name: subject.name,
    description: subject.description,
    isActive: subject.isActive,
    teachersCount: subject._count.teacherSubjects,
    classesCount: subject._count.classSubjects,
    gradesCount: subject._count.grades,
    createdAt: subject.createdAt,
  }));
}

export async function getSubjectsCount(): Promise<{
  total: number;
  active: number;
  inactive: number;
}> {
  const [total, active, inactive] = await Promise.all([
    db.subject.count(),
    db.subject.count({
      where: {
        isActive: true,
      },
    }),
    db.subject.count({
      where: {
        isActive: false,
      },
    }),
  ]);

  return {
    total,
    active,
    inactive,
  };
}

export async function hasSubjects(): Promise<boolean> {
  const count = await db.subject.count();
  return count > 0;
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}
