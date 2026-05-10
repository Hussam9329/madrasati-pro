'use client';

import { type LucideIcon, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  /** العنوان الرئيسي */
  title?: string;
  /** الوصف التفصيلي */
  description?: string;
  /** أيقونة مخصصة (افتراضي: Inbox) */
  icon?: LucideIcon;
  /** نص زر الإجراء */
  actionLabel?: string;
  /** دالة زر الإجراء */
  onAction?: () => void;
  /** مسافة إضافية */
  className?: string;
}

/**
 * مكون الحالة الفارغة — يُستخدم عند عدم وجود بيانات
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={Users}
 *   title="لم يتم تسجيل أي طالب بعد"
 *   description="ابدأ بإضافة الطلاب لإدارة بياناتهم"
 *   actionLabel="إضافة أول طالب"
 *   onAction={() => setFormOpen(true)}
 * />
 * ```
 */
export function EmptyState({
  title = 'لا توجد بيانات',
  description,
  icon: Icon = Inbox,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-20 text-center',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-muted-foreground/40" />
      </div>
      <h3 className="text-lg font-semibold text-muted-foreground">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-1.5 max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button
          variant="outline"
          className="mt-5 gap-2"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
