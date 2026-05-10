'use client';

import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SuccessStateProps {
  /** رسالة النجاح */
  title?: string;
  /** تفاصيل إضافية */
  description?: string;
  /** نص زر الإجراء التالي */
  actionLabel?: string;
  /** دالة زر الإجراء */
  onAction?: () => void;
  /** مسافة إضافية */
  className?: string;
}

/**
 * مكون حالة النجاح — يُستخدم بعد إتمام عملية بنجاح
 *
 * @example
 * ```tsx
 * <SuccessState
 *   title="تم حفظ التغييرات بنجاح"
 *   description="تم تحديث بيانات الطالب"
 *   actionLabel="العودة للقائمة"
 *   onAction={() => setActivePage('students')}
 * />
 * ```
 */
export function SuccessState({
  title = 'تمت العملية بنجاح',
  description,
  actionLabel,
  onAction,
  className,
}: SuccessStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 text-center',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
        <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-1.5 max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button className="mt-5 gap-2" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
