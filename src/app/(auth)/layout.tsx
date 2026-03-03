"use client";

import Image from "next/image";
import Link from "next/link";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useI18n } from "@/hooks/useI18n";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { language } = useI18n();
  const tr = (english: string, arabic: string) => (language === "ar" ? arabic : english);

  return (
    <div className="flex min-h-screen flex-col bg-surface2">
      <header className="mx-auto flex w-full max-w-6xl justify-end px-4 py-4 sm:px-6">
        <LanguageToggle />
      </header>

      <div className="flex-1 px-4 pb-10 sm:px-6">
        <div className="mx-auto flex h-full w-full max-w-[640px] flex-col items-center justify-center">
          <Image
            src="/fav.png"
            alt="Que logo"
            width={42}
            height={42}
            className="mb-6 h-10 w-10 rounded-md border border-border/70 bg-surface p-1"
            priority
          />

          <div className="w-full">{children}</div>

          <nav className="mt-8 flex items-center gap-8 text-sm text-mutedfg">
            <Link href="#" className="transition hover:text-fg">
              {tr("Terms", "الشروط")}
            </Link>
            <Link href="#" className="transition hover:text-fg">
              {tr("Privacy", "الخصوصية")}
            </Link>
            <Link href="#" className="transition hover:text-fg">
              {tr("Support", "الدعم")}
            </Link>
          </nav>
        </div>
      </div>

      <footer className="border-t border-zinc-800 bg-zinc-900 px-4 py-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-zinc-100">
            <Image src="/fav.png" alt="Que logo" width={34} height={34} className="h-8 w-8 rounded-md" />
            <span className="text-2xl font-semibold tracking-tight">Que</span>
          </div>
          <p className="text-sm text-zinc-300">{tr("AI-driven CRM", "CRM مدعوم بالذكاء الاصطناعي")}</p>
        </div>
      </footer>
    </div>
  );
}
