-- تغييرات مطلوبة للتحديثات الجديدة في الأقساط والامتحانات.
-- شغّل الملف مرة واحدة من Supabase SQL Editor قبل استخدام النسخة المعدلة.

alter table if exists class_fee_settings
  add column if not exists "uniformAmount" numeric not null default 0;

-- يضمن عدم تكرار إعداد رسوم الصف لنفس السنة.
create unique index if not exists class_fee_settings_class_year_unique
  on class_fee_settings ("classId", "academicYear");

alter table if exists exams
  add column if not exists "teacherId" text null;

alter table if exists grades
  add column if not exists "examId" text null;

-- الفهارس التالية تسرع قوائم الدفعات والحضور والبحث اليومي.
create index if not exists payments_student_year_type_idx
  on payments ("studentId", "academicYear", "feeType");

create index if not exists attendance_student_date_idx
  on attendance_records ("studentId", "date");

create index if not exists attendance_inside_school_idx
  on attendance_records ("date", "checkInAt", "checkOutAt");

create index if not exists grades_exam_student_idx
  on grades ("examId", "studentId");
