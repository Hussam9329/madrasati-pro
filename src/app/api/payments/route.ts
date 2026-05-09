import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/payments — List payments (filter by studentId, installmentId)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const installmentId = searchParams.get('installmentId')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {}
    if (studentId) where.studentId = studentId
    if (installmentId) where.installmentId = installmentId

    const payments = await db.payment.findMany({
      where,
      include: {
        student: { select: { id: true, fullName: true, studentNumber: true } },
        installment: {
          select: {
            id: true,
            totalAmount: true,
            paidAmount: true,
            remainingAmount: true,
            status: true,
            feePlan: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json({ error: 'فشل في جلب الدفعات' }, { status: 500 })
  }
}

// POST /api/payments — Record a new payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { installmentId, studentId, amount, paymentDate, paymentMethod, receiptNumber, notes, recordedBy } = body

    if (!installmentId) {
      return NextResponse.json({ error: 'يرجى اختيار القسط' }, { status: 400 })
    }
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'مبلغ الدفعة يجب أن يكون أكبر من صفر' }, { status: 400 })
    }
    if (!paymentDate) {
      return NextResponse.json({ error: 'يرجى تحديد تاريخ الدفع' }, { status: 400 })
    }

    // Get installment
    const installment = await db.installment.findUnique({
      where: { id: installmentId }
    })

    if (!installment) {
      return NextResponse.json({ error: 'القسط غير موجود' }, { status: 404 })
    }

    // Validate amount doesn't exceed remaining
    if (amount > installment.remainingAmount) {
      return NextResponse.json(
        { error: `مبلغ الدفعة (${amount}) يتجاوز المبلغ المتبقي (${installment.remainingAmount})` },
        { status: 400 }
      )
    }

    // Create payment and update installment in transaction
    const result = await db.$transaction(async (tx) => {
      // Create payment
      const payment = await tx.payment.create({
        data: {
          installmentId,
          studentId: studentId || installment.studentId,
          amount: parseInt(amount),
          paymentDate,
          paymentMethod: paymentMethod || 'نقدي',
          receiptNumber: receiptNumber || null,
          notes: notes || null,
          recordedBy: recordedBy || null,
        }
      })

      // Update installment
      const newPaidAmount = installment.paidAmount + parseInt(amount)
      const newRemainingAmount = Math.max(0, installment.totalAmount - newPaidAmount)
      const newStatus = newPaidAmount === 0 ? 'غير مدفوع'
        : newPaidAmount >= installment.totalAmount ? 'مدفوع بالكامل'
        : 'مدفوع جزئياً'

      const updatedInstallment = await tx.installment.update({
        where: { id: installmentId },
        data: {
          paidAmount: newPaidAmount,
          remainingAmount: newRemainingAmount,
          status: newStatus,
        }
      })

      return { payment, installment: updatedInstallment }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json({ error: 'فشل في تسجيل الدفعة' }, { status: 500 })
  }
}

// DELETE /api/payments — Delete a payment
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'معرف الدفعة مطلوب' }, { status: 400 })
    }

    const payment = await db.payment.findUnique({ where: { id } })
    if (!payment) {
      return NextResponse.json({ error: 'الدفعة غير موجودة' }, { status: 404 })
    }

    // Delete payment and update installment in transaction
    await db.$transaction(async (tx) => {
      const installment = await tx.installment.findUnique({
        where: { id: payment.installmentId }
      })

      if (installment) {
        const newPaidAmount = Math.max(0, installment.paidAmount - payment.amount)
        const newRemainingAmount = Math.max(0, installment.totalAmount - newPaidAmount)
        const newStatus = newPaidAmount === 0 ? 'غير مدفوع'
          : newPaidAmount >= installment.totalAmount ? 'مدفوع بالكامل'
          : 'مدفوع جزئياً'

        await tx.installment.update({
          where: { id: installment.id },
          data: {
            paidAmount: newPaidAmount,
            remainingAmount: newRemainingAmount,
            status: newStatus,
          }
        })
      }

      await tx.payment.delete({ where: { id } })
    })

    return NextResponse.json({ message: 'تم حذف الدفعة بنجاح' })
  } catch (error) {
    console.error('Error deleting payment:', error)
    return NextResponse.json({ error: 'فشل في حذف الدفعة' }, { status: 500 })
  }
}
