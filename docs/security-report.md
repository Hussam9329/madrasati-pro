# Batch 08 — Security & Environment Hardening Report

## المشاكل المكتشفة

| # | المشكلة | الخطورة | الحالة |
|---|---------|---------|--------|
| 1 | مفتاح JWT ثابت في الكود | 🔴 حرج | ✅ تم الإصلاح |
| 2 | لا يوجد فحص كلمة مرور في تسجيل الدخول | 🔴 حرج | ✅ تم الإصلاح |
| 3 | كلمة مرور المستخدم = اسم المستخدم | 🔴 حرج | ✅ تم الإصلاح |
| 4 | لا يوجد middleware — كل API مفتوح | 🔴 حرج | ✅ تم الإصلاح |
| 5 | 28/30 مسار API بدون حماية | 🔴 حرج | ✅ تم الإصلاح |
| 6 | صلاحيات الأدوار معرّفة لكن غير مطبقة | 🔴 حرج | ✅ تم الإصلاح |
| 7 | لا يوجد فحص مدخلات (Zod) | 🟡 عالي | ✅ تم الإصلاح |
| 8 | صور عن بعد بدون تقييد | 🟡 متوسط | ✅ تم الإصلاح |
| 9 | لا توجد رؤوس أمنية | 🟡 متوسط | ✅ تم الإصلاح |
| 10 | حقن CSV ممكن في التصدير | 🟢 منخفض | ✅ تم الإصلاح |

## التغييرات المُنفَّذة

### 1. auth.ts — إصلاح المصادقة
- إزالة مفتاح JWT الثابت (`'madrasati-pro-secret-key-2026'`)
- التطبيق يرفض العمل بدون `JWT_SECRET` من البيئة
- فحص طول المفتاح (32 حرف على الأقل)
- تحويل `hashPassword` و `comparePassword` إلى async (عدم حظر event loop)
- إضافة `authenticateRequest()` مساعد مركزي
- إضافة `hasPermission()` للتحقق من الصلاحيات
- تقليص مدة الرمز من 7 أيام إلى 8 ساعات
- إضافة `ADMIN_ROLES` و `GRADE_APPROVAL_ROLES` ثوابت

### 2. login route — فحص كلمة المرور
- إضافة حقل `password` مطلوب
- فحص كلمة المرور بـ `comparePassword()`
- رسالة موحدة لمنع اكتشاف أسماء المستخدمين

### 3. middleware.ts — حماية كل المسارات
- كل `/api/*` محمي ماعدا `/api/auth/login` و `/api`
- فحص Bearer token في كل طلب
- تمرير معلومات المستخدم عبر headers (`x-user-id`, `x-user-role`)

### 4. Zod validations — فحص المدخلات
- مخططات لكل endpoint: login, students, teachers, classes, subjects, attendance, grades, payments, fee-plans, installments, users, school, exam-types, schedule
- `validationErrorResponse()` مساعد لعرض أخطاء Zod بشكل عربي

### 5. API routes — صلاحيات RBAC
- كل مسار POST/PUT/DELETE يفحص صلاحية المستخدم
- مسارات الإدارة (users, school) تتطلب دور مدير
- مسارات الدرجات تتطلب صلاحيات محددة
- مسارات المدفوعات تتطلب صلاحيات محددة

### 6. users route — كلمات مرور عشوائية
- توليد كلمة مرور عشوائية (`randomBytes(8).toString('hex')`)
- عرضها للمدير مرة واحدة عند إنشاء المستخدم

### 7. الأمان الإضافي
- رؤوس أمنية: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy
- تقييد الصور عن بعد (cloudinary, github فقط)
- منع حقن CSV في التصدير
- رسائل خطأ عربية بدون كشف تفاصيل تقنية
