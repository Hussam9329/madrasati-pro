import { db } from "@/lib/db";
import {
  getSchoolCompletionPercentage,
  getSchoolSummary,
  normalizeSchoolInput,
  validateSchoolInput,
  type School,
  type SchoolFormInput,
  type SchoolSummary,
} from "@/types/school";

export type SchoolServiceResult<T> = {
  ok: boolean;
  data?: T;
  message: string;
  errors?: Record<string, string>;
};

export async function getSchool(): Promise<School | null> {
  const school = await db.school.findFirst({
    orderBy: {
      createdAt: "asc",
    },
  });

  return school;
}

export async function getSchoolOverview(): Promise<{
  school: School | null;
  summary: SchoolSummary | null;
  completionPercentage: number;
}> {
  const school = await getSchool();

  return {
    school,
    summary: school ? getSchoolSummary(school) : null,
    completionPercentage: getSchoolCompletionPercentage(school),
  };
}

export async function createOrUpdateSchool(
  input: SchoolFormInput,
): Promise<SchoolServiceResult<School>> {
  const validation = validateSchoolInput(input);

  if (!validation.valid) {
    return {
      ok: false,
      message: "توجد بيانات ناقصة أو غير صحيحة.",
      errors: validation.errors as Record<string, string>,
    };
  }

  const data = normalizeSchoolInput(input);
  const existingSchool = await getSchool();

  if (existingSchool) {
    const updatedSchool = await db.school.update({
      where: {
        id: existingSchool.id,
      },
      data: {
        name: data.name,
        academicYear: data.academicYear ?? null,
        address: data.address ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        logoUrl: data.logoUrl ?? null,
        notes: data.notes ?? null,
      },
    });

    return {
      ok: true,
      data: updatedSchool,
      message: "تم تحديث بيانات المدرسة بنجاح.",
    };
  }

  const createdSchool = await db.school.create({
    data: {
      name: data.name,
      academicYear: data.academicYear ?? null,
      address: data.address ?? null,
      phone: data.phone ?? null,
      email: data.email ?? null,
      logoUrl: data.logoUrl ?? null,
      notes: data.notes ?? null,
    },
  });

  return {
    ok: true,
    data: createdSchool,
    message: "تم حفظ بيانات المدرسة بنجاح.",
  };
}

export async function updateSchoolById(
  id: string,
  input: SchoolFormInput,
): Promise<SchoolServiceResult<School>> {
  const validation = validateSchoolInput(input);

  if (!validation.valid) {
    return {
      ok: false,
      message: "توجد بيانات ناقصة أو غير صحيحة.",
      errors: validation.errors as Record<string, string>,
    };
  }

  const data = normalizeSchoolInput(input);

  const existingSchool = await db.school.findUnique({
    where: {
      id,
    },
  });

  if (!existingSchool) {
    return {
      ok: false,
      message: "لم يتم العثور على بيانات المدرسة.",
    };
  }

  const updatedSchool = await db.school.update({
    where: {
      id,
    },
    data: {
      name: data.name,
      academicYear: data.academicYear ?? null,
      address: data.address ?? null,
      phone: data.phone ?? null,
      email: data.email ?? null,
      logoUrl: data.logoUrl ?? null,
      notes: data.notes ?? null,
    },
  });

  return {
    ok: true,
    data: updatedSchool,
    message: "تم تحديث بيانات المدرسة بنجاح.",
  };
}

export async function deleteSchool(): Promise<SchoolServiceResult<null>> {
  const school = await getSchool();

  if (!school) {
    return {
      ok: false,
      message: "لا توجد بيانات مدرسة لحذفها.",
    };
  }

  await db.school.delete({
    where: {
      id: school.id,
    },
  });

  return {
    ok: true,
    data: null,
    message: "تم حذف بيانات المدرسة بنجاح.",
  };
}

export async function hasSchoolData(): Promise<boolean> {
  const count = await db.school.count();
  return count > 0;
}

export async function getSchoolName(): Promise<string> {
  const school = await getSchool();
  return school?.name ?? "مدرستي";
}

export async function getSchoolSetupStatus(): Promise<{
  hasSchool: boolean;
  completionPercentage: number;
  nextMessage: string;
}> {
  const school = await getSchool();
  const completionPercentage = getSchoolCompletionPercentage(school);

  if (!school) {
    return {
      hasSchool: false,
      completionPercentage: 0,
      nextMessage: "أضف بيانات المدرسة حتى تظهر في التقارير والواجهات.",
    };
  }

  if (completionPercentage < 50) {
    return {
      hasSchool: true,
      completionPercentage,
      nextMessage: "أكمل معلومات المدرسة مثل الهاتف، العنوان، والسنة الدراسية.",
    };
  }

  if (completionPercentage < 100) {
    return {
      hasSchool: true,
      completionPercentage,
      nextMessage: "بيانات المدرسة جيدة، ويمكنك إكمال التفاصيل المتبقية لاحقًا.",
    };
  }

  return {
    hasSchool: true,
    completionPercentage,
    nextMessage: "بيانات المدرسة مكتملة وجاهزة للاستخدام في التقارير.",
  };
}
