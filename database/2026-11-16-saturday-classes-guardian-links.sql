-- دوام السبت لصفوف محددة + رابط ولي الأمر.
-- إضافات فقط: لا يحذف ولا يغيّر أي بيانات موجودة. آمن للتشغيل أكثر من مرة.
-- شغّل الملف مرة واحدة على قاعدة البيانات (Neon SQL Editor) قبل نشر النسخة المعدلة.

-- 1) أيام عطلة عامة يكون فيها الصف دوام، مثل '["saturday"]' لصفوف السادس.
alter table if exists school_classes
  add column if not exists "extraSchoolDays" jsonb not null default '[]'::jsonb;

-- 2) رمز رابط ولي الأمر (عشوائي وسري). يبقى فارغاً حتى يُطلب الرابط أول مرة.
alter table if exists students
  add column if not exists "guardianToken" text null;

create unique index if not exists "students_guardianToken_key"
  on students ("guardianToken");
