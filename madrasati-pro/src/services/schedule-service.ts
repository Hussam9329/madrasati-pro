import { Prisma } from "@/lib/prisma-types";
import { db } from "@/lib/db";
import { getSupabaseConfigErrorMessage, hasSupabaseConfig } from "@/lib/supabase-client";
import {
  getDayLabel,
  normalizeScheduleInput,
  sortSchedulesByDayAndTime,
  validateScheduleInput,
  type Schedule,
  type ScheduleConflict,
  type ScheduleDetails,
  type ScheduleFilter,
  type ScheduleFormInput,
  type ScheduleListItem,
} from "@/types/schedule";

export type ScheduleServiceResult<T> = {
  ok: boolean;
  data?: T;
  message: string;
  errors?: Record<string, string>;
};

export async function getSchedules(
  filter: ScheduleFilter = {},
): Promise<ScheduleListItem[]> {
  const where = buildScheduleWhere(filter);

  const schedules = await db.schedule.findMany({
    where,
    include: scheduleListInclude,
    orderBy: [
      {
        dayOfWeek: "asc",
      },
      {
        startTime: "asc",
      },
    ],
  });

  return sortSchedulesByDayAndTime(
    schedules.map((schedule) => toScheduleListItem(schedule)),
  );
}

export async function searchSchedules(
  query: string,
): Promise<ScheduleListItem[]> {
  return getSchedules({
    query,
  });
}

export async function getScheduleById(id: string): Promise<Schedule | null> {
  return db.schedule.findUnique({
    where: {
      id,
    },
  });
}

export async function getScheduleDetails(
  id: string,
): Promise<ScheduleDetails | null> {
  const schedule = await db.schedule.findUnique({
    where: {
      id,
    },
    include: scheduleListInclude,
  });

  if (!schedule) {
    return null;
  }

  const item = toScheduleListItem(schedule);

  return {
    ...item,
    updatedAt: schedule.updatedAt,
  };
}

export async function createSchedule(
  input: ScheduleFormInput,
): Promise<ScheduleServiceResult<Schedule>> {
  const validation = validateScheduleInput(input);

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

  const data = normalizeScheduleInput(input);

  const relationsCheck = await validateScheduleRelations(data);

  if (!relationsCheck.ok) {
    return {
      ok: false,
      message: relationsCheck.message,
      errors: relationsCheck.errors,
    };
  }

  const conflicts = await findScheduleConflicts(data);

  if (conflicts.length > 0) {
    return {
      ok: false,
      message: conflicts[0].message,
      errors: {
        conflict: conflicts[0].message,
      },
    };
  }

  try {
    const schedule = await db.schedule.create({
      data: {
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        room: data.room ?? null,
        notes: data.notes ?? null,
        isActive: data.isActive ?? true,
        sectionId: data.sectionId,
        subjectId: data.subjectId,
        teacherId: data.teacherId,
      },
    });

    return {
      ok: true,
      data: schedule,
      message: "تمت إضافة المحاضرة إلى الجدول بنجاح.",
    };
  } catch {
    return {
      ok: false,
      message: "حدث خطأ أثناء إضافة المحاضرة.",
    };
  }
}

export async function updateSchedule(
  id: string,
  input: ScheduleFormInput,
): Promise<ScheduleServiceResult<Schedule>> {
  const validation = validateScheduleInput(input);

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

  const existingSchedule = await getScheduleById(id);

  if (!existingSchedule) {
    return {
      ok: false,
      message: "لم يتم العثور على المحاضرة.",
    };
  }

  const data = normalizeScheduleInput(input);

  const relationsCheck = await validateScheduleRelations(data);

  if (!relationsCheck.ok) {
    return {
      ok: false,
      message: relationsCheck.message,
      errors: relationsCheck.errors,
    };
  }

  const conflicts = await findScheduleConflicts(data, id);

  if (conflicts.length > 0) {
    return {
      ok: false,
      message: conflicts[0].message,
      errors: {
        conflict: conflicts[0].message,
      },
    };
  }

  try {
    const schedule = await db.schedule.update({
      where: {
        id,
      },
      data: {
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        room: data.room ?? null,
        notes: data.notes ?? null,
        isActive: data.isActive ?? true,
        sectionId: data.sectionId,
        subjectId: data.subjectId,
        teacherId: data.teacherId,
      },
    });

    return {
      ok: true,
      data: schedule,
      message: "تم تحديث المحاضرة بنجاح.",
    };
  } catch {
    return {
      ok: false,
      message: "حدث خطأ أثناء تحديث المحاضرة.",
    };
  }
}

export async function deleteSchedule(
  id: string,
): Promise<ScheduleServiceResult<null>> {
  const schedule = await getScheduleById(id);

  if (!schedule) {
    return {
      ok: false,
      message: "لم يتم العثور على المحاضرة.",
    };
  }

  await db.schedule.delete({
    where: {
      id,
    },
  });

  return {
    ok: true,
    data: null,
    message: "تم حذف المحاضرة من الجدول بنجاح.",
  };
}

export async function toggleScheduleStatus(
  id: string,
): Promise<ScheduleServiceResult<Schedule>> {
  const schedule = await getScheduleById(id);

  if (!schedule) {
    return {
      ok: false,
      message: "لم يتم العثور على المحاضرة.",
    };
  }

  const updatedSchedule = await db.schedule.update({
    where: {
      id,
    },
    data: {
      isActive: !schedule.isActive,
    },
  });

  return {
    ok: true,
    data: updatedSchedule,
    message: updatedSchedule.isActive
      ? "تم تفعيل المحاضرة."
      : "تم تعطيل المحاضرة.",
  };
}

export async function getSchedulesCount(): Promise<{
  total: number;
  active: number;
  inactive: number;
  today: number;
}> {
  const todayDay = getTodayDayValue();

  const [total, active, inactive, today] = await Promise.all([
    db.schedule.count(),
    db.schedule.count({
      where: {
        isActive: true,
      },
    }),
    db.schedule.count({
      where: {
        isActive: false,
      },
    }),
    db.schedule.count({
      where: {
        dayOfWeek: todayDay,
        isActive: true,
      },
    }),
  ]);

  return {
    total,
    active,
    inactive,
    today,
  };
}

export async function getSchedulesBySectionId(
  sectionId: string,
): Promise<ScheduleListItem[]> {
  return getSchedules({
    sectionId,
  });
}

export async function getSchedulesByTeacherId(
  teacherId: string,
): Promise<ScheduleListItem[]> {
  return getSchedules({
    teacherId,
  });
}

export async function getSchedulesByDay(
  dayOfWeek: string,
): Promise<ScheduleListItem[]> {
  return getSchedules({
    dayOfWeek,
  });
}

export async function hasSchedules(): Promise<boolean> {
  const count = await db.schedule.count();
  return count > 0;
}

export async function findScheduleConflicts(
  input: ScheduleFormInput,
  excludeScheduleId?: string,
): Promise<ScheduleConflict[]> {
  const data = normalizeScheduleInput(input);

  const baseWhere: Prisma.ScheduleWhereInput = {
    dayOfWeek: data.dayOfWeek,
    isActive: true,
    startTime: {
      lt: data.endTime,
    },
    endTime: {
      gt: data.startTime,
    },
  };

  if (excludeScheduleId) {
    baseWhere.id = {
      not: excludeScheduleId,
    };
  }

  const conflictingSchedules = await db.schedule.findMany({
    where: {
      ...baseWhere,
      OR: [
        {
          teacherId: data.teacherId,
        },
        {
          sectionId: data.sectionId,
        },
      ],
    },
    include: scheduleListInclude,
  });

  return conflictingSchedules.map((schedule) => {
    const isTeacherConflict = schedule.teacherId === data.teacherId;

    return {
      id: schedule.id,
      type: isTeacherConflict ? "teacher" : "section",
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      sectionName: schedule.section.name,
      teacherName: schedule.teacher.fullName,
      message: isTeacherConflict
        ? `يوجد تعارض: المدرس ${schedule.teacher.fullName} لديه محاضرة أخرى يوم ${getDayLabel(schedule.dayOfWeek)} من ${schedule.startTime} إلى ${schedule.endTime}.`
        : `يوجد تعارض: الشعبة ${schedule.section.name} لديها محاضرة أخرى يوم ${getDayLabel(schedule.dayOfWeek)} من ${schedule.startTime} إلى ${schedule.endTime}.`,
    };
  });
}

function buildScheduleWhere(
  filter: ScheduleFilter,
): Prisma.ScheduleWhereInput {
  const query = filter.query?.trim();

  const where: Prisma.ScheduleWhereInput = {};

  if (query) {
    where.OR = [
      {
        room: {
          contains: query,
        },
      },
      {
        notes: {
          contains: query,
        },
      },
      {
        section: {
          name: {
            contains: query,
          },
        },
      },
      {
        section: {
          class: {
            name: {
              contains: query,
            },
          },
        },
      },
      {
        subject: {
          name: {
            contains: query,
          },
        },
      },
      {
        teacher: {
          fullName: {
            contains: query,
          },
        },
      },
    ];
  }

  if (filter.dayOfWeek) {
    where.dayOfWeek = filter.dayOfWeek;
  }

  if (filter.sectionId) {
    where.sectionId = filter.sectionId;
  }

  if (filter.subjectId) {
    where.subjectId = filter.subjectId;
  }

  if (filter.teacherId) {
    where.teacherId = filter.teacherId;
  }

  if (filter.classId) {
    where.section = {
      classId: filter.classId,
    };
  }

  if (typeof filter.isActive === "boolean") {
    where.isActive = filter.isActive;
  }

  return where;
}

async function validateScheduleRelations(
  input: ScheduleFormInput,
): Promise<{
  ok: boolean;
  message: string;
  errors?: Record<string, string>;
}> {
  const [section, subject, teacher] = await Promise.all([
    db.section.findUnique({
      where: {
        id: input.sectionId,
      },
      include: {
        class: true,
      },
    }),
    db.subject.findUnique({
      where: {
        id: input.subjectId,
      },
    }),
    db.teacher.findUnique({
      where: {
        id: input.teacherId,
      },
    }),
  ]);

  if (!section) {
    return {
      ok: false,
      message: "الشعبة المحددة غير موجودة.",
      errors: {
        sectionId: "الشعبة المحددة غير موجودة.",
      },
    };
  }

  if (!subject) {
    return {
      ok: false,
      message: "المادة المحددة غير موجودة.",
      errors: {
        subjectId: "المادة المحددة غير موجودة.",
      },
    };
  }

  if (!teacher) {
    return {
      ok: false,
      message: "المدرس المحدد غير موجود.",
      errors: {
        teacherId: "المدرس المحدد غير موجود.",
      },
    };
  }

  const teacherSubject = await db.teacherSubject.findFirst({
    where: {
      teacherId: input.teacherId,
      subjectId: input.subjectId,
    },
  });

  if (!teacherSubject) {
    return {
      ok: false,
      message: "هذا المدرس غير مرتبط بهذه المادة.",
      errors: {
        teacherId: "اربط المدرس بالمادة أولًا من صفحة المدرسين.",
        subjectId: "المادة غير مرتبطة بالمدرس.",
      },
    };
  }

  return {
    ok: true,
    message: "العلاقات صحيحة.",
  };
}

const scheduleListInclude = {
  section: {
    include: {
      class: true,
    },
  },
  subject: true,
  teacher: true,
} satisfies Prisma.ScheduleInclude;

type ScheduleWithRelations = Prisma.ScheduleGetPayload<{
  include: typeof scheduleListInclude;
}>;

function toScheduleListItem(
  schedule: ScheduleWithRelations,
): ScheduleListItem {
  return {
    id: schedule.id,
    dayOfWeek: schedule.dayOfWeek,
    dayLabel: getDayLabel(schedule.dayOfWeek),
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    room: schedule.room,
    notes: schedule.notes,
    isActive: schedule.isActive,

    sectionId: schedule.sectionId,
    sectionName: schedule.section.name,

    classId: schedule.section.classId,
    className: schedule.section.class.name,
    classLevel: schedule.section.class.level,

    subjectId: schedule.subjectId,
    subjectName: schedule.subject.name,

    teacherId: schedule.teacherId,
    teacherName: schedule.teacher.fullName,
    teacherPhone: schedule.teacher.phone,

    createdAt: schedule.createdAt,
  };
}

function getTodayDayValue(): string {
  const today = new Date().getDay();

  const map: Record<number, string> = {
    0: "sunday",
    1: "monday",
    2: "tuesday",
    3: "wednesday",
    4: "thursday",
    5: "friday",
    6: "saturday",
  };

  return map[today] ?? "saturday";
}
