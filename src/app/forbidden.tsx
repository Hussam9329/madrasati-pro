'use client';

/**
 * صفحة 403 — تظهر عندما يحاول المستخدم الوصول لصفحة لا يملك صلاحيتها.
 * بدلاً من طرد المستخدم فجأة، تشرح له السبب بلباقة.
 */
export default function ForbiddenPage() {
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
        {/* Lock Icon */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'hsl(var(--warning, 38 92% 50%) / 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: '32px',
          }}
        >
          🔒
        </div>

        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            marginBottom: '12px',
          }}
        >
          ليس لديك صلاحية الوصول
        </h1>

        <p
          style={{
            fontSize: '1rem',
            color: 'hsl(var(--muted-foreground, 215.4 16.3% 46.9%))',
            marginBottom: '8px',
            lineHeight: 1.6,
          }}
        >
          هذه الصفحة متاحة فقط للمستخدمين الذين يملكون الصلاحيات المناسبة.
        </p>

        <p
          style={{
            fontSize: '0.9rem',
            color: 'hsl(var(--muted-foreground))',
            marginBottom: '28px',
            lineHeight: 1.6,
          }}
        >
          إذا كنت تعتقد أن هذا خطأ، تواصل مع مسؤول النظام.
        </p>

        <button
          onClick={() => (window.location.href = '/')}
          style={{
            padding: '10px 32px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'hsl(var(--primary, 222.2 47.4% 11.2%))',
            color: 'hsl(var(--primary-foreground, 210 40% 98%))',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          العودة للرئيسية
        </button>
      </div>
    </div>
  );
}
