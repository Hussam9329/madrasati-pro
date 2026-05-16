-- إعدادات المدرسة الخاصة بالحضور والعطل.
-- شغّل الملف مرة واحدة من Supabase SQL Editor بعد ملف تحديث الأقساط والامتحانات.

create table if not exists school_settings (
  id text primary key default 'main',
  "weekendDays" jsonb not null default '["friday", "saturday"]'::jsonb,
  "customHolidayDates" jsonb not null default '[]'::jsonb,
  "checkoutWarningTime" text not null default '12:00',
  notes text null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

insert into school_settings (id, "weekendDays", "customHolidayDates", "checkoutWarningTime")
values ('main', '["friday", "saturday"]'::jsonb, '[]'::jsonb, '12:00')
on conflict (id) do nothing;

create index if not exists school_settings_updated_at_idx
  on school_settings ("updatedAt");
