import { checkDb, successResponse, errorResponse } from '@/services/api-response';
import { db } from '@/lib/db';

// قيم ثابتة غير قابلة للتغيير
const FIXED_SCHOOL_NAME = 'ثانوية مارينا';
const FIXED_SCHOOL_ADDRESS = 'زيونة - الشارع الخدمي لدار الازياء';

export async function GET() {
  const dbError = checkDb();
  if (dbError) return dbError;

  try {
    // إذا لا توجد مدرسة، أنشئها تلقائيًا بالقيم الثابتة
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
    const body = await request.json();

    const existingSchools = await db.school.findMany();

    let school;
    if (existingSchools.length > 0) {
      // تحديث مع تجاهل الاسم والعنوان (قيم ثابتة)
      school = await db.school.update({
        where: { id: existingSchools[0].id },
        data: {
          name: FIXED_SCHOOL_NAME,           // ثابت — لا يُغيَّر
          address: FIXED_SCHOOL_ADDRESS,     // ثابت — لا يُغيَّر
          logo: body.logo,
          phone: body.phone,
          email: body.email,
          principalName: body.principalName,
          academicYear: body.academicYear,
          schoolType: body.schoolType,
          shiftType: body.shiftType,         // configurable — يحدده المدير
          startTime: body.startTime,         // configurable — يحدده المدير
          endTime: body.endTime,             // configurable — يحدده المدير
          lateThreshold: body.lateThreshold,
          weekendDays: body.weekendDays,
        },
      });
    } else {
      school = await db.school.create({
        data: {
          name: FIXED_SCHOOL_NAME,
          address: FIXED_SCHOOL_ADDRESS,
          logo: body.logo,
          phone: body.phone,
          email: body.email,
          principalName: body.principalName,
          academicYear: body.academicYear || '2026-2027',
          schoolType: body.schoolType || 'ثانوية اعتيادية',
          shiftType: body.shiftType || 'صباحي',
          startTime: body.startTime || '08:00',
          endTime: body.endTime || '13:30',
          lateThreshold: body.lateThreshold || 10,
          weekendDays: body.weekendDays || '5,6',
        },
      });
    }

    return successResponse(school);
  } catch (error) {
    console.error('Update school error:', error);
    return errorResponse('حدث خطأ في تحديث بيانات المدرسة', 500);
  }
}
