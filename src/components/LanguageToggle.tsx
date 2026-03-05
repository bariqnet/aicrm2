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
          ? "inline-flex items-center gap-1 rounded-xl border border-border/80 bg-surface p-1"
          : "inline-flex items-center rounded-md border border-border bg-surface p-0.5",
        className
      )}
      role="group"
      aria-label={t("language.switch")}
    >
      <span
        className={cn(
          isFullMode
            ? "inline-flex h-7 w-7 items-center justify-center rounded-lg bg-black/[0.04] text-black/65"
            : "px-2 text-mutedfg"
        )}
        aria-hidden
      >
        <Languages size={14} />
      </span>
      <button
        type="button"
        className={cn(
          isFullMode ? "h-7 rounded-lg px-3 text-xs font-semibold transition-all" : "rounded-md px-2 py-1 text-xs font-medium transition",
          language === "en"
            ? isFullMode
              ? "bg-[#111319] text-white shadow-[0_1px_3px_rgba(17,19,25,0.25)]"
              : "bg-muted text-fg"
            : isFullMode
              ? "text-black/62 hover:bg-black/[0.05] hover:text-black"
              : "text-mutedfg hover:text-fg"
        )}
        aria-label={t("language.english")}
        onClick={() => changeLanguage("en")}
      >
        {englishLabel}
      </button>
      <button
        type="button"
        className={cn(
          isFullMode ? "h-7 rounded-lg px-3 text-xs font-semibold transition-all" : "rounded-md px-2 py-1 text-xs font-medium transition",
          language === "ar"
            ? isFullMode
              ? "bg-[#111319] text-white shadow-[0_1px_3px_rgba(17,19,25,0.25)]"
              : "bg-muted text-fg"
            : isFullMode
              ? "text-black/62 hover:bg-black/[0.05] hover:text-black"
              : "text-mutedfg hover:text-fg"
        )}
        aria-label={t("language.arabic")}
        onClick={() => changeLanguage("ar")}
      >
        {arabicLabel}
      </button>
    </div>
  );
}
