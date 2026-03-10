"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Moon, Sun } from "lucide-react";
import { APP_TOP_NAV_ITEMS } from "@/lib/navigation";
import { useI18n } from "@/hooks/useI18n";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";

export function Topbar() {
  const { setCommandOpen, dark, toggleTheme, mobileNavOpen, setMobileNavOpen } = useUIStore();
  const { t } = useI18n();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-border/90 bg-[hsl(var(--background)/0.96)] backdrop-blur-xl dark:border-white/8 dark:bg-black/92">
      <div className="flex w-full items-center gap-4 px-4 py-3 md:px-6 xl:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            className="btn w-9 shrink-0 px-0 md:hidden"
            aria-label={mobileNavOpen ? t("topbar.closeNav") : t("topbar.openNav")}
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
          >
            <Menu size={16} />
          </button>
          <Link
            href={"/dashboard" as Route}
            className="shrink-0 text-[1.08rem] font-semibold tracking-[-0.03em] text-fg"
          >
            Que CRM
          </Link>
          <nav className="hidden items-center gap-1 pl-3 md:flex">
            {APP_TOP_NAV_ITEMS.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

              return (
                <Link
                  key={item.href}
                  href={item.href as Route}
                  className={cn(
                    "rounded-full border border-transparent px-3 py-1.5 text-sm transition",
                    active
                      ? "border-border/90 bg-surface2 text-fg dark:border-white/12 dark:bg-white/[0.08] dark:text-white"
                      : "text-mutedfg hover:border-fg/12 hover:bg-surface2 hover:text-fg dark:text-zinc-400 dark:hover:border-white/12 dark:hover:bg-white/[0.08] dark:hover:text-white",
                  )}
                >
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="hidden rounded-full border border-border bg-surface2 px-3 py-1.5 text-xs font-medium text-mutedfg transition hover:border-fg/15 hover:bg-surface hover:text-fg dark:border-white/8 dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:border-white/12 dark:hover:bg-white/[0.08] dark:hover:text-white lg:inline-flex"
            aria-label={t("topbar.openCommandPalette")}
          >
            Cmd K
          </button>
          <Link href="/deals/new" className="btn btn-primary h-10">
            {t("topbar.newDeal")}
          </Link>
          <button
            className="btn w-9 px-0"
            onClick={toggleTheme}
            aria-label={t("topbar.themeToggle")}
          >
            {dark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </div>
    </header>
  );
}
