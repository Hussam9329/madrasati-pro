import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { qrCode, type } = body;

    if (!qrCode || !type) {
      return NextResponse.json(
        { error: 'رمز QR ونوع المسح مطلوبان' },
        { status: 400 }
      );
    }

    if (type !== 'checkIn' && type !== 'checkOut') {
      return NextResponse.json(
        { error: 'نوع المسح يجب أن يكون checkIn أو checkOut' },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: 'الطالب غير موجود. رمز QR غير صالح' },
        { status: 404 }
      );
    }

    if (student.cardStatus !== 'فعالة') {
      return NextResponse.json(
        {
          error: `بطاقة الطالب ${student.cardStatus}`,
          student: {
            id: student.id,
            fullName: student.fullName,
            studentNumber: student.studentNumber,
            cardStatus: student.cardStatus,
          },
        },
        { status: 403 }
      );
    }

    if (student.status !== 'مستمر') {
      return NextResponse.json(
        {
          error: `حالة الطالب: ${student.status}`,
          student: {
            id: student.id,
            fullName: student.fullName,
            studentNumber: student.studentNumber,
            status: student.status,
          },
        },
        { status: 403 }
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
          return NextResponse.json(
            {
              error: 'تم تسجيل حضور هذا الطالب مسبقاً اليوم',
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
            },
            { status: 409 }
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

        return NextResponse.json({
          message: 'تم تسجيل الحضور',
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
        });
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

      return NextResponse.json({
        message: 'تم تسجيل الحضور',
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
      });
    }

    // Check-out
    if (!existingRecord) {
      return NextResponse.json(
        {
          error: 'لم يتم تسجيل حضور هذا الطالب اليوم',
          student: {
            id: student.id,
            fullName: student.fullName,
            studentNumber: student.studentNumber,
          },
        },
        { status: 400 }
      );
    }

    if (existingRecord.checkOut) {
      return NextResponse.json(
        {
          error: 'تم تسجيل خروج هذا الطالب مسبقاً اليوم',
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
        },
        { status: 409 }
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

    return NextResponse.json({
      message: newStatus === 'خروج مبكر' ? 'تم تسجيل خروج مبكر' : 'تم تسجيل الخروج',
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
    });
  } catch (error) {
    console.error('Scan attendance error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في مسح الحضور' },
      { status: 500 }
    );
  }
}
