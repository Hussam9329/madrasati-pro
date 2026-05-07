'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shortcuts = [
  { category: 'التنقل', items: [
    { keys: ['Ctrl', 'K'], description: 'فتح لوحة الأوامر' },
    { keys: ['Ctrl', '1'], description: 'لوحة التحكم' },
    { keys: ['Ctrl', '2'], description: 'الطلاب' },
    { keys: ['Ctrl', '3'], description: 'المدرسون' },
    { keys: ['Ctrl', '4'], description: 'المواد' },
    { keys: ['Ctrl', '5'], description: 'الصفوف والشعب' },
    { keys: ['Ctrl', '6'], description: 'الامتحانات' },
    { keys: ['Ctrl', '7'], description: 'الحضور' },
    { keys: ['Ctrl', '8'], description: 'الدرجات' },
    { keys: ['Ctrl', '9'], description: 'جدول الحصص' },
  ]},
  { category: 'عام', items: [
    { keys: ['Ctrl', '/'], description: 'عرض اختصارات لوحة المفاتيح' },
    { keys: ['Ctrl', 'D'], description: 'تبديل الوضع الداكن' },
    { keys: ['Escape'], description: 'إغلاق أي نافذة أو لوحة' },
  ]},
];

function KeyBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-0.5 text-xs font-mono inline-flex items-center justify-center min-w-[24px]">
      {children}
    </span>
  );
}

export default function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg"
              style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}
            >
              <Keyboard className="w-4 h-4 text-white" />
            </div>
            اختصارات لوحة المفاتيح
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            استخدم هذه الاختصارات للتنقل السريع والوصول الفوري
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2 max-h-[60vh] overflow-y-auto">
          {shortcuts.map((group) => (
            <div key={group.category}>
              <h3 className="text-sm font-semibold mb-2 text-teal-700 dark:text-teal-300">
                {group.category}
              </h3>
              <div className="space-y-1.5">
                {group.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm text-foreground">{item.description}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, kIdx) => (
                        <React.Fragment key={kIdx}>
                          {kIdx > 0 && (
                            <span className="text-muted-foreground text-xs mx-0.5">+</span>
                          )}
                          <KeyBadge>{key}</KeyBadge>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-[11px] text-muted-foreground text-center">
            اضغط <KeyBadge>Ctrl</KeyBadge> + <KeyBadge>/</KeyBadge> لفتح هذه النافذة في أي وقت
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
