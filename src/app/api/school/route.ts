import { checkDb, successResponse, errorResponse, validationErrorResponse, forbiddenResponse } from '@/services/api-response';
import { db } from '@/lib/db';
import { schoolUpdateSchema } from '@/lib/validations';
import { ADMIN_ROLES } from '@/lib/auth';

// قيم ثابتة غير قابلة للتغيير
const FIXED_SCHOOL_NAME = 'ثانوية مارينا';
const FIXED_SCHOOL_ADDRESS = 'زيونة - الشارع الخدمي لدار الازياء';

export async function GET() {
  const dbError = checkDb();
  if (dbError) return dbError;

  try {
    let schools = await db.school.findMany({
      include: {
        _count: {
          select: {
            students: true,
            teachers: true,
            subjects: true,
            classes: true,
          },
        },
      },
    });

    if (schools.length === 0) {
      const school = await db.school.create({
        data: {
          name: FIXED_SCHOOL_NAME,
          address: FIXED_SCHOOL_ADDRESS,
          academicYear: '2026-2027',
          schoolType: 'ثانوية اعتيادية',
          shiftType: 'صباحي',
          startTime: '08:00',
          endTime: '13:30',
          lateThreshold: 10,
          weekendDays: '5,6',
        },
        include: {
          _count: {
            select: {
              students: true,
              teachers: true,
              subjects: true,
              classes: true,
            },
          },
        },
      });
      return successResponse({ school, schools: [school] });
    }

    // تأكد من أن الاسم والعنوان ثابتان دائمًا
    if (schools[0].name !== FIXED_SCHOOL_NAME || schools[0].address !== FIXED_SCHOOL_ADDRESS) {
      await db.school.update({
        where: { id: schools[0].id },
        data: {
          name: FIXED_SCHOOL_NAME,
          address: FIXED_SCHOOL_ADDRESS,
        },
      });
      schools = await db.school.findMany({
        include: {
          _count: {
            select: {
              students: true,
              teachers: true,
              subjects: true,
              classes: true,
            },
          },
        },
      });
    }

    return successResponse({ school: schools[0], schools });
  } catch (error) {
    console.error('Get school error:', error);
    return errorResponse('حدث خطأ في جلب بيانات المدرسة', 500);
  }
}

export async function PUT(request: Request) {
  const dbError = checkDb();
  if (dbError) return dbError;

  try {
    // Only admin roles can update school settings
    const userRole = request.headers.get('x-user-role');
    if (!userRole || !ADMIN_ROLES.includes(userRole as typeof ADMIN_ROLES[number])) {
      return forbiddenResponse('تحديث إعدادات المدرسة يتطلب صلاحيات مدير');
    }

    const body = await request.json();

    // Validate input with Zod
    const result = schoolUpdateSchema.safeParse(body);
    if (!result.success) {
      return validationErrorResponse(result.error);
    }

    const data = result.data;

    const existingSchools = await db.school.findMany();

    let school;
    if (existingSchools.length > 0) {
      // تحديث مع تجاهل الاسم والعنوان (قيم ثابتة)
      school = await db.school.update({
        where: { id: existingSchools[0].id },
        data: {
          name: FIXED_SCHOOL_NAME,
          address: FIXED_SCHOOL_ADDRESS,
          logo: data.logo,
          phone: data.phone,
          email: data.email,
          principalName: data.principalName,
          academicYear: data.academicYear,
          schoolType: data.schoolType,
          shiftType: data.shiftType,
          startTime: data.startTime,
          endTime: data.endTime,
          lateThreshold: data.lateThreshold,
          weekendDays: data.weekendDays,
        },
      });
    } else {
      school = await db.school.create({
        data: {
          name: FIXED_SCHOOL_NAME,
          address: FIXED_SCHOOL_ADDRESS,
          logo: data.logo,
          phone: data.phone,
          email: data.email,
          principalName: data.principalName,
          academicYear: data.academicYear || '2026-2027',
          schoolType: data.schoolType || 'ثانوية اعتيادية',
          shiftType: data.shiftType || 'صباحي',
          startTime: data.startTime || '08:00',
          endTime: data.endTime || '13:30',
          lateThreshold: data.lateThreshold || 10,
          weekendDays: data.weekendDays || '5,6',
        },
      });
    }

    return successResponse(school);
  } catch (error) {
    console.error('Update school error:', error);
    return errorResponse('حدث خطأ في تحديث بيانات المدرسة', 500);
  }
}
