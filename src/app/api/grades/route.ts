import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const subjectId = searchParams.get('subjectId');
    const examTypeId = searchParams.get('examTypeId');
    const classId = searchParams.get('classId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, unknown> = {};
    if (studentId) where.studentId = studentId;
    if (subjectId) where.subjectId = subjectId;
    if (examTypeId) where.examTypeId = examTypeId;
    if (classId) where.student = { classId };

    const [grades, total] = await Promise.all([
      db.grade.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              fullName: true,
              studentNumber: true,
              class: { select: { id: true, name: true } },
              section: { select: { id: true, name: true } },
            },
          },
          subject: {
            select: { id: true, name: true, code: true, maxScore: true, passScore: true },
          },
          examType: {
            select: { id: true, name: true, maxScore: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.grade.count({ where }),
    ]);

    return NextResponse.json({
      grades,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get grades error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الدرجات' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      studentId,
      subjectId,
      examTypeId,
      schoolId,
      score,
      status,
      modifiedBy,
      modificationReason,
    } = body;

    if (!studentId || !subjectId || !examTypeId || !schoolId) {
      return NextResponse.json(
        { error: 'معرف الطالب والمادة ونوع الامتحان والمدرسة مطلوبون' },
        { status: 400 }
      );
    }

    // Check if grade already exists for this student/subject/examType combination
    const existingGrade = await db.grade.findUnique({
      where: {
        studentId_subjectId_examTypeId: {
          studentId,
          subjectId,
          examTypeId,
        },
      },
    });

    if (existingGrade) {
      // Check if grade is approved/locked
      if (existingGrade.approved) {
        return NextResponse.json(
          { error: 'لا يمكن تعديل درجة مقفلة. الدرجات المعتمدة لا يمكن تعديلها' },
          { status: 403 }
        );
      }

      // Update grade and log modification
      const oldScore = existingGrade.score;

      if (oldScore !== null && oldScore !== score && modificationReason) {
        await db.gradeModification.create({
          data: {
            gradeId: existingGrade.id,
            oldScore: oldScore,
            newScore: score,
            reason: modificationReason,
            modifiedBy: modifiedBy || 'النظام',
          },
        });
      }

      const grade = await db.grade.update({
        where: { id: existingGrade.id },
        data: {
          score,
          status: status || (score !== null ? 'مكتملة' : 'ناقصة'),
        },
        include: {
          student: {
            select: { id: true, fullName: true, studentNumber: true },
          },
          subject: {
            select: { id: true, name: true, code: true },
          },
          examType: {
            select: { id: true, name: true },
          },
        },
      });

      return NextResponse.json(grade);
    }

    // Create new grade
    const grade = await db.grade.create({
      data: {
        studentId,
        subjectId,
        examTypeId,
        schoolId,
        score,
        status: status || (score !== null ? 'مكتملة' : 'ناقصة'),
      },
      include: {
        student: {
          select: { id: true, fullName: true, studentNumber: true },
        },
        subject: {
          select: { id: true, name: true, code: true },
        },
        examType: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(grade, { status: 201 });
  } catch (error) {
    console.error('Create grade error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تسجيل الدرجة' },
      { status: 500 }
    );
  }
}
