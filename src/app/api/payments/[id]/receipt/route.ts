import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { generatePaymentReceiptHtml } from "@/lib/receipt-html";
import { getPaymentDetails } from "@/services/payment-service";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  await requireAdmin();
  const { id } = await context.params;
  const payment = await getPaymentDetails(id);

  if (!payment) {
    notFound();
  }

  const html = generatePaymentReceiptHtml(
    {
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
    {
      fullName: payment.studentName,
      studentCode: payment.studentCode,
      sectionName: payment.sectionName,
      className: payment.className,
    },
    { name: "مدرستي برو" },
  );

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
