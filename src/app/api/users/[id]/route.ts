import { checkDb, successResponse, errorResponse } from '@/services/api-response';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const dbError = checkDb();
  if (dbError) return dbError;

  try {
    const { id } = await params;
    const body = await request.json();

    const existingUser = await db.user.findUnique({ where: { id } });
    if (!existingUser) {
      return errorResponse('المستخدم غير موجود', 404);
    }

    const data: Record<string, unknown> = {
      name: body.name,
      role: body.role,
      active: body.active,
    };

    // If updating username, check uniqueness
    if (body.username && body.username !== existingUser.username) {
      const usernameTaken = await db.user.findUnique({
        where: { username: body.username },
      });
      if (usernameTaken) {
        return errorResponse('اسم المستخدم مستخدم بالفعل', 409);
      }
      data.username = body.username;
    }

    const user = await db.user.update({
      where: { id },
      data,
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

    // Check authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return errorResponse('غير مصرح بهذا الإجراء', 401);
    }

    const token = authHeader.split(' ')[1];
    const user = verifyToken(token);
    if (!user || (user.role !== 'مدير' && user.role !== 'مسؤول نظام')) {
      return errorResponse('غير مصرح بهذا الإجراء. يتطلب صلاحيات مدير أو مسؤول نظام', 403);
    }

    const existingUser = await db.user.findUnique({ where: { id } });
    if (!existingUser) {
      return errorResponse('المستخدم غير موجود', 404);
    }

    // Prevent deleting yourself
    if (existingUser.id === user.id) {
      return errorResponse('لا يمكنك حذف حسابك الخاص', 400);
    }

    await db.user.delete({ where: { id } });

    return successResponse(null, 'تم حذف المستخدم بنجاح');
  } catch (error) {
    console.error('Delete user error:', error);
    return errorResponse('حدث خطأ في حذف المستخدم', 500);
  }
}
