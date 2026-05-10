import { checkDb, successResponse, errorResponse } from '@/services/api-response';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(request: Request) {
  const dbError = checkDb();
  if (dbError) return dbError;

  try {
    const body = await request.json();
    const { gradeIds, approvedBy } = body;

    if (!gradeIds || !Array.isArray(gradeIds) || gradeIds.length === 0) {
      return errorResponse('قائمة معرفات الدرجات مطلوبة', 400);
    }

    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return errorResponse('غير مصرح بهذا الإجراء', 401);
    }

    const token = authHeader.split(' ')[1];
    const user = verifyToken(token);
    if (!user || (user.role !== 'مدير' && user.role !== 'مسؤول نظام' && user.role !== 'معاون')) {
      return errorResponse('غير مصرح بالاعتماد. يتطلب صلاحيات مدير أو معاون', 403);
    }

    // Approve grades - lock them from editing
    const result = await db.grade.updateMany({
      where: {
        id: { in: gradeIds },
        approved: false,
      },
      data: {
        approved: true,
        approvedBy: approvedBy || user.name,
      },
    });

    return successResponse(
      { approvedCount: result.count },
      `تم اعتماد ${result.count} درجة بنجاح`
    );
  } catch (error) {
    console.error('Approve grades error:', error);
    return errorResponse('حدث خطأ في اعتماد الدرجات', 500);
  }
}
