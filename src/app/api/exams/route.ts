import { NextResponse } from 'next/server';

// In-memory exam storage (since we don't have an Exam model in Prisma)
// In production, this would use a proper database model
interface ExamRecord {
  id: string;
  subjectId: string;
  subjectName: string;
  examType: string;
  date: string;
  time: string;
  classId: string;
  className: string;
  room: string;
  notes?: string;
  createdAt: string;
}

// Store exams in memory
let examsStore: ExamRecord[] = [];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const examType = searchParams.get('examType');
    const date = searchParams.get('date');

    let filtered = [...examsStore];

    if (classId) {
      filtered = filtered.filter(e => e.classId === classId);
    }
    if (examType) {
      filtered = filtered.filter(e => e.examType === examType);
    }
    if (date) {
      filtered = filtered.filter(e => e.date === date);
    }

    // Sort by date
    filtered.sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ exams: filtered, total: filtered.length });
  } catch (error) {
    console.error('Get exams error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب بيانات الامتحانات' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      subjectId,
      subjectName,
      examType,
      date,
      time,
      classId,
      className,
      room,
      notes,
    } = body;

    if (!subjectId || !date || !classId) {
      return NextResponse.json(
        { error: 'المادة والتاريخ والصف مطلوبون' },
        { status: 400 }
      );
    }

    const exam: ExamRecord = {
      id: `exam-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      subjectId,
      subjectName: subjectName || '',
      examType: examType || 'شهر أول',
      date,
      time: time || '08:00',
      classId,
      className: className || '',
      room: room || '',
      notes,
      createdAt: new Date().toISOString(),
    };

    examsStore.push(exam);

    return NextResponse.json(exam, { status: 201 });
  } catch (error) {
    console.error('Create exam error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء الامتحان' },
      { status: 500 }
    );
  }
}
