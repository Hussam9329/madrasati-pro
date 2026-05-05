import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, verifyToken } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existingUser = await db.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // If updating password, hash it
    const data: Record<string, unknown> = {
      name: body.name,
      role: body.role,
      active: body.active,
    };

    if (body.password) {
      data.password = hashPassword(body.password);
    }

    // If updating username, check uniqueness
    if (body.username && body.username !== existingUser.username) {
      const usernameTaken = await db.user.findUnique({
        where: { username: body.username },
      });
      if (usernameTaken) {
        return NextResponse.json(
          { error: 'اسم المستخدم مستخدم بالفعل' },
          { status: 409 }
        );
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

    return NextResponse.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث بيانات المستخدم' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'غير مصرح بهذا الإجراء' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const user = verifyToken(token);
    if (!user || (user.role !== 'مدير' && user.role !== 'مسؤول نظام')) {
      return NextResponse.json(
        { error: 'غير مصرح بهذا الإجراء. يتطلب صلاحيات مدير أو مسؤول نظام' },
        { status: 403 }
      );
    }

    const existingUser = await db.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // Prevent deleting yourself
    if (existingUser.id === user.id) {
      return NextResponse.json(
        { error: 'لا يمكنك حذف حسابك الخاص' },
        { status: 400 }
      );
    }

    await db.user.delete({ where: { id } });

    return NextResponse.json({ message: 'تم حذف المستخدم بنجاح' });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في حذف المستخدم' },
      { status: 500 }
    );
  }
}
