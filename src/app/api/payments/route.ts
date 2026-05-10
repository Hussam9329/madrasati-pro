import { NextRequest } from 'next/server';
import { checkDb, successResponse, errorResponse } from '@/services/api-response';
import { db } from '@/lib/db';

// GET /api/payments — List payments (filter by studentId, installmentId)
export async function GET(request: NextRequest) {
  const dbError = checkDb();
  if (dbError) return dbError;

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

    return successResponse(payments)
  } catch (error) {
    console.error('Error fetching payments:', error)
    return errorResponse('فشل في جلب الدفعات', 500)
  }
}

// POST /api/payments — Record a new payment
export async function POST(request: NextRequest) {
  const dbError = checkDb();
  if (dbError) return dbError;

  try {
    const body = await request.json()
    const { installmentId, studentId, amount, paymentDate, paymentMethod, receiptNumber, notes, recordedBy } = body

    if (!installmentId) {
      return errorResponse('يرجى اختيار القسط', 400)
    }
    if (!amount || amount <= 0) {
      return errorResponse('مبلغ الدفعة يجب أن يكون أكبر من صفر', 400)
    }
    if (!paymentDate) {
      return errorResponse('يرجى تحديد تاريخ الدفع', 400)
    }

    // Get installment
    const installment = await db.installment.findUnique({
      where: { id: installmentId }
    })

    if (!installment) {
      return errorResponse('القسط غير موجود', 404)
    }

    // Validate amount doesn't exceed remaining
    if (amount > installment.remainingAmount) {
      return errorResponse(
        `مبلغ الدفعة (${amount}) يتجاوز المبلغ المتبقي (${installment.remainingAmount})`,
        400
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

    return successResponse(result, undefined, 201)
  } catch (error) {
    console.error('Error creating payment:', error)
    return errorResponse('فشل في تسجيل الدفعة', 500)
  }
}

// DELETE /api/payments — Delete a payment
export async function DELETE(request: NextRequest) {
  const dbError = checkDb();
  if (dbError) return dbError;

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return errorResponse('معرف الدفعة مطلوب', 400)
    }

    const payment = await db.payment.findUnique({ where: { id } })
    if (!payment) {
      return errorResponse('الدفعة غير موجودة', 404)
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

    return successResponse(null, 'تم حذف الدفعة بنجاح')
  } catch (error) {
    console.error('Error deleting payment:', error)
    return errorResponse('فشل في حذف الدفعة', 500)
  }
}
