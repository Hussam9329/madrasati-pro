import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch teacher-class assignments
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const teacherId = searchParams.get('teacherId');

    const where: Record<string, unknown> = {};
    if (classId) where.classId = classId;
    if (teacherId) where.teacherId = teacherId;

    const assignments = await db.teacherClass.findMany({
      where,
      include: {
        teacher: { select: { id: true, fullName: true, notes: true, phone: true } },
      },
      orderBy: { id: 'desc' },
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error('Get teacher-class assignments error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب بيانات التعيينات' },
      { status: 500 }
    );
  }
}

// POST - Assign teacher to class/section
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { teacherId, classId, sectionId } = body;

    if (!teacherId || !classId) {
      return NextResponse.json({ error: 'معرف الأستاذ والصف مطلوبان' }, { status: 400 });
    }

    // Check if already assigned
    const existing = await db.teacherClass.findFirst({
      where: { teacherId, classId }
    });

    if (existing) {
      // Update with sectionId if provided
      if (sectionId) {
        const updated = await db.teacherClass.update({
          where: { id: existing.id },
          data: { sectionId }
        });
        return NextResponse.json(updated);
      }
      return NextResponse.json({ error: 'الأستاذ معين بالفعل على هذا الصف' }, { status: 409 });
    }

    const assignment = await db.teacherClass.create({
      data: { teacherId, classId, sectionId },
      include: {
        teacher: { select: { id: true, fullName: true } },
      }
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error('Assign teacher error:', error);
    return NextResponse.json({ error: 'حدث خطأ في تعيين الأستاذ' }, { status: 500 });
  }
}

// DELETE - Remove teacher from class
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 });
    }

    await db.teacherClass.delete({ where: { id } });
    return NextResponse.json({ message: 'تم إلغاء تعيين الأستاذ بنجاح' });
  } catch (error) {
    console.error('Remove teacher assignment error:', error);
    return NextResponse.json({ error: 'حدث خطأ في إلغاء التعيين' }, { status: 500 });
  }
}
