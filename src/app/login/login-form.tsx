"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, {
    error: undefined,
  });

  return (
    <form action={formAction} className="space-y-6">
      {/* Error Message */}
      {state.error ? (
        <div className="rounded-2xl border border-red-200 bg-gradient-to-l from-red-50 to-rose-50 p-4 dark:border-red-800/40 dark:from-red-950/30 dark:to-rose-950/30">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <p className="text-sm font-bold text-red-700 dark:text-red-400">
              {state.error}
            </p>
          </div>
        </div>
      ) : null}

      {/* Username Field */}
      <div>
        <label
          htmlFor="username"
          className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
        >
          اسم المستخدم
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          autoFocus
          placeholder="أدخلي اسم المستخدم"
          className="input pr-4"
          dir="ltr"
          disabled={isPending}
        />
      </div>

      {/* Password Field */}
      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-extrabold text-[var(--app-text)]"
        >
          كلمة المرور
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="أدخلي كلمة المرور"
          className="input pr-4"
          dir="ltr"
          disabled={isPending}
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isPending}
        className="btn btn-primary w-full text-base"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            جارٍ الدخول...
          </span>
        ) : (
          "دخول المدير"
        )}
      </button>
    </form>
  );
}
