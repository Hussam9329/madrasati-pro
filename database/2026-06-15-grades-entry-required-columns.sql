-- إصلاحات احتياطية لصفحات الامتحانات/الدرجات.
-- شغّل هذا الملف مرة واحدة من Supabase SQL Editor إذا ظهرت أخطاء عند فتح أو حفظ درجات الامتحان.

alter table if exists exams
  add column if not exists "maxScore" numeric not null default 100,
  add column if not exists "passScore" numeric not null default 50,
  add column if not exists "failScore" numeric null,
  add column if not exists "teacherId" text null;

alter table if exists grades
  add column if not exists "examId" text null,
  add column if not exists "teacherId" text null;

create index if not exists exams_section_subject_type_idx
  on exams ("sectionId", "subjectId", "type");

create index if not exists exams_teacher_type_idx
  on exams ("teacherId", "type");

create index if not exists grades_exam_student_idx
  on grades ("examId", "studentId");

create index if not exists grades_subject_teacher_examtype_idx
  on grades ("subjectId", "teacherId", "examType");
