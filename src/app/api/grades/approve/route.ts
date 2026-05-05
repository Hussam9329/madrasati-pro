import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { gradeIds, approvedBy } = body;

    if (!gradeIds || !Array.isArray(gradeIds) || gradeIds.length === 0) {
      return NextResponse.json(
        { error: 'قائمة معرفات الدرجات مطلوبة' },
        { status: 400 }
      );
    }

    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'غير مصرح بهذا الإجراء' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const user = verifyToken(token);
    if (!user || (user.role !== 'مدير' && user.role !== 'مسؤول نظام' && user.role !== 'معاون')) {
      return NextResponse.json(
        { error: 'غير مصرح بالاعتماد. يتطلب صلاحيات مدير أو معاون' },
        { status: 403 }
      );
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

    return NextResponse.json({
      message: `تم اعتماد ${result.count} درجة بنجاح`,
      approvedCount: result.count,
    });
  } catch (error) {
    console.error('Approve grades error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في اعتماد الدرجات' },
      { status: 500 }
    );
  }
}
