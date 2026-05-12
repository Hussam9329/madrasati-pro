import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  ATTENDANCE_STATUSES,
  canDeleteAttendanceRecord,
  getAttendanceStatusLabel,
  normalizeAttendanceInput,
  normalizeDateOnly,
  validateAttendanceInput,
  type AttendanceBatchInput,
  type AttendanceDetails,
  type AttendanceFilter,
  type AttendanceFormInput,
  type AttendanceListItem,
  type AttendanceRecord,
} from "@/types/attendance";

export type AttendanceServiceResult<T> = {
  ok: boolean;
  data?: T;
  message: string;
  errors?: Record<string, string>;
};

// ─── Include & Mapper ───────────────────────────────────────────

const attendanceListInclude = {
  student: {
    include: {
      section: {
        include: {
          class: true,
        },
      },
    },
  },
  schedule: {
    include: {
      section: {
        include: {
          class: true,
        },
      },
      subject: true,
      teacher: true,
    },
  },
} satisfies Prisma.AttendanceRecordInclude;

const attendanceFullInclude = {
  ...attendanceListInclude,
} satisfies Prisma.AttendanceRecordInclude;

type AttendanceWithRelations = Prisma.AttendanceRecordGetPayload<{
  include: typeof attendanceFullInclude;
}>;

function toAttendanceListItem(
  record: AttendanceWithRelations,
): AttendanceListItem {
  return {
    id: record.id,
    date: record.date,
    status: record.status,
    statusLabel: getAttendanceStatusLabel(record.status),
    notes: record.notes ?? null,

    studentId: record.studentId,
    studentName: record.student.fullName,
    studentCode: record.student.studentCode ?? null,

    sectionId: record.student.sectionId ?? record.schedule?.sectionId ?? null,
    sectionName:
      record.student.section?.name ?? record.schedule?.section.name ?? null,

    classId:
      record.student.section?.classId ??
      record.schedule?.section.classId ??
      null,
    className:
      record.student.section?.class.name ??
      record.schedule?.section.class.name ??
      null,
    classLevel:
      record.student.section?.class.level ??
      record.schedule?.section.class.level ??
      null,

    scheduleId: record.scheduleId ?? null,
    dayOfWeek: record.schedule?.dayOfWeek ?? null,
    startTime: record.schedule?.startTime ?? null,
    endTime: record.schedule?.endTime ?? null,

    subjectId: record.schedule?.subjectId ?? null,
    subjectName: record.schedule?.subject.name ?? null,

    teacherId: record.schedule?.teacherId ?? null,
    teacherName: record.schedule?.teacher.fullName ?? null,

    createdAt: record.createdAt,
  };
}

// ─── Where Builder ───────────────────────────────────────────────

function buildAttendanceWhere(
  filter: AttendanceFilter,
): Prisma.AttendanceRecordWhereInput {
  const query = filter.query?.trim();
  const where: Prisma.AttendanceRecordWhereInput = {};

  if (query) {
    where.OR = [
      {
        student: {
          fullName: {
            contains: query,
          },
        },
      },
      {
        student: {
          studentCode: {
            contains: query,
          },
        },
      },
      {
        notes: {
          contains: query,
        },
      },
      {
        schedule: {
          subject: {
            name: {
              contains: query,
            },
          },
        },
      },
      {
        schedule: {
          teacher: {
            fullName: {
              contains: query,
            },
          },
        },
      },
    ];
  }

  if (filter.status) {
    where.status = filter.status;
  }

  if (filter.studentId) {
    where.studentId = filter.studentId;
  }

  if (filter.scheduleId) {
    where.scheduleId = filter.scheduleId;
  }

  if (filter.date) {
    const parsed = normalizeDateOnly(filter.date);
    if (parsed) {
      const start = new Date(
        parsed.getFullYear(),
        parsed.getMonth(),
        parsed.getDate(),
        0,
        0,
        0,
        0,
      );
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      where.date = {
        gte: start,
        lt: end,
      };
    }
  }

  if (filter.fromDate || filter.toDate) {
    const dateFilter: Prisma.DateTimeFilter = {};

    if (filter.fromDate) {
      const from = normalizeDateOnly(filter.fromDate);
      if (from) {
        dateFilter.gte = new Date(
          from.getFullYear(),
          from.getMonth(),
          from.getDate(),
          0,
          0,
          0,
          0,
        );
      }
    }

    if (filter.toDate) {
      const to = normalizeDateOnly(filter.toDate);
      if (to) {
        const toEnd = new Date(
          to.getFullYear(),
          to.getMonth(),
          to.getDate() + 1,
          0,
          0,
          0,
          0,
        );
        dateFilter.lt = toEnd;
      }
    }

    where.date = {
      ...(typeof where.date === "object" && where.date !== null
        ? (where.date as Prisma.DateTimeFilter)
        : {}),
      ...dateFilter,
    };
  }

  if (filter.sectionId) {
    where.OR = [
      {
        student: {
          sectionId: filter.sectionId,
        },
      },
      {
        schedule: {
          sectionId: filter.sectionId,
        },
      },
    ];
  }

  if (filter.classId) {
    where.OR = [
      {
        student: {
          section: {
            classId: filter.classId,
          },
        },
      },
      {
        schedule: {
          section: {
            classId: filter.classId,
          },
        },
      },
    ];
  }

  if (filter.subjectId) {
    where.schedule = {
      ...((where.schedule as Prisma.ScheduleWhereInput) ?? {}),
      subjectId: filter.subjectId,
    };
  }

  if (filter.teacherId) {
    where.schedule = {
      ...((where.schedule as Prisma.ScheduleWhereInput) ?? {}),
      teacherId: filter.teacherId,
    };
  }

  return where;
}

// ─── Validation Helpers ──────────────────────────────────────────

async function validateAttendanceRelations(
  input: AttendanceFormInput,
): Promise<{
  ok: boolean;
  message: string;
  errors?: Record<string, string>;
}> {
  const student = await db.student.findUnique({
    where: {
      id: input.studentId,
    },
  });

  if (!student) {
    return {
      ok: false,
      message: "الطالب المحدد غير موجود.",
      errors: {
        studentId: "الطالب المحدد غير موجود.",
      },
    };
  }

  if (student.status !== "active") {
    return {
      ok: false,
      message: "لا يمكن تسجيل الحضور لطالب غير مستمر.",
      errors: {
        studentId: "حالة الطالب ليست مستمرة.",
      },
    };
  }

  if (input.scheduleId) {
    const schedule = await db.schedule.findUnique({
      where: {
        id: input.scheduleId,
      },
    });

    if (!schedule) {
      return {
        ok: false,
        message: "الحصة المحددة غير موجودة.",
        errors: {
          scheduleId: "الحصة المحددة غير موجودة.",
        },
      };
    }

    if (!schedule.isActive) {
      return {
        ok: false,
        message: "لا يمكن ربط الحضور بحصة متوقفة.",
        errors: {
          scheduleId: "الحصة متوقفة.",
        },
      };
    }
  }

  return {
    ok: true,
    message: "العلاقات صحيحة.",
  };
}

async function findDuplicateAttendanceRecord(
  input: AttendanceFormInput,
  excludeId?: string,
): Promise<boolean> {
  const dateValue = normalizeDateOnly(input.date);
  if (!dateValue) return false;

  const start = new Date(
    dateValue.getFullYear(),
    dateValue.getMonth(),
    dateValue.getDate(),
    0,
    0,
    0,
    0,
  );
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const where: Prisma.AttendanceRecordWhereInput = {
    date: {
      gte: start,
      lt: end,
    },
    studentId: input.studentId,
  };

  if (input.scheduleId) {
    where.scheduleId = input.scheduleId;
  } else {
    where.scheduleId = null;
  }

  if (excludeId) {
    where.id = { not: excludeId };
  }

  const existing = await db.attendanceRecord.findFirst({ where });
  return existing !== null;
}

// ─── Read Operations ─────────────────────────────────────────────

export async function getAttendanceRecords(
  filter: AttendanceFilter = {},
): Promise<AttendanceListItem[]> {
  const where = buildAttendanceWhere(filter);

  const records = await db.attendanceRecord.findMany({
    where,
    include: attendanceFullInclude,
    orderBy: [
      {
        createdAt: "desc",
      },
    ],
  });

  return records.map((record) => toAttendanceListItem(record));
}

export async function searchAttendanceRecords(
  query: string,
): Promise<AttendanceListItem[]> {
  return getAttendanceRecords({
    query,
  });
}

export async function getAttendanceRecordById(
  id: string,
): Promise<AttendanceRecord | null> {
  const record = await db.attendanceRecord.findUnique({
    where: {
      id,
    },
  });

  if (!record) return null;

  return {
    id: record.id,
    date: record.date,
    status: record.status,
    notes: record.notes,
    studentId: record.studentId,
    scheduleId: record.scheduleId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export async function getAttendanceDetails(
  id: string,
): Promise<AttendanceDetails | null> {
  const record = await db.attendanceRecord.findUnique({
    where: {
      id,
    },
    include: attendanceFullInclude,
  });

  if (!record) return null;

  const item = toAttendanceListItem(record);

  return {
    ...item,
    updatedAt: record.updatedAt,
  };
}

// ─── Write Operations ────────────────────────────────────────────

export async function createAttendanceRecord(
  input: AttendanceFormInput,
): Promise<AttendanceServiceResult<AttendanceRecord>> {
  const validation = validateAttendanceInput(input);

  if (!validation.valid) {
    return {
      ok: false,
      message: "توجد بيانات ناقصة أو غير صحيحة.",
      errors: validation.errors as Record<string, string>,
    };
  }

  const data = normalizeAttendanceInput(input);

  const relationsCheck = await validateAttendanceRelations(data);

  if (!relationsCheck.ok) {
    return {
      ok: false,
      message: relationsCheck.message,
      errors: relationsCheck.errors,
    };
  }

  const isDuplicate = await findDuplicateAttendanceRecord(data);

  if (isDuplicate) {
    return {
      ok: false,
      message: "يوجد سجل حضور مكرر لهذا الطالب في نفس اليوم والحصة.",
      errors: {
        studentId: "سجل الحضور موجود مسبقًا لهذا الطالب.",
      },
    };
  }

  try {
    const dateValue = normalizeDateOnly(data.date);

    const record = await db.attendanceRecord.create({
      data: {
        date: dateValue ?? new Date(),
        status: data.status,
        notes: data.notes ?? null,
        scheduleId: data.scheduleId || null,
        studentId: data.studentId,
      },
    });

    return {
      ok: true,
      data: {
        id: record.id,
        date: record.date,
        status: record.status,
        notes: record.notes,
        studentId: record.studentId,
        scheduleId: record.scheduleId,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
      message: "تم تسجيل الحضور بنجاح.",
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        ok: false,
        message: "يوجد سجل حضور مكرر لهذا الطالب في نفس اليوم والحصة.",
        errors: {
          studentId: "سجل الحضور موجود مسبقًا لهذا الطالب.",
        },
      };
    }

    return {
      ok: false,
      message: "حدث خطأ أثناء تسجيل الحضور.",
    };
  }
}

export async function updateAttendanceRecord(
  id: string,
  input: AttendanceFormInput,
): Promise<AttendanceServiceResult<AttendanceRecord>> {
  const validation = validateAttendanceInput(input);

  if (!validation.valid) {
    return {
      ok: false,
      message: "توجد بيانات ناقصة أو غير صحيحة.",
      errors: validation.errors as Record<string, string>,
    };
  }

  const existing = await db.attendanceRecord.findUnique({
    where: { id },
  });

  if (!existing) {
    return {
      ok: false,
      message: "لم يتم العثور على سجل الحضور.",
    };
  }

  const data = normalizeAttendanceInput(input);

  const relationsCheck = await validateAttendanceRelations(data);

  if (!relationsCheck.ok) {
    return {
      ok: false,
      message: relationsCheck.message,
      errors: relationsCheck.errors,
    };
  }

  const isDuplicate = await findDuplicateAttendanceRecord(data, id);

  if (isDuplicate) {
    return {
      ok: false,
      message: "يوجد سجل حضور مكرر لهذا الطالب في نفس اليوم والحصة.",
      errors: {
        studentId: "سجل الحضور موجود مسبقًا لهذا الطالب.",
      },
    };
  }

  try {
    const dateValue = normalizeDateOnly(data.date);

    const record = await db.attendanceRecord.update({
      where: { id },
      data: {
        date: dateValue ?? existing.date,
        status: data.status,
        notes: data.notes ?? null,
        scheduleId: data.scheduleId || null,
        studentId: data.studentId,
      },
    });

    return {
      ok: true,
      data: {
        id: record.id,
        date: record.date,
        status: record.status,
        notes: record.notes,
        studentId: record.studentId,
        scheduleId: record.scheduleId,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
      message: "تم تحديث سجل الحضور بنجاح.",
    };
  } catch {
    return {
      ok: false,
      message: "حدث خطأ أثناء تحديث سجل الحضور.",
    };
  }
}

export async function deleteAttendanceRecord(
  id: string,
): Promise<AttendanceServiceResult<null>> {
  const record = await db.attendanceRecord.findUnique({
    where: { id },
  });

  if (!record) {
    return {
      ok: false,
      message: "لم يتم العثور على سجل الحضور.",
    };
  }

  const deleteCheck = canDeleteAttendanceRecord();

  if (!deleteCheck.allowed) {
    return {
      ok: false,
      message: deleteCheck.reason ?? "لا يمكن حذف سجل الحضور حاليًا.",
    };
  }

  await db.attendanceRecord.delete({
    where: { id },
  });

  return {
    ok: true,
    data: null,
    message: "تم حذف سجل الحضور بنجاح.",
  };
}

// ─── Batch Operations ────────────────────────────────────────────

export async function markAttendanceBatch(
  input: AttendanceBatchInput,
): Promise<AttendanceServiceResult<{ created: number; updated: number }>> {
  if (!input.records || input.records.length === 0) {
    return {
      ok: false,
      message: "لا توجد سجلات حضور لإضافتها.",
    };
  }

  const dateValue = normalizeDateOnly(input.date);

  if (!dateValue) {
    return {
      ok: false,
      message: "تاريخ الحضور غير صحيح.",
      errors: {
        date: "تاريخ الحضور غير صحيح.",
      },
    };
  }

  const start = new Date(
    dateValue.getFullYear(),
    dateValue.getMonth(),
    dateValue.getDate(),
    0,
    0,
    0,
    0,
  );
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  let created = 0;
  let updated = 0;

  for (const entry of input.records) {
    const statusValue = String(entry.status || "present").trim();

    if (!ATTENDANCE_STATUSES.some((s) => s.value === statusValue)) {
      continue;
    }

    const existing = await db.attendanceRecord.findFirst({
      where: {
        date: {
          gte: start,
          lt: end,
        },
        studentId: entry.studentId,
        scheduleId: input.scheduleId || null,
      },
    });

    if (existing) {
      await db.attendanceRecord.update({
        where: { id: existing.id },
        data: {
          status: statusValue,
          notes: entry.notes?.trim() || null,
          scheduleId: input.scheduleId || null,
        },
      });
      updated++;
    } else {
      await db.attendanceRecord.create({
        data: {
          date: dateValue,
          status: statusValue,
          notes: entry.notes?.trim() || null,
          scheduleId: input.scheduleId || null,
          studentId: entry.studentId,
        },
      });
      created++;
    }
  }

  return {
    ok: true,
    data: { created, updated },
    message: `تم تسجيل الحضور: ${created} جديد، ${updated} محدّث.`,
  };
}

// ─── Counts & Aggregations ───────────────────────────────────────

export async function getAttendanceCounts(): Promise<{
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
}> {
  const [total, present, absent, late, excused] = await Promise.all([
    db.attendanceRecord.count(),
    db.attendanceRecord.count({
      where: { status: "present" },
    }),
    db.attendanceRecord.count({
      where: { status: "absent" },
    }),
    db.attendanceRecord.count({
      where: { status: "late" },
    }),
    db.attendanceRecord.count({
      where: { status: "excused" },
    }),
  ]);

  return {
    total,
    present,
    absent,
    late,
    excused,
  };
}

// ─── Query by Relations ──────────────────────────────────────────

export async function getAttendanceByStudentId(
  studentId: string,
): Promise<AttendanceListItem[]> {
  return getAttendanceRecords({
    studentId,
  });
}

export async function getAttendanceByScheduleId(
  scheduleId: string,
): Promise<AttendanceListItem[]> {
  return getAttendanceRecords({
    scheduleId,
  });
}

export async function getTodayAttendance(): Promise<AttendanceListItem[]> {
  const today = new Date();
  const dateStr = today.toISOString().split("T")[0];

  return getAttendanceRecords({
    date: dateStr,
  });
}

export async function hasAttendanceRecords(): Promise<boolean> {
  const count = await db.attendanceRecord.count();
  return count > 0;
}

// ─── Internal Helpers ────────────────────────────────────────────

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}
