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
      className={cn("inline-flex items-center rounded-md border border-border bg-surface p-0.5", className)}
      role="group"
      aria-label={t("language.switch")}
    >
      <span className={cn("text-mutedfg", isFullMode ? "px-2.5" : "px-2")} aria-hidden>
        <Languages size={14} />
      </span>
      <button
        type="button"
        className={cn(
          "rounded-md py-1 text-xs font-medium transition",
          isFullMode ? "px-3" : "px-2",
          language === "en" ? "bg-muted text-fg" : "text-mutedfg hover:text-fg"
        )}
        aria-label={t("language.english")}
        onClick={() => changeLanguage("en")}
      >
        {englishLabel}
      </button>
      <button
        type="button"
        className={cn(
          "rounded-md py-1 text-xs font-medium transition",
          isFullMode ? "px-3" : "px-2",
          language === "ar" ? "bg-muted text-fg" : "text-mutedfg hover:text-fg"
        )}
        aria-label={t("language.arabic")}
        onClick={() => changeLanguage("ar")}
      >
        {arabicLabel}
      </button>
    </div>
  );
}
