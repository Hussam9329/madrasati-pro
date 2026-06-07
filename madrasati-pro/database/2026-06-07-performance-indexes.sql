-- فهارس أداء إضافية لتسريع تحميل العلاقات والقوائم والتقارير.
-- شغّل الملف مرة واحدة من Supabase SQL Editor بعد تطبيق التحديث.

create index if not exists sections_class_active_idx
  on sections ("classId", "isActive");

create index if not exists students_section_status_idx
  on students ("sectionId", "status");

create index if not exists students_status_created_idx
  on students ("status", "createdAt" desc);

create index if not exists teacher_subjects_teacher_created_idx
  on teacher_subjects ("teacherId", "createdAt" desc);

create index if not exists teacher_subjects_subject_idx
  on teacher_subjects ("subjectId");

create index if not exists teacher_sections_teacher_created_idx
  on teacher_sections ("teacherId", "createdAt" desc);

create index if not exists teacher_sections_section_idx
  on teacher_sections ("sectionId");

create index if not exists class_subjects_class_idx
  on class_subjects ("classId");

create index if not exists class_subjects_subject_idx
  on class_subjects ("subjectId");

create index if not exists schedules_section_day_idx
  on schedules ("sectionId", "dayOfWeek");

create index if not exists schedules_teacher_day_idx
  on schedules ("teacherId", "dayOfWeek");

create index if not exists schedules_subject_idx
  on schedules ("subjectId");

create index if not exists attendance_records_schedule_date_idx
  on attendance_records ("scheduleId", "date");

create index if not exists attendance_records_status_date_idx
  on attendance_records ("status", "date");

create index if not exists grades_student_date_idx
  on grades ("studentId", "date" desc);

create index if not exists grades_teacher_date_idx
  on grades ("teacherId", "date" desc);

create index if not exists payments_student_status_idx
  on payments ("studentId", "status");

create index if not exists payments_status_due_date_idx
  on payments ("status", "dueDate");
