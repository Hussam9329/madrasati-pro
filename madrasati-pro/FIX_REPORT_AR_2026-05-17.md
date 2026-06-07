# تقرير إصلاح مشكلة عدم الحفظ عند إضافة الطلاب والمدرسين وباقي البيانات

تاريخ التعديل: 2026-05-17

## ملخص المشكلة
كان التطبيق يعرض رسائل عامة مثل "لم تكتمل العملية" أو "حدث خطأ" رغم أن الإدخال صحيح، لأن سبب الخطأ الحقيقي كان يختفي خلف رسائل عامة. أثناء الفحص ظهرت مشكلتان أساسيتان:

1. إعدادات Supabase المطلوبة للتشغيل غير مذكورة في `.env.example`، بينما الكود يعتمد فعليًا على `NEXT_PUBLIC_SUPABASE_URL` و `SUPABASE_SERVICE_ROLE_KEY`.
2. حفظ المدرس كان يرسل علاقات `teacherSubjects` و `teacherSections` داخل جدول `teachers` بأسلوب Prisma nested writes، بينما عميل Supabase REST المخصص لم يكن يدعم هذه الكتابة، فيفشل حفظ المدرس حتى لو كانت البيانات صحيحة.

## التعديلات المنفذة

### 1) تعديل `.env.example`
**الملف:** `.env.example`

**ما تم تعديله:**
- إضافة `NEXT_PUBLIC_SUPABASE_URL`.
- إضافة `SUPABASE_SERVICE_ROLE_KEY`.
- توضيح أن `DATABASE_URL` و `DIRECT_URL` اختياريان في النسخة الحالية لأن المشروع يستخدم Supabase REST.

**سبب التعديل:**
بدون هذين المتغيرين لا يستطيع التطبيق الاتصال بقاعدة البيانات، فتفشل كل عمليات الإضافة.

---

### 2) حماية اتصال Supabase برسالة واضحة
**الملف:** `src/lib/supabase-client.ts`

**ما تم تعديله:**
- إضافة `hasSupabaseConfig()` لفحص وجود متغيرات Supabase.
- إضافة `getSupabaseConfigErrorMessage()` لإرجاع رسالة عربية واضحة عند نقص الإعدادات.
- منع استخدام رابط placeholder وهمي عند عدم وجود الإعدادات، لأن ذلك كان يخفي سبب الخطأ الحقيقي.

**سبب التعديل:**
بدل أن يفشل الحفظ برسالة عامة، سيظهر السبب الحقيقي: إعدادات قاعدة البيانات غير مكتملة.

---

### 3) دعم حفظ العلاقات عند إضافة أو تحديث المدرس
**الملف:** `src/lib/supabase-client.ts`

**ما تم تعديله:**
- إضافة `splitNestedWrites()` لفصل الحقول العادية عن العلاقات المتداخلة.
- إضافة `createNestedRows()` لحفظ العلاقات في جداولها الصحيحة بعد حفظ السجل الأساسي.
- تعديل `create()` و `update()` حتى لا يرسلا حقولًا مثل `teacherSubjects` و `teacherSections` إلى جدول `teachers` مباشرة.
- إضافة `prepareWriteData()` لتحويل قيم `Date` إلى ISO وحذف القيم `undefined` قبل الإرسال إلى Supabase.

**سبب التعديل:**
كان حفظ المدرس يفشل لأن Supabase كان يستقبل أعمدة غير موجودة داخل جدول `teachers`. الآن يحفظ المدرس أولًا، ثم يحفظ ربطه بالمواد والشُعب في الجداول الصحيحة.

---

### 4) إظهار سبب الخطأ الحقيقي في الصفحات بدل رسالة عامة
**الملف الجديد:** `src/lib/redirect-message.ts`

**ما تم تعديله:**
- إضافة دالة `buildErrorRedirect()` لتمرير رسالة الخطأ عبر الرابط بشكل آمن.

**الصفحات المعدلة:**
- `src/app/students/page.tsx`
- `src/app/teachers/page.tsx`
- `src/app/subjects/page.tsx`
- `src/app/classes/page.tsx`
- `src/app/schedules/page.tsx`
- `src/app/payments/page.tsx`
- `src/app/exams/page.tsx`
- `src/app/settings/page.tsx`

**سبب التعديل:**
عند فشل الإضافة، كانت الصفحة تعرض رسالة عامة لا توضّح السبب. الآن تعرض رسالة الخدمة الحقيقية مثل نقص إعدادات قاعدة البيانات، تكرار الاسم، اختيار شعبة متوقفة، أو تعارض جدول.

---

### 5) فحص إعدادات قاعدة البيانات داخل خدمات الإضافة والتحديث
**الملفات المعدلة:**
- `src/services/student-service.ts`
- `src/services/teacher-service.ts`
- `src/services/subject-service.ts`
- `src/services/class-service.ts`
- `src/services/payment-service.ts`
- `src/services/schedule-service.ts`
- `src/services/grade-service.ts`
- `src/services/attendance-service.ts`
- `src/services/exam-service.ts`

**ما تم تعديله:**
- بعد نجاح فحص الحقول، يتم فحص إعدادات Supabase قبل أي استعلام قاعدة بيانات.
- إذا كانت الإعدادات ناقصة، ترجع الخدمة رسالة واضحة بدل فشل غير مفهوم.

**سبب التعديل:**
هذا يمنع ظهور رسائل مبهمة عند الإضافة أو التحديث، ويكشف السبب الحقيقي بسرعة.

## التحقق

تم تشغيل فحص TypeScript التالي بنجاح:

```bash
npx tsc --noEmit --pretty false
```

تم تشغيل `next build` أيضًا، ووصل إلى مرحلة:

```text
✓ Compiled successfully
Linting and checking validity of types ...
```

لكن أمر البناء لم يكتمل داخل بيئة الفحص بسبب انتهاء مهلة الأداة أثناء مرحلة فحص Next.js. لا يوجد خطأ TypeScript ظاهر لأن فحص `tsc` المستقل نجح.

## ملاحظات تشغيل مهمة

بعد رفع النسخة المعدلة، تأكد من إضافة هذه المتغيرات في Vercel أو ملف `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL="https://YOUR-PROJECT-REF.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="YOUR-SUPABASE-SERVICE-ROLE-KEY"
JWT_SECRET="ضع-قيمة-سرية-قوية"
```

ثم أعد نشر المشروع أو أعد تشغيل السيرفر.
