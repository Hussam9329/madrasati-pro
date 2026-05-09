import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function GET(request: Request) {
  try {
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

    return NextResponse.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب بيانات المستخدمين' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, name, role, active } = body;

    if (!username || !name) {
      return NextResponse.json(
        { error: 'اسم المستخدم والاسم مطلوبان' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUser = await db.user.findUnique({ where: { username } });
    if (existingUser) {
      return NextResponse.json(
        { error: 'اسم المستخدم مستخدم بالفعل' },
        { status: 409 }
      );
    }

    // كلمة مرور افتراضية = اسم المستخدم (لا يوجد تسجيل بكلمة مرور)
    const hashedPassword = hashPassword(username);

    const user = await db.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        role: role || 'موظف تسجيل',
        active: active !== undefined ? active : true,
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

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء المستخدم' },
      { status: 500 }
    );
  }
}
