"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell, Menu, Moon, Plus, Search, Sun } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { useUIStore } from "@/store/ui-store";

export function Topbar() {
  const {
    setCommandOpen,
    dark,
    toggleTheme,
    mobileNavOpen,
    setMobileNavOpen
  } = useUIStore();
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-2 px-4 py-3 md:flex-nowrap md:gap-3 md:px-8">
        <div className="flex w-full min-w-0 items-center gap-2 md:flex-1">
          <button
            className="btn w-9 shrink-0 px-0 md:hidden"
            aria-label={mobileNavOpen ? t("topbar.closeNav") : t("topbar.openNav")}
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
          >
            <Menu size={16} />
          </button>
          <Link href="/dashboard" className="hidden md:inline-flex md:shrink-0" aria-label={t("topbar.queHome")}>
            <Image
              src="/fav.png"
              alt="Que logo"
              width={102}
              height={34}
              className="h-8 w-auto"
              priority
            />
          </Link>
          <button
            onClick={() => setCommandOpen(true)}
            className="input flex h-9 min-w-0 flex-1 items-center justify-between text-mutedfg md:max-w-lg"
            aria-label={t("topbar.openCommandPalette")}
          >
            <span className="inline-flex items-center gap-2 truncate">
              <Search size={14} />
              <span className="truncate">{t("topbar.searchPlaceholder")}</span>
            </span>
            <span className="hidden rounded border border-border bg-surface2 px-1.5 py-0.5 text-[11px] text-mutedfg sm:inline-flex">
              Cmd K
            </span>
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/contacts/new" className="btn btn-primary hidden sm:inline-flex">
            <Plus size={14} />
            {t("topbar.newContact")}
          </Link>
          <Link href="/contacts/new" className="btn btn-primary w-9 px-0 sm:hidden" aria-label={t("topbar.newContact")}>
            <Plus size={14} />
          </Link>
          <Link href="/deals/new" className="btn hidden xl:inline-flex">{t("topbar.newDeal")}</Link>
          <button className="btn w-9 px-0" aria-label={t("topbar.notifications")}>
            <Bell size={14} />
          </button>
          <button className="btn w-9 px-0" onClick={toggleTheme} aria-label={t("topbar.themeToggle")}>
            {dark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </div>
    </header>
  );
}
