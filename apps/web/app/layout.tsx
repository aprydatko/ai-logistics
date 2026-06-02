import type { Metadata } from "next";

import { MainNavigation } from "@/components/main-navigation";

import "@repo/ui/globals.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Logistics",
  description: "Operational logistics console for dispatch, incidents, and AI workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <MainNavigation />
        {children}
      </body>
    </html>
  );
}
