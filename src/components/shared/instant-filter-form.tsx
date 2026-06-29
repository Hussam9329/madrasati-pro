"use client";

import { usePathname, useRouter } from "next/navigation";
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
  const formRef = useRef<HTMLFormElement | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const lastUrlRef = useRef<string>("");
  const [, startTransition] = useTransition();

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

      if (href === lastUrlRef.current) {
        return;
      }

      lastUrlRef.current = href;
      startTransition(() => {
        router.replace(href, { scroll: false });
      });
    }, delay);
  }, [buildHref, router]);

  useEffect(() => {
    lastUrlRef.current = `${pathname}${window.location.search}`;

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [pathname]);

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
