"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  type ChangeEvent,
  type FormHTMLAttributes,
  type InputEvent,
  type KeyboardEvent,
  type SubmitEvent,
  useCallback,
  useEffect,
  useRef,
  useTransition,
} from "react";

type InstantFilterFormProps = Omit<FormHTMLAttributes<HTMLFormElement>, "action"> & {
  action?: string;
  debounceMs?: number;
};

type ScrollSnapshot = {
  href: string;
  x: number;
  y: number;
  activeId?: string;
  activeName?: string;
  selectionStart?: number | null;
  selectionEnd?: number | null;
  createdAt: number;
};

const SCROLL_SNAPSHOT_KEY = "madrasati.instant-filter-scroll";
const SCROLL_SNAPSHOT_MAX_AGE_MS = 5_000;
const SCROLL_RESTORE_ATTEMPTS = 16;
const SCROLL_RESTORE_INTERVAL_MS = 50;

function isTextLikeField(target: EventTarget | null) {
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
    return false;
  }

  if (target instanceof HTMLTextAreaElement) {
    return true;
  }

  return [
    "",
    "search",
    "text",
    "tel",
    "email",
    "number",
    "url",
    "date",
    "time",
    "month",
    "week",
  ].includes(target.type);
}

function normalizeHref(href: string) {
  if (typeof window === "undefined") {
    return href;
  }

  const url = new URL(href, window.location.origin);
  return `${url.pathname}${url.search}`;
}

function getCurrentHref(pathname: string, searchParams: { toString(): string }) {
  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function readScrollSnapshot() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(SCROLL_SNAPSHOT_KEY);
    if (!raw) {
      return null;
    }

    const snapshot = JSON.parse(raw) as ScrollSnapshot;
    if (!snapshot.href || Date.now() - snapshot.createdAt > SCROLL_SNAPSHOT_MAX_AGE_MS) {
      window.sessionStorage.removeItem(SCROLL_SNAPSHOT_KEY);
      return null;
    }

    return snapshot;
  } catch {
    window.sessionStorage.removeItem(SCROLL_SNAPSHOT_KEY);
    return null;
  }
}

function writeScrollSnapshot(snapshot: ScrollSnapshot) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(SCROLL_SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch {
    // تجاهل أي خطأ ناتج عن إعدادات المتصفح أو امتلاء التخزين.
  }
}

function removeScrollSnapshot() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(SCROLL_SNAPSHOT_KEY);
  } catch {
    // لا حاجة لإظهار خطأ للمستخدم.
  }
}

function getActiveFormField(form: HTMLFormElement | null) {
  const activeElement = document.activeElement;
  if (!form || !(activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement || activeElement instanceof HTMLSelectElement)) {
    return null;
  }

  if (!form.contains(activeElement)) {
    return null;
  }

  return activeElement;
}

function createScrollSnapshot(form: HTMLFormElement | null, href: string): ScrollSnapshot {
  const activeField = getActiveFormField(form);
  const canReadSelection = activeField instanceof HTMLInputElement || activeField instanceof HTMLTextAreaElement;

  return {
    href: normalizeHref(href),
    x: window.scrollX,
    y: window.scrollY,
    activeId: activeField?.id || undefined,
    activeName: activeField?.getAttribute("name") || undefined,
    selectionStart: canReadSelection ? activeField.selectionStart : null,
    selectionEnd: canReadSelection ? activeField.selectionEnd : null,
    createdAt: Date.now(),
  };
}

function escapeCssSelectorValue(value: string) {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }

  return value.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

function findFieldFromSnapshot(form: HTMLFormElement | null, snapshot: ScrollSnapshot) {
  if (!form) {
    return null;
  }

  const escapedId = snapshot.activeId ? escapeCssSelectorValue(snapshot.activeId) : "";
  const escapedName = snapshot.activeName ? escapeCssSelectorValue(snapshot.activeName) : "";
  const selector = [
    escapedId ? `#${escapedId}` : "",
    escapedName ? `[name="${escapedName}"]` : "",
  ].filter(Boolean).join(",");

  if (!selector) {
    return null;
  }

  const field = form.querySelector(selector);
  if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement) {
    return field;
  }

  return null;
}

function restoreFocus(form: HTMLFormElement | null, snapshot: ScrollSnapshot) {
  const field = findFieldFromSnapshot(form, snapshot);
  if (!field) {
    return;
  }

  field.focus({ preventScroll: true });

  if (
    (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) &&
    snapshot.selectionStart !== undefined &&
    snapshot.selectionEnd !== undefined &&
    snapshot.selectionStart !== null &&
    snapshot.selectionEnd !== null
  ) {
    try {
      field.setSelectionRange(snapshot.selectionStart, snapshot.selectionEnd);
    } catch {
      // بعض أنواع الحقول لا تدعم تحديد المؤشر.
    }
  }
}

export function InstantFilterForm({
  action,
  debounceMs = 220,
  children,
  onInput,
  onChange,
  onSubmit,
  onKeyDown,
  ...props
}: InstantFilterFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const restoreTimerRef = useRef<number | null>(null);
  const lastUrlRef = useRef<string>("");
  const [, startTransition] = useTransition();

  const currentHref = getCurrentHref(pathname, searchParams);

  const restoreScroll = useCallback((snapshot: ScrollSnapshot) => {
    if (Date.now() - snapshot.createdAt > SCROLL_SNAPSHOT_MAX_AGE_MS) {
      removeScrollSnapshot();
      return;
    }

    if (restoreTimerRef.current !== null) {
      window.clearInterval(restoreTimerRef.current);
    }

    let attempts = 0;

    const applyRestore = () => {
      attempts += 1;
      window.scrollTo(snapshot.x, snapshot.y);
      restoreFocus(formRef.current, snapshot);

      if (attempts >= SCROLL_RESTORE_ATTEMPTS) {
        if (restoreTimerRef.current !== null) {
          window.clearInterval(restoreTimerRef.current);
          restoreTimerRef.current = null;
        }
        removeScrollSnapshot();
      }
    };

    window.requestAnimationFrame(applyRestore);
    restoreTimerRef.current = window.setInterval(applyRestore, SCROLL_RESTORE_INTERVAL_MS);
  }, []);

  const buildHref = useCallback(() => {
    const form = formRef.current;
    const targetPath = action?.trim() || pathname;
    const params = new URLSearchParams();

    if (!form) {
      return targetPath;
    }

    const formData = new FormData(form);
    for (const [name, rawValue] of formData.entries()) {
      if (!name || rawValue instanceof File) {
        continue;
      }

      const value = String(rawValue).trim();
      if (!value) {
        continue;
      }

      params.append(name, value);
    }

    const query = params.toString();
    return query ? `${targetPath}?${query}` : targetPath;
  }, [action, pathname]);

  const pushFilters = useCallback((delay: number) => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      const href = buildHref();
      const normalizedHref = normalizeHref(href);

      if (normalizedHref === lastUrlRef.current) {
        return;
      }

      const snapshot = createScrollSnapshot(formRef.current, normalizedHref);
      writeScrollSnapshot(snapshot);
      lastUrlRef.current = normalizedHref;

      startTransition(() => {
        router.replace(href, { scroll: false });
        restoreScroll(snapshot);
      });
    }, delay);
  }, [buildHref, restoreScroll, router]);

  useEffect(() => {
    lastUrlRef.current = currentHref;

    const snapshot = readScrollSnapshot();
    if (snapshot?.href === currentHref) {
      restoreScroll(snapshot);
    }

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      if (restoreTimerRef.current !== null) {
        window.clearInterval(restoreTimerRef.current);
      }
    };
  }, [currentHref, restoreScroll]);

  function handleInput(event: InputEvent<HTMLFormElement>) {
    onInput?.(event);
    if (event.defaultPrevented) return;

    pushFilters(isTextLikeField(event.target) ? debounceMs : 0);
  }

  function handleChange(event: ChangeEvent<HTMLFormElement>) {
    onChange?.(event);
    if (event.defaultPrevented) return;

    pushFilters(0);
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    onSubmit?.(event);
    if (event.defaultPrevented) return;

    event.preventDefault();
    pushFilters(0);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;

    if (event.key === "Enter" && !(event.target instanceof HTMLTextAreaElement)) {
      event.preventDefault();
      pushFilters(0);
    }
  }

  return (
    <form
      ref={formRef}
      action={action}
      onInput={handleInput}
      onChange={handleChange}
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {children}
    </form>
  );
}
