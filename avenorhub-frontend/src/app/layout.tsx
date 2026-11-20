import { Suspense } from "react";
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider, ThemeScript } from "@/components/theme-provider";
import RoleGuard from "@/components/RoleGuard";
import { TenantProvider } from "@/context/TenantContext";

export const instant = false;

export const metadata: Metadata = {
  title: "AvenorHub - Management & Operations Platform",
  description: "Enterprise operations hub with strict design tokens and theme controls",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <head>
        <ThemeScript />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-[#F3F4F6] text-gray-900 dark:bg-[#111111] dark:text-gray-100 antialiased transition-colors"
      >
        <ThemeProvider defaultTheme="system">
          <TenantProvider>
            <Suspense fallback={<div className="min-h-screen bg-[#F3F4F6] dark:bg-[#202124]" />}>
              <RoleGuard>{children}</RoleGuard>
            </Suspense>
          </TenantProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}