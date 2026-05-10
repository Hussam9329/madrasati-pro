import type { Metadata } from "next";
import "./globals.css";
import "@/../public/fonts/fonts.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";

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
        className="font-['Cairo'] antialiased bg-background text-foreground"
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
