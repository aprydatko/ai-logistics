import type { Metadata } from "next";

import "@repo/ui/globals.css";
import { Toaster } from "@repo/ui/components/toaster";
import { QueryProvider } from "@/components/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Logistics",
  description:
    "Operational logistics console for dispatch, incidents, and AI workflows.",
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
