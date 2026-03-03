"use client";

import { Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/hooks/useI18n";
import { getDirection, type AppLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type LanguageToggleProps = {
  className?: string;
};

export function LanguageToggle({ className }: LanguageToggleProps) {
  const router = useRouter();
  const { language, setLanguage, t } = useI18n();

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
      <span className="px-2 text-mutedfg" aria-hidden>
        <Languages size={14} />
      </span>
      <button
        type="button"
        className={cn(
          "rounded-md px-2 py-1 text-xs font-medium transition",
          language === "en" ? "bg-muted text-fg" : "text-mutedfg hover:text-fg"
        )}
        onClick={() => changeLanguage("en")}
      >
        EN
      </button>
      <button
        type="button"
        className={cn(
          "rounded-md px-2 py-1 text-xs font-medium transition",
          language === "ar" ? "bg-muted text-fg" : "text-mutedfg hover:text-fg"
        )}
        onClick={() => changeLanguage("ar")}
      >
        AR
      </button>
    </div>
  );
}
