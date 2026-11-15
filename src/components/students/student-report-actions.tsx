"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { CalendarDays, CheckCircle2, CheckSquare, Copy, Link2, MessageCircle, Printer, RefreshCw, Square } from "lucide-react";
import type { ReportPeriod } from "@/types/report";
import {
  buildGuardianLinkMessage,
  buildGuardianLinkUrl,
  copyTextToClipboard,
  getTelegramDesktopUrl,
  getWhatsappUrl,
} from "@/lib/contact-links";

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
  studentId: string;
  studentName: string;
  /** Guardian links only work for active students. */
  isActiveStudent: boolean;
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
  studentId,
  studentName,
  isActiveStudent,
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

      <GuardianLinkActions
        studentId={studentId}
        studentName={studentName}
        guardianPhone={guardianPhone}
        isActiveStudent={isActiveStudent}
      />

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

type GuardianLinkActionsProps = {
  studentId: string;
  studentName: string;
  guardianPhone?: string | null;
  isActiveStudent: boolean;
};

type GuardianLinkResponse = {
  ok: boolean;
  message?: string;
  data?: { token: string };
};

const GUARDIAN_LINK_ERROR = "تعذر تجهيز رابط ولي الأمر. حاول مرة أخرى.";
const COPIED_FEEDBACK_MS = 2000;

function subscribeToNothing() {
  return () => {};
}

async function requestGuardianToken(studentId: string, method: "GET" | "POST") {
  const response = await fetch(`/api/students/${encodeURIComponent(studentId)}/guardian-link`, {
    method,
    cache: "no-store",
  });
  const result = (await response.json().catch(() => null)) as GuardianLinkResponse | null;
  if (!response.ok || !result?.ok || !result.data?.token) {
    throw new Error(result?.message || GUARDIAN_LINK_ERROR);
  }
  return result.data.token;
}

/**
 * The student's permanent guardian link (/p/<token>): copy it, send it by
 * WhatsApp, or replace it with a new one (the old link stops working).
 */
function GuardianLinkActions({ studentId, studentName, guardianPhone, isActiveStudent }: GuardianLinkActionsProps) {
  const origin = useSyncExternalStore(subscribeToNothing, () => window.location.origin, () => "");
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmingRegenerate, setConfirmingRegenerate] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    requestGuardianToken(studentId, "GET")
      .then((value) => {
        if (!cancelled) setToken(value);
      })
      .catch((requestError: unknown) => {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : GUARDIAN_LINK_ERROR);
      });
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const linkUrl = token && origin ? buildGuardianLinkUrl(origin, token) : null;
  const whatsappUrl = linkUrl
    ? getWhatsappUrl(guardianPhone, buildGuardianLinkMessage([{ name: studentName, url: linkUrl }]))
    : null;

  async function copyLink() {
    if (linkUrl && (await copyTextToClipboard(linkUrl))) setCopied(true);
  }

  async function regenerate() {
    setRegenerating(true);
    setError(null);
    setNotice(null);
    try {
      setToken(await requestGuardianToken(studentId, "POST"));
      setNotice("تم إنشاء رابط جديد. الرابط القديم لم يعد يعمل، أرسل الرابط الجديد لولي الأمر.");
      setConfirmingRegenerate(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : GUARDIAN_LINK_ERROR);
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="mt-5 border-t border-[var(--app-border-soft)] pt-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-base font-extrabold text-[var(--app-text)]">
            <Link2 size={18} className="text-[var(--app-primary)]" />
            رابط ولي الأمر
          </h3>
          <p className="mt-1 text-sm font-semibold text-[var(--app-text-muted)]">
            رابط ثابت يُرسل مرة واحدة، ويعرض لولي الأمر آخر الحضور والدرجات والأقساط في كل مرة يفتحه.
          </p>
          {!isActiveStudent ? (
            <p className="mt-1 text-sm font-bold text-amber-700">الطالب غير فعّال، لذلك لن يعمل الرابط حتى تعود حالته إلى فعّال.</p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3 xl:justify-end">
          <button type="button" onClick={copyLink} disabled={!linkUrl} className="btn btn-secondary disabled:opacity-60">
            {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
            {copied ? "تم النسخ" : "نسخ رابط ولي الأمر"}
          </button>
          <a
            href={whatsappUrl ?? undefined}
            target="_blank"
            rel="noreferrer"
            className={["btn btn-secondary", !whatsappUrl ? "pointer-events-none opacity-60" : ""].join(" ")}
            title={linkUrl && !whatsappUrl ? "لا يوجد رقم ولي أمر صالح" : undefined}
          >
            <MessageCircle size={18} />
            إرسال الرابط بالواتساب
          </a>
          <button
            type="button"
            onClick={() => setConfirmingRegenerate(true)}
            disabled={!token || regenerating}
            className="btn btn-secondary disabled:opacity-60"
          >
            <RefreshCw size={18} />
            رابط جديد
          </button>
        </div>
      </div>

      {confirmingRegenerate ? (
        <div role="alertdialog" aria-label="تأكيد إنشاء رابط جديد" className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
          <p className="text-sm font-bold leading-7 text-amber-800 dark:text-amber-200">
            سيتوقف الرابط الحالي عن العمل فورًا، وسيحتاج ولي الأمر إلى الرابط الجديد. هل تريد المتابعة؟
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={regenerate} disabled={regenerating} className="btn btn-primary disabled:opacity-60">
              {regenerating ? "جارٍ الإنشاء..." : "نعم، أنشئ رابطًا جديدًا"}
            </button>
            <button type="button" onClick={() => setConfirmingRegenerate(false)} disabled={regenerating} className="btn btn-secondary">
              إلغاء
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p role="alert" className="mt-3 text-sm font-bold text-rose-600">{error}</p> : null}
      {notice ? <p role="status" className="mt-3 text-sm font-bold text-emerald-700">{notice}</p> : null}
    </div>
  );
}
