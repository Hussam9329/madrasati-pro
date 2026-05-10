import { checkDb, successResponse, errorResponse, validationErrorResponse, requirePermission, requireAnyPermission } from '@/services/api-response';
import { db } from '@/lib/db';
import { studentCreateSchema } from '@/lib/validations';

export async function GET(request: Request) {
  const dbError = checkDb();
  if (dbError) return dbError;

  // View students requires appropriate permission
  const authError = requireAnyPermission(request, ['students', 'students_view', 'attendance', 'grades', 'grades_own', 'reports']);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const sectionId = searchParams.get('sectionId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));

    const where: Record<string, unknown> = { deletedAt: null };

    if (classId) where.classId = classId;
    if (sectionId) where.sectionId = sectionId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { studentNumber: { contains: search } },
        { nationalId: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const [students, total] = await Promise.all([
      db.student.findMany({
        where,
        include: {
          class: true,
          section: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.student.count({ where }),
    ]);

    return successResponse({
      students,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get students error:', error);
    return errorResponse('حدث خطأ في جلب بيانات الطلاب', 500);
  }
}

export async function POST(request: Request) {
  const dbError = checkDb();
  if (dbError) return dbError;

  try {
    // Check authorization — students permission required to create
    const authError = requirePermission(request, 'students');
    if (authError) return authError;

    const body = await request.json();

    // Validate input with Zod
    const result = studentCreateSchema.safeParse(body);
    if (!result.success) {
      return validationErrorResponse(result.error);
    }

    const data = result.data;

    // Auto-generate student number: STU-2026-XXXXX
    const currentYear = new Date().getFullYear();
    const lastStudent = await db.student.findFirst({
      where: { studentNumber: { startsWith: `STU-${currentYear}-` } },
      orderBy: { studentNumber: 'desc' },
    });

    let nextNumber = 1;
    if (lastStudent) {
      const parts = lastStudent.studentNumber.split('-');
      const lastNum = parseInt(parts[parts.length - 1]);
      nextNumber = lastNum + 1;
    }
    const studentNumber = `STU-${currentYear}-${String(nextNumber).padStart(5, '0')}`;

    // Auto-generate QR code: MADRASATI-STU-2026-XXXXX-TIMESTAMP
    const timestamp = Date.now();
    const qrCode = `MADRASATI-STU-${currentYear}-${String(nextNumber).padStart(5, '0')}-${timestamp}`;

    const student = await db.student.create({
      data: {
        fullName: data.fullName,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        nationalId: data.nationalId,
        phone: data.phone,
        address: data.address,
        photo: data.photo,
        status: data.status,
        classId: data.classId,
        sectionId: data.sectionId,
        schoolId: data.schoolId,
        guardianName: data.guardianName,
        guardianPhone: data.guardianPhone,
        guardianRelation: data.guardianRelation,
        studentNumber,
        qrCode,
      },
      include: {
        class: true,
        section: true,
      },
    });

    return successResponse(student, undefined, 201);
  } catch (error) {
    console.error('Create student error:', error);
    return errorResponse('حدث خطأ في إنشاء الطالب', 500);
  }
}
