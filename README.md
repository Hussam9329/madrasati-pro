# Madrasati Pro — نظام إدارة المدرسة

نظام إدارة مدرسية شامل مبني بـ Next.js 16، يدعم الحضور عبر QR، الدرجات، جدول الحصص، والأقساط المالية.

## المتطلبات

- Node.js 20+
- npm أو pnpm
- قاعدة بيانات PostgreSQL (مثل Neon)

## التثبيت

```bash
# استنساخ المشروع
git clone https://github.com/Hussam9329/madrasati-pro.git
cd madrasati-pro

# تثبيت المكتبات
npm install

# إعداد متغيرات البيئة
cp .env.example .env.local
# عدّل القيم في .env.local (خاصة DATABASE_URL و JWT_SECRET)

# إعداد قاعدة البيانات
npm run db:push
npm run db:seed
```

## التطوير

```bash
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000) في المتصفح.

## البناء

```bash
npm run build
npm start
```

## متغيرات البيئة

انسخ `.env.example` إلى `.env.local` وعدّل القيم:

| المتغير | الوصف | مطلوب |
|---------|-------|-------|
| `DATABASE_URL` | رابط قاعدة بيانات PostgreSQL | ✅ |
| `JWT_SECRET` | مفتاح JWT (32 حرف على الأقل) | ✅ |
| `NEXT_PUBLIC_APP_URL` | رابط التطبيق | ❌ |
| `ADMIN_PASSWORD` | كلمة مرور المدير الافتراضية (seed) | ❌ |

### توليد مفتاح JWT

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## هيكل المشروع

```
madrasati-pro/
├── prisma/           # مخطط قاعدة البيانات (Prisma)
├── public/           # ملفات ثابتة (خطوط، صور)
├── scripts/          # سكريبتات التهيئة
├── src/
│   ├── app/
│   │   ├── api/      # مسارات API (Route Handlers)
│   │   ├── layout.tsx # التخطيط الرئيسي (RTL + خطوط)
│   │   └── page.tsx  # الصفحة الرئيسية (SPA router)
│   ├── components/
│   │   ├── school/   # مكونات الصفحات (14 صفحة)
│   │   └── ui/       # مكونات shadcn/ui
│   ├── hooks/        # خطافات React مخصصة
│   ├── lib/
│   │   ├── auth.ts   # المصادقة (JWT + bcrypt)
│   │   ├── db.ts     # اتصال Prisma
│   │   ├── store.ts  # حالة Zustand
│   │   ├── validations/ # مخططات Zod
│   │   └── utils.ts  # دوال مساعدة
│   ├── services/     # طبقة الخدمة (API wrapper)
│   ├── types/        # أنواع TypeScript
│   └── utils/        # أدوات تنسيق وأخطاء
├── .github/
│   └── workflows/
│       └── ci.yml    # GitHub Actions CI
├── docs/             # توثيق الدفعات
└── middleware.ts     # حماية مسارات API
```

## الأوامر

| الأمر | الوصف |
|-------|-------|
| `npm run dev` | تشغيل خادم التطوير |
| `npm run build` | بناء للإنتاج |
| `npm start` | تشغيل نسخة الإنتاج |
| `npm run lint` | فحص الكود |
| `npm run typecheck` | فحص الأنواع |
| `npm test` | تشغيل الاختبارات (مراقب) |
| `npm run test:run` | تشغيل الاختبارات (مرة واحدة) |
| `npm run check` | فحص شامل (lint + typecheck + test + build) |
| `npm run db:push` | رفع المخطط إلى قاعدة البيانات |
| `npm run db:seed` | إعداد البيانات الأساسية |
| `npm run db:studio` | فتح Prisma Studio |

## الأمان

- ✅ المصادقة عبر JWT مع فحص كلمة المرور (bcrypt)
- ✅ middleware.ts يحمي كل مسارات API
- ✅ فحص المدخلات بـ Zod قبل الحفظ في قاعدة البيانات
- ✅ صلاحيات الأدوار (RBAC) في كل مسار
- ✅ لا أسرار في الكود — كل شيء من متغيرات البيئة
- ✅ رؤوس أمنية (X-Frame-Options, X-Content-Type-Options, etc.)
- ✅ منع حقن CSV في التصدير
- ✅ رسائل خطأ عربية بدون كشف تفاصيل النظام

## الترخيص

مشروع خاص — جميع الحقوق محفوظة.
