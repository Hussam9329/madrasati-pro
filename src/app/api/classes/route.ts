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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, level, stage, branch, schoolId, sections } = body;

    if (!name || !level || !stage || !schoolId) {
      return NextResponse.json(
        { error: 'اسم الصف والمستوى والمرحلة والمدرسة مطلوبون' },
        { status: 400 }
      );
    }

    const newClass = await db.class.create({
      data: {
        name,
        level,
        stage,
        branch,
        schoolId,
        sections: sections
          ? {
              create: sections.map((sec: { name: string }) => ({
                name: sec.name,
                schoolId,
              })),
            }
          : {
              create: { name: 'أ', schoolId },
            },
      },
      include: {
        sections: true,
      },
    });

    return NextResponse.json(newClass, { status: 201 });
  } catch (error) {
    console.error('Create class error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء الصف' },
      { status: 500 }
    );
  }
}
