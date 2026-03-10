import "./globals.css";
import type { Metadata } from "next";
import { Cairo, IBM_Plex_Mono, Manrope } from "next/font/google";
import { DocumentLanguageSync } from "@/components/DocumentLanguageSync";
import { MixpanelProvider } from "@/components/MixpanelProvider";
import { getSessionData } from "@/lib/auth";
import { getServerLanguage } from "@/lib/server-language";

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
  display: "swap",
});

const arabicFont = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-arabic",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Que",
    template: "%s | Que",
  },
  description: "Que is an AI-driven CRM workspace for contacts, deals, tasks, and operations.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const language = await getServerLanguage();
  const session = await getSessionData();
  const direction = language === "ar" ? "rtl" : "ltr";
  const mixpanelToken = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
  const mixpanelApiHost = process.env.NEXT_PUBLIC_MIXPANEL_API_HOST;
  const mixpanelDebug = process.env.NEXT_PUBLIC_MIXPANEL_DEBUG === "true";

  return (
    <html lang={language} dir={direction} className="dark">
      <body className={`${bodyFont.variable} ${monoFont.variable} ${arabicFont.variable}`}>
        <DocumentLanguageSync />
        {mixpanelToken ? (
          <MixpanelProvider
            apiHost={mixpanelApiHost}
            debug={mixpanelDebug}
            token={mixpanelToken}
            user={session.user ?? null}
            workspaceId={session.workspaceId}
          />
        ) : null}
        {children}
      </body>
    </html>
  );
}
