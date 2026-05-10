import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";

// Use Next.js font optimization instead of CSS @font-face
// This enables automatic subsetting, preloading, and eliminates layout shift
const cairo = localFont({
  src: [
    { path: "../../public/fonts/cairo-400.ttf", weight: "400", style: "normal" },
    { path: "../../public/fonts/cairo-500.ttf", weight: "500", style: "normal" },
    { path: "../../public/fonts/cairo-600.ttf", weight: "600", style: "normal" },
    { path: "../../public/fonts/cairo-700.ttf", weight: "700", style: "normal" },
    { path: "../../public/fonts/cairo-800.ttf", weight: "800", style: "normal" },
  ],
  variable: "--font-cairo",
  display: "swap",
  preload: true,
  fallback: ["Tajawal", "sans-serif"],
});

const tajawal = localFont({
  src: [
    { path: "../../public/fonts/tajawal-400.ttf", weight: "400", style: "normal" },
    { path: "../../public/fonts/tajawal-500.ttf", weight: "500", style: "normal" },
    { path: "../../public/fonts/tajawal-700.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-tajawal",
  display: "swap",
  preload: false,
  fallback: ["sans-serif"],
});

export const metadata: Metadata = {
  title: "مدرستي - نظام إدارة المدرسة",
  description: "نظام إدارة مدرسة مدرستي - حضور QR ودرجات وجدول حصص بدون تضاربات",
  keywords: ["مدرستي", "إدارة مدرسية", "حضور QR", "درجات", "جدول حصص"],
  authors: [{ name: "مدرستي" }],
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        dir="rtl"
        className={`${cairo.variable} ${tajawal.variable} font-[family-name:var(--font-cairo)] antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
          <Toaster
            richColors
            position="top-center"
            dir="rtl"
            toastOptions={{
              className: 'text-right',
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
