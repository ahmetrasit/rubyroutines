import type { Metadata, Viewport } from "next";
import { TRPCProvider } from "@/lib/trpc/Provider";
import { ToasterProvider } from "@/components/ui/toast";
import { PageErrorBoundary } from "@/components/error-boundary";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { CookieConsent } from "@/components/cookie-consent";
import { SkipNavigation } from "@/components/skip-navigation";
import { NetworkStatusIndicator } from "@/components/ui/network-status-indicator";
import "./globals.css";

// Force dynamic rendering for all pages to prevent SSR/prerendering issues with tRPC
export const dynamic = 'force-dynamic';

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
              <NetworkStatusIndicator
                position="bottom-right"
                hideWhenOnline={true}
                compact={true}
              />
            </TRPCProvider>
          </PageErrorBoundary>
          <CookieConsent />
        </ThemeProvider>
      </body>
    </html>
  );
}
