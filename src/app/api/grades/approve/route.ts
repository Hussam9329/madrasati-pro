import { checkDb, successResponse, errorResponse, validationErrorResponse, forbiddenResponse } from '@/services/api-response';
import { db } from '@/lib/db';
import { GRADE_APPROVAL_ROLES } from '@/lib/auth';
import { gradeApproveSchema } from '@/lib/validations';

export async function POST(request: Request) {
  const dbError = checkDb();
  if (dbError) return dbError;

  try {
    // Verify authorization — only specific roles can approve grades
    const userRole = request.headers.get('x-user-role');
    const userName = request.headers.get('x-user-name');

    if (!userRole || !GRADE_APPROVAL_ROLES.includes(userRole as typeof GRADE_APPROVAL_ROLES[number])) {
      return forbiddenResponse('غير مصرح بالاعتماد. يتطلب صلاحيات مدير أو معاون');
    }

    const body = await request.json();

    // Validate input with Zod
    const result = gradeApproveSchema.safeParse(body);
    if (!result.success) {
      return validationErrorResponse(result.error);
    }

    const data = result.data;

    // Approve grades - lock them from editing
    const approvedByName = userName ? decodeURIComponent(userName) : data.approvedBy;

    const approveResult = await db.grade.updateMany({
      where: {
        id: { in: data.gradeIds },
        approved: false,
      },
      data: {
        approved: true,
        approvedBy: approvedByName,
      },
    });

    return successResponse(
      { approvedCount: approveResult.count },
      `تم اعتماد ${approveResult.count} درجة بنجاح`
    );
  } catch (error) {
    console.error('Approve grades error:', error);
    return errorResponse('حدث خطأ في اعتماد الدرجات', 500);
  }
}
