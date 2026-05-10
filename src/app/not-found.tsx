import Link from 'next/link';

/**
 * صفحة 404 — تظهر عندما يطلب المستخدم صفحة غير موجودة.
 * تصميم عربي متناسق مع باقي النظام.
 */
export default function NotFound() {
  return (
    <div
      dir="rtl"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '24px',
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: 'hsl(var(--background, 0 0% 100%))',
        color: 'hsl(var(--foreground, 222.2 84% 4.9%))',
      }}
    >
      <div
        style={{
          maxWidth: '480px',
          padding: '48px 40px',
          borderRadius: '16px',
          backgroundColor: 'hsl(var(--card, 0 0% 100%))',
          border: '1px solid hsl(var(--border, 214.3 31.8% 91.4%))',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}
      >
        {/* 404 Number */}
        <div
          style={{
            fontSize: '6rem',
            fontWeight: 800,
            lineHeight: 1,
            color: 'hsl(var(--muted-foreground, 215.4 16.3% 46.9%) / 0.3)',
            marginBottom: '16px',
          }}
        >
          ٤٠٤
        </div>

        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            marginBottom: '12px',
          }}
        >
          الصفحة غير موجودة
        </h1>

        <p
          style={{
            fontSize: '1rem',
            color: 'hsl(var(--muted-foreground))',
            marginBottom: '28px',
            lineHeight: 1.6,
          }}
        >
          الصفحة التي تبحث عنها غير موجودة أو تم نقلها إلى عنوان آخر.
        </p>

        <Link
          href="/"
          style={{
            display: 'inline-block',
            padding: '10px 32px',
            borderRadius: '8px',
            backgroundColor: 'hsl(var(--primary, 222.2 47.4% 11.2%))',
            color: 'hsl(var(--primary-foreground, 210 40% 98%))',
            fontSize: '0.95rem',
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'opacity 0.2s',
          }}
        >
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
