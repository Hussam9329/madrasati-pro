import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');

    const where: Record<string, unknown> = {};
    if (schoolId) where.schoolId = schoolId;

    const classes = await db.class.findMany({
      where,
      include: {
        sections: {
          include: {
            _count: {
              select: { students: true },
            },
          },
        },
        _count: {
          select: { students: true },
        },
        subjects: {
          include: {
            subject: {
              select: { id: true, name: true, code: true },
            },
          },
        },
      },
      orderBy: [{ level: 'asc' }, { stage: 'asc' }],
    });

    return NextResponse.json(classes);
  } catch (error) {
    console.error('Get classes error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب بيانات الصفوف' },
      { status: 500 }
    );
  }
}
