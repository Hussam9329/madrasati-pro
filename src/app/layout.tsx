import type { Metadata, Viewport } from "next";
import { Tajawal } from "next/font/google";
import { ThemeProvider } from "@/components/layout/theme-provider";
import "./globals.css";

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "700", "800"],
  display: "swap",
  variable: "--font-tajawal",
});

export const metadata: Metadata = {
  title: {
    default: "مارينا",
    template: "%s | مارينا",
  },
  description:
    "نظام مدرسي ذكي ومتكامل لإدارة ثانوية مارينا، الطلاب، المدرسين، الصفوف، الدرجات، الأقساط، والمدفوعات.",
  applicationName: "مارينا",
  authors: [{ name: "مارينا" }],
  generator: "Next.js",
  keywords: [
    "مارينا",
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
  themeColor: "#1e40af",
};

type RootLayoutProps = {
  children: React.ReactNode;
};

/* Inline script to prevent flash of wrong theme (FOUC) */
const themeScript = `
  (function() {
    try {
      var theme = localStorage.getItem('theme');
      if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      }
    } catch(e) {}
  })();
`;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ar" dir="rtl" className={tajawal.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-app text-app antialiased font-[family-name:var(--font-tajawal)]">
        <ThemeProvider>
          <div id="app-root" className="min-h-screen">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
