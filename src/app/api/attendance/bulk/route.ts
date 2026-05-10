import { checkDb, successResponse, errorResponse, validationErrorResponse } from '@/services/api-response';
import { db } from '@/lib/db';
import { attendanceBulkSchema } from '@/lib/validations';

export async function POST(request: Request) {
  const dbError = checkDb();
  if (dbError) return dbError;

  try {
    const body = await request.json();

    // Validate input with Zod
    const result = attendanceBulkSchema.safeParse(body);
    if (!result.success) {
      return validationErrorResponse(result.error);
    }

    const { records } = result.data;

    const results: Record<string, unknown>[] = [];
    const errors: Record<string, unknown>[] = [];

    for (const record of records) {
      try {
        const { studentId, schoolId, date, status, checkIn, checkOut, lateMinutes } = record;

        // Check if record already exists for this student on this date
        const existingRecord = await db.attendanceRecord.findFirst({
          where: { studentId, date },
        });

        if (existingRecord && existingRecord.checkIn && checkIn) {
          errors.push({
            studentId,
            error: `تم تسجيل حضور الطالب مسبقاً في ${existingRecord.checkIn}`,
          });
          continue;
        }

        if (existingRecord && existingRecord.checkOut && checkOut) {
          errors.push({
            studentId,
            error: `تم تسجيل خروج الطالب مسبقاً في ${existingRecord.checkOut}`,
          });
          continue;
        }

        let savedRecord;
        if (existingRecord) {
          savedRecord = await db.attendanceRecord.update({
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
          savedRecord = await db.attendanceRecord.create({
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

        results.push(savedRecord);
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
