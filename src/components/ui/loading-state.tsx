'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  /** رسالة تظهر تحت المؤشر */
  message?: string;
  /** حجم المؤشر: 'sm' | 'md' | 'lg' */
  size?: 'sm' | 'md' | 'lg';
  /** مسافة عمودية إضافية */
  className?: string;
}

const sizeMap = {
  sm: 'w-5 h-5',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

/**
 * مكون حالة التحميل — يُستخدم عند جلب البيانات من الخادم
 *
 * @example
 * ```tsx
 * if (loading) return <LoadingState message="جاري تحميل البيانات..." />
 * ```
 */
export function LoadingState({
  message = 'جاري التحميل...',
  size = 'md',
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 gap-4',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <Loader2 className={cn('animate-spin text-primary', sizeMap[size])} />
      {message && (
        <p className="text-sm text-muted-foreground font-medium">{message}</p>
      )}
    </div>
  );
}
