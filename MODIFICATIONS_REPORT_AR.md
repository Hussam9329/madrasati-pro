# تقرير التعديلات البرمجية — Madrasati Pro

## المرحلة 1 — الأقساط وإدارة الرسوم

1. افتح الملف `src/services/class-fee-service.ts` واستبدل منطق الرسوم بالكامل بحيث يدعم:
   - `tuitionAmount` للرسوم الدراسية.
   - `uniformAmount` لسعر الزي المدرسي.
   - `getStudentFeePlans()` لجلب كل طالب مع صفه، الرسوم، المدفوع، المتبقي، وحالة الزي.
   - تصحيح البحث عن إعداد الصف من `findUnique(classId_academicYear)` إلى `findFirst({ classId, academicYear })` لأن عميل Supabase REST في المشروع لا يدعم المفتاح المركب بنفس طريقة Prisma.

2. افتح الملف `src/app/fees/page.tsx` واستبدل التحويل القديم إلى `/payments` بصفحة إدارة أقساط فعلية:
   - تعرض كل الصفوف الفعالة.
   - لكل صف حقول: الرسوم الدراسية، سعر الزي، ملاحظات.
   - تحفظ الإعدادات حسب السنة الدراسية.

3. افتح الملف `src/app/api/settings/fees/route.ts` وعدّل API ليقبل:
   - `tuitionAmount` أو `amount` للتوافق القديم.
   - `uniformAmount` لسعر الزي.

4. افتح الملف `src/components/payments/payment-create-form.tsx` وأنشئه كمكوّن Client جديد:
   - البحث باسم الطالب فقط.
   - القائمة المنسدلة تعرض اسم الطالب فقط بدون الرمز أو تفاصيل الصف.
   - بعد الاختيار تظهر سطور توضيحية: الصف، الرسوم، المدفوع، المتبقي، سعر الزي، حالة الزي.
   - اختيار نوع الرسوم: `رسوم دراسية` أو `زي مدرسي`.
   - الزي يسجل مبلغه تلقائيًا من إعدادات الصف.
   - الرسوم الدراسية تدعم دفع كامل أو دفعات.
   - إذا كانت الدفعة مساوية للمتبقي تسجل كمدفوعة كاملة تلقائيًا.

5. افتح الملف `src/app/payments/page.tsx` وعدّل:
   - استبدال نموذج الدفع القديم بالمكوّن الجديد.
   - الاعتماد على `getStudentFeePlans()` بدل `getStudents()`.
   - تعديل `createPaymentAction()` لتطبيع الدفع الكامل/الجزئي والزي.
   - إضافة عمود/شارة `الزي المدرسي: صح/غلط` داخل سجل الدفعات.
   - إضافة عرض `المتبقي` في كل دفعة.
   - إضافة زر `طباعة الوصل` لكل دفعة.

6. افتح الملف `src/services/payment-service.ts` وعدّل `toPaymentListItem()` لإضافة:
   - `remainingAmount`.
   - `formattedRemainingAmount`.
   - `isUniformPaid`.

7. افتح الملف `src/types/payment.ts` وأضف خصائص:
   - `paymentMode`.
   - `remainingAmount`.
   - `formattedRemainingAmount`.
   - `isUniformPaid`.

8. أنشئ الملف `src/app/api/payments/[id]/receipt/route.ts`:
   - يجلب تفاصيل الدفعة.
   - ينشئ وصل HTML باستخدام `generatePaymentReceiptHtml()`.
   - يفتح صفحة جاهزة للطباعة بنفس الآلية المتفق عليها.

## المرحلة 2 — الامتحانات والدرجات

1. افتح الملف `src/services/exam-service.ts` وعدّل:
   - `createExam()` ليقبل `teacherId`.
   - `saveExamGrades()` ليحفظ أو يحدث درجات الطلاب حسب `examId + studentId`.
   - منع حفظ درجة غير رقمية أو أكبر من الدرجة الكلية.
   - ربط الدرجة بالمادة والمدرس والامتحان.

2. افتح الملف `src/types/grade.ts` وعدّل أنواع الامتحانات الأساسية إلى:
   - يومي `daily`.
   - شهري `monthly`.
   - نصف سنة `midyear`.
   - فاينل `final`.
   - تراكمي `cumulative`.
   - مع إبقاء بعض الأنواع القديمة للتوافق.

3. أنشئ الملف `src/app/exams/page.tsx`:
   - صفحة جديدة لإضافة امتحان مرتبط بصف/شعبة، مادة، مدرس، نوع امتحان، درجة كلية، درجة نجاح، تاريخ وملاحظات.
   - عرض قائمة الامتحانات مع زر إدخال الدرجات.

4. أنشئ الملف `src/app/exams/[id]/grades/page.tsx`:
   - يعرض كل طلاب الصف المرتبط بالامتحان.
   - لكل طالب خانة درجة الامتحان وملاحظات.
   - يتضمن بحثًا سريعًا داخل الطلاب.
   - يحفظ الدرجات دفعة واحدة.

5. افتح الملف `src/services/grade-service.ts` وأضف دعم `examId` في الفلترة والحفظ والعرض.

## المرحلة 3 — الحضور والانصراف

1. افتح الملف `src/components/attendance/quick-code-attendance.tsx` وأضف:
   - دالة `confirmEarlyCheckout()`.
   - عند اختيار الانصراف قبل الساعة 12:00 يظهر تنبيه تأكيد للمستخدم.
   - التنبيه يعمل سواء تم الاختيار من البحث بالاسم أو الإدخال المباشر.

2. افتح الملف `src/services/attendance-service.ts` وعدّل:
   - السماح بتسجيل الانصراف حتى لو لم يوجد تسجيل دخول صباحي في نفس اليوم.
   - في تسجيل الدخول يتم إظهار رسالة عن حالة الطالب في آخر يوم دوام سابق.
   - حساب آخر يوم دوام سابق يتجاوز الجمعة والسبت افتراضيًا لحين ربط جدول إعدادات العطل.

## المرحلة 4 — لوحة التحكم والبحث السريع

1. افتح الملف `src/services/dashboard-service.ts` وأضف إحصائية:
   - `insideSchoolNow`: عدد الطلاب الذين لديهم `checkInAt` اليوم ولا يملكون `checkOutAt`.

2. افتح الملف `src/app/page.tsx` وأضف بطاقة إحصائية:
   - `داخل بناية المدرسة`.
   - تتصفر عمليًا عند تسجيل انصراف الطالب لأن الشرط يعتمد على عدم وجود `checkOutAt`.

3. أنشئ الملف `src/app/api/search/route.ts`:
   - بحث سريع موحد للطلاب والمدرسين والصفوف.

4. افتح الملف `src/components/layout/app-shell.tsx` وعدّل `TopbarSearch()`:
   - تفعيل البحث السريع في الأعلى.
   - عرض نتائج مباشرة مع روابط لملف الطالب أو صفحات المدرسين/الصفوف.

## المرحلة 5 — الطلاب وملف الطالب

1. افتح الملف `src/app/students/page.tsx` وعدّل:
   - إصلاح عدم ظهور الصفوف في نموذج إضافة الطالب بتغيير فلتر الشعب من `section.isActive` إلى `section.isActive !== false`.
   - حذف زر الاتصال الهاتفي.
   - إضافة زر `تواصل مع ولي الأمر على واتساب`.
   - إضافة زر `ملف الطالب` في خانة الإجراءات.
   - حذف مكوّن `FormField` غير المستخدم.

2. أنشئ الملف `src/app/students/[id]/page.tsx`:
   - ملف طالب موحد يحتوي البيانات الأساسية، الدرجات، الحضور، التقرير المالي.
   - زر طباعة/حفظ PDF عبر `window.print()`.
   - رابط إرسال رسالة واتساب لولي الأمر.

3. أنشئ الملف `src/components/students/student-report-actions.tsx`:
   - أزرار الطباعة وواتساب الخاصة بملف الطالب.

## المرحلة 6 — التنقل والهجرات وتحسينات الجودة

1. افتح الملف `src/lib/navigation.ts` وأضف:
   - تبويبة `إدارة الأقساط`.
   - تبويبة `الامتحانات`.
   - تعديل وصف `الدرجات` ليصبح للمتابعة والمراجعة.

2. أنشئ الملف `database/2026-05-16-fees-exams-settings.sql` وشغله في Supabase SQL Editor:
   - إضافة عمود `uniformAmount` إلى `class_fee_settings`.
   - إضافة `teacherId` إلى `exams`.
   - إضافة `examId` إلى `grades`.
   - إنشاء فهارس لتحسين سرعة الأقساط والحضور والدرجات.

3. تم حذف أثر ملفات البناء المؤقتة قبل ضغط المشروع:
   - `node_modules` غير مضمّن.
   - `.next` غير مضمّن.
   - `tsconfig.tsbuildinfo` غير مضمّن.

## نتيجة الفحص

- تم تنفيذ `npm ci --ignore-scripts` لتثبيت الاعتماديات محليًا أثناء الفحص.
- تم تنفيذ `npx tsc --noEmit` ونجح فحص TypeScript بدون أخطاء.
- تم تشغيل `npm run build` ووصل إلى مرحلة Compile بنجاح، لكن Next.js أظهر مشكلة ESLint موجودة أصلًا في `.eslintrc.json` وهي: `Converting circular structure to JSON`، ثم علقت مرحلة `Collecting page data` في بيئة الاختبار بسبب عدم وجود إعدادات Supabase الحقيقية. لم أعدّل `.eslintrc.json` حتى لا أغيّر إعدادات lint الأساسية بدون طلب صريح.

---

# تقرير الدفعة الثانية — الإعدادات والعطل وربطها بالحضور

## الهدف المنجز في هذه الدفعة

تم تحويل منطق العطل من قيمة ثابتة داخل كود الحضور إلى إعدادات قابلة للتعديل من داخل النظام. صار المستخدم يستطيع تحديد أيام العطل الأسبوعية، وإضافة تواريخ عطل خاصة، وتحديد وقت الانصراف القياسي الذي تظهر قبله رسالة التأكيد.

## الأوامر البرمجية التفصيلية للتعديل

1. افتح الملف `src/types/settings.ts` وأنشئ أنواع وإعدادات المدرسة:
   - أضف `SchoolDay` لقيم أيام الأسبوع.
   - أضف `SchoolSettings` و `SchoolSettingsInput`.
   - أضف القيم الافتراضية: الجمعة والسبت عطلة، ووقت الانصراف القياسي `12:00`.
   - أضف دوال تنظيف التواريخ: `normalizeHolidayDate()` و `parseHolidayDatesText()`.
   - أضف دالة عرض أسماء الأيام بالعربية `getSchoolDayLabel()`.

2. افتح الملف `src/services/school-settings-service.ts` وأنشئ خدمة إعدادات المدرسة:
   - أضف `getSchoolSettings()` لجلب إعدادات المدرسة أو الرجوع للقيم الافتراضية إذا لم يكن جدول الإعدادات مضافًا بعد.
   - أضف `saveSchoolSettings()` لحفظ أيام العطل ووقت الانصراف وتواريخ العطل الخاصة.
   - أضف `isConfiguredHoliday()` لفحص ما إذا كان التاريخ عطلة حسب إعدادات المدرسة.
   - أضف `getPreviousConfiguredSchoolDay()` لاستخراج آخر يوم دوام حقيقي قبل اليوم الحالي، مع تجاوز أيام العطل الأسبوعية والتواريخ الخاصة.

3. افتح الملف `src/lib/supabase-client.ts` وعدّل عميل قاعدة البيانات:
   - أضف الموديل `schoolSetting` إلى `MODEL_TO_TABLE` وربطه بجدول `school_settings`.
   - أضف علاقة فارغة `schoolSetting: {}` داخل `RELATION_MAP` لأن الإعدادات لا تحتاج علاقات.
   - أضف `schoolSetting: ModelHandler` إلى واجهة `SupabaseDB`.
   - أضف `schoolSetting: new SupabaseModelHandler("schoolSetting", "school_settings")` داخل `createSupabaseDB()`.

4. افتح الملف `src/lib/prisma-types.ts` وأضف نوع توافق:
   - `SchoolSettingWhereInput = Record<string, any>`.

5. افتح الملف `src/app/settings/page.tsx` واستبدل التحويل القديم إلى `/permissions` بصفحة إعدادات فعلية:
   - تعرض بطاقة أيام العطل الأسبوعية.
   - تعرض بطاقة وقت تنبيه الانصراف المبكر.
   - تعرض حالة اليوم: دوام أو عطلة حسب الإعدادات الحالية.
   - تضيف نموذج اختيار أيام العطل الأسبوعية.
   - تضيف حقل وقت الانصراف القياسي `type="time"`.
   - تضيف حقل تواريخ العطل الخاصة، كل تاريخ بسطر مستقل بصيغة `YYYY-MM-DD`.
   - تضيف ملاحظات داخلية.
   - تضيف Server Action باسم `saveSchoolSettingsAction()` لحفظ الإعدادات وإعادة تحديث `/settings` و `/attendance` و `/`.

6. افتح الملف `src/lib/navigation.ts` وعدّل التنقل:
   - أضف تبويبة `الإعدادات` برابط `/settings` داخل مجموعة النظام.
   - عدّل وصف مجموعة النظام ليشمل الإعدادات والصلاحيات.

7. افتح الملف `src/services/attendance-service.ts` وعدّل حساب الغياب السابق:
   - احذف الاعتماد القديم على الجمعة/السبت داخل `getPreviousSchoolDay()`.
   - استبدله باستدعاء `getPreviousConfiguredSchoolDay()` من خدمة إعدادات المدرسة.
   - الآن عند تسجيل دخول الطالب يظهر هل كان غائبًا في آخر يوم دوام سابق حسب الإعدادات، وليس حسب أيام ثابتة داخل الكود.

8. افتح الملف `src/app/attendance/page.tsx` وعدّل تبويبة الحضور:
   - اجلب إعدادات المدرسة مع سجلات الحضور والإحصائيات.
   - اعرض تنبيهًا يوضح أيام العطل الأسبوعية الحالية ووقت تنبيه الانصراف المبكر.
   - مرر `checkoutWarningTime` إلى لوحة إدخال الحضور.
   - أضف زر انتقال مباشر إلى `/settings` لتعديل أيام العطل.

9. افتح الملف `src/components/attendance/attendance-entry-panel.tsx` وعدّل المكوّن:
   - أضف الخاصية `checkoutWarningTime`.
   - مرر الخاصية إلى `QuickCodeAttendance`.
   - مرر الخاصية إلى ماسح QR في الحضور والانصراف.

10. افتح الملف `src/components/attendance/quick-code-attendance.tsx` وعدّل تنبيه الانصراف:
    - اجعل `confirmEarlyCheckout()` يعتمد على وقت الانصراف المحفوظ في الإعدادات بدل الساعة `12:00` الثابتة.
    - أبقِ الانصراف متاحًا بكل الأوقات.
    - إذا كان الوقت الحالي قبل وقت الانصراف القياسي، يظهر سؤال تأكيد للمستخدم.
    - طبّق التنبيه سواء كان الإدخال باسم الطالب أو برمز الطالب.

11. افتح الملف `src/components/attendance/qr-attendance-scanner.tsx` وعدّل ماسح QR:
    - أضف الخاصية `checkoutWarningTime`.
    - أضف دالة `confirmEarlyCheckout()` داخل ماسح QR.
    - عند مسح QR في وضع الانصراف قبل الوقت المحدد، يظهر نفس تنبيه التأكيد.
    - إذا ألغى المستخدم التأكيد لا يتم تسجيل الانصراف.

12. أنشئ الملف `database/2026-05-16-school-settings.sql` وشغّله في Supabase SQL Editor:
    - ينشئ جدول `school_settings`.
    - يحفظ أيام العطل الأسبوعية بصيغة `jsonb`.
    - يحفظ تواريخ العطل الخاصة بصيغة `jsonb`.
    - يحفظ وقت الانصراف القياسي في العمود `checkoutWarningTime`.
    - يضيف سجلًا افتراضيًا بالقيمة `main` إذا لم يكن موجودًا.

## ملف SQL المطلوب لهذه الدفعة

بعد تطبيق ملف الدفعة الأولى، شغّل هذا الملف أيضًا:

```sql
-- database/2026-05-16-school-settings.sql
create table if not exists school_settings (
  id text primary key default 'main',
  "weekendDays" jsonb not null default '["friday", "saturday"]'::jsonb,
  "customHolidayDates" jsonb not null default '[]'::jsonb,
  "checkoutWarningTime" text not null default '12:00',
  notes text null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);
```

## نتيجة الفحص بعد الدفعة الثانية

- تم تنفيذ `npm install --ignore-scripts` مؤقتًا داخل بيئة العمل حتى تتوفر الاعتماديات للفحص، ولم يتم تضمين `node_modules` في ملف التسليم.
- تم تنفيذ `npx tsc --noEmit` بنجاح بدون أخطاء TypeScript.
- تم تشغيل `npm run build`، ونجحت مرحلة Compile، لكن بقيت نفس مشكلة ESLint الموجودة سابقًا في `.eslintrc.json`: `Converting circular structure to JSON`. لم أعدل إعدادات ESLint لأنها مشكلة إعداد مشروع وليست منطق الدفعة الثانية.

## ما أصبح مكتملًا من طلب الحضور والإعدادات

- الانصراف متاح في كل الأوقات.
- تظهر رسالة تأكيد إذا تم الانصراف قبل وقت الانصراف القياسي المحدد في الإعدادات.
- وقت الانصراف لم يعد ثابتًا في الكود، ويمكن تغييره من `/settings`.
- الغياب في اليوم السابق يعتمد على آخر يوم دوام حقيقي.
- أيام العطل الأسبوعية والتواريخ الخاصة لا تُحسب كغياب.
- صفحة الإعدادات أصبحت موجودة في القائمة الجانبية.
