import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/exam-types — List all exam types (optionally filter by subjectId)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId')

    const where = subjectId ? { subjectId } : {}

    const examTypes = await db.examType.findMany({
      where,
      include: {
        subject: {
          select: { id: true, name: true, code: true, maxScore: true, passScore: true }
        },
        _count: {
          select: { grades: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(examTypes)
  } catch (error) {
    console.error('Error fetching exam types:', error)
    return NextResponse.json({ error: 'فشل في جلب أنواع الامتحانات' }, { status: 500 })
  }
}

// POST /api/exam-types — Create a new exam type
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, maxScore, subjectId } = body

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'اسم نوع الامتحان مطلوب' }, { status: 400 })
    }
    if (!maxScore || maxScore <= 0) {
      return NextResponse.json({ error: 'الدرجة الكاملة يجب أن تكون أكبر من صفر' }, { status: 400 })
    }
    if (!subjectId) {
      return NextResponse.json({ error: 'يرجى اختيار المادة' }, { status: 400 })
    }

    // Check subject exists
    const subject = await db.subject.findUnique({
      where: { id: subjectId },
      select: { id: true, name: true, maxScore: true }
    })

    if (!subject) {
      return NextResponse.json({ error: 'المادة غير موجودة' }, { status: 404 })
    }

    // Validate maxScore doesn't exceed subject maxScore
    if (maxScore > subject.maxScore) {
      return NextResponse.json(
        { error: `الدرجة الكاملة للامتحان (${maxScore}) لا يمكن أن تتجاوز الدرجة الكاملة للمادة (${subject.maxScore})` },
        { status: 400 }
      )
    }

    const examType = await db.examType.create({
      data: {
        name: name.trim(),
        maxScore: parseInt(maxScore),
        subjectId,
      },
      include: {
        subject: {
          select: { id: true, name: true, code: true }
        }
      }
    })

    return NextResponse.json(examType, { status: 201 })
  } catch (error) {
    console.error('Error creating exam type:', error)
    return NextResponse.json({ error: 'فشل في إنشاء نوع الامتحان' }, { status: 500 })
  }
}
