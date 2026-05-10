'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ModalProps {
  /** هل النافذة مفتوحة */
  open: boolean;
  /** دالة تغيير حالة الفتح */
  onOpenChange: (open: boolean) => void;
  /** عنوان النافذة */
  title: string;
  /** وصف اختياري تحت العنوان */
  description?: string;
  /** محتوى النافذة */
  children: React.ReactNode;
  /** أزرار التذييل */
  footer?: React.ReactNode;
  /** عرض إضافي */
  className?: string;
  /** حجم النافذة */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** منع الإغلاق بالضغط على الخلفية */
  preventClose?: boolean;
}

const sizeMap = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
};

/**
 * مكون نافذة منبثقة موحّد — يلف Dialog مع عنوان ووصف وتذييل
 *
 * @example
 * ```tsx
 * <Modal
 *   open={formOpen}
 *   onOpenChange={setFormOpen}
 *   title="إضافة طالب جديد"
 *   description="أدخل بيانات الطالب"
 *   footer={
 *     <>
 *       <Button variant="outline" onClick={() => setFormOpen(false)}>إلغاء</Button>
 *       <Button onClick={handleSave}>حفظ</Button>
 *     </>
 *   }
 * >
 *   <form>...</form>
 * </Modal>
 * ```
 */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  size = 'md',
  preventClose,
}: ModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={preventClose ? undefined : onOpenChange}
    >
      <DialogContent
        className={cn(sizeMap[size], 'max-h-[90vh] overflow-y-auto', className)}
        onPointerDownOutside={preventClose ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={preventClose ? (e) => e.preventDefault() : undefined}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="py-4">{children}</div>
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
