import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/exam-types/[id] — Get single exam type
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const examType = await db.examType.findUnique({
      where: { id },
      include: {
        subject: {
          select: { id: true, name: true, code: true, maxScore: true, passScore: true }
        },
        grades: {
          include: {
            student: { select: { id: true, fullName: true, studentNumber: true } }
          }
        }
      }
    })

    if (!examType) {
      return NextResponse.json({ error: 'نوع الامتحان غير موجود' }, { status: 404 })
    }

    return NextResponse.json(examType)
  } catch (error) {
    console.error('Error fetching exam type:', error)
    return NextResponse.json({ error: 'فشل في جلب بيانات نوع الامتحان' }, { status: 500 })
  }
}

// PUT /api/exam-types/[id] — Update exam type
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, maxScore } = body

    // Check exists
    const existing = await db.examType.findUnique({
      where: { id },
      include: {
        subject: { select: { maxScore: true } },
        _count: { select: { grades: true } }
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'نوع الامتحان غير موجود' }, { status: 404 })
    }

    // Check if grades exist and are approved
    if (existing._count.grades > 0) {
      const approvedGrades = await db.grade.count({
        where: { examTypeId: id, approved: true }
      })
      if (approvedGrades > 0) {
        return NextResponse.json(
          { error: 'لا يمكن تعديل نوع امتحان معتمد. يرجى إلغاء الاعتماد أولاً.' },
          { status: 400 }
        )
      }
    }

    // Validate maxScore
    const newMaxScore = maxScore ? parseInt(maxScore) : existing.maxScore
    if (newMaxScore <= 0) {
      return NextResponse.json({ error: 'الدرجة الكاملة يجب أن تكون أكبر من صفر' }, { status: 400 })
    }
    if (newMaxScore > existing.subject.maxScore) {
      return NextResponse.json(
        { error: `الدرجة الكاملة للامتحان لا يمكن أن تتجاوز الدرجة الكاملة للمادة (${existing.subject.maxScore})` },
        { status: 400 }
      )
    }

    const examType = await db.examType.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(maxScore && { maxScore: newMaxScore }),
      },
      include: {
        subject: {
          select: { id: true, name: true, code: true }
        }
      }
    })

    return NextResponse.json(examType)
  } catch (error) {
    console.error('Error updating exam type:', error)
    return NextResponse.json({ error: 'فشل في تحديث نوع الامتحان' }, { status: 500 })
  }
}

// DELETE /api/exam-types/[id] — Delete exam type
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check exists
    const existing = await db.examType.findUnique({
      where: { id },
      include: {
        _count: { select: { grades: true } }
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'نوع الامتحان غير موجود' }, { status: 404 })
    }

    // Check for approved grades
    if (existing._count.grades > 0) {
      const approvedGrades = await db.grade.count({
        where: { examTypeId: id, approved: true }
      })
      if (approvedGrades > 0) {
        return NextResponse.json(
          { error: 'لا يمكن حذف نوع امتحان يحتوي على درجات معتمدة' },
          { status: 400 }
        )
      }
    }

    // Delete associated grades first
    await db.grade.deleteMany({
      where: { examTypeId: id }
    })

    // Delete exam type
    await db.examType.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'تم حذف نوع الامتحان بنجاح' })
  } catch (error) {
    console.error('Error deleting exam type:', error)
    return NextResponse.json({ error: 'فشل في حذف نوع الامتحان' }, { status: 500 })
  }
}
