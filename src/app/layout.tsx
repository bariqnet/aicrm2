import "./globals.css";
import type { Metadata } from "next";
import { Cairo, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { DocumentLanguageSync } from "@/components/DocumentLanguageSync";
import { getServerLanguage } from "@/lib/server-language";

const bodyFont = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap"
});

const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
  display: "swap"
});

const arabicFont = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-arabic",
  weight: ["400", "500", "600", "700"],
  display: "swap"
});

export const metadata: Metadata = {
  title: {
    default: "Que",
    template: "%s | Que"
  },
  description: "Que is an AI-driven CRM workspace for contacts, deals, tasks, and operations."
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const language = await getServerLanguage();
  const direction = language === "ar" ? "rtl" : "ltr";

  return (
    <html lang={language} dir={direction}>
      <body className={`${bodyFont.variable} ${monoFont.variable} ${arabicFont.variable}`}>
        <DocumentLanguageSync />
        {children}
      </body>
    </html>
  );
}
