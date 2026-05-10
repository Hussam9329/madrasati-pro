import { checkDb, successResponse, errorResponse, validationErrorResponse, requirePermission } from '@/services/api-response';
import { db } from '@/lib/db';
import { attendanceScanSchema } from '@/lib/validations';

export async function POST(request: Request) {
  const dbError = checkDb();
  if (dbError) return dbError;

  // QR scan attendance requires attendance_scan or attendance permission
  const authError = requirePermission(request, 'attendance_scan');
  if (authError) return authError;

  try {
    const body = await request.json();

    // Validate input with Zod
    const result = attendanceScanSchema.safeParse(body);
    if (!result.success) {
      return validationErrorResponse(result.error);
    }

    const { qrCode, type } = result.data;

    // Find student by QR code
    const student = await db.student.findFirst({
      where: { qrCode },
      include: {
        class: true,
        section: true,
        school: true,
      },
    });

    if (!student) {
      return errorResponse('الطالب غير موجود. رمز QR غير صالح', 404);
    }

    if (student.cardStatus !== 'فعالة') {
      return errorResponse(
        `بطاقة الطالب ${student.cardStatus}`,
        403
      );
    }

    if (student.status !== 'مستمر') {
      return errorResponse(
        `حالة الطالب: ${student.status}`,
        403
      );
    }

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Check for existing record today
    const existingRecord = await db.attendanceRecord.findFirst({
      where: { studentId: student.id, date: today },
    });

    // Get school settings for late threshold
    const school = student.school;
    const lateThreshold = school.lateThreshold || 10;
    const startTime = school.startTime || '08:00';

    if (type === 'checkIn') {
      // Determine if late
      const [startH, startM] = startTime.split(':').map(Number);
      const lateThresholdMinutes = startH * 60 + startM + lateThreshold;
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      let attendanceStatus: string;
      let lateMinutes: number | null = null;

      if (currentMinutes <= startH * 60 + startM) {
        attendanceStatus = 'حاضر';
      } else if (currentMinutes <= lateThresholdMinutes) {
        attendanceStatus = 'متأخر';
        lateMinutes = currentMinutes - (startH * 60 + startM);
      } else {
        attendanceStatus = 'متأخر';
        lateMinutes = currentMinutes - (startH * 60 + startM);
      }

      if (existingRecord) {
        if (existingRecord.checkIn) {
          return errorResponse('تم تسجيل حضور هذا الطالب مسبقاً اليوم', 409);
        }

        const record = await db.attendanceRecord.update({
          where: { id: existingRecord.id },
          data: {
            checkIn: currentTime,
            status: attendanceStatus,
            lateMinutes,
          },
        });

        return successResponse({
          action: 'checkIn',
          status: attendanceStatus,
          lateMinutes,
          record,
          student: {
            id: student.id,
            fullName: student.fullName,
            studentNumber: student.studentNumber,
            class: student.class.name,
            section: student.section.name,
          },
        }, 'تم تسجيل الحضور');
      }

      const record = await db.attendanceRecord.create({
        data: {
          studentId: student.id,
          schoolId: student.schoolId,
          date: today,
          checkIn: currentTime,
          status: attendanceStatus,
          lateMinutes,
        },
      });

      return successResponse({
        action: 'checkIn',
        status: attendanceStatus,
        lateMinutes,
        record,
        student: {
          id: student.id,
          fullName: student.fullName,
          studentNumber: student.studentNumber,
          class: student.class.name,
          section: student.section.name,
        },
      }, 'تم تسجيل الحضور');
    }

    // Check-out
    if (!existingRecord) {
      return errorResponse('لم يتم تسجيل حضور هذا الطالب اليوم', 400);
    }

    if (existingRecord.checkOut) {
      return errorResponse('تم تسجيل خروج هذا الطالب مسبقاً اليوم', 409);
    }

    // Determine if early exit
    const endTime = school.endTime || '13:30';
    const [endH, endM] = endTime.split(':').map(Number);
    const endMinutes = endH * 60 + endM;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let newStatus = existingRecord.status;
    if (currentMinutes < endMinutes) {
      newStatus = 'خروج مبكر';
    }

    const record = await db.attendanceRecord.update({
      where: { id: existingRecord.id },
      data: {
        checkOut: currentTime,
        status: newStatus,
      },
    });

    return successResponse({
      action: 'checkOut',
      status: newStatus,
      isEarlyExit: currentMinutes < endMinutes,
      record,
      student: {
        id: student.id,
        fullName: student.fullName,
        studentNumber: student.studentNumber,
        class: student.class.name,
        section: student.section.name,
      },
    }, newStatus === 'خروج مبكر' ? 'تم تسجيل خروج مبكر' : 'تم تسجيل الخروج');
  } catch (error) {
    console.error('Scan attendance error:', error);
    return errorResponse('حدث خطأ في مسح الحضور', 500);
  }
}
