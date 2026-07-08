import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "METER — AI Coding Analytics",
    template: "%s | METER",
  },
  description:
    "Privacy-first, open-source analytics platform for AI coding assistants. Track your usage of Claude Code, Codex, Cursor, and more — entirely locally.",
  keywords: ["AI coding", "analytics", "Claude Code", "Codex", "Cursor", "privacy", "open source"],
  authors: [{ name: "METER Contributors" }],
  creator: "METER",
  robots: { index: false, follow: false }, // Local app — no indexing
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
