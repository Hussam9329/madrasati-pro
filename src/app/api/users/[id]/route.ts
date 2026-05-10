import { checkDb, successResponse, errorResponse, validationErrorResponse, forbiddenResponse } from '@/services/api-response';
import { db } from '@/lib/db';
import { ADMIN_ROLES } from '@/lib/auth';
import { userUpdateSchema } from '@/lib/validations';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const dbError = checkDb();
  if (dbError) return dbError;

  try {
    // Only admin roles can update users
    const userRole = request.headers.get('x-user-role');
    if (!userRole || !ADMIN_ROLES.includes(userRole as typeof ADMIN_ROLES[number])) {
      return forbiddenResponse('تعديل المستخدمين يتطلب صلاحيات مدير');
    }

    const { id } = await params;
    const body = await request.json();

    // Validate input with Zod
    const result = userUpdateSchema.safeParse(body);
    if (!result.success) {
      return validationErrorResponse(result.error);
    }

    const data = result.data;

    const existingUser = await db.user.findUnique({ where: { id } });
    if (!existingUser) {
      return errorResponse('المستخدم غير موجود', 404);
    }

    const updateData: Record<string, unknown> = {
      name: data.name,
      role: data.role,
      active: data.active,
    };

    // If updating username, check uniqueness
    if (data.username && data.username !== existingUser.username) {
      const usernameTaken = await db.user.findUnique({
        where: { username: data.username },
      });
      if (usernameTaken) {
        return errorResponse('اسم المستخدم مستخدم بالفعل', 409);
      }
      updateData.username = data.username;
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return successResponse(user);
  } catch (error) {
    console.error('Update user error:', error);
    return errorResponse('حدث خطأ في تحديث بيانات المستخدم', 500);
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

    // Verify authorization — only admin roles
    const userRole = request.headers.get('x-user-role');
    const userId = request.headers.get('x-user-id');
    if (!userRole || !ADMIN_ROLES.includes(userRole as typeof ADMIN_ROLES[number])) {
      return forbiddenResponse('حذف المستخدمين يتطلب صلاحيات مدير');
    }

    const existingUser = await db.user.findUnique({ where: { id } });
    if (!existingUser) {
      return errorResponse('المستخدم غير موجود', 404);
    }

    // Prevent deleting yourself
    if (existingUser.id === userId) {
      return errorResponse('لا يمكنك حذف حسابك الخاص', 400);
    }

    await db.user.delete({ where: { id } });

    return successResponse(null, 'تم حذف المستخدم بنجاح');
  } catch (error) {
    console.error('Delete user error:', error);
    return errorResponse('حدث خطأ في حذف المستخدم', 500);
  }
}
