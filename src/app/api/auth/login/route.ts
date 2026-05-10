import { checkDb, successResponse, errorResponse } from '@/services/api-response';
import { db } from '@/lib/db';
import { generateToken, type AuthUser } from '@/lib/auth';

export async function POST(request: Request) {
  const dbError = checkDb();
  if (dbError) return dbError;

  try {
    const body = await request.json();
    const { username } = body;

    if (!username) {
      return errorResponse('اسم المستخدم مطلوب', 400);
    }

    const user = await db.user.findUnique({
      where: { username },
    });

    if (!user) {
      return errorResponse('اسم المستخدم غير موجود', 401);
    }

    if (!user.active) {
      return errorResponse('هذا الحساب معطل. تواصل مع المسؤول', 403);
    }

    const authUser: AuthUser = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    };

    const token = generateToken(authUser);

    return successResponse({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        active: user.active,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('حدث خطأ في تسجيل الدخول', 500);
  }
}
