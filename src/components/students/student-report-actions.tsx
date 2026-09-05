"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckSquare, MessageCircle, Printer, Square } from "lucide-react";
import type { ReportPeriod } from "@/types/report";
import { getTelegramDesktopUrl, getWhatsappUrl } from "@/lib/contact-links";

const REPORT_SECTIONS = [
  { key: "summary", label: "الملخص العام" },
  { key: "basic", label: "البيانات الأساسية" },
  { key: "academic", label: "الدرجات" },
  { key: "attendance", label: "الحضور" },
  { key: "financial", label: "التقرير المالي" },
  { key: "notes", label: "الملاحظات والتوصيات" },
] as const;

const REPORT_PERIODS: { value: ReportPeriod; label: string }[] = [
  { value: "daily", label: "اليوم" },
  { value: "weekly", label: "هذا الأسبوع" },
  { value: "monthly", label: "هذا الشهر" },
  { value: "quarterly", label: "ربع سنوي" },
  { value: "semester", label: "فصلي" },
  { value: "annual", label: "سنوي" },
  { value: "custom", label: "فترة مخصصة" },
];

type ReportSectionKey = (typeof REPORT_SECTIONS)[number]["key"];

type StudentReportActionsProps = {
  studentName: string;
  guardianPhone?: string | null;
  guardianTelegram?: string | null;
  classDisplay: string;
  averageLabel: string;
  gradeSummary: string;
  attendanceSummary: string;
  /** Per-day attendance lines with check-in/check-out times for the WhatsApp message. */
  attendanceDetailSummary: string;
  financialSummary: string;
  reportPeriod: ReportPeriod;
  reportFromDate: string;
  reportToDate: string;
  reportRangeLabel: string;
};

export function StudentReportActions({
  studentName,
  guardianPhone,
  guardianTelegram,
  classDisplay,
  averageLabel,
  gradeSummary,
  attendanceSummary,
  attendanceDetailSummary,
  financialSummary,
  reportPeriod,
  reportFromDate,
  reportToDate,
  reportRangeLabel,
}: StudentReportActionsProps) {
  const [selectedSections, setSelectedSections] = useState<ReportSectionKey[]>(
    REPORT_SECTIONS.map((section) => section.key),
  );

  useEffect(() => {
    for (const section of REPORT_SECTIONS) {
      document.documentElement.dataset[`print${section.key}`] = selectedSections.includes(section.key) ? "1" : "0";
    }
  }, [selectedSections]);

  const whatsappMessage = useMemo(() => {
    return [
      `تقرير الطالب: ${studentName}`,
      `فترة التقرير: ${reportRangeLabel}`,
      `الصف: ${classDisplay}`,
      `المعدل خلال الفترة: ${averageLabel}`,
      "درجات المواد خلال الفترة:",
      gradeSummary,
      `الحضور خلال الفترة: ${attendanceSummary}`,
      "أوقات الدخول والانصراف خلال الفترة:",
      attendanceDetailSummary,
      `الجانب المالي الحالي: ${financialSummary}`,
      "يمكن حفظ التقرير PDF من زر طباعة / حفظ PDF داخل ملف الطالب في النظام.",
    ].join("\n");
  }, [attendanceDetailSummary, attendanceSummary, averageLabel, classDisplay, financialSummary, gradeSummary, reportRangeLabel, studentName]);

  const whatsappUrl = getWhatsappUrl(guardianPhone, whatsappMessage);
  const telegramUrl = getTelegramDesktopUrl(guardianTelegram);

  function toggleSection(section: ReportSectionKey) {
    setSelectedSections((current) => {
      if (current.includes(section)) {
        return current.filter((item) => item !== section);
      }
      return [...current, section];
    });
  }

  function selectAll() {
    setSelectedSections(REPORT_SECTIONS.map((section) => section.key));
  }

  function printReport() {
    window.print();
  }

  return (
    <section className="app-card p-5 print:hidden">
      <div className="grid gap-5 xl:grid-cols-[1fr_auto] xl:items-start">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
              <CalendarDays size={20} />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[var(--app-text)]">فترة التقرير قبل الإرسال</h3>
              <p className="mt-1 text-sm font-semibold text-[var(--app-text-muted)]">
                التقرير الحالي للفترة: <span className="font-extrabold text-[var(--app-text)]">{reportRangeLabel}</span>
              </p>
            </div>
          </div>

          <form method="get" className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
            <div>
              <label htmlFor="student-report-period" className="mb-2 block text-xs font-extrabold text-[var(--app-text-muted)]">
                نوع الفترة
              </label>
              <select
                id="student-report-period"
                name="period"
                defaultValue={reportPeriod}
                className="input"
              >
                {REPORT_PERIODS.map((period) => (
                  <option key={period.value} value={period.value}>{period.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="student-report-from" className="mb-2 block text-xs font-extrabold text-[var(--app-text-muted)]">
                من تاريخ للمخصص
              </label>
              <input
                id="student-report-from"
                name="fromDate"
                type="date"
                defaultValue={reportFromDate}
                className="input"
              />
            </div>

            <div>
              <label htmlFor="student-report-to" className="mb-2 block text-xs font-extrabold text-[var(--app-text-muted)]">
                إلى تاريخ للمخصص
              </label>
              <input
                id="student-report-to"
                name="toDate"
                type="date"
                defaultValue={reportToDate}
                className="input"
              />
            </div>

            <button type="submit" className="btn btn-secondary">
              تطبيق الفترة
            </button>
          </form>
        </div>

        <div className="flex flex-wrap gap-3 xl:justify-end">
          <button type="button" onClick={selectAll} className="btn btn-secondary">
            <CheckSquare size={18} />
            تحديد الكل
          </button>
          <button type="button" onClick={printReport} className="btn btn-primary">
            <Printer size={18} />
            طباعة / حفظ PDF
          </button>
          <a
            href={whatsappUrl ?? undefined}
            target="_blank"
            rel="noreferrer"
            className={["btn btn-secondary", !whatsappUrl ? "pointer-events-none opacity-60" : ""].join(" ")}
            title={!whatsappUrl ? "لا يوجد رقم ولي أمر صالح" : undefined}
          >
            <MessageCircle size={18} />
            إرسال ملخص لولي الأمر عبر واتساب
          </a>
          <a
            href={telegramUrl ?? undefined}
            className={["btn btn-secondary", !telegramUrl ? "pointer-events-none opacity-60" : ""].join(" ")}
            title={!telegramUrl ? "لا يوجد معرف تليكرام لولي الأمر" : "فتح المحادثة في Telegram Desktop"}
          >
            <MessageCircle size={18} />
            فتح تليكرام ولي الأمر
          </a>
        </div>
      </div>

      <div className="mt-5 border-t border-[var(--app-border-soft)] pt-4">
        <div>
          <h3 className="text-base font-extrabold text-[var(--app-text)]">خيارات الطباعة</h3>
          <p className="mt-1 text-sm font-semibold text-[var(--app-text-muted)]">
            اختر الأجزاء التي تريد ظهورها عند الطباعة أو الحفظ PDF.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {REPORT_SECTIONS.map((section) => {
          const checked = selectedSections.includes(section.key);
          return (
            <button
              key={section.key}
              type="button"
              onClick={() => toggleSection(section.key)}
              className="flex items-center justify-between rounded-2xl border border-[var(--app-border-soft)] bg-white px-4 py-3 text-sm font-extrabold text-[var(--app-text)] transition hover:border-[var(--app-primary)] hover:bg-indigo-50"
            >
              <span>{section.label}</span>
              {checked ? <CheckSquare size={18} className="text-[var(--app-primary)]" /> : <Square size={18} className="text-[var(--app-text-muted)]" />}
            </button>
          );
        })}
      </div>
    </section>
  );
}
