"use client";

import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/hooks/useI18n";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { language } = useI18n();
  const tr = (english: string, arabic: string) => (language === "ar" ? arabic : english);

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip bg-[#f5f6f8] text-[#0f1218]">
      <div className="pointer-events-none absolute inset-x-0 top-[-14rem] h-[34rem] bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),rgba(245,246,248,0)_68%)]" />

      <main className="relative mx-auto flex w-full max-w-7xl flex-1 items-center justify-center px-5 pb-14 pt-8 sm:px-8 lg:pb-20 lg:pt-12">
        <div className="w-full max-w-[560px]">{children}</div>
      </main>

      <footer className="relative border-t border-black/7 px-5 py-5 sm:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 text-sm text-black/58">
          <div className="flex items-center gap-3">
            <Image src="/fav.png" alt="Que logo" width={1076} height={400} className="h-6 w-auto opacity-90" />
            <span>{tr("AI-driven CRM", "CRM مدعوم بالذكاء الاصطناعي")}</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href={"/terms" as Route} className="transition hover:text-black">
              {tr("Terms", "الشروط")}
            </Link>
            <Link href={"/privacy" as Route} className="transition hover:text-black">
              {tr("Privacy", "الخصوصية")}
            </Link>
            <Link href={"/support" as Route} className="transition hover:text-black">
              {tr("Support", "الدعم")}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
