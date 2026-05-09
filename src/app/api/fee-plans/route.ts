import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/fee-plans — List fee plans (optionally filter by classId)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')

    const where = classId ? { classId } : {}

    const feePlans = await db.feePlan.findMany({
      where,
      include: {
        class: { select: { id: true, name: true, level: true, stage: true } },
        _count: { select: { installments: true } }
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
    })

    return NextResponse.json(feePlans)
  } catch (error) {
    console.error('Error fetching fee plans:', error)
    return NextResponse.json({ error: 'فشل في جلب خطط الرسوم' }, { status: 500 })
  }
}

// POST /api/fee-plans — Create a fee plan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, amount, classId, schoolId, dueDate, description, sortOrder } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'اسم خطة الرسوم مطلوب' }, { status: 400 })
    }
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'المبلغ يجب أن يكون أكبر من صفر' }, { status: 400 })
    }
    if (!classId) {
      return NextResponse.json({ error: 'يرجى اختيار الصف' }, { status: 400 })
    }

    // Verify class exists
    const classExists = await db.class.findUnique({ where: { id: classId } })
    if (!classExists) {
      return NextResponse.json({ error: 'الصف غير موجود' }, { status: 404 })
    }

    const schoolIdFinal = schoolId || classExists.schoolId

    const feePlan = await db.feePlan.create({
      data: {
        name: name.trim(),
        amount: parseInt(amount),
        classId,
        schoolId: schoolIdFinal,
        dueDate: dueDate || null,
        description: description || null,
        sortOrder: sortOrder || 0,
      },
      include: {
        class: { select: { id: true, name: true } }
      }
    })

    return NextResponse.json(feePlan, { status: 201 })
  } catch (error) {
    console.error('Error creating fee plan:', error)
    return NextResponse.json({ error: 'فشل في إنشاء خطة الرسوم' }, { status: 500 })
  }
}
