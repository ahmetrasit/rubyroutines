import type { Metadata, Viewport } from "next";
import { TRPCProvider } from "@/lib/trpc/Provider";
import { ToasterProvider } from "@/components/ui/toast";
import { PageErrorBoundary } from "@/components/error-boundary";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { CookieConsent } from "@/components/cookie-consent";
import { SkipNavigation } from "@/components/skip-navigation";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ruby Routines",
  description: "Routine management for parents and teachers",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ruby Routines",
  },
};

export const viewport: Viewport = {
  themeColor: "#0ea5e9",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <SkipNavigation />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PageErrorBoundary>
            <TRPCProvider>
              <ToasterProvider>{children}</ToasterProvider>
            </TRPCProvider>
          </PageErrorBoundary>
          <CookieConsent />
        </ThemeProvider>
      </body>
    </html>
  );
}
