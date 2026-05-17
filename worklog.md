# Madrasati Pro - Vercel Serverless Fix Worklog

## Date: 2026-03-04

## Problem
The app was crashing on Vercel with "An error occurred in the Server Components render" because:
1. SQLite database calls in Server Components would fail when the database was unavailable
2. No error boundary existed to catch and gracefully display errors
3. `prisma generate` wasn't running during Vercel's build/postinstall
4. The `ensureDatabase()` function didn't run `prisma generate` before `prisma db push`
5. The build script didn't include `prisma generate`

## Changes Made

### 1. `/src/lib/db.ts` - Added `safeQuery` utility and improved `ensureDatabase`
- Added `safeQuery<T>(fn, fallback)` function that wraps any database call in a try-catch and returns a fallback value on failure
- Updated `ensureDatabase()` to run `prisma generate` before `prisma db push` on Vercel
- This is the core utility used by all Server Component pages to prevent crashes

### 2. `/src/app/error.tsx` - Created global error boundary
- Added a "use client" error boundary component
- Shows a friendly Arabic error message with details
- Includes a retry button that calls `reset()`
- Handles the case where the database is unavailable gracefully

### 3. `/package.json` - Fixed build scripts
- Changed `build` from `next build` to `prisma generate && next build`
- Added `postinstall` script: `prisma generate`
- This ensures Prisma client is generated both during `npm install` and `next build` on Vercel

### 4. `/src/app/students/page.tsx` - Wrapped DB calls with `safeQuery`
- `getStudents()` → `safeQuery(() => getStudents(...), [])`
- `getSections()` → `safeQuery(() => getSections(), [])`
- `getStudentsCount()` → `safeQuery(() => getStudentsCount(), { total: 0, active: 0, inactive: 0, graduated: 0, transferred: 0, withoutSection: 0 })`

### 5. `/src/app/teachers/page.tsx` - Wrapped DB calls with `safeQuery`
- `getTeachers()` → `safeQuery(() => getTeachers(), [])`
- `getTeachersCount()` → `safeQuery(() => getTeachersCount(), { total: 0, active: 0, inactive: 0, withSubjects: 0, withoutSubjects: 0 })`
- `getActiveSubjects()` → `safeQuery(() => getActiveSubjects(), [])`

### 6. `/src/app/subjects/page.tsx` - Wrapped DB calls with `safeQuery`
- `searchSubjects(query)` → `safeQuery(() => searchSubjects(query), [])`
- `getSubjectsCount()` → `safeQuery(() => getSubjectsCount(), { total: 0, active: 0, inactive: 0 })`

### 7. `/src/app/classes/page.tsx` - Wrapped DB calls with `safeQuery`
- `searchClasses(query)` → `safeQuery(() => searchClasses(query), [])`
- `getActiveClasses()` → `safeQuery(() => getActiveClasses(), [])`
- `getSections()` → `safeQuery(() => getSections(), [])`
- `getClassesCount()` → `safeQuery(() => getClassesCount(), { total: 0, active: 0, inactive: 0, sections: 0 })`

### 8. `/src/app/school/page.tsx` - Wrapped DB calls with `safeQuery`
- `getSchoolOverview()` → `safeQuery(() => getSchoolOverview(), { school: null, summary: null, completionPercentage: 0 })`

### 9. `/src/app/schedules/page.tsx` - Wrapped DB calls with `safeQuery`
- `getSchedules(...)` → `safeQuery(() => getSchedules(...), [])`
- `getSchedulesCount()` → `safeQuery(() => getSchedulesCount(), { total: 0, active: 0, inactive: 0, today: 0 })`
- `getSections()` → `safeQuery(() => getSections(), [])`
- `getActiveSubjects()` → `safeQuery(() => getActiveSubjects(), [])`
- `getActiveTeachers()` → `safeQuery(() => getActiveTeachers(), [])`

### 10. `/src/app/attendance/page.tsx` - Wrapped DB calls with `safeQuery`
- `getAttendanceRecords(...)` → `safeQuery(() => getAttendanceRecords(...), [])`
- `getSections()` → `safeQuery(() => getSections(), [])`
- `getSchedules()` → `safeQuery(() => getSchedules(), [])`
- `getAttendanceCounts()` → `safeQuery(() => getAttendanceCounts(), { total: 0, present: 0, absent: 0, late: 0, excused: 0 })`
- `getStudents()` → `safeQuery(() => getStudents(), [])`

### 11. `/src/app/grades/page.tsx` - Wrapped DB calls with `safeQuery`
- `getGrades(...)` → `safeQuery(() => getGrades(...), [])`
- `getGradesCount()` → `safeQuery(() => getGradesCount(), { total: 0, excellent: 0, passed: 0, failed: 0, averagePercentage: 0 })`
- `getActiveStudents()` → `safeQuery(() => getActiveStudents(), [])`
- `getActiveSubjects()` → `safeQuery(() => getActiveSubjects(), [])`
- `getActiveTeachers()` → `safeQuery(() => getActiveTeachers(), [])`

### 12. `/src/app/payments/page.tsx` - Wrapped DB calls with `safeQuery`
- `getPayments(...)` → `safeQuery(() => getPayments(...), [])`
- `getStudents()` → `safeQuery(() => getStudents(), [])`
- `getPaymentsCount()` → `safeQuery(() => getPaymentsCount(), { total: 0, paid: 0, partial: 0, pending: 0, refunded: 0, overdue: 0, totalPaid: 0, totalPending: 0, totalRefunded: 0 })`

### 13. API Routes - Verified already have try-catch
All API route handlers already have try-catch blocks with proper error responses. No changes needed.

### 14. `/vercel.json` - Verified already correct
The vercel.json already had proper settings including `buildCommand`, `outputDirectory`, and `DATABASE_URL` env var. No changes needed.

## Verification
- TypeScript compilation passes with no errors (`npx tsc --noEmit` succeeded)
- All fallback values match the exact return types of their corresponding service functions
- The app structure and functionality remain unchanged - only error resilience was added

---

## Date: 2026-05-17

## Student Section Picker - Card-Based UI

### Change
Replaced the `<select>` dropdown for section/class selection in the student creation form with card-based radio buttons grouped by class.

### File Modified
- `src/app/students/page.tsx` — `StudentCreateForm` component

### What Changed
1. **Grouped sections by class** — sections are now organized under their parent class using `reduce()` to create class groups
2. **Card-based radio selection** — each section is displayed as a selectable card with:
   - Radio input (`name="sectionId"`) so the same form field is submitted
   - Section name displayed prominently
   - Student count and capacity info shown as subtitle
   - Visual feedback on hover and selection (`has-[:checked]:` CSS)
3. **Empty state** — when no classes/sections exist, shows a helpful message directing to the classes page
4. **Scrollable container** — section cards area is scrollable (`max-h-80 overflow-y-auto`) for many classes/sections
5. **Same form field name** — still uses `sectionId` as the name, so the API/backend logic is completely unchanged

### Verification
- `npx tsc --noEmit` passes
- `npm run build` compiles successfully
- Deployed to Vercel production: https://madrasati-pro.vercel.app
