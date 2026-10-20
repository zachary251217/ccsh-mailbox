import type { Metadata, Viewport } from "next";
import { SITE_TITLE } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: "有話想對學生會說？不需登入，完全匿名。",
  robots: { index: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant-TW">
      <body>{children}</body>
    </html>
  );
}
