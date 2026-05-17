"use client";

import { useState, useTransition, useCallback } from "react";
import { Trash2, AlertTriangle, XCircle, ShieldAlert } from "lucide-react";

type BulkDeleteResult = {
  ok: boolean;
  message?: string;
};

type BulkDeleteButtonProps = {
  /** The server action to call on final confirm */
  action: (formData: FormData) => Promise<BulkDeleteResult | void>;
  /** Entity name in Arabic (e.g. "الطلاب", "المدرسين") */
  entityName: string;
  /** Count of items that will be deleted */
  count: number;
  /** Additional description of what will be deleted */
  description?: string;
  /** Additional CSS class for the trigger button */
  className?: string;
  /** Whether the trigger button is disabled */
  disabled?: boolean;
};

const CONFIRM_WORD = "حذف";

export function BulkDeleteButton({
  action,
  entityName,
  count,
  description,
  className,
  disabled = false,
}: BulkDeleteButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [typedConfirm, setTypedConfirm] = useState("");

  const handleButtonClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setErrorMessage(null);
    setTypedConfirm("");
    setStep(1);
    setShowDialog(true);
  }, []);

  const handleCancel = useCallback(() => {
    if (isPending) return;
    setShowDialog(false);
    setErrorMessage(null);
    setTypedConfirm("");
    setStep(1);
  }, [isPending]);

  const handleNextStep = useCallback(() => {
    setErrorMessage(null);
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
      setTypedConfirm("");
    }
  }, [step]);

  const handlePrevStep = useCallback(() => {
    setErrorMessage(null);
    if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      setStep(2);
    }
  }, [step]);

  const handleConfirm = useCallback(() => {
    if (typedConfirm !== CONFIRM_WORD) return;
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("bulkDelete", "true");
        const result = await action(formData);

        if (result && typeof result === "object" && "ok" in result) {
          if (!result.ok) {
            setErrorMessage(result.message || "حدث خطأ أثناء الحذف.");
            return;
          }
        }

        setShowDialog(false);
        setStep(1);
        setTypedConfirm("");
      } catch (error: unknown) {
        if (
          error &&
          typeof error === "object" &&
          "digest" in error &&
          typeof (error as { digest: unknown }).digest === "string" &&
          (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
        ) {
          setShowDialog(false);
          return;
        }

        setErrorMessage("حدث خطأ غير متوقع أثناء الحذف. حاول مرة أخرى.");
      }
    });
  }, [action, typedConfirm]);

  const isButtonDisabled = count === 0 || disabled || isPending;

  return (
    <>
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={isButtonDisabled}
        className={
          className ??
          "btn border-red-100 bg-gradient-to-r from-red-50 to-orange-50 text-red-700 hover:from-red-100 hover:to-orange-100 disabled:opacity-50"
        }
      >
        <Trash2 size={17} />
        حذف الكل ({count})
      </button>

      {showDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={isPending ? undefined : handleCancel}
        >
          <div
            className="mx-4 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Step indicator */}
            <div className="mb-4 flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={[
                    "h-2 flex-1 rounded-full transition",
                    s < step
                      ? "bg-red-500"
                      : s === step
                        ? "bg-red-400"
                        : "bg-gray-200",
                  ].join(" ")}
                />
              ))}
            </div>

            {/* Step 1: Initial warning */}
            {step === 1 && (
              <>
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 text-amber-600">
                    <AlertTriangle size={28} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-amber-900">
                      هل تريد حذف جميع {entityName}؟
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-gray-600">
                      سيتم حذف <span className="font-extrabold text-red-700">{count}</span> {entityName} نهائيًا.
                      {description && (
                        <span className="mt-1 block">{description}</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-sm leading-6 text-amber-800">
                    <strong>تنبيه:</strong> هذا الإجراء لا يمكن التراجع عنه. تأكد أنك تفهم ما ستقوم به قبل المتابعة.
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isPending}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={isPending}
                    className="rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-amber-700 hover:to-orange-700"
                  >
                    نعم، أريد الحذف
                  </button>
                </div>
              </>
            )}

            {/* Step 2: Second confirmation */}
            {step === 2 && (
              <>
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-100 to-orange-100 text-red-600">
                    <ShieldAlert size={28} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-red-900">
                      هل أنت متأكد تمامًا؟
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-gray-600">
                      أنت على وشك حذف <span className="font-extrabold text-red-700">{count}</span> {entityName} نهائيًا.
                      هذا الإجراء <strong className="text-red-700">لا يمكن التراجع عنه</strong> بعد التنفيذ.
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3">
                  <p className="text-sm leading-6 text-red-800">
                    <strong>تحذير نهائي:</strong> بعد الضغط على &quot;حذف الكل&quot; سيُطلب منك كتابة كلمة تأكيد.
                    لا تتابع إلا إذا كنت متأكدًا بنسبة 100%.
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    disabled={isPending}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    تراجع
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={isPending}
                    className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-red-700 hover:to-red-800"
                  >
                    حذف الكل
                  </button>
                </div>
              </>
            )}

            {/* Step 3: Type confirmation */}
            {step === 3 && (
              <>
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-200 to-red-100 text-red-700">
                    <AlertTriangle size={28} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-red-900">
                      تأكيد نهائي: اكتب كلمة التأكيد
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-gray-600">
                      اكتب <span className="rounded bg-red-100 px-2 py-0.5 font-extrabold text-red-700">{CONFIRM_WORD}</span> في الحقل أدناه لتأكيد حذف جميع {entityName}.
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <input
                    type="text"
                    value={typedConfirm}
                    onChange={(e) => setTypedConfirm(e.target.value)}
                    placeholder={`اكتب "${CONFIRM_WORD}" هنا`}
                    className="input border-red-200 text-center text-lg font-bold focus:border-red-500 focus:ring-red-500"
                    dir="rtl"
                    autoComplete="off"
                    disabled={isPending}
                  />
                </div>

                {/* Error message */}
                {errorMessage && (
                  <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                    <XCircle size={20} className="mt-0.5 shrink-0 text-red-600" />
                    <div>
                      <p className="text-sm font-bold text-red-800">
                        لا يمكن الحذف
                      </p>
                      <p className="mt-1 text-sm leading-6 text-red-700">
                        {errorMessage}
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    disabled={isPending}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    تراجع
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={typedConfirm !== CONFIRM_WORD || isPending}
                    className="rounded-xl bg-gradient-to-r from-red-700 to-red-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-red-800 hover:to-red-900 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isPending ? "جارٍ الحذف..." : "حذف نهائي"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
