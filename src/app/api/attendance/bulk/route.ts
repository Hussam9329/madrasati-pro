import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { records } = body;

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: 'يجب توفير قائمة سجلات الحضور' },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    for (const record of records) {
      try {
        const { studentId, schoolId, date, status, checkIn, checkOut, lateMinutes } = record;

        if (!studentId || !schoolId || !date || !status) {
          errors.push({ studentId: studentId || 'unknown', error: 'بيانات ناقصة' });
          continue;
        }

        // Check if record already exists for this student on this date
        const existingRecord = await db.attendanceRecord.findFirst({
          where: { studentId, date },
        });

        let result;
        if (existingRecord) {
          // Update existing record
          result = await db.attendanceRecord.update({
            where: { id: existingRecord.id },
            data: {
              checkIn: checkIn || existingRecord.checkIn,
              checkOut: checkOut || existingRecord.checkOut,
              status,
              lateMinutes: lateMinutes ?? existingRecord.lateMinutes,
              modifiedAt: new Date(),
            },
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
          });
        } else {
          // Create new record
          result = await db.attendanceRecord.create({
            data: {
              studentId,
              schoolId,
              date,
              checkIn: checkIn || (status === 'حاضر' ? new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : null),
              checkOut,
              status,
              lateMinutes: lateMinutes || null,
            },
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
          });
        }

        results.push(result);
      } catch (err) {
        errors.push({ studentId: record.studentId || 'unknown', error: 'خطأ في حفظ السجل' });
      }
    }

    return NextResponse.json({
      message: `تم حفظ ${results.length} سجل حضور`,
      saved: results.length,
      errors: errors.length,
      errorDetails: errors,
    }, { status: 201 });
  } catch (error) {
    console.error('Bulk attendance error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تسجيل الحضور الجماعي' },
      { status: 500 }
    );
  }
}
