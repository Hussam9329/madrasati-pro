import { NextRequest } from 'next/server';
import { checkDb, successResponse, errorResponse, validationErrorResponse, forbiddenResponse, requireAnyPermission } from '@/services/api-response';
import { db } from '@/lib/db';
import { feePlanCreateSchema } from '@/lib/validations';
import { hasPermission } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const dbError = checkDb();
  if (dbError) return dbError;

  // عرض خطط الرسوم يتطلب صلاحية مناسبة
  const authError = requireAnyPermission(request, ['students', 'payments_view']);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');

    const where = classId ? { classId } : {};

    const feePlans = await db.feePlan.findMany({
      where,
      include: {
        class: { select: { id: true, name: true, level: true, stage: true } },
        _count: { select: { installments: true } }
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
    });

    return successResponse(feePlans);
  } catch (error) {
    console.error('Error fetching fee plans:', error);
    return errorResponse('فشل في جلب خطط الرسوم', 500);
  }
}

export async function POST(request: NextRequest) {
  const dbError = checkDb();
  if (dbError) return dbError;

  try {
    // Only admin roles can create fee plans
    const userRole = request.headers.get('x-user-role');
    if (!userRole || !hasPermission(userRole, 'all')) {
      return forbiddenResponse('إنشاء خطط الرسوم يتطلب صلاحيات مدير');
    }

    const body = await request.json();

    // Validate input with Zod
    const result = feePlanCreateSchema.safeParse(body);
    if (!result.success) {
      return validationErrorResponse(result.error);
    }

    const data = result.data;

    // Verify class exists
    const classExists = await db.class.findUnique({ where: { id: data.classId } });
    if (!classExists) {
      return errorResponse('الصف غير موجود', 404);
    }

    const schoolIdFinal = data.schoolId || classExists.schoolId;

    const feePlan = await db.feePlan.create({
      data: {
        name: data.name,
        amount: parseInt(String(data.amount)),
        classId: data.classId,
        schoolId: schoolIdFinal,
        dueDate: data.dueDate || null,
        description: data.description || null,
        sortOrder: data.sortOrder || 0,
      },
      include: {
        class: { select: { id: true, name: true } }
      }
    });

    return successResponse(feePlan, undefined, 201);
  } catch (error) {
    console.error('Error creating fee plan:', error);
    return errorResponse('فشل في إنشاء خطة الرسوم', 500);
  }
}
