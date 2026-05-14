"use client";

import { useCallback, useRef, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Keyboard,
  RefreshCw,
  UserCheck,
  UserX,
  History,
} from "lucide-react";
import type { AttendanceScanResult } from "@/types/attendance";

type QuickCodeAttendanceProps = {
  /** Whether QR camera scanner is also available on this device */
  qrAvailable: boolean;
};

type ScanHistoryEntry = {
  id: number;
  result: AttendanceScanResult;
  mode: "check-in" | "check-out";
  timestamp: Date;
};

export function QuickCodeAttendance({ qrAvailable }: QuickCodeAttendanceProps) {
  const [mode, setMode] = useState<"check-in" | "check-out">("check-in");
  const [studentCode, setStudentCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AttendanceScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ScanHistoryEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const historyIdRef = useRef(0);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();

      const code = studentCode.trim();
      if (!code) return;

      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const res = await fetch("/api/attendance/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentCode: code, mode, source: "manual-code" }),
        });

        const data: AttendanceScanResult = await res.json();
        setResult(data);

        if (!data.ok) {
          setError(data.message);
        } else {
          // Add to history
          historyIdRef.current += 1;
          setHistory((prev) => [
            {
              id: historyIdRef.current,
              result: data,
              mode,
              timestamp: new Date(),
            },
            ...prev.slice(0, 9), // Keep last 10 entries
          ]);
          // Clear input on success
          setStudentCode("");
        }
      } catch {
        setError("حدث خطأ في الاتصال بالخادم.");
      } finally {
        setLoading(false);
        // Refocus input for rapid entry
        inputRef.current?.focus();
      }
    },
    [studentCode, mode],
  );

  const handleModeSwitch = useCallback((newMode: "check-in" | "check-out") => {
    setMode(newMode);
    setResult(null);
    setError(null);
    inputRef.current?.focus();
  }, []);

  return (
    <div className="app-card overflow-hidden">
      <div className="border-b border-[var(--app-border-soft)] bg-gradient-to-l from-emerald-50/40 to-amber-50/20 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700">
            <Keyboard size={24} />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-[var(--app-text)]">
              تسجيل حضور برمز الطالبة
            </h3>
            <p className="mt-1 text-sm leading-7 text-[var(--app-text-muted)]">
              أدخلي رمز الطالبة (مثل: MarinaSchoolStd-0001) وسيتم تسجيل حضورها أو انصرافها فورًا.
              {qrAvailable && " يمكنك أيضًا استخدام الكاميرا لمسح رمز QR."}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Mode Toggle */}
        <div className="mb-5 flex gap-2">
          <button
            type="button"
            onClick={() => handleModeSwitch("check-in")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold transition-all ${
              mode === "check-in"
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            <UserCheck size={18} />
            تسجيل حضور
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch("check-out")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold transition-all ${
              mode === "check-out"
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100"
            }`}
          >
            <UserX size={18} />
            تسجيل انصراف
          </button>
        </div>

        {/* Code Input Form */}
        <form onSubmit={handleSubmit} className="mb-5">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                id="student-code-input"
                type="text"
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value)}
                placeholder="أدخلي رمز الطالبة... (مثل: MarinaSchoolStd-0001)"
                className="input ltr text-left placeholder:text-right"
                dir="ltr"
                disabled={loading}
                autoComplete="off"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !studentCode.trim()}
              className="btn btn-primary min-w-[100px]"
            >
              {loading ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : mode === "check-in" ? (
                <>
                  <CheckCircle2 size={18} />
                  حضور
                </>
              ) : (
                <>
                  <XCircle size={18} />
                  انصراف
                </>
              )}
            </button>
          </div>

          {/* Quick tip */}
          <p className="mt-2 text-xs text-[var(--app-text-soft)]">
            اضغطي Enter بعد كتابة الرمز للتسجيل السريع
          </p>
        </form>

        {/* Result Display */}
        {result && (
          <div
            className={`mb-5 rounded-xl border p-4 animate-rise ${
              result.ok
                ? "border-emerald-200 bg-emerald-50"
                : "border-red-200 bg-red-50"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  result.ok
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {result.ok ? <CheckCircle2 size={22} /> : <XCircle size={22} />}
              </div>
              <div className="flex-1">
                <p
                  className={`font-extrabold ${
                    result.ok ? "text-emerald-700" : "text-red-700"
                  }`}
                >
                  {result.message}
                </p>
                {result.ok && (
                  <div className="mt-2 grid gap-1 text-sm text-emerald-800">
                    <p>
                      الطالبة: <span className="font-bold">{result.studentName}</span>
                    </p>
                    <p>
                      الرمز: <span className="font-bold ltr inline-block" dir="ltr">{result.studentCode}</span>
                    </p>
                    {result.checkInAt && (
                      <p>
                        وقت الحضور:{" "}
                        <span className="font-bold">
                          {new Date(result.checkInAt).toLocaleTimeString("ar-IQ")}
                        </span>
                      </p>
                    )}
                    {result.checkOutAt && (
                      <p>
                        وقت الانصراف:{" "}
                        <span className="font-bold">
                          {new Date(result.checkOutAt).toLocaleTimeString("ar-IQ")}
                        </span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Display (non-result errors) */}
        {error && !result?.ok && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700 animate-rise">
            {error}
          </div>
        )}

        {/* Recent History */}
        {history.length > 0 && (
          <div className="mt-2">
            <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-[var(--app-text-muted)]">
              <History size={16} />
              آخر العمليات ({history.length})
            </div>
            <div className="max-h-[240px] overflow-y-auto rounded-xl border border-[var(--app-border-soft)]">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 border-b border-[var(--app-border-soft)] px-4 py-3 last:border-0"
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs ${
                      entry.mode === "check-in"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {entry.mode === "check-in" ? (
                      <UserCheck size={14} />
                    ) : (
                      <UserX size={14} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[var(--app-text)]">
                      {entry.result.studentName}
                    </p>
                    <p className="text-xs text-[var(--app-text-soft)]" dir="ltr">
                      {entry.result.studentCode}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-[var(--app-text-muted)]">
                      {entry.timestamp.toLocaleTimeString("ar-IQ")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
