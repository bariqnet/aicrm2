"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { AppErrorScreen } from "@/components/AppErrorScreen";
import { initializeMixpanel } from "@/lib/mixpanel-browser";

function readDocumentLanguage(): { dir: "ltr" | "rtl"; lang: "ar" | "en" } {
  if (typeof document === "undefined") {
    return { dir: "ltr", lang: "en" };
  }

  const lang = document.documentElement.lang === "ar" ? "ar" : "en";
  return { dir: lang === "ar" ? "rtl" : "ltr", lang };
}

function GlobalErrorMixpanelBootstrap() {
  const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
  const apiHost = process.env.NEXT_PUBLIC_MIXPANEL_API_HOST;
  const debug = process.env.NEXT_PUBLIC_MIXPANEL_DEBUG === "true";
  const [isScriptReady, setIsScriptReady] = useState(false);

  useEffect(() => {
    if (!token || !isScriptReady || !window.mixpanel) return;
    initializeMixpanel({ apiHost, debug, token });
  }, [apiHost, debug, isScriptReady, token]);

  if (!token) return null;

  return (
    <Script
      id="mixpanel-browser-sdk-global-error"
      src="https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js"
      strategy="afterInteractive"
      onLoad={() => setIsScriptReady(true)}
    />
  );
}

export default function GlobalErrorPage({
  error,
  reset
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  const { dir, lang } = readDocumentLanguage();

  return (
    <html dir={dir} lang={lang}>
      <body>
        <GlobalErrorMixpanelBootstrap />
        <AppErrorScreen error={error} reset={reset} source="global-error-boundary" />
      </body>
    </html>
  );
}
