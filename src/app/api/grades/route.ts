import { checkDb, successResponse, errorResponse, validationErrorResponse, forbiddenResponse } from '@/services/api-response';
import { db } from '@/lib/db';
import { gradeCreateSchema } from '@/lib/validations';
import { hasPermission } from '@/lib/auth';

export async function GET(request: Request) {
  const dbError = checkDb();
  if (dbError) return dbError;

  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const subjectId = searchParams.get('subjectId');
    const examTypeId = searchParams.get('examTypeId');
    const classId = searchParams.get('classId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));

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

    return successResponse({
      grades,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get grades error:', error);
    return errorResponse('حدث خطأ في جلب الدرجات', 500);
  }
}

export async function POST(request: Request) {
  const dbError = checkDb();
  if (dbError) return dbError;

  try {
    // Check authorization
    const userRole = request.headers.get('x-user-role');
    if (!userRole || !hasPermission(userRole, 'grades')) {
      if (!hasPermission(userRole || '', 'grades_own')) {
        return forbiddenResponse('ليس لديك صلاحية لتسجيل الدرجات');
      }
    }

    const body = await request.json();

    // Validate input with Zod
    const result = gradeCreateSchema.safeParse(body);
    if (!result.success) {
      return validationErrorResponse(result.error);
    }

    const data = result.data;

    // Check if grade already exists for this student/subject/examType combination
    const existingGrade = await db.grade.findUnique({
      where: {
        studentId_subjectId_examTypeId: {
          studentId: data.studentId,
          subjectId: data.subjectId,
          examTypeId: data.examTypeId,
        },
      },
    });

    if (existingGrade) {
      // Check if grade is approved/locked
      if (existingGrade.approved) {
        return errorResponse('لا يمكن تعديل درجة مقفلة. الدرجات المعتمدة لا يمكن تعديلها', 403);
      }

      const grade = await db.grade.update({
        where: { id: existingGrade.id },
        data: {
          score: data.score,
          status: data.status || (data.score !== null ? 'مكتملة' : 'ناقصة'),
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

      return successResponse(grade);
    }

    // Create new grade
    const grade = await db.grade.create({
      data: {
        studentId: data.studentId,
        subjectId: data.subjectId,
        examTypeId: data.examTypeId,
        schoolId: data.schoolId,
        score: data.score,
        status: data.status || (data.score !== null ? 'مكتملة' : 'ناقصة'),
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

    return successResponse(grade, undefined, 201);
  } catch (error) {
    console.error('Create grade error:', error);
    return errorResponse('حدث خطأ في تسجيل الدرجة', 500);
  }
}
