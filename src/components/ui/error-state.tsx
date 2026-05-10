'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  /** رسالة الخطأ الرئيسية */
  title?: string;
  /** تفاصيل إضافية */
  description?: string;
  /** نص زر إعادة المحاولة */
  retryLabel?: string;
  /** دالة إعادة المحاولة */
  onRetry?: () => void;
  /** مسافة إضافية */
  className?: string;
}

/**
 * مكون حالة الخطأ — يُستخدم عند فشل جلب البيانات
 *
 * الرسائل التقنية مثل "undefined" أو "500 Internal Server Error"
 * لا تظهر أبدًا للمستخدم. بدلاً من ذلك تُعرض رسائل عربية واضحة.
 *
 * @example
 * ```tsx
 * if (error) return (
 *   <ErrorState
 *     title="تعذر تحميل البيانات"
 *     description="حاول مرة أخرى لاحقاً"
 *     onRetry={fetchData}
 *   />
 * )
 * ```
 */
export function ErrorState({
  title = 'تعذر تحميل البيانات',
  description = 'حدث خطأ أثناء الاتصال بالخادم. حاول مرة أخرى.',
  retryLabel = 'إعادة المحاولة',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 text-center',
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-1.5 max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {onRetry && (
        <Button
          variant="outline"
          className="mt-5 gap-2"
          onClick={onRetry}
        >
          <RefreshCw className="w-4 h-4" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
