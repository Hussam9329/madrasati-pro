import { NextRequest } from 'next/server';
import { checkDb, successResponse, errorResponse, validationErrorResponse, requirePermission, requireAnyPermission } from '@/services/api-response';
import { db } from '@/lib/db';
import { paymentCreateSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  const dbError = checkDb();
  if (dbError) return dbError;

  // View payments requires payments_view or students permission
  const authError = requireAnyPermission(request, ['students', 'payments_view']);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const installmentId = searchParams.get('installmentId');
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));

    const where: Record<string, unknown> = {};
    if (studentId) where.studentId = studentId;
    if (installmentId) where.installmentId = installmentId;

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
    });

    return successResponse(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return errorResponse('فشل في جلب الدفعات', 500);
  }
}

export async function POST(request: NextRequest) {
  const dbError = checkDb();
  if (dbError) return dbError;

  try {
    // Check authorization - only users with students permission can create payments
    // (payments_view is read-only, not for creating)
    const authError = requirePermission(request, 'students');
    if (authError) return authError;

    const body = await request.json();

    // Validate input with Zod
    const result = paymentCreateSchema.safeParse(body);
    if (!result.success) {
      return validationErrorResponse(result.error);
    }

    const data = result.data;

    // Get installment
    const installment = await db.installment.findUnique({
      where: { id: data.installmentId }
    });

    if (!installment) {
      return errorResponse('القسط غير موجود', 404);
    }

    // Validate amount doesn't exceed remaining
    if (data.amount > installment.remainingAmount) {
      return errorResponse(
        `مبلغ الدفعة (${data.amount}) يتجاوز المبلغ المتبقي (${installment.remainingAmount})`,
        400
      );
    }

    // Create payment and update installment in transaction
    const payResult = await db.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          installmentId: data.installmentId,
          studentId: data.studentId || installment.studentId,
          amount: parseInt(String(data.amount)),
          paymentDate: data.paymentDate,
          paymentMethod: data.paymentMethod,
          receiptNumber: data.receiptNumber || null,
          notes: data.notes || null,
          recordedBy: data.recordedBy || null,
        }
      });

      const newPaidAmount = installment.paidAmount + parseInt(String(data.amount));
      const newRemainingAmount = Math.max(0, installment.totalAmount - newPaidAmount);
      const newStatus = newPaidAmount === 0 ? 'غير مدفوع'
        : newPaidAmount >= installment.totalAmount ? 'مدفوع بالكامل'
        : 'مدفوع جزئياً';

      const updatedInstallment = await tx.installment.update({
        where: { id: data.installmentId },
        data: {
          paidAmount: newPaidAmount,
          remainingAmount: newRemainingAmount,
          status: newStatus,
        }
      });

      return { payment, installment: updatedInstallment };
    });

    return successResponse(payResult, undefined, 201);
  } catch (error) {
    console.error('Error creating payment:', error);
    return errorResponse('فشل في تسجيل الدفعة', 500);
  }
}

export async function DELETE(request: NextRequest) {
  const dbError = checkDb();
  if (dbError) return dbError;

  try {
    // Only admin roles can delete payments
    const authError = requirePermission(request, 'all');
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('معرف الدفعة مطلوب', 400);
    }

    const payment = await db.payment.findUnique({ where: { id } });
    if (!payment) {
      return errorResponse('الدفعة غير موجودة', 404);
    }

    await db.$transaction(async (tx) => {
      const installment = await tx.installment.findUnique({
        where: { id: payment.installmentId }
      });

      if (installment) {
        const newPaidAmount = Math.max(0, installment.paidAmount - payment.amount);
        const newRemainingAmount = Math.max(0, installment.totalAmount - newPaidAmount);
        const newStatus = newPaidAmount === 0 ? 'غير مدفوع'
          : newPaidAmount >= installment.totalAmount ? 'مدفوع بالكامل'
          : 'مدفوع جزئياً';

        await tx.installment.update({
          where: { id: installment.id },
          data: {
            paidAmount: newPaidAmount,
            remainingAmount: newRemainingAmount,
            status: newStatus,
          }
        });
      }

      await tx.payment.delete({ where: { id } });
    });

    return successResponse(null, 'تم حذف الدفعة بنجاح');
  } catch (error) {
    console.error('Error deleting payment:', error);
    return errorResponse('فشل في حذف الدفعة', 500);
  }
}
