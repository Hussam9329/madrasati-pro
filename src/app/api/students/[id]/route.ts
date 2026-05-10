import { checkDb, successResponse, errorResponse } from '@/services/api-response';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const dbError = checkDb();
  if (dbError) return dbError;

  try {
    const { id } = await params;

    const student = await db.student.findUnique({
      where: { id },
      include: {
        class: true,
        section: true,
        grades: {
          include: {
            subject: true,
            examType: true,
          },
        },
        attendance: {
          orderBy: { date: 'desc' },
          take: 30,
        },
      },
    });

    if (!student) {
      return errorResponse('الطالب غير موجود', 404);
    }

    return successResponse(student);
  } catch (error) {
    console.error('Get student error:', error);
    return errorResponse('حدث خطأ في جلب بيانات الطالب', 500);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const dbError = checkDb();
  if (dbError) return dbError;

  try {
    const { id } = await params;
    const body = await request.json();

    const existingStudent = await db.student.findUnique({ where: { id } });
    if (!existingStudent) {
      return errorResponse('الطالب غير موجود', 404);
    }

    const student = await db.student.update({
      where: { id },
      data: {
        fullName: body.fullName,
        gender: body.gender,
        dateOfBirth: body.dateOfBirth,
        nationalId: body.nationalId,
        phone: body.phone,
        address: body.address,
        photo: body.photo,
        status: body.status,
        classId: body.classId,
        sectionId: body.sectionId,
        guardianName: body.guardianName,
        guardianPhone: body.guardianPhone,
        guardianRelation: body.guardianRelation,
        cardStatus: body.cardStatus,
      },
      include: {
        class: true,
        section: true,
      },
    });

    return successResponse(student);
  } catch (error) {
    console.error('Update student error:', error);
    return errorResponse('حدث خطأ في تحديث بيانات الطالب', 500);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const dbError = checkDb();
  if (dbError) return dbError;

  try {
    const { id } = await params;

    const existingStudent = await db.student.findUnique({ where: { id } });
    if (!existingStudent) {
      return errorResponse('الطالب غير موجود', 404);
    }

    // Delete related records first
    await db.attendanceRecord.deleteMany({ where: { studentId: id } });
    await db.grade.deleteMany({ where: { studentId: id } });
    await db.student.delete({ where: { id } });

    return successResponse(null, 'تم حذف الطالب بنجاح');
  } catch (error) {
    console.error('Delete student error:', error);
    return errorResponse('حدث خطأ في حذف الطالب', 500);
  }
}
