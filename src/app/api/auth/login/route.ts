import { checkDb, successResponse, errorResponse, validationErrorResponse } from '@/services/api-response';
import { db } from '@/lib/db';
import { generateToken, comparePassword, type AuthUser } from '@/lib/auth';
import { loginSchema } from '@/lib/validations';

export async function POST(request: Request) {
  const dbError = checkDb();
  if (dbError) return dbError;

  try {
    const body = await request.json();

    // Validate input using Zod schema
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return validationErrorResponse(result.error);
    }

    const { username, password } = result.data;

    const user = await db.user.findUnique({
      where: { username },
    });

    if (!user) {
      // Use a generic message to prevent username enumeration
      return errorResponse('اسم المستخدم أو كلمة المرور غير صحيحة', 401);
    }

    if (!user.active) {
      return errorResponse('هذا الحساب معطل. تواصل مع المسؤول', 403);
    }

    // Verify password against the stored hash
    const passwordValid = await comparePassword(password, user.password);
    if (!passwordValid) {
      // Same generic message — don't reveal which part is wrong
      return errorResponse('اسم المستخدم أو كلمة المرور غير صحيحة', 401);
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
    }, 'تم تسجيل الدخول بنجاح');
  } catch (error) {
    console.error('Login error:', error);
    // Never expose internal error details
    return errorResponse('حدث خطأ في تسجيل الدخول. حاول مرة أخرى لاحقاً', 500);
  }
}
