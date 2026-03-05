"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { trackMixpanelError } from "@/lib/mixpanel-browser";

type AppErrorScreenProps = {
  error: Error & { digest?: string };
  reset?: () => void;
  source: "route-error-boundary" | "global-error-boundary";
};

function readDocumentLanguage(): "ar" | "en" {
  if (typeof document === "undefined") return "en";
  return document.documentElement.lang === "ar" ? "ar" : "en";
}

export function AppErrorScreen({ error, reset, source }: AppErrorScreenProps) {
  const hasTrackedRef = useRef(false);
  const language = readDocumentLanguage();
  const isArabic = language === "ar";

  useEffect(() => {
    if (hasTrackedRef.current) return;

    trackMixpanelError(source, error, {
      error_boundary: source,
      support_link: "/support"
    });

    hasTrackedRef.current = true;
  }, [error, source]);

  const copy = useMemo(
    () =>
      isArabic
        ? {
            backHome: "العودة إلى الرئيسية",
            body: "حدث خلل غير متوقع أثناء تحميل هذه الصفحة. تم تسجيل الخطأ تلقائيًا حتى نراجعه بسرعة.",
            code: "مرجع الخطأ",
            retry: "إعادة المحاولة",
            support: "الدعم",
            title: "حصل خطأ غير متوقع"
          }
        : {
            backHome: "Back to home",
            body: "Something failed while loading this page. The error was logged automatically so it can be reviewed.",
            code: "Error reference",
            retry: "Try again",
            support: "Support",
            title: "Something went wrong"
          },
    [isArabic]
  );

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(253,230,138,0.24),_transparent_42%),linear-gradient(180deg,_#f9fafb_0%,_#eef2f7_100%)] px-6 py-10 text-slate-950 sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center justify-center">
        <section className="w-full overflow-hidden rounded-[32px] border border-slate-950/8 bg-white/88 p-8 shadow-[0_30px_120px_rgba(15,23,42,0.12)] backdrop-blur sm:p-12">
          <div className="inline-flex items-center rounded-full border border-amber-400/35 bg-amber-100/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-950/80">
            {isArabic ? "صفحة الخطأ" : "Error state"}
          </div>
          <h1 className="mt-6 max-w-2xl text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
            {copy.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-700 sm:text-lg">{copy.body}</p>

          <div className="mt-8 grid gap-4 rounded-3xl border border-slate-950/8 bg-slate-950/[0.03] p-5 text-sm text-slate-700 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
            <div>
              <p className="font-semibold text-slate-900">{error.message || "Unknown error"}</p>
              {error.digest ? (
                <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                  {copy.code}: {error.digest}
                </p>
              ) : null}
            </div>
            <div className="rounded-2xl border border-slate-950/8 bg-white px-3 py-2 text-xs font-medium text-slate-500">
              {source}
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {reset ? (
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {copy.retry}
              </button>
            ) : null}
            <Link
              href={"/" as Route}
              className="inline-flex items-center justify-center rounded-full border border-slate-950/10 bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:border-slate-950/20 hover:bg-slate-50"
            >
              {copy.backHome}
            </Link>
            <Link
              href={"/support" as Route}
              className="inline-flex items-center justify-center rounded-full border border-transparent px-5 py-3 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
            >
              {copy.support}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
