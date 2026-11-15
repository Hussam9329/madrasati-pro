"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { CheckCircle2, Copy, MessageCircle, PhoneOff, RotateCcw, Search } from "lucide-react";
import {
  buildGuardianLinkMessage,
  buildGuardianLinkUrl,
  copyTextToClipboard,
  getWhatsappUrl,
} from "@/lib/contact-links";

export type GuardianLinkChild = {
  id: string;
  fullName: string;
  classDisplay: string;
  token: string;
};

export type GuardianLinkGroup = {
  /** Normalized WhatsApp number; also the key for the "sent" mark. */
  phone: string;
  /** The number as staff entered it. */
  displayPhone: string;
  children: GuardianLinkChild[];
};

type GuardianLinksSenderProps = {
  groups: GuardianLinkGroup[];
  withoutPhone: GuardianLinkChild[];
};

const SENT_STORAGE_KEY = "marina:guardian-links:sent";
const COPIED_FEEDBACK_MS = 2000;

function readSentPhones(): Set<string> {
  try {
    const raw = window.localStorage.getItem(SENT_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []);
  } catch {
    return new Set();
  }
}

function writeSentPhones(phones: Set<string>) {
  try {
    window.localStorage.setItem(SENT_STORAGE_KEY, JSON.stringify(Array.from(phones)));
  } catch {
    // Storage blocked (private mode etc.): the marks just won't persist.
  }
}

function subscribeToNothing() {
  return () => {};
}

/** window.location.origin on the client, "" during server rendering. */
function useOrigin() {
  return useSyncExternalStore(subscribeToNothing, () => window.location.origin, () => "");
}

function buildMessage(origin: string, children: GuardianLinkChild[]) {
  return buildGuardianLinkMessage(
    children.map((child) => ({ name: child.fullName, url: buildGuardianLinkUrl(origin, child.token) })),
  );
}

export function GuardianLinksSender({ groups, withoutPhone }: GuardianLinksSenderProps) {
  const origin = useOrigin();
  const [query, setQuery] = useState("");
  const [sentPhones, setSentPhones] = useState<Set<string>>(() => new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    setSentPhones(readSentPhones());
  }, []);

  useEffect(() => {
    if (!copiedKey) return;
    const timer = window.setTimeout(() => setCopiedKey(null), COPIED_FEEDBACK_MS);
    return () => window.clearTimeout(timer);
  }, [copiedKey]);

  const normalizedQuery = query.trim().toLowerCase();
  const queryDigits = normalizedQuery.replace(/\D/g, "");

  const visibleGroups = useMemo(() => {
    if (!normalizedQuery) return groups;
    return groups.filter((group) =>
      group.children.some((child) => child.fullName.toLowerCase().includes(normalizedQuery)) ||
      (queryDigits.length > 0 && (group.phone.includes(queryDigits) || group.displayPhone.replace(/\D/g, "").includes(queryDigits))),
    );
  }, [groups, normalizedQuery, queryDigits]);

  const visibleWithoutPhone = useMemo(() => {
    if (!normalizedQuery) return withoutPhone;
    return withoutPhone.filter((child) => child.fullName.toLowerCase().includes(normalizedQuery));
  }, [withoutPhone, normalizedQuery]);

  const sentCount = groups.filter((group) => sentPhones.has(group.phone)).length;

  function markSent(phone: string) {
    setSentPhones((current) => {
      const next = new Set(current);
      next.add(phone);
      writeSentPhones(next);
      return next;
    });
  }

  function resetSent() {
    const empty = new Set<string>();
    writeSentPhones(empty);
    setSentPhones(empty);
  }

  async function copy(key: string, text: string) {
    if (await copyTextToClipboard(text)) setCopiedKey(key);
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="app-card flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <Search size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--app-text-muted)]" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ابحث باسم الطالب أو رقم الهاتف"
            className="input pr-10"
            aria-label="بحث"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="badge badge-info text-sm">
            تم الإرسال: {sentCount} / {groups.length}
          </span>
          <button type="button" onClick={resetSent} disabled={sentCount === 0} className="btn btn-secondary disabled:opacity-60">
            <RotateCcw size={18} />
            تصفير علامات الإرسال
          </button>
        </div>
      </section>

      {groups.length === 0 ? (
        <section className="app-card p-8 text-center text-sm font-semibold text-[var(--app-text-muted)]">
          لا يوجد طلاب فعّالون لديهم رقم هاتف صالح.
        </section>
      ) : visibleGroups.length === 0 ? (
        <section className="app-card p-8 text-center text-sm font-semibold text-[var(--app-text-muted)]">
          لا توجد نتائج مطابقة للبحث.
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {visibleGroups.map((group) => {
            const sent = sentPhones.has(group.phone);
            const message = origin ? buildMessage(origin, group.children) : "";
            const whatsappUrl = origin ? getWhatsappUrl(group.phone, message) : null;
            const copied = copiedKey === group.phone;

            return (
              <article
                key={group.phone}
                className={[
                  "app-card flex flex-col gap-4 p-5",
                  sent ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-500/30" : "",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <ul className="min-w-0 flex flex-col gap-1.5">
                    {group.children.map((child) => (
                      <li key={child.id} className="min-w-0">
                        <Link href={`/students/${child.id}`} className="font-extrabold text-[var(--app-text)] hover:text-[var(--app-primary)]">
                          {child.fullName}
                        </Link>
                        <span className="mr-2 text-xs font-semibold text-[var(--app-text-muted)]">{child.classDisplay}</span>
                      </li>
                    ))}
                  </ul>
                  {sent ? (
                    <span className="badge badge-success shrink-0">
                      <CheckCircle2 size={14} className="ml-1" />
                      أُرسل
                    </span>
                  ) : null}
                </div>

                <p className="text-sm font-bold text-[var(--app-text-muted)]">
                  <span dir="ltr">{group.displayPhone}</span>
                  {group.children.length > 1 ? <span className="mr-2">— {group.children.length} طلاب برسالة واحدة</span> : null}
                </p>

                <div className="flex flex-wrap gap-2">
                  <a
                    href={whatsappUrl ?? undefined}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => markSent(group.phone)}
                    className={["btn btn-primary", !whatsappUrl ? "pointer-events-none opacity-60" : ""].join(" ")}
                  >
                    <MessageCircle size={18} />
                    واتساب
                  </a>
                  <button
                    type="button"
                    onClick={() => copy(group.phone, message)}
                    disabled={!message}
                    className="btn btn-secondary disabled:opacity-60"
                  >
                    {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                    {copied ? "تم النسخ" : "نسخ"}
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {withoutPhone.length > 0 ? (
        <section className="app-card p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <PhoneOff size={20} />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[var(--app-text)]">طلاب بدون رقم صالح ({withoutPhone.length})</h3>
              <p className="mt-1 text-sm font-semibold text-[var(--app-text-muted)]">
                أضف رقم ولي الأمر من ملف الطالب، أو انسخ الرابط وأرسله بطريقة أخرى.
              </p>
            </div>
          </div>

          {visibleWithoutPhone.length === 0 ? (
            <p className="text-center text-sm font-semibold text-[var(--app-text-muted)]">لا توجد نتائج مطابقة للبحث.</p>
          ) : (
            <ul className="divide-y divide-[var(--app-border-soft)]">
              {visibleWithoutPhone.map((child) => {
                const copied = copiedKey === child.id;
                return (
                  <li key={child.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <Link href={`/students/${child.id}`} className="font-extrabold text-[var(--app-text)] hover:text-[var(--app-primary)]">
                        {child.fullName}
                      </Link>
                      <span className="mr-2 text-xs font-semibold text-[var(--app-text-muted)]">{child.classDisplay}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copy(child.id, buildMessage(origin, [child]))}
                      disabled={!origin}
                      className="btn btn-secondary disabled:opacity-60"
                    >
                      {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                      {copied ? "تم النسخ" : "نسخ الرسالة"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
