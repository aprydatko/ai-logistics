import type { Metadata } from "next";

import "@repo/ui/globals.css";
import { Toaster } from "@repo/ui/components/toaster";
import { QueryProvider } from "@/components/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Logistics | Intelligent Fleet Operations",
  description:
    "Real-time fleet visibility, AI-powered incident detection, and automated logistics workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
