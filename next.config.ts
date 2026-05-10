import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  serverExternalPackages: ["@prisma/client", "bcryptjs"],

  // Performance optimizations
  compiler: {
    // Remove console.log in production builds
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },

  // Enable experimental optimizations for better performance
  experimental: {
    // Optimize package imports to reduce bundle size
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "date-fns",
      "@radix-ui/react-icons",
    ],
  },

  // Image optimization configuration
  images: {
    formats: ["image/avif", "image/webp"],
    // Restrict remote images to known sources only (prevent SSRF)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/logo.svg",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400",
          },
        ],
      },
      // Security headers for all routes
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            // HSTS — إجبار المتصفح على استخدام HTTPS
            // max-age=63072000 = سنتان
            // includeSubDomains = يشمل جميع النطاقات الفرعية
            // preload = يمكن إضافته لقائمة HSTS preload
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            // Content-Security-Policy — منع XSS وحقن الكود الخبيث
            // default-src 'self' = السماح فقط من نفس النطاق
            // script-src 'self' 'unsafe-eval' 'unsafe-inline' = Next.js يحتاج eval و inline
            // style-src = السماح بالأنماط المحلية و inline (مطلوب لـ Tailwind/shadcn)
            // img-src = السماح بالصور المحلية + data: URIs + Cloudinary
            // font-src = السماح بالخطوط المحلية
            // connect-src = السماح بالاتصال بنفس النطاق + Neon WebSocket
            // frame-ancestors 'none' = منع التضمين في iframe (مثل X-Frame-Options)
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://res.cloudinary.com",
              "font-src 'self' data:",
              "connect-src 'self' https://*.neon.tech wss://*.neon.tech",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
          {
            // منع كشف معلومات التقنيات المستخدمة
            key: "X-Powered-By",
            value: "",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
