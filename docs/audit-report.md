# Audit Report — مدرستي Pro

**التاريخ:** 2026-05-10
**الفرع:** `cleanup/batch-01-audit`
**المدقق:** Automated Audit (Batch 01)

---

## Stack

| العنصر | القيمة |
|--------|--------|
| Framework | Next.js 16.1.1 (App Router + Turbopack) |
| Language | TypeScript 5.x (strict mode ON لكن `noImplicitAny: OFF`) |
| Package Manager | npm (bun.lock موجود أيضاً — ازدواجية) |
| Database | PostgreSQL (Neon) via Prisma 6.11.1 |
| UI Library | React 19 + shadcn/ui + Tailwind CSS 4 |
| State Management | Zustand 5 (مع persist) |
| Auth | JWT مخصص (jsonwebtoken + bcryptjs) |
| Charts | Recharts 2.15 |
| Forms | React Hook Form 7 + Zod 4 |

---

## Build Status

| الاختبار | النتيجة |
|----------|---------|
| `npm install` | ✅ نجح (5 moderate vulnerabilities) |
| `next build` | ✅ نجح (24 صفحة، 0 أخطاء بناء) |
| TypeScript (`tsc --noEmit`) | ❌ 20 خطأ TypeScript في src/ (4 أخطاء إضافية في examples/skills) |
| ESLint | ❌ 28 خطأ (0 تحذيرات) |

**ملاحظة مهمة:** `next.config.ts` يحتوي على `ignoreBuildErrors: true` مما يخفي أخطاء TypeScript أثناء البناء — هذا خطير في الإنتاج.

---

## Current Errors

### 1. أخطاء TypeScript (20 خطأ في src/)

#### أ. خصائص JSX مكررة (8 أخطاء — حرج)
- **الملف:** `src/components/school/AttendancePage.tsx`
- **الأسطر:** 359, 704, 845, 894, 904, 980, 1077, 1171
- **المشكلة:** عناصر JSX لها خصائص مكررة (duplicate props)
- **التأثير:** قد يسبب سلوك غير متوقع، آخر قيمة فقط تُستخدم

#### ب. أخطاء أنواع Prisma (3 أخطاء)
- `src/app/api/dashboard/route.ts:197` — `maxScore` غير موجود في `GradeSelect`
- `src/app/api/dashboard/route.ts:206,215` — `students` غير موجود في نتيجة `Class` (يحتاج `include`)
- `src/app/api/subjects/[id]/route.ts:17` — `specialty` غير موجود في `TeacherSelect`

#### ج. أخطاء أنواع المصفوفات (5 أخطاء)
- `src/app/api/attendance/bulk/route.ts:24,35,49,111,113` — أنواع غير متوافقة مع مصفوفات `never[]`

#### د. أخطاء أخرى (4 أخطاء)
- `src/app/page.tsx:47` — `null` غير قابل للتخصيص لـ `undefined`
- `src/components/school/AppLayout.tsx:46` — `profile` مفقود في `Record<PageKey, string>`
- `src/components/school/DashboardPage.tsx:202` — نوع `ease` غير متوافق في Framer Motion

### 2. أخطاء ESLint (28 خطأ)

| نوع الخطأ | العدد | الملفات المتأثرة |
|-----------|-------|-----------------|
| `react-hooks/set-state-in-effect` | 18 | AttendancePage, DashboardPage, ExamsPage, GradesPage, PaymentsPage, SettingsPage, StudentProfilePage, StudentsPage, SubjectsPage, TeachersPage, carousel.tsx, use-mobile.ts |
| `react-hooks/immutability` | 2 | AttendancePage, ReportsPage |
| `react/jsx-no-duplicate-props` | 8 | AttendancePage |

---

## Security Issues

### 🔴 حرج — بيانات اعتماد قاعدة البيانات في Git
- ملف `.env` مُتتبع في Git رغم وجوده في `.gitignore`
- يحتوي على `DATABASE_URL` مع بيانات اعتماد Neon PostgreSQL
- **الإجراء المطلوب:** إزالة من Git tracking (`git rm --cached .env`) وتدوير بيانات الاعتماد فوراً

### 🔴 حرج — JWT Secret ثابت في الكود
- `src/lib/auth.ts:4` — `JWT_SECRET = process.env.JWT_SECRET || 'madrasati-pro-secret-key-2026'`
- المفتاح الاحتياطي مكتوب في المصدر ومرئي للجميع
- **الإجراء المطلوب:** إزالة القيمة الاحتياطية وفرض وجود المتغير البيئي

### 🟡 متوسط — 25 من 27 API route بدون تحقق من الهوية
- فقط 2 من أصل 27 API route يتحققان من الهوية (`verifyToken`):
  - `api/grades/approve/route.ts`
  - `api/users/[id]/route.ts`
- جميع المسارات الأخرى مفتوحة بدون أي تحقق
- **التأثير:** أي شخص يمكنه الوصول لبيانات الطلاب والدرجات والحضور والمدفوعات

### 🟡 متوسط — Prisma log mode في الإنتاج
- `src/lib/db.ts:20` — `log: ['query']` يسجل كل استعلام SQL
- في الإنتاج هذا يبطئ الأداء ويسجل بيانات حساسة

### 🟡 متوسط — ثغرات حزم (5 moderate)
- `postcss < 8.5.10` — XSS vulnerability (عبر Next.js)
- `prismjs < 1.30.0` — DOM Clobbering (عبر react-syntax-highlighter)

---

## Risky Files

| الملف | السبب | الخطورة |
|-------|-------|---------|
| `.env` | مُتتبع في Git مع بيانات اعتماد حقيقية | 🔴 حرج |
| `src/lib/auth.ts` | JWT secret احتياطي مكتوب في الكود | 🔴 حرج |
| `src/app/api/auth/login/route.ts` | نقطة دخول المصادقة — يجب مراجعتها | 🟡 متوسط |
| `src/app/api/attendance/bulk/route.ts` | 5 أخطاء TypeScript + بدون تحقق هوية | 🟡 متوسط |
| `src/app/api/dashboard/route.ts` | 3 أخطاء Prisma + بدون تحقق هوية | 🟡 متوسط |
| `src/components/school/AttendancePage.tsx` | 8 خصائص JSX مكررة + أخطاء hooks | 🟡 متوسط |
| `next.config.ts` | `ignoreBuildErrors: true` يخفي أخطاء TS | 🟡 متوسط |
| `src/lib/db.ts` | تسجيل الاستعلامات في الإنتاج | 🟢 منخفض |

---

## Unused Dependencies (12 حزمة غير مستخدمة)

| الحزمة | الحجم التقريبي | ملاحظة |
|--------|---------------|--------|
| `next-auth` | كبير | لا يُستخدم إطلاقاً — نظام JWT مخصص |
| `next-intl` | متوسط | لا يُستخدم — لا يوجد تعدد لغات |
| `z-ai-web-dev-sdk` | متوسط | لا يُستخدم في src/ |
| `react-markdown` | صغير | لا يُستخدم |
| `react-syntax-highlighter` | كبير | لا يُستخدم + يحتوي على ثغرة prismjs |
| `@mdxeditor/editor` | كبير جداً | لا يُستخدم |
| `@reactuses/core` | صغير | لا يُستخدم |
| `@dnd-kit/core` | متوسط | لا يُستخدم |
| `@dnd-kit/sortable` | صغير | لا يُستخدم |
| `@dnd-kit/utilities` | صغير | لا يُستخدم |
| `sharp` | كبير جداً | لا يُستخدم في src/ |
| `uuid` | صغير | لا يُستخدم |

**تقدير التوفير:** إزالة هذه الحزم قد يقلل `node_modules` بـ 100-200 MB ويُسرع البناء.

---

## Code Quality Issues

### ملفات ضخمة تحتاج تقسيم
| الملف | عدد الأسطر | التوصية |
|-------|-----------|---------|
| `ReportsPage.tsx` | 1,387 | تقسيم لمكونات فرعية |
| `StudentsPage.tsx` | 1,331 | تقسيم لمكونات فرعية |
| `AttendancePage.tsx` | 1,213 | تقسيم + إصلاح الخصائص المكررة |
| `DashboardPage.tsx` | 1,080 | تقسيم الرسوم البيانية لمكونات |
| `StudentProfilePage.tsx` | 890 | تقسيم التبويبات |

### مشاكل React Hooks شائعة
- **18 مكون** يستدعي `setState` مباشرة داخل `useEffect` — نمط مهمل في React 19
- **2 مكون** يصل لمتغيرات قبل تعريفها في `useEffect`
- **التوصية:** تحويل لاستخدام `use()` أو `React Query` بشكل صحيح

### ESLint معطّل تقريباً
- `eslint.config.mjs` يعطل معظم القواعد المفيدة:
  - `no-unused-vars: off`
  - `no-console: off`
  - `no-debugger: off`
  - `@typescript-eslint/no-explicit-any: off`
  - `react-hooks/exhaustive-deps: off`
- **النتيجة:** ESLint فعلياً لا يفحص شيئاً مفيداً

---

## Files Tracked That Shouldn't Be

| الملف/المجلد | السبب |
|-------------|-------|
| `.env` | يحتوي بيانات اعتماد قاعدة البيانات |
| `skills/` (416 ملف) | أدوات تطوير داخلية — ليست جزءاً من المشروع |
| `مدرستي_Pro_Presentation.pptx` | ملف عرض تقديمي — لا ينتمي للمصدر |
| `download/` (~13MB) | صور مراجعة جودة — ليس للمصدر |
| `db/school.db` | قاعدة بيانات محلية — لا تنتمي للمصدر |
| `worklog.md` | ملف عمل مؤقت |

---

## Configuration Issues

| المشكلة | الملف | التفاصيل |
|---------|-------|---------|
| `ignoreBuildErrors: true` | `next.config.ts` | يخفي أخطاء TypeScript |
| `reactStrictMode: false` | `next.config.ts` | معطل — يفقد فوائد اكتشاف الأخطاء |
| `noImplicitAny: false` | `tsconfig.json` | يسمح بـ `any` ضمنياً |
| Lockfile مزدوج | `package-lock.json` + `bun.lock` | يجب اختيار واحد فقط |
| Content path ناقص | `tailwind.config.ts` | لا يشمل `./src/**/*` |

---

## Broken Pages

لا يمكن تحديد الصفحات المعطلة بدقة بدون تشغيل المتصفح، لكن بناءً على أخطاء TypeScript:

| الصفحة | المشكلة المحتملة |
|--------|-----------------|
| ملف الطالب (`profile`) | `AppLayout.tsx` لا يعرّف عنوان `profile` في قائمة الأسماء |
| الحضور (`attendance`) | 8 خصائص JSX مكررة قد تسبب سلوك غريب |
| لوحة التحكم (`dashboard`) | أخطاء Prisma قد تسبب بيانات ناقصة |
| التقارير (`reports`) | `generateReport` يُستدعى قبل تعريفه |

---

## Cleanup Plan

### Batch 2 — أمني (أولوية قصوى)
- [ ] إزالة `.env` من Git tracking: `git rm --cached .env`
- [ ] إزالة JWT secret الاحتياطي من `auth.ts`
- [ ] إضافة تحقق الهوية لجميع API routes
- [ ] تعطيل `log: ['query']` في الإنتاج
- [ ] تدوير بيانات اعتماد قاعدة البيانات

### Batch 3 — تبعيات
- [ ] إزالة 12 حزمة غير مستخدمة
- [ ] تحديث `postcss` و `prismjs` لسد الثغرات
- [ ] توحيد lockfile (npm أو bun — واحد فقط)
- [ ] تحديث Prisma للإصدار 7

### Batch 4 — أخطاء TypeScript
- [ ] إصلاح 8 خصائص JSX المكررة في `AttendancePage.tsx`
- [ ] إصلاح أخطاء أنواع Prisma في API routes
- [ ] إصلاح خطأ `Record<PageKey, string>` في `AppLayout.tsx`
- [ ] إصلاح نوع Framer Motion في `DashboardPage.tsx`
- [ ] إزالة `ignoreBuildErrors: true` من `next.config.ts`

### Batch 5 — جودة الكود
- [ ] تقسيم الملفات الضخمة (>800 سطر) لمكونات فرعية
- [ ] إصلاح 18 مشكلة `setState` داخل `useEffect`
- [ ] تفعيل قواعد ESLint المفيدة تدريجياً
- [ ] إصلاح 2 مشكلة وصول لمتغيرات قبل تعريفها

### Batch 6 — تنظيف Git
- [ ] إزالة `skills/` من التتبع (416 ملف)
- [ ] إزالة ملفات العرض والصور من المصدر
- [ ] تنظيف `worklog.md` وغيرها من الملفات المؤقتة
- [ ] تحديث `.gitignore` وإضافة الملفات المطلوبة

---

## Summary

| الفئة | العدد | الخطورة |
|-------|-------|---------|
| 🔴 مشاكل أمنية حرجة | 3 | يتدخل فوري |
| 🟡 مشاكل متوسطة | 6 | حل في الدفعات القادمة |
| 🟢 مشاكل منخفضة | 3 | تحسين مستمر |
| أخطاء TypeScript | 20 | Batch 4 |
| أخطاء ESLint | 28 | Batch 5 |
| حزم غير مستخدمة | 12 | Batch 3 |
| ملفات لا تنتمي للمصدر | ~420 | Batch 6 |

**النتيجة الإجمالية:** المشروع يعمل ويُبنى بنجاح، لكنه يحتاج تدخل أمني عاجل (بيانات اعتماد مكشوفة + API بدون حماية) وتحسين جودة الكود بشكل تدريجي.
