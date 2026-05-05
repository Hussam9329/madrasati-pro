import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const schoolId = searchParams.get('schoolId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (schoolId) where.schoolId = schoolId;

    const [notices, total] = await Promise.all([
      db.notice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.notice.count({ where }),
    ]);

    return NextResponse.json({
      notices,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get notices error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الإعلانات' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, content, type, schoolId, createdBy } = body;

    if (!title || !content || !schoolId) {
      return NextResponse.json(
        { error: 'العنوان والمحتوى والمدرسة مطلوبون' },
        { status: 400 }
      );
    }

    const notice = await db.notice.create({
      data: {
        title,
        content,
        type: type || 'عام',
        schoolId,
        createdBy: createdBy || 'النظام',
      },
    });

    return NextResponse.json(notice, { status: 201 });
  } catch (error) {
    console.error('Create notice error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء الإعلان' },
      { status: 500 }
    );
  }
}
