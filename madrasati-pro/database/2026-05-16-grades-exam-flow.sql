-- تحسينات الدفعة الثالثة لتسريع فلترة الامتحانات والدرجات.
-- شغّل الملف مرة واحدة بعد ملفات الدفعة الأولى والثانية.

create index if not exists exams_section_subject_type_idx
  on exams ("sectionId", "subjectId", "type");

create index if not exists exams_teacher_type_idx
  on exams ("teacherId", "type");

create index if not exists grades_subject_teacher_examtype_idx
  on grades ("subjectId", "teacherId", "examType");

create index if not exists grades_section_lookup_idx
  on grades ("studentId", "subjectId", "examType");
