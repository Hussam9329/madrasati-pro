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
  themeColor: "#b01849",
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
