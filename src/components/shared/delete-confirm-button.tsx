"use client";

import { useState, useTransition } from "react";
import { Trash2, AlertTriangle } from "lucide-react";

type DeleteConfirmButtonProps = {
  /** The server action to call on confirm */
  action: (formData: FormData) => Promise<void>;
  /** The ID of the item to delete */
  itemId: string;
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
};

export function DeleteConfirmButton({
  action,
  itemId,
  confirmTitle = "هل أنت متأكد من الحذف؟",
  confirmDescription = "لن يظهر هذا العنصر في القوائم بعد الحذف. تأكد قبل المتابعة.",
  confirmLabel = "نعم، احذف",
  cancelLabel = "تراجع",
  buttonLabel = "حذف",
  className,
}: DeleteConfirmButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleButtonClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setShowDialog(true);
  }

  function handleCancel() {
    setShowDialog(false);
  }

  function handleConfirm() {
    const formData = new FormData();
    formData.set("id", itemId);
    setShowDialog(false);
    startTransition(async () => {
      await action(formData);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={isPending}
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
          onClick={handleCancel}
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

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-red-700 hover:to-red-800 disabled:opacity-50"
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
