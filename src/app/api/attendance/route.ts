import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const studentId = searchParams.get('studentId');
    const classId = searchParams.get('classId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, unknown> = {};
    if (date) where.date = date;
    if (studentId) where.studentId = studentId;
    if (status) where.status = status;
    if (classId) {
      where.student = { classId };
    }

    const [records, total] = await Promise.all([
      db.attendanceRecord.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              fullName: true,
              studentNumber: true,
              class: { select: { id: true, name: true } },
              section: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.attendanceRecord.count({ where }),
    ]);

    return NextResponse.json({
      records,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب سجلات الحضور' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      studentId,
      schoolId,
      date,
      checkIn,
      checkOut,
      status,
      lateMinutes,
      earlyExitReason,
      earlyExitApproved,
      modifiedBy,
    } = body;

    if (!studentId || !schoolId || !date) {
      return NextResponse.json(
        { error: 'معرف الطالب والمدرسة والتاريخ مطلوبون' },
        { status: 400 }
      );
    }

    // Check if record already exists for this student on this date
    const existingRecord = await db.attendanceRecord.findFirst({
      where: { studentId, date },
    });

    if (existingRecord) {
      // Update existing record
      const record = await db.attendanceRecord.update({
        where: { id: existingRecord.id },
        data: {
          checkIn: checkIn || existingRecord.checkIn,
          checkOut: checkOut || existingRecord.checkOut,
          status: status || existingRecord.status,
          lateMinutes: lateMinutes ?? existingRecord.lateMinutes,
          earlyExitReason: earlyExitReason || existingRecord.earlyExitReason,
          earlyExitApproved: earlyExitApproved ?? existingRecord.earlyExitApproved,
          modifiedBy: modifiedBy || existingRecord.modifiedBy,
          modifiedAt: new Date(),
        },
        include: {
          student: {
            select: {
              id: true,
              fullName: true,
              studentNumber: true,
            },
          },
        },
      });

      return NextResponse.json(record);
    }

    // Create new record
    const record = await db.attendanceRecord.create({
      data: {
        studentId,
        schoolId,
        date,
        checkIn,
        checkOut,
        status: status || 'حاضر',
        lateMinutes,
        earlyExitReason,
        earlyExitApproved,
        modifiedBy,
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            studentNumber: true,
          },
        },
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Create attendance error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تسجيل الحضور' },
      { status: 500 }
    );
  }
}
