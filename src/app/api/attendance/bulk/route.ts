import { checkDb, successResponse, errorResponse } from '@/services/api-response';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  const dbError = checkDb();
  if (dbError) return dbError;

  try {
    const body = await request.json();
    const { records } = body;

    if (!Array.isArray(records) || records.length === 0) {
      return errorResponse('يجب توفير قائمة سجلات الحضور', 400);
    }

    const results: Record<string, unknown>[] = [];
    const errors: Record<string, unknown>[] = [];

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

        // Prevent duplicate check-in if student already checked in
        if (existingRecord && existingRecord.checkIn && checkIn) {
          errors.push({
            studentId,
            error: `تم تسجيل حضور الطالب مسبقاً في ${existingRecord.checkIn}`,
            existingRecord: {
              id: existingRecord.id,
              checkIn: existingRecord.checkIn,
              status: existingRecord.status,
            }
          });
          continue;
        }

        // Prevent duplicate check-out if student already checked out
        if (existingRecord && existingRecord.checkOut && checkOut) {
          errors.push({
            studentId,
            error: `تم تسجيل خروج الطالب مسبقاً في ${existingRecord.checkOut}`,
            existingRecord: {
              id: existingRecord.id,
              checkOut: existingRecord.checkOut,
              status: existingRecord.status,
            }
          });
          continue;
        }

        let result;
        if (existingRecord) {
          // Update existing record (only fill missing fields, don't overwrite)
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

    return successResponse(
      {
        saved: results.length,
        errors: errors.length,
        errorDetails: errors,
      },
      `تم حفظ ${results.length} سجل حضور`,
      201
    );
  } catch (error) {
    console.error('Bulk attendance error:', error);
    return errorResponse('حدث خطأ في تسجيل الحضور الجماعي', 500);
  }
}
