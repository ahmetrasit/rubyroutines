import type { Metadata } from "next";
import { TRPCProvider } from "@/lib/trpc/Provider";
import { ToasterProvider } from "@/components/ui/toast";
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
    <html lang="en">
      <body>
        <TRPCProvider>
          <ToasterProvider>{children}</ToasterProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
