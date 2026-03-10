"use client";

import { Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/hooks/useI18n";
import { getDirection, type AppLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type LanguageToggleProps = {
  className?: string;
  mode?: "compact" | "full";
};

export function LanguageToggle({ className, mode = "compact" }: LanguageToggleProps) {
  const router = useRouter();
  const { language, setLanguage, t } = useI18n();
  const isFullMode = mode === "full";
  const englishLabel = isFullMode ? t("language.english") : "EN";
  const arabicLabel = isFullMode ? t("language.arabic") : "AR";

  function changeLanguage(nextLanguage: AppLanguage) {
    if (nextLanguage === language) return;

    document.documentElement.lang = nextLanguage;
    document.documentElement.dir = getDirection(nextLanguage);
    document.cookie = `que_lang=${nextLanguage}; path=/; max-age=31536000; samesite=lax`;
    setLanguage(nextLanguage);
    router.refresh();
  }

  return (
    <div
      className={cn(
        isFullMode
          ? "inline-flex items-center gap-1 rounded-full border border-border bg-surface p-1 dark:border-white/10 dark:bg-zinc-950"
          : "inline-flex items-center rounded-full border border-border bg-surface p-0.5 dark:border-white/10 dark:bg-zinc-950",
        className,
      )}
      role="group"
      aria-label={t("language.switch")}
    >
      <span
        className={cn(
          isFullMode
            ? "inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted text-mutedfg dark:bg-white/5 dark:text-zinc-500"
            : "px-2 text-mutedfg dark:text-zinc-500",
        )}
        aria-hidden
      >
        <Languages size={14} />
      </span>
      <button
        type="button"
        className={cn(
          isFullMode
            ? "h-7 rounded-full border border-transparent px-3 text-xs font-semibold transition-all"
            : "rounded-full border border-transparent px-2 py-1 text-xs font-medium transition",
          language === "en"
            ? isFullMode
              ? "border-border/90 bg-surface2 text-fg dark:border-white/12 dark:bg-white/[0.08] dark:text-white"
              : "border-border/80 bg-surface2 text-fg dark:border-white/12 dark:bg-white/[0.08] dark:text-white"
            : isFullMode
              ? "text-mutedfg hover:border-fg/12 hover:bg-surface2 hover:text-fg dark:text-zinc-500 dark:hover:border-white/12 dark:hover:bg-white/[0.08] dark:hover:text-white"
              : "text-mutedfg hover:border-fg/12 hover:bg-surface2 hover:text-fg dark:text-zinc-500 dark:hover:border-white/12 dark:hover:bg-white/[0.08] dark:hover:text-white",
        )}
        aria-label={t("language.english")}
        onClick={() => changeLanguage("en")}
      >
        {englishLabel}
      </button>
      <button
        type="button"
        className={cn(
          isFullMode
            ? "h-7 rounded-full border border-transparent px-3 text-xs font-semibold transition-all"
            : "rounded-full border border-transparent px-2 py-1 text-xs font-medium transition",
          language === "ar"
            ? isFullMode
              ? "border-border/90 bg-surface2 text-fg dark:border-white/12 dark:bg-white/[0.08] dark:text-white"
              : "border-border/80 bg-surface2 text-fg dark:border-white/12 dark:bg-white/[0.08] dark:text-white"
            : isFullMode
              ? "text-mutedfg hover:border-fg/12 hover:bg-surface2 hover:text-fg dark:text-zinc-500 dark:hover:border-white/12 dark:hover:bg-white/[0.08] dark:hover:text-white"
              : "text-mutedfg hover:border-fg/12 hover:bg-surface2 hover:text-fg dark:text-zinc-500 dark:hover:border-white/12 dark:hover:bg-white/[0.08] dark:hover:text-white",
        )}
        aria-label={t("language.arabic")}
        onClick={() => changeLanguage("ar")}
      >
        {arabicLabel}
      </button>
    </div>
  );
}
