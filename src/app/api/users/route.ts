import { checkDb, successResponse, errorResponse, validationErrorResponse, forbiddenResponse } from '@/services/api-response';
import { db } from '@/lib/db';
import { hashPassword, ADMIN_ROLES } from '@/lib/auth';
import { userCreateSchema } from '@/lib/validations';
import { randomBytes } from 'crypto';

export async function GET(request: Request) {
  const dbError = checkDb();
  if (dbError) return dbError;

  try {
    // Only admin roles can list users
    const userRole = request.headers.get('x-user-role');
    if (!userRole || !ADMIN_ROLES.includes(userRole as typeof ADMIN_ROLES[number])) {
      return forbiddenResponse('عرض المستخدمين يتطلب صلاحيات مدير');
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const active = searchParams.get('active');

    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (active !== null && active !== undefined) where.active = active === 'true';

    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(users);
  } catch (error) {
    console.error('Get users error:', error);
    return errorResponse('حدث خطأ في جلب بيانات المستخدمين', 500);
  }
}

export async function POST(request: Request) {
  const dbError = checkDb();
  if (dbError) return dbError;

  try {
    // Only admin roles can create users
    const userRole = request.headers.get('x-user-role');
    if (!userRole || !ADMIN_ROLES.includes(userRole as typeof ADMIN_ROLES[number])) {
      return forbiddenResponse('إنشاء المستخدمين يتطلب صلاحيات مدير');
    }

    const body = await request.json();

    // Validate input with Zod
    const result = userCreateSchema.safeParse(body);
    if (!result.success) {
      return validationErrorResponse(result.error);
    }

    const data = result.data;

    // Check if username already exists
    const existingUser = await db.user.findUnique({ where: { username: data.username } });
    if (existingUser) {
      return errorResponse('اسم المستخدم مستخدم بالفعل', 409);
    }

    // Generate a random temporary password (NOT the username!)
    const tempPassword = randomBytes(8).toString('hex');
    const hashedPassword = await hashPassword(tempPassword);

    const user = await db.user.create({
      data: {
        username: data.username,
        password: hashedPassword,
        name: data.name,
        role: data.role,
        active: data.active,
      },
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

    // Return user data with temporary password (shown once to admin)
    return successResponse({
      ...user,
      tempPassword, // Admin must share this securely with the user
    }, undefined, 201);
  } catch (error) {
    console.error('Create user error:', error);
    return errorResponse('حدث خطأ في إنشاء المستخدم', 500);
  }
}
