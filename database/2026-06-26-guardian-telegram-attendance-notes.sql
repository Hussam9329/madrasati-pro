-- إضافة معرف تليكرام لولي الأمر.
-- ملاحظات الحضور محفوظة مسبقًا في attendance_records.notes، وهذا الملف يضمن فقط حقل تليكرام الجديد.
-- شغّل الملف مرة واحدة من Supabase SQL Editor قبل استخدام النسخة المعدلة.

alter table if exists students
  add column if not exists "guardianTelegram" text null;

create index if not exists students_guardian_telegram_idx
  on students ("guardianTelegram");
