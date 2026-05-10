'use client';

import { useEffect } from 'react';

/**
 * Error Boundary — يمنع الشاشة البيضاء عند حدوث خطأ في React.
 * يعرض رسالة عربية مفهومة مع زر تحديث الصفحة.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error for debugging (not shown to user)
    console.error('Frontend Error:', error);
  }, [error]);

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
          padding: '40px',
          borderRadius: '16px',
          backgroundColor: 'hsl(var(--card, 0 0% 100%))',
          border: '1px solid hsl(var(--border, 214.3 31.8% 91.4%))',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}
      >
        {/* Error Icon */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'hsl(var(--destructive, 0 84.2% 60.2%) / 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: '32px',
          }}
        >
          ⚠️
        </div>

        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            marginBottom: '12px',
            color: 'hsl(var(--foreground))',
          }}
        >
          حدث خطأ غير متوقع
        </h2>

        <p
          style={{
            fontSize: '1rem',
            color: 'hsl(var(--muted-foreground, 215.4 16.3% 46.9%))',
            marginBottom: '8px',
            lineHeight: 1.6,
          }}
        >
          نعتذر عن هذا الخلل. يرجى تحديث الصفحة أو المحاولة لاحقاً.
        </p>

        {error.digest && (
          <p
            style={{
              fontSize: '0.75rem',
              color: 'hsl(var(--muted-foreground))',
              marginBottom: '20px',
              direction: 'ltr',
              fontFamily: 'monospace',
            }}
          >
            خطأ: {error.digest}
          </p>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '20px' }}>
          <button
            onClick={() => reset()}
            style={{
              padding: '10px 24px',
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
            إعادة المحاولة
          </button>

          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: '1px solid hsl(var(--border))',
              backgroundColor: 'transparent',
              color: 'hsl(var(--foreground))',
              fontSize: '0.95rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            تحديث الصفحة
          </button>
        </div>
      </div>
    </div>
  );
}
