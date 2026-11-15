import { db } from "@/lib/db";
import {
  DEFAULT_SCHOOL_SETTINGS,
  SCHOOL_DAY_VALUES,
  isSchoolDay,
  normalizeCheckoutWarningTime,
  normalizeHolidayDates,
  type SchoolDay,
  type SchoolSettings,
  type SchoolSettingsInput,
} from "@/types/settings";

const SETTINGS_ID = "main";

function toArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item));
      }
    } catch {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

/**
 * Safely reads a stored weekday list (Json column) into unique weekday keys,
 * ignoring anything that is not a known weekday.
 */
export function parseSchoolDays(value: unknown): SchoolDay[] {
  return Array.from(new Set(toArray(value).filter(isSchoolDay)));
}

function normalizeWeekendDays(value: unknown): SchoolDay[] {
  if (value === null || value === undefined) {
    return [...DEFAULT_SCHOOL_SETTINGS.weekendDays];
  }

  return parseSchoolDays(value);
}

function toSchoolSettings(record: any): SchoolSettings {
  const now = new Date();

  return {
    id: String(record?.id ?? DEFAULT_SCHOOL_SETTINGS.id),
    weekendDays: normalizeWeekendDays(record?.weekendDays),
    customHolidayDates: normalizeHolidayDates(toArray(record?.customHolidayDates)),
    checkoutWarningTime: normalizeCheckoutWarningTime(record?.checkoutWarningTime),
    notes: record?.notes ? String(record.notes) : null,
    createdAt: record?.createdAt ? new Date(record.createdAt) : now,
    updatedAt: record?.updatedAt ? new Date(record.updatedAt) : now,
  };
}

export async function getSchoolSettings(): Promise<SchoolSettings> {
  try {
    const existing = await db.schoolSetting.findUnique({
      where: { id: SETTINGS_ID },
    });

    if (!existing) {
      return toSchoolSettings(DEFAULT_SCHOOL_SETTINGS);
    }

    return toSchoolSettings(existing);
  } catch (error) {
    console.error("[getSchoolSettings] Falling back to defaults:", error);
    return toSchoolSettings(DEFAULT_SCHOOL_SETTINGS);
  }
}

export async function saveSchoolSettings(input: SchoolSettingsInput): Promise<SchoolSettings> {
  const normalizedWeekendDays = Array.from(new Set(input.weekendDays.filter(isSchoolDay)));

  const data = {
    id: SETTINGS_ID,
    weekendDays: normalizedWeekendDays,
    customHolidayDates: normalizeHolidayDates(input.customHolidayDates),
    checkoutWarningTime: normalizeCheckoutWarningTime(input.checkoutWarningTime),
    notes: input.notes?.trim() || null,
  };

  const existing = await db.schoolSetting.findUnique({ where: { id: SETTINGS_ID } });

  const saved = existing
    ? await db.schoolSetting.update({ where: { id: SETTINGS_ID }, data })
    : await db.schoolSetting.create({ data });

  return toSchoolSettings(saved);
}

export function getWeekdayKey(date: Date): SchoolDay {
  return SCHOOL_DAY_VALUES[date.getDay()];
}

export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Whether `date` is a school day for a class.
 * - A custom holiday date is off for everyone.
 * - A global weekend day is off unless the class has it in its extra school
 *   days (e.g. Saturday for sixth-grade classes).
 * - Students without a class pass no extra days and follow the global calendar.
 */
export function isSchoolDayForClass(
  date: Date,
  settings: Pick<SchoolSettings, "weekendDays" | "customHolidayDates">,
  classExtraSchoolDays: readonly SchoolDay[] = [],
): boolean {
  if (settings.customHolidayDates.includes(formatDateKey(date))) {
    return false;
  }

  const weekday = getWeekdayKey(date);
  return !settings.weekendDays.includes(weekday) || classExtraSchoolDays.includes(weekday);
}

/** Global calendar only (a day off for students who have no extra school days). */
export function isConfiguredHoliday(date: Date, settings: Pick<SchoolSettings, "weekendDays" | "customHolidayDates">): boolean {
  return !isSchoolDayForClass(date, settings);
}

export async function getPreviousConfiguredSchoolDay(
  date: Date,
  classExtraSchoolDays: readonly SchoolDay[] = [],
): Promise<Date> {
  const settings = await getSchoolSettings();
  const previous = new Date(date);
  previous.setDate(previous.getDate() - 1);
  previous.setHours(0, 0, 0, 0);

  for (let i = 0; i < 370; i += 1) {
    if (isSchoolDayForClass(previous, settings, classExtraSchoolDays)) {
      return previous;
    }
    previous.setDate(previous.getDate() - 1);
  }

  return previous;
}
