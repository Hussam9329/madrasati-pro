import { checkDb, successResponse, errorResponse } from '@/services/api-response';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  const dbError = checkDb();
  if (dbError) return dbError;

  try {
    const body = await request.json();
    const { qrCode, type } = body;

    if (!qrCode || !type) {
      return errorResponse('رمز QR ونوع المسح مطلوبان', 400);
    }

    if (type !== 'checkIn' && type !== 'checkOut') {
      return errorResponse('نوع المسح يجب أن يكون checkIn أو checkOut', 400);
    }

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
        403,
        JSON.stringify({
          student: {
            id: student.id,
            fullName: student.fullName,
            studentNumber: student.studentNumber,
            cardStatus: student.cardStatus,
          },
        })
      );
    }

    if (student.status !== 'مستمر') {
      return errorResponse(
        `حالة الطالب: ${student.status}`,
        403,
        JSON.stringify({
          student: {
            id: student.id,
            fullName: student.fullName,
            studentNumber: student.studentNumber,
            status: student.status,
          },
        })
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
    const lateThreshold = school.lateThreshold || 10; // minutes
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
        // Check if student already checked in today
        if (existingRecord.checkIn) {
          return errorResponse(
            'تم تسجيل حضور هذا الطالب مسبقاً اليوم',
            409,
            JSON.stringify({
              action: 'duplicateCheckIn',
              student: {
                id: student.id,
                fullName: student.fullName,
                studentNumber: student.studentNumber,
                class: student.class.name,
                section: student.section.name,
              },
              existingRecord: {
                id: existingRecord.id,
                checkIn: existingRecord.checkIn,
                status: existingRecord.status,
                lateMinutes: existingRecord.lateMinutes,
              },
            })
          );
        }

        // Record exists but no check-in yet (e.g. was marked absent), update it
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

      // Create new check-in record
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
      return errorResponse(
        'لم يتم تسجيل حضور هذا الطالب اليوم',
        400,
        JSON.stringify({
          student: {
            id: student.id,
            fullName: student.fullName,
            studentNumber: student.studentNumber,
          },
        })
      );
    }

    if (existingRecord.checkOut) {
      return errorResponse(
        'تم تسجيل خروج هذا الطالب مسبقاً اليوم',
        409,
        JSON.stringify({
          action: 'duplicateCheckOut',
          student: {
            id: student.id,
            fullName: student.fullName,
            studentNumber: student.studentNumber,
            class: student.class.name,
            section: student.section.name,
          },
          existingRecord: {
            id: existingRecord.id,
            checkIn: existingRecord.checkIn,
            checkOut: existingRecord.checkOut,
            status: existingRecord.status,
          },
        })
      );
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
