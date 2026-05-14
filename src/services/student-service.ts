import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  canDeleteStudent,
  normalizeStudentInput,
  parseOptionalDate,
  validateStudentInput,
  type Student,
  type StudentDetails,
  type StudentFormInput,
  type StudentListItem,
  type StudentsFilter,
} from "@/types/student";

export type StudentServiceResult<T> = {
  ok: boolean;
  data?: T;
  message: string;
  errors?: Record<string, string>;
};

export async function getStudents(
  filter: StudentsFilter = {},
): Promise<StudentListItem[]> {
  const where = buildStudentWhere(filter);

  const students = await db.student.findMany({
    where,
    orderBy: [
      {
        status: "asc",
      },
      {
        createdAt: "desc",
      },
    ],
    include: {
      section: {
        include: {
          class: true,
        },
      },
      _count: {
        select: {
          grades: true,
          attendanceRecords: true,
          payments: true,
        },
      },
    },
  });

  return students.map((student) => toStudentListItem(student));
}

export async function searchStudents(
  query: string,
): Promise<StudentListItem[]> {
  return getStudents({
    query,
  });
}

export async function getStudentById(id: string): Promise<Student | null> {
  return db.student.findUnique({
    where: {
      id,
    },
  });
}

export async function getStudentDetails(
  id: string,
): Promise<StudentDetails | null> {
  const student = await db.student.findUnique({
    where: {
      id,
    },
    include: {
      section: {
        include: {
          class: true,
        },
      },
      _count: {
        select: {
          grades: true,
          attendanceRecords: true,
          payments: true,
        },
      },
    },
  });

  if (!student) {
    return null;
  }

  return {
    id: student.id,
    fullName: student.fullName,
    studentCode: student.studentCode,
    gender: student.gender,
    birthDate: student.birthDate,
    phone: student.phone,
    guardianName: student.guardianName,
    guardianPhone: student.guardianPhone,
    address: student.address,
    enrollmentDate: student.enrollmentDate,
    status: student.status,
    notes: student.notes,
    sectionId: student.sectionId,
    createdAt: student.createdAt,
    updatedAt: student.updatedAt,
    sectionName: student.section?.name ?? null,
    classId: student.section?.classId ?? null,
    className: student.section?.class.name ?? null,
    classLevel: student.section?.class.level ?? null,
    gradesCount: student._count.grades,
    attendanceCount: student._count.attendanceRecords,
    feesCount: student._count.payments,
  };
}

export async function createStudent(
  input: StudentFormInput,
): Promise<StudentServiceResult<Student>> {
  const validation = validateStudentInput(input);

  if (!validation.valid) {
    return {
      ok: false,
      message: "توجد بيانات ناقصة أو غير صحيحة.",
      errors: validation.errors as Record<string, string>,
    };
  }

  const data = normalizeStudentInput(input);

  const sectionCheck = await validateSectionIfProvided(data.sectionId);

  if (!sectionCheck.ok) {
    return {
      ok: false,
      message: sectionCheck.message,
      errors: {
        sectionId: sectionCheck.message,
      },
    };
  }

  try {
    const student = await db.student.create({
      data: {
        fullName: data.fullName,
        studentCode: null,
        gender: "female",
        birthDate: parseOptionalDate(data.birthDate) ?? null,
        phone: data.phone ?? null,
        guardianName: null,
        guardianPhone: data.guardianPhone ?? null,
        address: null,
        enrollmentDate: new Date(),
        status: "active",
        notes: null,
        sectionId: data.sectionId || null,
      },
    });

    return {
      ok: true,
      data: student,
      message: "تمت إضافة الطالب بنجاح.",
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        ok: false,
        message: "رقم الطالب مستخدم مسبقًا.",
        errors: {
          studentCode: "رقم الطالب مستخدم مسبقًا.",
        },
      };
    }

    return {
      ok: false,
      message: "حدث خطأ أثناء إضافة الطالب.",
    };
  }
}

export async function updateStudent(
  id: string,
  input: StudentFormInput,
): Promise<StudentServiceResult<Student>> {
  const validation = validateStudentInput(input);

  if (!validation.valid) {
    return {
      ok: false,
      message: "توجد بيانات ناقصة أو غير صحيحة.",
      errors: validation.errors as Record<string, string>,
    };
  }

  const existingStudent = await getStudentById(id);

  if (!existingStudent) {
    return {
      ok: false,
      message: "لم يتم العثور على الطالب.",
    };
  }

  const data = normalizeStudentInput(input);

  const sectionCheck = await validateSectionIfProvided(data.sectionId);

  if (!sectionCheck.ok) {
    return {
      ok: false,
      message: sectionCheck.message,
      errors: {
        sectionId: sectionCheck.message,
      },
    };
  }

  try {
    const student = await db.student.update({
      where: {
        id,
      },
      data: {
        fullName: data.fullName,
        birthDate: parseOptionalDate(data.birthDate) ?? null,
        phone: data.phone ?? null,
        guardianPhone: data.guardianPhone ?? null,
        sectionId: data.sectionId || null,
      },
    });

    return {
      ok: true,
      data: student,
      message: "تم تحديث بيانات الطالب بنجاح.",
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        ok: false,
        message: "رقم الطالب مستخدم مسبقًا.",
        errors: {
          studentCode: "رقم الطالب مستخدم مسبقًا.",
        },
      };
    }

    return {
      ok: false,
      message: "حدث خطأ أثناء تحديث بيانات الطالب.",
    };
  }
}

export async function deleteStudent(
  id: string,
): Promise<StudentServiceResult<null>> {
  const student = await db.student.findUnique({
    where: {
      id,
    },
    include: {
      _count: {
        select: {
          grades: true,
          attendanceRecords: true,
          payments: true,
        },
      },
    },
  });

  if (!student) {
    return {
      ok: false,
      message: "لم يتم العثور على الطالب.",
    };
  }

  const deleteCheck = canDeleteStudent({
    gradesCount: student._count.grades,
    attendanceCount: student._count.attendanceRecords,
    feesCount: student._count.payments,
  });

  if (!deleteCheck.allowed) {
    return {
      ok: false,
      message: deleteCheck.reason ?? "لا يمكن حذف الطالب حاليًا.",
    };
  }

  await db.student.delete({
    where: {
      id,
    },
  });

  return {
    ok: true,
    data: null,
    message: "تم حذف الطالب بنجاح.",
  };
}

export async function updateStudentStatus(
  id: string,
  status: string,
): Promise<StudentServiceResult<Student>> {
  if (!["active", "inactive", "graduated", "transferred"].includes(status)) {
    return {
      ok: false,
      message: "حالة الطالب غير صحيحة.",
    };
  }

  const student = await getStudentById(id);

  if (!student) {
    return {
      ok: false,
      message: "لم يتم العثور على الطالب.",
    };
  }

  const updatedStudent = await db.student.update({
    where: {
      id,
    },
    data: {
      status,
    },
  });

  return {
    ok: true,
    data: updatedStudent,
    message: "تم تحديث حالة الطالب بنجاح.",
  };
}

export async function moveStudentToSection(
  studentId: string,
  sectionId: string | null,
): Promise<StudentServiceResult<Student>> {
  const student = await getStudentById(studentId);

  if (!student) {
    return {
      ok: false,
      message: "لم يتم العثور على الطالب.",
    };
  }

  const sectionCheck = await validateSectionIfProvided(sectionId ?? undefined);

  if (!sectionCheck.ok) {
    return {
      ok: false,
      message: sectionCheck.message,
    };
  }

  const updatedStudent = await db.student.update({
    where: {
      id: studentId,
    },
    data: {
      sectionId,
    },
  });

  return {
    ok: true,
    data: updatedStudent,
    message: sectionId
      ? "تم نقل الطالب إلى الشعبة المحددة."
      : "تم إزالة ارتباط الطالب بالشعبة.",
  };
}

export async function getStudentsCount(): Promise<{
  total: number;
  active: number;
  inactive: number;
  graduated: number;
  transferred: number;
  withoutSection: number;
}> {
  const [total, active, inactive, graduated, transferred, withoutSection] =
    await Promise.all([
      db.student.count(),
      db.student.count({
        where: {
          status: "active",
        },
      }),
      db.student.count({
        where: {
          status: "inactive",
        },
      }),
      db.student.count({
        where: {
          status: "graduated",
        },
      }),
      db.student.count({
        where: {
          status: "transferred",
        },
      }),
      db.student.count({
        where: {
          sectionId: null,
        },
      }),
    ]);

  return {
    total,
    active,
    inactive,
    graduated,
    transferred,
    withoutSection,
  };
}

export async function getStudentsBySectionId(
  sectionId: string,
): Promise<StudentListItem[]> {
  return getStudents({
    sectionId,
  });
}

export async function getActiveStudentsBySectionId(
  sectionId: string,
): Promise<Student[]> {
  return db.student.findMany({
    where: {
      sectionId,
      status: "active",
    },
    orderBy: {
      fullName: "asc",
    },
  });
}

export async function getActiveStudents(): Promise<Student[]> {
  return db.student.findMany({
    where: {
      status: "active",
    },
    orderBy: {
      fullName: "asc",
    },
  });
}

export async function hasStudents(): Promise<boolean> {
  const count = await db.student.count();
  return count > 0;
}

function buildStudentWhere(filter: StudentsFilter): Prisma.StudentWhereInput {
  const query = filter.query?.trim();

  const where: Prisma.StudentWhereInput = {};

  if (query) {
    where.OR = [
      {
        fullName: {
          contains: query,
        },
      },
      {
        studentCode: {
          contains: query,
        },
      },
      {
        phone: {
          contains: query,
        },
      },
      {
        guardianName: {
          contains: query,
        },
      },
      {
        guardianPhone: {
          contains: query,
        },
      },
    ];
  }

  if (filter.sectionId) {
    where.sectionId = filter.sectionId;
  }

  if (filter.classId) {
    where.section = {
      classId: filter.classId,
    };
  }

  if (filter.status) {
    where.status = filter.status;
  }

  return where;
}

async function validateSectionIfProvided(
  sectionId?: string,
): Promise<{
  ok: boolean;
  message: string;
}> {
  if (!sectionId) {
    return {
      ok: true,
      message: "لا توجد شعبة محددة.",
    };
  }

  const section = await db.section.findUnique({
    where: {
      id: sectionId,
    },
    include: {
      class: true,
    },
  });

  if (!section) {
    return {
      ok: false,
      message: "الشعبة المحددة غير موجودة.",
    };
  }

  if (!section.isActive) {
    return {
      ok: false,
      message: "لا يمكن ربط الطالب بشعبة متوقفة.",
    };
  }

  if (!section.class.isActive) {
    return {
      ok: false,
      message: "لا يمكن ربط الطالب بصف متوقف.",
    };
  }

  return {
    ok: true,
    message: "الشعبة صالحة.",
  };
}

type StudentWithRelations = Prisma.StudentGetPayload<{
  include: {
    section: {
      include: {
        class: true;
      };
    };
    _count: {
      select: {
        grades: true;
        attendanceRecords: true;
        payments: true;
      };
    };
  };
}>;

function toStudentListItem(student: StudentWithRelations): StudentListItem {
  return {
    id: student.id,
    fullName: student.fullName,
    studentCode: student.studentCode,
    gender: student.gender,
    birthDate: student.birthDate,
    phone: student.phone,
    guardianName: student.guardianName,
    guardianPhone: student.guardianPhone,
    status: student.status,
    sectionId: student.sectionId,
    sectionName: student.section?.name ?? null,
    classId: student.section?.classId ?? null,
    className: student.section?.class.name ?? null,
    classLevel: student.section?.class.level ?? null,
    gradesCount: student._count.grades,
    attendanceCount: student._count.attendanceRecords,
    feesCount: student._count.payments,
    enrollmentDate: student.enrollmentDate,
    createdAt: student.createdAt,
  };
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}
