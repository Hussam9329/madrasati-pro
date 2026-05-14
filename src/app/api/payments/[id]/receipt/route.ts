import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { generatePaymentReceiptHtml } from "@/lib/receipt-html";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await ensureDatabase();
  try {
    await requireAdmin();
  } catch {
    return new NextResponse("غير مصرح.", { status: 401 });
  }

  try {
    const { id } = await params;

    const payment = await db.payment.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            section: {
              include: {
                class: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return new NextResponse("الدفعة غير موجودة.", { status: 404 });
    }

    const student = {
      fullName: payment.student.fullName,
      studentCode: payment.student.studentCode,
      sectionName: payment.student.section?.name ?? null,
      className: payment.student.section?.class?.name ?? null,
    };

    const html = generatePaymentReceiptHtml(
      {
        receiptNumber: payment.receiptNumber,
        feeTitle: payment.feeTitle,
        amount: payment.amount,
        originalAmount: payment.originalAmount,
        discountAmount: payment.discountAmount,
        discountPercent: payment.discountPercent,
        discountReason: payment.discountReason,
        finalAmount: payment.finalAmount,
        method: payment.method,
        paidAt: payment.paidAt,
        notes: payment.notes,
        academicYear: payment.academicYear,
        createdAt: payment.createdAt,
      },
      student,
      { name: "ثانوية مارينا للبنات" },
    );

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch {
    return new NextResponse("حدث خطأ أثناء إنشاء الفاتورة.", { status: 500 });
  }
}
