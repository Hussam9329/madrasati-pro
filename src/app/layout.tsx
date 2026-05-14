import type { Metadata, Viewport } from "next";
import { Tajawal } from "next/font/google";
import { ThemeProvider } from "@/components/layout/theme-provider";
import "./globals.css";

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "700", "800"],
  variable: "--font-tajawal",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "مدرستي",
    template: "%s | مدرستي",
  },
  description:
    "نظام مدرسي ذكي ومتكامل لإدارة ثانوية مارينا للبنات، الطلاب، المدرسات، الصفوف، الدرجات، الأقساط، والمدفوعات.",
  applicationName: "مدرستي",
  authors: [{ name: "مدرستي" }],
  generator: "Next.js",
  keywords: [
    "مدرستي",
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
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${tajawal.variable} min-h-screen bg-app text-app antialiased`}>
        <ThemeProvider>
          <div id="app-root" className="min-h-screen">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
