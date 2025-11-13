import type { Metadata } from "next";
import { TRPCProvider } from "@/lib/trpc/Provider";
import { ToasterProvider } from "@/components/ui/toast";
import { PageErrorBoundary } from "@/components/error-boundary";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ruby Routines",
  description: "Routine management for parents and teachers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
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
        </ThemeProvider>
      </body>
    </html>
  );
}
