"use client";

import { useState, useTransition, useCallback } from "react";
import { Trash2, AlertTriangle, XCircle } from "lucide-react";

type DeleteResult = {
  ok: boolean;
  message?: string;
};

type DeleteConfirmButtonProps = {
  /** The server action to call on confirm. Can return a result object or void. */
  action?: (formData: FormData) => Promise<DeleteResult | void>;
  /** Alternative: async callback that returns a result. Used when not using server actions. */
  onConfirm?: () => Promise<DeleteResult | void>;
  /** The ID of the item to delete (used with action prop) */
  itemId?: string;
  /** Confirmation dialog title */
  confirmTitle?: string;
  /** Confirmation dialog description */
  confirmDescription?: string;
  /** Confirm button label */
  confirmLabel?: string;
  /** Cancel button label */
  cancelLabel?: string;
  /** Button label (default: "حذف") */
  buttonLabel?: string;
  /** Additional CSS class for the trigger button */
  className?: string;
  /** Whether the trigger button is disabled */
  disabled?: boolean;
};

export function DeleteConfirmButton({
  action,
  onConfirm,
  itemId,
  confirmTitle = "هل أنت متأكد من الحذف؟",
  confirmDescription = "لن يظهر هذا العنصر في القوائم بعد الحذف. تأكد قبل المتابعة.",
  confirmLabel = "نعم، احذف",
  cancelLabel = "تراجع",
  buttonLabel = "حذف",
  className,
  disabled = false,
}: DeleteConfirmButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleButtonClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setErrorMessage(null);
    setShowDialog(true);
  }, []);

  const handleCancel = useCallback(() => {
    if (isPending) return;
    setShowDialog(false);
    setErrorMessage(null);
  }, [isPending]);

  const handleConfirm = useCallback(() => {
    setErrorMessage(null);

    startTransition(async () => {
      try {
        let result: DeleteResult | void;

        if (onConfirm) {
          // Use the callback pattern
          result = await onConfirm();
        } else if (action && itemId) {
          // Use the server action pattern
          const formData = new FormData();
          formData.set("id", itemId);
          result = await action(formData);
        } else {
          setErrorMessage("لم يتم تحديد إجراء الحذف.");
          return;
        }

        // If the action/callback returns a result object, check it
        if (result && typeof result === "object" && "ok" in result) {
          if (!result.ok) {
            // Deletion failed — show error inside the dialog and keep it open
            setErrorMessage(result.message || "حدث خطأ أثناء الحذف.");
            return;
          }
        }

        // Success — close the dialog
        setShowDialog(false);
      } catch (error: unknown) {
        // Server actions that call redirect() throw a NEXT_REDIRECT error.
        // If it's a redirect, it means success (or at least the action completed).
        if (error && typeof error === "object" && "digest" in error && typeof (error as { digest: unknown }).digest === "string" && (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")) {
          // This is a Next.js redirect — means the action completed successfully
          setShowDialog(false);
          return;
        }

        // Unexpected error — show it in the dialog
        setErrorMessage("حدث خطأ غير متوقع أثناء الحذف. حاول مرة أخرى.");
      }
    });
  }, [action, onConfirm, itemId]);

  return (
    <>
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={disabled || isPending}
        className={
          className ??
          "btn w-full border-red-100 bg-gradient-to-r from-red-50 to-indigo-50 text-red-700 hover:from-red-100 hover:to-indigo-100"
        }
      >
        <Trash2 size={17} />
        {isPending ? "جارٍ الحذف..." : buttonLabel}
      </button>

      {showDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={isPending ? undefined : handleCancel}
        >
          <div
            className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-100 to-orange-100 text-red-600">
                <AlertTriangle size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-red-900">
                  {confirmTitle}
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  {confirmDescription}
                </p>
              </div>
            </div>

            {/* Error message shown inside the dialog when deletion fails */}
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
                onClick={handleCancel}
                disabled={isPending}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-red-700 hover:to-red-800 disabled:opacity-50"
              >
                {isPending ? "جارٍ الحذف..." : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
