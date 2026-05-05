import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const schoolId = searchParams.get('schoolId');

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (schoolId) where.schoolId = schoolId;

    const subjects = await db.subject.findMany({
      where,
      include: {
        teachers: {
          include: {
            teacher: {
              select: { id: true, fullName: true, phone: true },
            },
          },
        },
        classes: {
          include: {
            class: true,
          },
        },
        examTypes: true,
        school: {
          select: { id: true, name: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(subjects);
  } catch (error) {
    console.error('Get subjects error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب بيانات المواد' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      code,
      type,
      maxScore,
      passScore,
      schoolId,
      teacherIds,
      classIds,
    } = body;

    if (!name || !code || !schoolId) {
      return NextResponse.json(
        { error: 'اسم المادة ورمزها والمدرسة مطلوبون' },
        { status: 400 }
      );
    }

    // Check for unique code
    const existingSubject = await db.subject.findUnique({ where: { code } });
    if (existingSubject) {
      return NextResponse.json(
        { error: 'رمز المادة مستخدم بالفعل' },
        { status: 409 }
      );
    }

    const subject = await db.subject.create({
      data: {
        name,
        code,
        type: type || 'أساسية',
        maxScore: maxScore || 100,
        passScore: passScore || 50,
        schoolId,
        teachers: teacherIds
          ? {
              create: (teacherIds as string[]).map((teacherId: string) => ({
                teacherId,
              })),
            }
          : undefined,
        classes: classIds
          ? {
              create: (classIds as string[]).map((classId: string) => ({
                classId,
              })),
            }
          : undefined,
      },
      include: {
        teachers: {
          include: {
            teacher: {
              select: { id: true, fullName: true },
            },
          },
        },
        classes: {
          include: {
            class: true,
          },
        },
      },
    });

    return NextResponse.json(subject, { status: 201 });
  } catch (error) {
    console.error('Create subject error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء المادة' },
      { status: 500 }
    );
  }
}
