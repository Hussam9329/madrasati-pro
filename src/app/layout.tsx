import type { Metadata, Viewport } from "next";
import { Tajawal } from "next/font/google";
import "./globals.css";

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "700", "800"],
  variable: "--font-tajawal",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "مدرستي برو",
    template: "%s | مدرستي برو",
  },
  description:
    "نظام مدرسي سريع ومنظم لإدارة الطلاب، الصفوف، المدرسين، الحضور، الدرجات، الأقساط والتقارير.",
  applicationName: "مدرستي برو",
  authors: [{ name: "Madrasati Pro" }],
  generator: "Next.js",
  keywords: [
    "مدرستي برو",
    "نظام مدرسة",
    "إدارة الطلاب",
    "الحضور",
    "الدرجات",
    "الأقساط",
    "التقارير",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#6366f1",
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${tajawal.variable} min-h-screen bg-app text-app antialiased`}>
        <div id="app-root" className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
