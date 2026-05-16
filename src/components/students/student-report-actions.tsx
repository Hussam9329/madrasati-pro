"use client";

import { MessageCircle, Printer } from "lucide-react";

function getWhatsappUrl(phone?: string | null, message?: string) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  const normalized = digits.startsWith("964")
    ? digits
    : digits.startsWith("0")
      ? `964${digits.slice(1)}`
      : digits;
  return `https://wa.me/${normalized}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

type StudentReportActionsProps = {
  studentName: string;
  guardianPhone?: string | null;
};

export function StudentReportActions({ studentName, guardianPhone }: StudentReportActionsProps) {
  const whatsappUrl = getWhatsappUrl(
    guardianPhone,
    `تقرير الطالب ${studentName} جاهز. يمكن فتح ملف الطالب من النظام ثم طباعته أو حفظه PDF من زر الطباعة.`,
  );

  return (
    <div className="flex flex-wrap gap-3 print:hidden">
      <button type="button" onClick={() => window.print()} className="btn btn-primary">
        <Printer size={18} />
        طباعة / حفظ PDF
      </button>
      <a
        href={whatsappUrl ?? undefined}
        target="_blank"
        rel="noreferrer"
        className={["btn btn-secondary", !whatsappUrl ? "pointer-events-none opacity-60" : ""].join(" ")}
      >
        <MessageCircle size={18} />
        إرساله لولي الأمر عبر واتساب
      </a>
    </div>
  );
}
